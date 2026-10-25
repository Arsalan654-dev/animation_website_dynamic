<?php

namespace Database\Factories;

use App\Models\Invitation;
use App\Models\InvitationEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvitationEventFactory extends Factory
{
    protected $model = InvitationEvent::class;

    public function definition(): array
    {
        return [
            'invitation_id' => Invitation::factory(),
            'title' => $this->faker->randomElement(['Mehndi', 'Nikah', 'Baraat', 'Walima']),
            'description' => $this->faker->sentence(),
            'event_at' => now()->addMonths(2)->utc(),
            'timezone' => 'Asia/Karachi',
            'venue_name' => 'The Grand Ballroom',
            'venue_address' => 'Karachi, Pakistan',
            'map_url' => null,
            'dress_code' => null,
            'image_media_id' => null,
            'rsvp_enabled' => true,
            'sort_order' => 0,
        ];
    }
}
