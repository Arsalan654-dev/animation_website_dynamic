<?php

namespace Database\Seeders;

use App\Models\AnimationPreset;
use Illuminate\Database\Seeder;

class AnimationPresetSeeder extends Seeder
{
    public function run(): void
    {
        $schema = [
            ['key' => 'duration', 'label' => 'Duration', 'type' => 'number', 'min' => 0.2, 'max' => 5, 'step' => 0.1],
            ['key' => 'delay', 'label' => 'Delay', 'type' => 'number', 'min' => 0, 'max' => 3, 'step' => 0.05],
            ['key' => 'distance', 'label' => 'Travel distance', 'type' => 'number', 'min' => 0, 'max' => 160, 'step' => 2],
            ['key' => 'stagger', 'label' => 'Stagger', 'type' => 'number', 'min' => 0, 'max' => 0.6, 'step' => 0.01],
            ['key' => 'scale', 'label' => 'Scale', 'type' => 'number', 'min' => 0.8, 'max' => 1.2, 'step' => 0.01],
            ['key' => 'parallax', 'label' => 'Parallax intensity', 'type' => 'number', 'min' => 0, 'max' => 0.6, 'step' => 0.01],
            ['key' => 'easing', 'label' => 'Easing', 'type' => 'select', 'options' => ['easeOut', 'easeInOut', 'linear', 'spring']],
            ['key' => 'direction', 'label' => 'Direction', 'type' => 'select', 'options' => ['up', 'down', 'left', 'right']],
            ['key' => 'once', 'label' => 'Play once', 'type' => 'boolean'],
        ];

        $presets = [
            [
                'name' => 'Fade Up',
                'slug' => 'fade-up',
                'type' => 'fade_up',
                'description' => 'A calm, editorial entrance: fade in while rising gently into place.',
                'defaults' => ['duration' => 0.8, 'delay' => 0.05, 'easing' => 'easeOut', 'distance' => 40, 'scale' => 1, 'stagger' => 0.12, 'once' => true, 'direction' => 'up', 'parallax' => 0, 'mobile' => true, 'reduced_motion' => 'fade'],
            ],
            [
                'name' => 'Stagger Reveal',
                'slug' => 'stagger-reveal',
                'type' => 'stagger',
                'description' => 'Cards and list items appear one after another for a rhythmic reveal.',
                'defaults' => ['duration' => 0.7, 'delay' => 0.1, 'easing' => 'easeOut', 'distance' => 24, 'scale' => 1, 'stagger' => 0.12, 'once' => true, 'direction' => 'up', 'parallax' => 0, 'mobile' => true, 'reduced_motion' => 'fade'],
            ],
            [
                'name' => 'Soft Zoom',
                'slug' => 'soft-zoom',
                'type' => 'zoom',
                'description' => 'Photography opens from a soft scale for a cinematic, intimate feel.',
                'defaults' => ['duration' => 1.15, 'delay' => 0.05, 'easing' => 'easeOut', 'distance' => 0, 'scale' => 0.94, 'stagger' => 0.1, 'once' => true, 'direction' => 'up', 'parallax' => 0, 'mobile' => true, 'reduced_motion' => 'fade'],
            ],
            [
                'name' => 'Parallax',
                'slug' => 'parallax',
                'type' => 'parallax',
                'description' => 'Layered background and foreground movement for a rich scroll scene.',
                'defaults' => ['duration' => 1.3, 'delay' => 0, 'easing' => 'easeOut', 'distance' => 0, 'scale' => 1, 'stagger' => 0, 'once' => false, 'direction' => 'up', 'parallax' => 0.18, 'mobile' => true, 'reduced_motion' => 'fade'],
            ],
            [
                'name' => 'Slide In',
                'slug' => 'slide-in',
                'type' => 'slide',
                'description' => 'Content arrives from the side with a measured, formal elegance.',
                'defaults' => ['duration' => 0.9, 'delay' => 0.05, 'easing' => 'easeOut', 'distance' => 56, 'scale' => 1, 'stagger' => 0.1, 'once' => true, 'direction' => 'left', 'parallax' => 0, 'mobile' => true, 'reduced_motion' => 'fade'],
            ],
            [
                'name' => 'Envelope Reveal',
                'slug' => 'envelope-reveal',
                'type' => 'envelope',
                'description' => 'The full envelope sequence: wax seal, lifting flap, rising card and page reveal.',
                'defaults' => ['duration' => 1.4, 'delay' => 0.1, 'easing' => 'easeInOut', 'distance' => 0, 'scale' => 1, 'stagger' => 0.1, 'once' => true, 'direction' => 'up', 'parallax' => 0, 'mobile' => true, 'reduced_motion' => 'fade'],
            ],
        ];

        foreach ($presets as $preset) {
            AnimationPreset::query()->updateOrCreate(
                ['slug' => $preset['slug']],
                $preset + ['config_schema' => $schema, 'is_active' => true]
            );
        }
    }
}
