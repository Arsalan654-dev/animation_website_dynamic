<?php

namespace Tests\Feature;

use App\Models\AnimationPreset;
use App\Models\Invitation;
use App\Models\InvitationDesign;
use App\Models\Theme;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvitationDesignTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_an_invitation_creates_an_active_original_design(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $theme = Theme::factory()->create();

        Sanctum::actingAs($admin, ['admin']);

        $response = $this->postJson('/api/v1/invitations', [
            'title' => 'Ayesha & Hamza',
            'theme_id' => $theme->id,
            'timezone' => 'Asia/Karachi',
            'couple_details' => [
                'partner_one' => 'Ayesha',
                'partner_two' => 'Hamza',
            ],
            'event_at' => '2027-02-14T19:00',
        ])->assertCreated();

        $invitationId = $response->json('data.id');

        $this->assertDatabaseHas('invitation_designs', [
            'invitation_id' => $invitationId,
            'name' => 'Original',
            'is_active' => true,
            'version' => 1,
        ]);

        $design = InvitationDesign::query()->where('invitation_id', $invitationId)->firstOrFail();

        $this->assertIsArray($design->snapshot['sections']);
        $this->assertSame($theme->id, $design->snapshot['theme_id']);
        $this->assertDatabaseCount('invitation_design_versions', 1);
    }

    public function test_designs_can_be_created_listed_and_activated(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $theme = Theme::factory()->create();
        $preset = AnimationPreset::factory()->create();
        $invitation = Invitation::factory()->for($admin)->create(['theme_id' => $theme->id]);
        $invitation->sections()->create([
            'type' => 'hero',
            'title' => 'Hero',
            'content' => ['heading' => 'The original hero'],
            'sort_order' => 0,
            'is_visible' => true,
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $this->getJson('/api/v1/invitations/'.$invitation->id.'/designs')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Original')
            ->assertJsonPath('data.0.is_active', true);

        $created = $this->postJson('/api/v1/invitations/'.$invitation->id.'/designs', [
            'name' => 'Reception look',
            'description' => 'A darker evening version.',
            'activate' => false,
            'snapshot' => [
                'theme_id' => $theme->id,
                'design_config' => [
                    'theme_tokens' => ['colors' => ['primary' => '#123456']],
                    'effects' => ['grain' => false, 'hover_lift' => false],
                    'custom_css' => '.ea-hero { letter-spacing: 0.1em; }',
                ],
                'envelope' => [
                    'enabled' => false,
                    'monogram' => 'A & H',
                ],
                'cover_image_path' => null,
                'sections' => [
                    [
                        'type' => 'hero',
                        'title' => 'Reception hero',
                        'content' => ['heading' => 'Ayesha & Hamza', 'eyebrow' => 'An evening celebration'],
                        'design' => ['align' => 'left', 'hover_effect' => 'lift'],
                        'animation_preset_id' => $preset->id,
                        'animation_config' => ['duration' => 1.2, 'delay' => 0.1],
                        'sort_order' => 0,
                        'is_visible' => true,
                    ],
                    [
                        'type' => 'rsvp',
                        'title' => 'RSVP',
                        'content' => ['heading' => 'Will you join us?'],
                        'sort_order' => 1,
                        'is_visible' => true,
                    ],
                ],
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Reception look')
            ->assertJsonPath('data.is_active', false)
            ->assertJsonPath('data.version', 1)
            ->assertJsonPath('data.section_count', 2)
            ->assertJsonPath('data.snapshot.sections.0.type', 'hero')
            ->assertJsonPath('data.snapshot.sections.1.type', 'rsvp');

        $designId = $created->json('data.id');

        $this->getJson('/api/v1/invitations/'.$invitation->id.'/designs')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->postJson('/api/v1/invitations/'.$invitation->id.'/designs/'.$designId.'/activate')
            ->assertOk()
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('invitation_designs', [
            'id' => $designId,
            'is_active' => true,
        ]);

        $this->assertDatabaseMissing('invitation_designs', [
            'invitation_id' => $invitation->id,
            'name' => 'Original',
            'is_active' => true,
        ]);

        $this->assertSame(
            ['hero', 'rsvp'],
            $invitation->fresh()->sections()->orderBy('sort_order')->pluck('type')->all()
        );

        $this->assertSame(
            '#123456',
            $invitation->fresh()->design_config['theme_tokens']['colors']['primary']
        );

        $this->assertFalse($invitation->fresh()->envelope['enabled']);
    }

    public function test_saving_an_active_design_stays_a_draft_until_it_is_activated(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $invitation = Invitation::factory()->for($admin)->create();
        $invitation->sections()->create([
            'type' => 'hero',
            'title' => 'Hero',
            'content' => ['heading' => 'Original heading'],
            'sort_order' => 0,
            'is_visible' => true,
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $designId = $this->getJson('/api/v1/invitations/'.$invitation->id.'/designs')
            ->assertOk()
            ->json('data.0.id');

        $this->patchJson('/api/v1/invitations/'.$invitation->id.'/designs/'.$designId, [
            'snapshot' => [
                'theme_id' => $invitation->theme_id,
                'design_config' => [
                    'effects' => ['grain' => false, 'parallax' => true],
                ],
                'envelope' => ['enabled' => false],
                'cover_image_path' => null,
                'sections' => [
                    [
                        'type' => 'hero',
                        'title' => 'New hero',
                        'content' => ['heading' => 'A brand new heading'],
                        'sort_order' => 0,
                        'is_visible' => true,
                    ],
                    [
                        'type' => 'story',
                        'title' => 'Story',
                        'content' => ['heading' => 'How it began'],
                        'sort_order' => 1,
                        'is_visible' => true,
                    ],
                ],
            ],
            'label' => 'Editorial refresh',
        ])
            ->assertOk()
            ->assertJsonPath('data.version', 2)
            ->assertJsonPath('data.snapshot.sections.0.title', 'New hero');

        $this->assertSame(
            'Original heading',
            $invitation->fresh()->sections()->orderBy('sort_order')->first()->content['heading']
        );

        $this->assertSame(
            ['hero'],
            $invitation->fresh()->sections()->orderBy('sort_order')->pluck('type')->all()
        );

        $this->assertTrue($invitation->fresh()->envelope['enabled']);

        $versions = $this->getJson('/api/v1/invitations/'.$invitation->id.'/designs/'.$designId.'/versions')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.version', 2)
            ->assertJsonPath('data.0.label', 'Editorial refresh')
            ->json('data');

        $this->postJson('/api/v1/invitations/'.$invitation->id.'/designs/'.$designId.'/activate')
            ->assertOk()
            ->assertJsonPath('data.is_active', true);

        $this->assertSame(
            'A brand new heading',
            $invitation->fresh()->sections()->orderBy('sort_order')->first()->content['heading']
        );

        $this->assertSame(
            ['hero', 'story'],
            $invitation->fresh()->sections()->orderBy('sort_order')->pluck('type')->all()
        );

        $this->assertFalse($invitation->fresh()->envelope['enabled']);
        $this->assertTrue($invitation->fresh()->design_config['effects']['parallax']);
        $this->assertFalse($invitation->fresh()->design_config['effects']['grain']);

        $this->postJson(
            '/api/v1/invitations/'.$invitation->id.'/designs/'.$designId.'/versions/'.$versions[1]['id'].'/restore'
        )
            ->assertOk()
            ->assertJsonPath('data.version', 3)
            ->assertJsonPath('data.snapshot.sections.0.title', 'Hero');

        $this->assertSame(
            'Original heading',
            $invitation->fresh()->sections()->orderBy('sort_order')->first()->content['heading']
        );
    }

    public function test_design_can_be_duplicated_and_deleted_but_the_live_design_cannot_be_deleted(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $invitation = Invitation::factory()->for($admin)->create();

        Sanctum::actingAs($admin, ['admin']);

        $designId = $this->getJson('/api/v1/invitations/'.$invitation->id.'/designs')
            ->assertOk()
            ->json('data.0.id');

        $copy = $this->postJson('/api/v1/invitations/'.$invitation->id.'/designs/'.$designId.'/duplicate')
            ->assertCreated()
            ->assertJsonPath('data.name', 'Original Copy')
            ->assertJsonPath('data.is_active', false)
            ->assertJsonPath('data.version', 1);

        $copyId = $copy->json('data.id');

        $this->deleteJson('/api/v1/invitations/'.$invitation->id.'/designs/'.$designId)
            ->assertStatus(422)
            ->assertJsonValidationErrors('design');

        $this->deleteJson('/api/v1/invitations/'.$invitation->id.'/designs/'.$copyId)
            ->assertOk();

        $this->assertDatabaseMissing('invitation_designs', ['id' => $copyId]);
    }

    public function test_export_renders_a_standalone_html_invitation_with_cdn_assets_and_rsvp_endpoint(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $invitation = Invitation::factory()->for($admin)->create([
            'title' => 'Maheen & Uzair',
            'slug' => 'maheen-and-uzair',
            'venue_name' => 'The Grand Ballroom',
            'venue_address' => 'Karachi, Pakistan',
        ]);
        $invitation->sections()->create([
            'type' => 'hero',
            'title' => 'Hero',
            'content' => [
                'eyebrow' => 'Together with their families',
                'heading' => 'Maheen & Uzair',
                'subheading' => 'invite you to celebrate their wedding',
            ],
            'sort_order' => 0,
            'is_visible' => true,
        ]);
        $invitation->sections()->create([
            'type' => 'story',
            'title' => 'Our Story',
            'content' => ['heading' => 'Our Story', 'body' => 'It began with a cup of chai.'],
            'sort_order' => 1,
            'is_visible' => true,
        ]);
        $invitation->sections()->create([
            'type' => 'rsvp',
            'title' => 'RSVP',
            'content' => ['heading' => 'Will You Join Us?'],
            'sort_order' => 2,
            'is_visible' => true,
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $designId = $this->getJson('/api/v1/invitations/'.$invitation->id.'/designs')
            ->assertOk()
            ->json('data.0.id');

        $response = $this->get('/api/v1/invitations/'.$invitation->id.'/designs/'.$designId.'/export')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/html; charset=UTF-8');

        $this->assertStringContainsString('attachment;', $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('bootstrap@5.3.3', $response->getContent());
        $this->assertStringContainsString('fonts.googleapis.com', $response->getContent());
        $this->assertStringContainsString('data-ea-envelope', $response->getContent());
        $this->assertStringContainsString('data-ea-rsvp', $response->getContent());
        $this->assertStringContainsString('Maheen &amp; Uzair', $response->getContent());
        $this->assertStringContainsString('It began with a cup of chai.', $response->getContent());
        $this->assertStringContainsString('/public/invitations/', $response->getContent());
        $this->assertStringContainsString('/rsvp', $response->getContent());
        $this->assertStringContainsString('apiBase:', $response->getContent());

        $inline = $this->get('/api/v1/invitations/'.$invitation->id.'/designs/'.$designId.'/export?inline=1')
            ->assertOk();

        $this->assertStringContainsString('inline;', $inline->headers->get('Content-Disposition'));
    }

    public function test_designs_are_scoped_to_their_invitation_and_owner(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $otherUser = User::factory()->create(['role' => 'planner']);
        $invitation = Invitation::factory()->for($admin)->create();
        $otherInvitation = Invitation::factory()->for($otherUser)->create();

        $design = InvitationDesign::query()->create([
            'invitation_id' => $invitation->id,
            'name' => 'Private design',
            'snapshot' => [
                'theme_id' => $invitation->theme_id,
                'design_config' => [],
                'envelope' => [],
                'cover_image_path' => null,
                'sections' => [],
            ],
            'is_active' => true,
            'version' => 1,
        ]);

        Sanctum::actingAs($otherUser, ['planner']);

        $this->getJson('/api/v1/invitations/'.$invitation->id.'/designs')->assertForbidden();
        $this->getJson('/api/v1/invitations/'.$invitation->id.'/designs/'.$design->id.'/export')->assertForbidden();

        Sanctum::actingAs($admin, ['admin']);

        $this->getJson('/api/v1/invitations/'.$otherInvitation->id.'/designs/'.$design->id)->assertNotFound();

        $this->getJson('/api/v1/designs')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $design->id)
            ->assertJsonPath('data.0.invitation.title', $invitation->title);
    }

    public function test_design_payloads_are_validated(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $invitation = Invitation::factory()->for($admin)->create();

        Sanctum::actingAs($admin, ['admin']);

        $this->postJson('/api/v1/invitations/'.$invitation->id.'/designs', [
            'name' => 'Broken',
            'snapshot' => [
                'theme_id' => 999999,
                'sections' => [
                    ['type' => 'not-a-real-section'],
                ],
            ],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'snapshot.theme_id',
                'snapshot.sections.0.type',
            ]);
    }
}
