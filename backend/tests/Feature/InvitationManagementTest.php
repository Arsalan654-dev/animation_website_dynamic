<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\InvitationEvent;
use App\Models\InvitationSection;
use App\Models\Template;
use App\Models\Theme;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvitationManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_an_invitation_from_a_template(): void
    {
        $admin = $this->admin();
        $theme = Theme::factory()->create();
        $template = Template::factory()->create([
            'default_theme_id' => $theme->id,
            'layout' => [
                'sections' => [
                    ['type' => 'hero', 'content' => ['heading' => 'Ayesha & Hamza']],
                    ['type' => 'story', 'content' => ['heading' => 'Our Story']],
                ],
            ],
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $response = $this->postJson('/api/v1/invitations', [
            'title' => 'Ayesha & Hamza',
            'theme_id' => $theme->id,
            'template_id' => $template->id,
            'timezone' => 'Asia/Karachi',
            'couple_details' => [
                'partner_one' => 'Ayesha',
                'partner_two' => 'Hamza',
            ],
            'event_at' => '2027-02-14T19:00',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.slug', 'ayesha-hamza')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.event.local_iso', '2027-02-14T19:00')
            ->assertJsonCount(2, 'data.sections')
            ->assertJsonPath('data.sections.0.type', 'hero')
            ->assertJsonPath('data.sections.1.type', 'story');

        $this->assertDatabaseHas('invitations', [
            'id' => $response->json('data.id'),
            'user_id' => $admin->id,
            'slug' => 'ayesha-hamza',
        ]);
    }

    public function test_generated_slugs_remain_unique(): void
    {
        $admin = $this->admin();
        $theme = Theme::factory()->create();

        Sanctum::actingAs($admin, ['admin']);

        $payload = [
            'title' => 'Same Title',
            'theme_id' => $theme->id,
            'timezone' => 'Asia/Karachi',
            'couple_details' => [
                'partner_one' => 'One',
                'partner_two' => 'Two',
            ],
        ];

        $this->postJson('/api/v1/invitations', $payload)
            ->assertCreated()
            ->assertJsonPath('data.slug', 'same-title');

        $this->postJson('/api/v1/invitations', $payload)
            ->assertCreated()
            ->assertJsonPath('data.slug', 'same-title-2');
    }

    public function test_invitation_creation_validates_required_fields(): void
    {
        Sanctum::actingAs($this->admin(), ['admin']);

        $this->postJson('/api/v1/invitations', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'theme_id', 'couple_details', 'timezone']);
    }

    public function test_update_merges_details_and_strips_html_from_text(): void
    {
        $admin = $this->admin();
        $invitation = Invitation::factory()->for($admin)->create();

        Sanctum::actingAs($admin, ['admin']);

        $this->patchJson('/api/v1/invitations/'.$invitation->id, [
            'couple_details' => [
                'partner_one' => '<b>Ayesha</b>',
            ],
            'venue_name' => 'The Pearl Continental',
        ])
            ->assertOk()
            ->assertJsonPath('data.couple_details.partner_one', 'Ayesha')
            ->assertJsonPath('data.couple_details.partner_two', $invitation->couple_details['partner_two'])
            ->assertJsonPath('data.venue_name', 'The Pearl Continental');
    }

    public function test_publish_requires_a_visible_section_and_then_controls_public_visibility(): void
    {
        $admin = $this->admin();
        $invitation = Invitation::factory()->for($admin)->create();

        Sanctum::actingAs($admin, ['admin']);

        $this->postJson('/api/v1/invitations/'.$invitation->id.'/publish')
            ->assertStatus(422)
            ->assertJsonValidationErrors('sections');

        InvitationSection::factory()->for($invitation)->create(['is_visible' => true]);

        $published = $this->postJson('/api/v1/invitations/'.$invitation->id.'/publish')
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        $this->assertNotNull($published->json('data.published_at'));
        $this->getJson('/api/v1/public/invitations/'.$invitation->slug)->assertOk();

        $this->postJson('/api/v1/invitations/'.$invitation->id.'/unpublish')
            ->assertOk()
            ->assertJsonPath('data.status', 'draft');

        $this->getJson('/api/v1/public/invitations/'.$invitation->slug)->assertNotFound();

        $this->postJson('/api/v1/invitations/'.$invitation->id.'/archive')
            ->assertOk()
            ->assertJsonPath('data.status', 'archived');

        $this->getJson('/api/v1/public/invitations/'.$invitation->slug)->assertNotFound();

        $this->postJson('/api/v1/invitations/'.$invitation->id.'/restore')
            ->assertOk()
            ->assertJsonPath('data.status', 'draft');
    }

    public function test_duplicating_an_invitation_copies_sections_and_events_as_a_draft(): void
    {
        $admin = $this->admin();
        $invitation = Invitation::factory()->for($admin)->published()->create();

        InvitationSection::factory()->for($invitation)->create([
            'type' => 'story',
            'content' => ['heading' => 'Our Story'],
        ]);
        InvitationEvent::factory()->for($invitation)->create(['title' => 'Nikah']);

        Sanctum::actingAs($admin, ['admin']);

        $response = $this->postJson('/api/v1/invitations/'.$invitation->id.'/duplicate');

        $response->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.title', $invitation->title.' (Copy)')
            ->assertJsonPath('data.sections.0.type', 'story')
            ->assertJsonPath('data.events.0.title', 'Nikah');

        $this->assertNotSame($invitation->id, $response->json('data.id'));
        $this->assertNull($response->json('data.published_at'));
        $this->assertDatabaseCount('invitations', 2);
    }

    public function test_planners_cannot_manage_another_planners_invitation(): void
    {
        $owner = User::factory()->create(['role' => 'planner']);
        $other = User::factory()->create(['role' => 'planner']);
        $invitation = Invitation::factory()->for($owner)->create();

        Sanctum::actingAs($other, ['admin']);

        $this->getJson('/api/v1/invitations/'.$invitation->id)->assertForbidden();
        $this->patchJson('/api/v1/invitations/'.$invitation->id, ['venue_name' => 'Nope'])->assertForbidden();
        $this->postJson('/api/v1/invitations/'.$invitation->id.'/publish')->assertForbidden();
        $this->postJson('/api/v1/invitations/'.$invitation->id.'/duplicate')->assertForbidden();
        $this->getJson('/api/v1/invitations')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_global_admins_can_manage_any_invitation(): void
    {
        $owner = User::factory()->create(['role' => 'planner']);
        $admin = $this->admin();
        $invitation = Invitation::factory()->for($owner)->create();

        Sanctum::actingAs($admin, ['admin']);

        $this->getJson('/api/v1/invitations/'.$invitation->id)
            ->assertOk()
            ->assertJsonPath('data.id', $invitation->id);

        $this->getJson('/api/v1/invitations')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }
}
