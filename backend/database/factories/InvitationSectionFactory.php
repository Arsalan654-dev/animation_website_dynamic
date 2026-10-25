<?php

namespace Database\Factories;

use App\Models\Invitation;
use App\Models\InvitationSection;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvitationSectionFactory extends Factory
{
    protected $model = InvitationSection::class;

    public function definition(): array
    {
        return [
            'invitation_id' => Invitation::factory(),
            'type' => 'text',
            'title' => 'A note',
            'content' => [
                'heading' => $this->faker->sentence(4),
                'body' => $this->faker->paragraph(),
            ],
            'design' => null,
            'animation_preset_id' => null,
            'animation_config' => null,
            'sort_order' => 0,
            'is_visible' => true,
        ];
    }
}
