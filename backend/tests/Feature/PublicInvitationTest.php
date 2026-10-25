<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\InvitationEvent;
use App\Models\InvitationSection;
use App\Models\MediaAsset;
use App\Models\Setting;
use App\Models\Theme;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublicInvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_published_invitation_returns_the_full_public_payload(): void
    {
        $theme = Theme::factory()->create();
        $invitation = Invitation::factory()->published()->create([
            'theme_id' => $theme->id,
            'design_config' => [
                'animation' => ['preset' => null, 'disabled' => false],
                'theme_tokens' => ['colors' => ['primary' => '#123456']],
            ],
        ]);

        InvitationSection::factory()->for($invitation)->create([
            'type' => 'story',
            'title' => 'Our story',
            'content' => ['heading' => 'How we met', 'body' => 'At a bookshop.'],
            'sort_order' => 0,
            'is_visible' => true,
        ]);

        InvitationSection::factory()->for($invitation)->create([
            'type' => 'text',
            'title' => 'Hidden note',
            'sort_order' => 1,
            'is_visible' => false,
        ]);

        InvitationEvent::factory()->for($invitation)->create([
            'title' => 'Nikah',
            'sort_order' => 0,
        ]);

        Setting::put('site_name', 'Test Studio');

        $response = $this->getJson('/api/v1/public/invitations/'.$invitation->slug);

        $response->assertOk()
            ->assertJsonPath('data.slug', $invitation->slug)
            ->assertJsonPath('data.theme.tokens.colors.primary', '#123456')
            ->assertJsonPath('data.site_name', 'Test Studio')
            ->assertJsonPath('data.rsvp.open', true)
            ->assertJsonPath('data.animations_enabled', true)
            ->assertJsonCount(1, 'data.sections')
            ->assertJsonPath('data.sections.0.type', 'story')
            ->assertJsonPath('data.sections.0.content.heading', 'How we met')
            ->assertJsonCount(1, 'data.events')
            ->assertJsonPath('data.events.0.title', 'Nikah')
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'slug',
                    'status',
                    'cover_image',
                    'theme' => ['id', 'name', 'slug', 'tokens'],
                    'couple',
                    'monogram',
                    'event',
                    'venue',
                    'envelope',
                    'design',
                    'events',
                    'sections',
                    'rsvp',
                    'animations_enabled',
                    'site_name',
                ],
            ]);
    }

    public function test_draft_and_archived_invitations_are_not_publicly_available(): void
    {
        $draft = Invitation::factory()->create();
        $archived = Invitation::factory()->create([
            'status' => 'archived',
            'archived_at' => now(),
        ]);

        $this->getJson('/api/v1/public/invitations/'.$draft->slug)->assertNotFound();
        $this->getJson('/api/v1/public/invitations/'.$archived->slug)->assertNotFound();
    }

    public function test_theme_overrides_are_merged_and_unknown_tokens_are_stripped(): void
    {
        $invitation = Invitation::factory()->published()->create([
            'design_config' => [
                'animation' => [],
                'theme_tokens' => [
                    'colors' => [
                        'primary' => '#123456',
                        'evil' => 'url(javascript:alert(1))',
                    ],
                    'evil' => ['payload' => 'nope'],
                ],
            ],
        ]);

        $this->getJson('/api/v1/public/invitations/'.$invitation->slug)
            ->assertOk()
            ->assertJsonPath('data.theme.tokens.colors.primary', '#123456')
            ->assertJsonMissingPath('data.theme.tokens.colors.evil')
            ->assertJsonMissingPath('data.theme.tokens.evil');
    }

    public function test_global_animation_setting_disables_section_animation(): void
    {
        Setting::put('animations_enabled', false);

        $invitation = Invitation::factory()->published()->create();
        InvitationSection::factory()->for($invitation)->create(['sort_order' => 0]);

        $this->getJson('/api/v1/public/invitations/'.$invitation->slug)
            ->assertOk()
            ->assertJsonPath('data.animations_enabled', false)
            ->assertJsonPath('data.sections.0.animation.enabled', false);
    }

    public function test_envelope_and_event_media_are_hydrated_for_the_public_page(): void
    {
        $cover = MediaAsset::factory()->create();
        $eventImage = MediaAsset::factory()->create();

        $invitation = Invitation::factory()->published()->create();
        $envelope = $invitation->envelope;
        $envelope['cover_media_id'] = $cover->id;
        $invitation->update(['envelope' => $envelope]);

        InvitationEvent::factory()->for($invitation)->create([
            'title' => 'Walima',
            'image_media_id' => $eventImage->id,
        ]);

        $this->getJson('/api/v1/public/invitations/'.$invitation->slug)
            ->assertOk()
            ->assertJsonPath('data.envelope.cover_image.id', $cover->id)
            ->assertJsonPath('data.envelope.cover_image.mediaId', $cover->id)
            ->assertJsonPath('data.events.0.image.id', $eventImage->id);
    }

    public function test_owner_can_preview_a_draft_but_another_planner_cannot(): void
    {
        $owner = User::factory()->create(['role' => 'planner']);
        $other = User::factory()->create(['role' => 'planner']);

        $invitation = Invitation::factory()->for($owner)->create();
        InvitationSection::factory()->for($invitation)->create(['is_visible' => true]);
        InvitationSection::factory()->for($invitation)->create(['is_visible' => false]);

        Sanctum::actingAs($owner, ['admin']);

        $this->getJson('/api/v1/invitations/'.$invitation->id.'/preview')
            ->assertOk()
            ->assertJsonPath('preview', true)
            ->assertJsonCount(1, 'data.sections');

        Sanctum::actingAs($other, ['admin']);

        $this->getJson('/api/v1/invitations/'.$invitation->id.'/preview')
            ->assertForbidden();
    }
}
