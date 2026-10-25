<?php

namespace Database\Factories;

use App\Models\Invitation;
use App\Models\Theme;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class InvitationFactory extends Factory
{
    protected $model = Invitation::class;

    public function definition(): array
    {
        $one = $this->faker->firstName();
        $two = $this->faker->firstName();
        $eventAt = now()->addMonths(3)->setTime(19, 0);

        return [
            'user_id' => User::factory(),
            'template_id' => null,
            'theme_id' => Theme::factory(),
            'title' => $one.' & '.$two,
            'slug' => Str::slug($one.'-and-'.$two).'-'.$this->faker->unique()->numberBetween(1, 999999),
            'status' => 'draft',
            'cover_image_path' => null,
            'envelope' => [
                'enabled' => true,
                'style' => 'classic',
                'monogram' => $one[0].' & '.$two[0],
                'seal_text' => $one[0].' & '.$two[0],
                'prompt' => 'Open the invitation',
                'cover_media_id' => null,
                'card_media_id' => null,
                'seal_media_id' => null,
                'card_message' => 'Together with their families',
            ],
            'couple_details' => [
                'partner_one' => $one,
                'partner_two' => $two,
                'title' => 'Together with their families',
                'subtitle' => 'request the pleasure of your company',
                'quote' => 'Two souls, one beautiful beginning.',
                'message' => 'Join us as we celebrate our wedding.',
                'story_heading' => 'Our Story',
                'story_body' => 'Our story began with a chance meeting and grew into a lifetime of love.',
            ],
            'event_at' => $eventAt->utc(),
            'timezone' => 'Asia/Karachi',
            'venue_name' => 'The Grand Ballroom',
            'venue_address' => 'Karachi, Pakistan',
            'venue_map_url' => 'https://maps.google.com',
            'rsvp_settings' => config('wedding.default_rsvp_settings'),
            'design_config' => [
                'animation' => ['preset' => 'fade-up', 'disabled' => false],
                'theme_tokens' => [],
            ],
            'published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }
}
