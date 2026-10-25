<?php

namespace Database\Factories;

use App\Models\AnimationPreset;
use App\Models\Theme;
use App\Support\ThemeTokens;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ThemeFactory extends Factory
{
    protected $model = Theme::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->words(2, true);

        return [
            'name' => Str::title($name),
            'slug' => Str::slug($name).'-'.$this->faker->unique()->numberBetween(1, 99999),
            'description' => $this->faker->sentence(),
            'preview_image_path' => null,
            'tokens' => ThemeTokens::defaults(),
            'default_animation_preset_id' => AnimationPreset::factory(),
            'is_active' => true,
        ];
    }
}
