<?php

namespace App\Http\Resources;

use App\Support\DatePayload;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvitationEventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'event_at' => $this->event_at?->utc()->toIso8601String(),
            'event_at_local' => $this->event_at?->copy()->setTimezone($this->timezone)->format('Y-m-d\TH:i'),
            'date' => DatePayload::make($this->event_at, $this->timezone),
            'timezone' => $this->timezone,
            'venue_name' => $this->venue_name,
            'venue_address' => $this->venue_address,
            'map_url' => $this->map_url,
            'dress_code' => $this->dress_code,
            'image_media_id' => $this->image_media_id,
            'image' => $this->whenLoaded('image', fn () => new MediaResource($this->image)),
            'rsvp_enabled' => $this->rsvp_enabled,
            'sort_order' => $this->sort_order,
        ];
    }
}
