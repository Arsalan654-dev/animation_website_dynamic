<?php

namespace Tests\Feature;

use App\Models\AnimationPreset;
use App\Models\Invitation;
use App\Models\RsvpSubmission;
use App\Models\Setting;
use App\Models\Theme;
use App\Models\User;
use App\Support\ThemeTokens;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudioResourcesTest extends TestCase
{
    use RefreshDatabase;

    public function test_theme_can_be_created_updated_duplicated_and_deleted(): void
    {
        AnimationPreset::factory()->create([
            'name' => 'Fade Up',
            'slug' => 'fade-up',
        ]);

        Sanctum::actingAs($this->admin(), ['admin']);

        $created = $this->postJson('/api/v1/themes', [
            'name' => 'Editorial Rose',
            'description' => 'A warm editorial theme.',
            'tokens' => ThemeTokens::defaults(),
        ])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'editorial-rose')
            ->assertJsonPath('data.is_active', true);

        $themeId = $created->json('data.id');

        $this->patchJson('/api/v1/themes/'.$themeId, [
            'name' => 'Editorial Rose No. 2',
            'tokens' => [
                'colors' => [
                    'primary' => '#abcdef',
                    'evil' => '#000000',
                ],
                'evil' => ['payload' => true],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Editorial Rose No. 2')
            ->assertJsonPath('data.tokens.colors.primary', '#abcdef')
            ->assertJsonMissingPath('data.tokens.colors.evil')
            ->assertJsonMissingPath('data.tokens.evil');

        $this->postJson('/api/v1/themes/'.$themeId.'/duplicate')
            ->assertCreated()
            ->assertJsonPath('data.name', 'Editorial Rose No. 2 Copy')
            ->assertJsonPath('data.is_active', false);

        $this->deleteJson('/api/v1/themes/'.$themeId)->assertOk();
        $this->assertDatabaseMissing('themes', ['id' => $themeId]);
    }

    public function test_theme_validation_and_delete_conflicts_are_enforced(): void
    {
        Sanctum::actingAs($this->admin(), ['admin']);

        $tokens = ThemeTokens::defaults();
        $tokens['typography']['headingFont'] = 'Comic Sans MS';

        $this->postJson('/api/v1/themes', [
            'name' => 'Invalid Font',
            'tokens' => $tokens,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('tokens.typography.headingFont');

        $theme = Theme::factory()->create();
        Invitation::factory()->create(['theme_id' => $theme->id]);

        $this->deleteJson('/api/v1/themes/'.$theme->id)
            ->assertStatus(409)
            ->assertJsonPath('message', 'This theme is assigned to invitations. Reassign them before deleting it.');
    }

    public function test_templates_can_be_created_duplicated_and_protected_from_deletion(): void
    {
        $admin = $this->admin();
        $theme = Theme::factory()->create();

        Sanctum::actingAs($admin, ['admin']);

        $created = $this->postJson('/api/v1/templates', [
            'name' => 'Garden Party',
            'description' => 'Loose botanicals and cream paper.',
            'category' => 'garden',
            'default_theme_id' => $theme->id,
            'layout' => [
                'sections' => [
                    ['type' => 'hero', 'content' => ['heading' => 'A & B']],
                    ['type' => 'story', 'content' => ['heading' => 'Our Story']],
                ],
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'garden-party')
            ->assertJsonPath('data.layout.sections.0.type', 'hero');

        $templateId = $created->json('data.id');

        $this->postJson('/api/v1/templates/'.$templateId.'/duplicate')
            ->assertCreated()
            ->assertJsonPath('data.name', 'Garden Party Copy')
            ->assertJsonPath('data.is_active', false);

        Invitation::factory()->create([
            'user_id' => $admin->id,
            'template_id' => $templateId,
        ]);

        $this->deleteJson('/api/v1/templates/'.$templateId)->assertStatus(409);
    }

    public function test_animation_presets_can_be_created_duplicated_and_protected_from_deletion(): void
    {
        Sanctum::actingAs($this->admin(), ['admin']);

        $created = $this->postJson('/api/v1/animation-presets', [
            'name' => 'Soft Rise',
            'description' => 'A slow, gentle entrance.',
            'type' => 'fade_up',
            'defaults' => [
                'duration' => 1.2,
                'delay' => 0.1,
                'easing' => 'easeOut',
                'distance' => 32,
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'soft-rise')
            ->assertJsonPath('data.type', 'fade_up')
            ->assertJsonPath('data.is_active', true);

        $presetId = $created->json('data.id');

        $this->postJson('/api/v1/animation-presets/'.$presetId.'/duplicate')
            ->assertCreated()
            ->assertJsonPath('data.name', 'Soft Rise Copy')
            ->assertJsonPath('data.is_active', false);

        $this->deleteJson('/api/v1/animation-presets/'.$presetId)->assertOk();
        $this->assertDatabaseMissing('animation_presets', ['id' => $presetId]);
    }

    public function test_studio_settings_are_admin_only(): void
    {
        $admin = $this->admin();
        $planner = User::factory()->create(['role' => 'planner']);

        Sanctum::actingAs($admin, ['admin']);

        $this->patchJson('/api/v1/settings', [
            'site_name' => 'Atelier Noor',
            'animations_enabled' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.site_name', 'Atelier Noor')
            ->assertJsonPath('data.animations_enabled', false);

        $this->assertSame('Atelier Noor', Setting::value('site_name'));

        Sanctum::actingAs($planner, ['admin']);

        $this->patchJson('/api/v1/settings', ['site_name' => 'Not Allowed'])
            ->assertForbidden();
    }

    public function test_dashboard_reports_invitation_and_rsvp_metrics(): void
    {
        $admin = $this->admin();
        $invitation = Invitation::factory()->for($admin)->published()->create();

        RsvpSubmission::factory()->for($invitation)->create([
            'attendance' => 'attending',
            'guest_count' => 2,
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $this->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('data.invitations.total', 1)
            ->assertJsonPath('data.invitations.published', 1)
            ->assertJsonPath('data.rsvps.total', 1)
            ->assertJsonPath('data.rsvps.attending_responses', 1)
            ->assertJsonPath('data.rsvps.confirmed_guests', 2)
            ->assertJsonPath('data.attendance_rate', 100)
            ->assertJsonCount(1, 'data.recent_rsvps');
    }

    public function test_health_endpoint_reports_database_status(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('data.database', 'ok');
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }
}
