<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvitationResource extends JsonResource
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
            'template' => $this->whenLoaded('template', fn () => new TemplateResource($this->template)),
            'cover_image_path' => $this->cover_image_path,
            'envelope' => $this->envelope ?? [],
            'couple_details' => $this->couple_details ?? [],
            'event_at' => $this->event_at?->utc()->toIso8601String(),
            'event_at_local' => $this->event_at?->copy()->setTimezone($this->timezone)->format('Y-m-d\TH:i'),
            'event' => $this->eventPayload(),
            'timezone' => $this->timezone,
            'venue_name' => $this->venue_name,
            'venue_address' => $this->venue_address,
            'venue_map_url' => $this->venue_map_url,
            'venue_map_embed' => $this->venue_map_embed,
            'rsvp_settings' => $this->rsvpConfig(),
            'rsvp_open' => $this->isRsvpOpen(),
            'design_config' => $this->design_config ?? [],
            'published_at' => $this->published_at?->toIso8601String(),
            'archived_at' => $this->archived_at?->toIso8601String(),
            'sections' => InvitationSectionResource::collection($this->whenLoaded('sections')),
            'events' => InvitationEventResource::collection($this->whenLoaded('events')),
            'media_assets' => $this->when(
                isset($this->media_assets),
                fn () => MediaResource::collection($this->media_assets)->resolve()
            ),
            'stats' => $this->when(isset($this->rsvps_count), fn () => [
                'rsvps_count' => (int) ($this->rsvps_count ?? 0),
                'attending_count' => (int) ($this->attending_responses_count ?? 0),
                'confirmed_guests' => (int) ($this->confirmed_guests_sum ?? 0),
                'guests_count' => (int) ($this->guests_count ?? 0),
            ]),
            'public_url' => rtrim(config('app.frontend_url'), '/').'/i/'.$this->slug,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
