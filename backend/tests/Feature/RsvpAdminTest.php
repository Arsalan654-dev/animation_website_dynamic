<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\RsvpSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RsvpAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_planners_only_see_rsvps_for_their_own_invitations(): void
    {
        $owner = User::factory()->create(['role' => 'planner']);
        $other = User::factory()->create(['role' => 'planner']);

        $ownInvitation = Invitation::factory()->for($owner)->create();
        $otherInvitation = Invitation::factory()->for($other)->create();

        RsvpSubmission::factory()->for($ownInvitation)->create([
            'guest_name' => 'Sara Khan',
            'attendance' => 'attending',
            'guest_count' => 3,
        ]);
        RsvpSubmission::factory()->for($ownInvitation)->create([
            'guest_name' => 'Omar Farooq',
            'attendance' => 'declined',
            'guest_count' => 1,
        ]);
        RsvpSubmission::factory()->for($otherInvitation)->create([
            'guest_name' => 'Other Guest',
        ]);

        Sanctum::actingAs($owner, ['admin']);

        $this->getJson('/api/v1/rsvps')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.summary.total_responses', 2)
            ->assertJsonPath('meta.summary.attending_responses', 1)
            ->assertJsonPath('meta.summary.declined_responses', 1)
            ->assertJsonPath('meta.summary.confirmed_guests', 3);
    }

    public function test_global_admins_see_every_rsvp(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $owner = User::factory()->create(['role' => 'planner']);
        $invitation = Invitation::factory()->for($owner)->create();

        RsvpSubmission::factory()->count(2)->for($invitation)->create();

        Sanctum::actingAs($admin, ['admin']);

        $this->getJson('/api/v1/rsvps')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.summary.total_responses', 2);
    }

    public function test_rsvp_list_supports_attendance_search_invitation_and_date_filters(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $invitation = Invitation::factory()->for($admin)->create();
        $otherInvitation = Invitation::factory()->for($admin)->create();

        RsvpSubmission::factory()->for($invitation)->create([
            'guest_name' => 'Sara Khan',
            'attendance' => 'attending',
        ]);
        RsvpSubmission::factory()->for($invitation)->create([
            'guest_name' => 'Omar Farooq',
            'attendance' => 'declined',
        ]);
        RsvpSubmission::factory()->for($otherInvitation)->create([
            'guest_name' => 'Sara Other',
            'attendance' => 'attending',
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $this->getJson('/api/v1/rsvps?attendance=declined')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.guest_name', 'Omar Farooq');

        $this->getJson('/api/v1/rsvps?search=Sara')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/v1/rsvps?invitation_id='.$invitation->id)
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/v1/rsvps?from='.now()->addDay()->toDateString())
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_rsvp_detail_and_private_notes_are_scoped_to_the_invitation_owner(): void
    {
        $owner = User::factory()->create(['role' => 'planner']);
        $other = User::factory()->create(['role' => 'planner']);
        $invitation = Invitation::factory()->for($owner)->create();
        $rsvp = RsvpSubmission::factory()->for($invitation)->create([
            'guest_name' => 'Sara Khan',
        ]);

        Sanctum::actingAs($owner, ['admin']);

        $this->getJson('/api/v1/rsvps/'.$rsvp->id)
            ->assertOk()
            ->assertJsonPath('data.guest_name', 'Sara Khan');

        $this->patchJson('/api/v1/rsvps/'.$rsvp->id, [
            'admin_notes' => 'Called to confirm the vegetarian meal.',
        ])
            ->assertOk()
            ->assertJsonPath('data.admin_notes', 'Called to confirm the vegetarian meal.');

        $this->assertDatabaseHas('rsvp_submissions', [
            'id' => $rsvp->id,
            'admin_notes' => 'Called to confirm the vegetarian meal.',
        ]);

        Sanctum::actingAs($other, ['admin']);

        $this->getJson('/api/v1/rsvps/'.$rsvp->id)->assertForbidden();
        $this->patchJson('/api/v1/rsvps/'.$rsvp->id, ['admin_notes' => 'Nope'])->assertForbidden();
        $this->deleteJson('/api/v1/rsvps/'.$rsvp->id)->assertForbidden();
    }

    public function test_rsvp_can_be_deleted_by_an_authorized_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $invitation = Invitation::factory()->for($admin)->create();
        $rsvp = RsvpSubmission::factory()->for($invitation)->create();

        Sanctum::actingAs($admin, ['admin']);

        $this->deleteJson('/api/v1/rsvps/'.$rsvp->id)->assertOk();

        $this->assertDatabaseMissing('rsvp_submissions', ['id' => $rsvp->id]);
    }

    public function test_csv_export_respects_filters_and_returns_a_download(): void
    {
        $owner = User::factory()->create(['role' => 'planner']);
        $other = User::factory()->create(['role' => 'planner']);
        $invitation = Invitation::factory()->for($owner)->create();
        $otherInvitation = Invitation::factory()->for($other)->create();

        RsvpSubmission::factory()->for($invitation)->create([
            'guest_name' => 'Sara Khan',
            'attendance' => 'attending',
        ]);
        RsvpSubmission::factory()->for($invitation)->create([
            'guest_name' => 'Omar Farooq',
            'attendance' => 'declined',
        ]);
        RsvpSubmission::factory()->for($otherInvitation)->create([
            'guest_name' => 'Other Guest',
        ]);

        Sanctum::actingAs($owner, ['admin']);

        $response = $this->get('/api/v1/rsvps/export?invitation_id='.$invitation->id);

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('content-type'));
        $this->assertStringContainsString('attachment', $response->headers->get('content-disposition'));

        $csv = $response->streamedContent();

        $this->assertStringContainsString('Sara Khan', $csv);
        $this->assertStringContainsString('Omar Farooq', $csv);
        $this->assertStringNotContainsString('Other Guest', $csv);
    }
}
