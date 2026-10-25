<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\InvitationEvent;
use App\Models\InvitationSection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvitationContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_sections_can_be_created_reordered_duplicated_and_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $invitation = Invitation::factory()->for($admin)->create();

        Sanctum::actingAs($admin, ['admin']);

        $gallery = $this->postJson('/api/v1/invitations/'.$invitation->id.'/sections', [
            'type' => 'gallery',
            'title' => 'Moments',
            'content' => ['heading' => 'Gallery', 'images' => []],
            'design' => ['background' => 'cream'],
        ])
            ->assertCreated()
            ->assertJsonPath('data.type', 'gallery')
            ->assertJsonPath('data.sort_order', 1);

        $galleryId = $gallery->json('data.id');

        $note = $this->postJson('/api/v1/invitations/'.$invitation->id.'/sections', [
            'type' => 'text',
            'title' => 'A note',
            'content' => ['heading' => 'Thank you', 'body' => 'With love.'],
        ])
            ->assertCreated()
            ->assertJsonPath('data.sort_order', 2);

        $noteId = $note->json('data.id');

        $this->postJson('/api/v1/invitations/'.$invitation->id.'/sections/reorder', [
            'sections' => [
                ['id' => $noteId, 'sort_order' => 0],
                ['id' => $galleryId, 'sort_order' => 1],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.0.id', $noteId)
            ->assertJsonPath('data.1.id', $galleryId);

        $this->postJson('/api/v1/invitations/'.$invitation->id.'/sections/'.$galleryId.'/duplicate')
            ->assertCreated()
            ->assertJsonPath('data.title', 'Moments (Copy)')
            ->assertJsonPath('data.type', 'gallery');

        $this->deleteJson('/api/v1/invitations/'.$invitation->id.'/sections/'.$noteId)
            ->assertOk();

        $this->assertDatabaseMissing('invitation_sections', ['id' => $noteId]);
    }

    public function test_section_payloads_and_ownership_are_validated(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $invitation = Invitation::factory()->for($admin)->create();
        $otherInvitation = Invitation::factory()->for($admin)->create();
        $section = InvitationSection::factory()->for($invitation)->create();

        Sanctum::actingAs($admin, ['admin']);

        $this->postJson('/api/v1/invitations/'.$invitation->id.'/sections', [
            'type' => 'not-a-real-section',
            'content' => [],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('type');

        $this->putJson('/api/v1/invitations/'.$otherInvitation->id.'/sections/'.$section->id, [
            'title' => 'Hijacked',
        ])->assertNotFound();
    }

    public function test_events_are_stored_in_utc_and_displayed_in_the_event_timezone(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $invitation = Invitation::factory()->for($admin)->create(['timezone' => 'Asia/Karachi']);

        Sanctum::actingAs($admin, ['admin']);

        $event = $this->postJson('/api/v1/invitations/'.$invitation->id.'/events', [
            'title' => 'Mehndi',
            'event_at' => '2027-03-01T18:30',
            'timezone' => 'Asia/Karachi',
            'venue_name' => 'Family Home',
        ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Mehndi')
            ->assertJsonPath('data.event_at_local', '2027-03-01T18:30')
            ->assertJsonPath('data.timezone', 'Asia/Karachi');

        $eventId = $event->json('data.id');

        $this->assertDatabaseHas('invitation_events', [
            'id' => $eventId,
            'event_at' => '2027-03-01 13:30:00',
        ]);

        $this->putJson('/api/v1/invitations/'.$invitation->id.'/events/'.$eventId, [
            'title' => 'Mehndi & Dinner',
        ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Mehndi & Dinner');

        $this->deleteJson('/api/v1/invitations/'.$invitation->id.'/events/'.$eventId)
            ->assertOk();

        $this->assertDatabaseMissing('invitation_events', ['id' => $eventId]);
    }

    public function test_events_cannot_be_modified_through_another_invitation(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $invitation = Invitation::factory()->for($admin)->create();
        $otherInvitation = Invitation::factory()->for($admin)->create();
        $event = InvitationEvent::factory()->for($invitation)->create();

        Sanctum::actingAs($admin, ['admin']);

        $this->putJson('/api/v1/invitations/'.$otherInvitation->id.'/events/'.$event->id, [
            'title' => 'Hijacked',
        ])->assertNotFound();
    }

    public function test_guest_list_entries_receive_unique_codes_and_can_be_managed(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $invitation = Invitation::factory()->for($admin)->create();

        Sanctum::actingAs($admin, ['admin']);

        $guest = $this->postJson('/api/v1/invitations/'.$invitation->id.'/guests', [
            'name' => 'Sara Khan',
            'email' => 'sara@example.test',
            'max_guests' => 4,
        ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Sara Khan')
            ->assertJsonPath('data.max_guests', 4);

        $guestId = $guest->json('data.id');
        $code = $guest->json('data.code');

        $this->assertNotEmpty($code);
        $this->assertStringContainsString('?guest='.$code, $guest->json('data.invitation_link'));

        $this->getJson('/api/v1/invitations/'.$invitation->id.'/guests')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $guestId);

        $this->putJson('/api/v1/invitations/'.$invitation->id.'/guests/'.$guestId, [
            'name' => 'Sara Ali',
            'max_guests' => 2,
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Sara Ali')
            ->assertJsonPath('data.max_guests', 2);

        $this->deleteJson('/api/v1/invitations/'.$invitation->id.'/guests/'.$guestId)
            ->assertOk();

        $this->assertDatabaseMissing('invitation_guests', ['id' => $guestId]);
    }
}
