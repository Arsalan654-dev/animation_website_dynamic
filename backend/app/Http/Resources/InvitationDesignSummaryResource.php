<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvitationDesignSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $snapshot = is_array($this->snapshot ?? null) ? $this->snapshot : [];

        return [
            'id' => $this->id,
            'invitation_id' => $this->invitation_id,
            'name' => $this->name,
            'description' => $this->description,
            'is_active' => (bool) $this->is_active,
            'version' => $this->version,
            'section_count' => count($snapshot['sections'] ?? []),
            'theme_id' => $snapshot['theme_id'] ?? null,
            'cover_image_path' => $snapshot['cover_image_path'] ?? null,
            'published_at' => $this->published_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'invitation' => $this->whenLoaded('invitation', fn () => [
                'id' => $this->invitation->id,
                'title' => $this->invitation->title,
                'slug' => $this->invitation->slug,
                'status' => $this->invitation->status,
                'theme_id' => $this->invitation->theme_id,
                'public_url' => rtrim(config('app.frontend_url'), '/').'/i/'.$this->invitation->slug,
            ]),
            'creator' => $this->whenLoaded('creator', fn () => $this->creator ? [
                'id' => $this->creator->id,
                'name' => $this->creator->name,
            ] : null),
        ];
    }
}
