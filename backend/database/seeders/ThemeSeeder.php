<?php

namespace Database\Seeders;

use App\Models\AnimationPreset;
use App\Models\Theme;
use App\Support\ThemeTokens;
use Illuminate\Database\Seeder;

class ThemeSeeder extends Seeder
{
    public function run(): void
    {
        $presets = AnimationPreset::query()->pluck('id', 'slug');

        $previews = [
            'blue-toile' => '/demo/garden.jpg',
            'burgundy-olive' => '/demo/florals.jpg',
            'brown-ivory' => '/demo/details.jpg',
            'sage-cream' => '/demo/ceremony.jpg',
            'blush-floral' => '/demo/rings.jpg',
            'black-gold' => '/demo/venue.jpg',
        ];

        foreach (config('wedding.theme_presets') as $slug => $preset) {
            $tokens = ThemeTokens::merge([
                'colors' => $preset['colors'] ?? [],
                'typography' => $preset['typography'] ?? [],
                'surfaces' => $preset['surfaces'] ?? [],
                'ornaments' => $preset['ornaments'] ?? [],
                'animation' => $preset['animation'] ?? [],
            ]);

            Theme::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $preset['name'],
                    'description' => $preset['description'],
                    'preview_image_path' => $previews[$slug] ?? null,
                    'tokens' => $tokens,
                    'default_animation_preset_id' => $presets[$preset['animation']['preset'] ?? 'fade-up'] ?? null,
                    'is_active' => true,
                ]
            );
        }
    }
}
