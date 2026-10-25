<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'category' => $this->category,
            'thumbnail_path' => $this->thumbnail_path,
            'thumbnail_url' => $this->thumbnail_path
                ? (str_starts_with($this->thumbnail_path, 'http')
                    ? $this->thumbnail_path
                    : asset($this->thumbnail_path))
                : null,
            'default_theme_id' => $this->default_theme_id,
            'default_theme' => $this->whenLoaded('defaultTheme', fn () => new ThemeResource($this->defaultTheme)),
            'layout' => $this->layout,
            'is_active' => $this->is_active,
            'invitations_count' => $this->whenCounted('invitations'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
