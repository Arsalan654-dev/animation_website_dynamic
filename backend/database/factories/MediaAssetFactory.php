<?php

namespace Database\Factories;

use App\Models\MediaAsset;
use Illuminate\Database\Eloquent\Factories\Factory;

class MediaAssetFactory extends Factory
{
    protected $model = MediaAsset::class;

    public function definition(): array
    {
        return [
            'disk' => 'public',
            'path' => 'media/demo/'.$this->faker->unique()->slug().'.jpg',
            'original_name' => $this->faker->word().'.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 240000,
            'width' => 1600,
            'height' => 1200,
            'alt_text' => $this->faker->sentence(4),
            'caption' => null,
        ];
    }
}
