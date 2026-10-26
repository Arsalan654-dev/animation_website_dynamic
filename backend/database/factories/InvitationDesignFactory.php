<?php

namespace Database\Factories;

use App\Models\Invitation;
use App\Models\InvitationDesign;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvitationDesignFactory extends Factory
{
    protected $model = InvitationDesign::class;

    public function definition(): array
    {
        return [
            'invitation_id' => Invitation::factory(),
            'name' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(),
            'snapshot' => [
                'theme_id' => null,
                'design_config' => [
                    'animation' => ['preset' => 'fade-up', 'disabled' => false, 'overrides' => []],
                    'theme_tokens' => [],
                    'effects' => [
                        'scroll_reveal' => true,
                        'hover_lift' => true,
                        'image_zoom' => true,
                        'parallax' => false,
                        'grain' => true,
                        'sticky_nav' => true,
                        'scroll_progress' => false,
                        'cursor_glow' => false,
                    ],
                    'custom_css' => '',
                    'page' => [
                        'background_image' => null,
                        'overlay' => 0,
                        'nav_style' => 'glass',
                    ],
                ],
                'envelope' => [
                    'enabled' => true,
                    'style' => 'classic',
                    'monogram' => 'A & B',
                    'seal_text' => 'A & B',
                    'prompt' => 'Open the invitation',
                    'cover_media_id' => null,
                    'card_media_id' => null,
                    'seal_media_id' => null,
                    'card_message' => 'Together with their families',
                ],
                'cover_image_path' => null,
                'sections' => [],
            ],
            'is_active' => false,
            'version' => 1,
            'created_by' => User::factory(),
            'updated_by' => null,
            'published_at' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'is_active' => true,
            'published_at' => now(),
        ]);
    }
}
