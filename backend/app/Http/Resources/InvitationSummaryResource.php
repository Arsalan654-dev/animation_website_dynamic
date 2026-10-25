<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvitationSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'status' => $this->status,
            'theme_id' => $this->theme_id,
            'theme' => $this->whenLoaded('theme', fn () => new ThemeResource($this->theme)),
            'template_id' => $this->template_id,
            'cover_image_path' => $this->cover_image_path,
            'couple_details' => $this->couple_details ?? [],
            'event' => $this->eventPayload(),
            'timezone' => $this->timezone,
            'venue_name' => $this->venue_name,
            'published_at' => $this->published_at?->toIso8601String(),
            'sections_count' => $this->whenCounted('sections'),
            'rsvps_count' => $this->whenCounted('rsvps'),
            'confirmed_guests' => (int) ($this->confirmed_guests_sum ?? 0),
            'public_url' => rtrim(config('app.frontend_url'), '/').'/i/'.$this->slug,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
