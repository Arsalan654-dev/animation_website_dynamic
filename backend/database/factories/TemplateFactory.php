<?php

namespace Database\Factories;

use App\Models\Template;
use App\Models\Theme;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TemplateFactory extends Factory
{
    protected $model = Template::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->words(2, true);

        return [
            'name' => Str::title($name),
            'slug' => Str::slug($name).'-'.$this->faker->unique()->numberBetween(1, 99999),
            'description' => $this->faker->sentence(),
            'category' => $this->faker->randomElement(['classic', 'modern', 'garden', 'destination']),
            'thumbnail_path' => null,
            'default_theme_id' => Theme::factory(),
            'layout' => [
                'sections' => [
                    ['type' => 'hero', 'content' => ['heading' => 'A & B', 'eyebrow' => 'Together with their families']],
                    ['type' => 'story', 'content' => ['heading' => 'Our Story', 'body' => 'Our story begins here.']],
                    ['type' => 'events', 'content' => ['heading' => 'The Celebrations']],
                    ['type' => 'rsvp', 'content' => ['heading' => 'Will You Join Us?']],
                ],
            ],
            'is_active' => true,
        ];
    }
}
