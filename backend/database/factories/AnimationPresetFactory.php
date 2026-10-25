<?php

namespace Database\Factories;

use App\Models\AnimationPreset;
use Illuminate\Database\Eloquent\Factories\Factory;

class AnimationPresetFactory extends Factory
{
    protected $model = AnimationPreset::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->words(2, true),
            'slug' => $this->faker->unique()->slug(3),
            'description' => $this->faker->sentence(),
            'type' => $this->faker->randomElement(['fade_up', 'stagger', 'zoom', 'parallax', 'slide', 'envelope']),
            'defaults' => [
                'duration' => 0.8,
                'delay' => 0.05,
                'easing' => 'easeOut',
                'distance' => 40,
                'once' => true,
                'direction' => 'up',
            ],
            'config_schema' => null,
            'is_active' => true,
        ];
    }
}
