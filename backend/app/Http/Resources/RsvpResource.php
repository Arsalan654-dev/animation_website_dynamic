<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RsvpResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invitation_id' => $this->invitation_id,
            'invitation' => $this->whenLoaded('invitation', fn () => [
                'id' => $this->invitation->id,
                'title' => $this->invitation->title,
                'slug' => $this->invitation->slug,
            ]),
            'guest_name' => $this->guest_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'attendance' => $this->attendance,
            'guest_count' => $this->guest_count,
            'message' => $this->message,
            'answers' => $this->answers,
            'guest_code' => $this->guest_code,
            'source' => $this->source,
            'admin_notes' => $this->admin_notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
