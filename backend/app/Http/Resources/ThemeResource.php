<?php

namespace App\Http\Resources;

use App\Support\ThemeTokens;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ThemeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'preview_image_path' => $this->preview_image_path,
            'preview_image_url' => $this->preview_image_path
                ? (str_starts_with($this->preview_image_path, 'http')
                    ? $this->preview_image_path
                    : asset($this->preview_image_path))
                : null,
            'tokens' => ThemeTokens::sanitize(ThemeTokens::merge($this->tokens ?? [])),
            'default_animation_preset_id' => $this->default_animation_preset_id,
            'default_animation_preset' => $this->whenLoaded('defaultAnimationPreset', fn () => new AnimationPresetResource($this->defaultAnimationPreset)),
            'is_active' => $this->is_active,
            'invitations_count' => $this->whenCounted('invitations'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
