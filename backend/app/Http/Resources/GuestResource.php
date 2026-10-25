<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GuestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invitation_id' => $this->invitation_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'code' => $this->code,
            'max_guests' => $this->max_guests,
            'is_allowed' => $this->is_allowed,
            'notes' => $this->notes,
            'rsvp_submission_id' => $this->rsvp_submission_id,
            'invitation_link' => rtrim(config('app.frontend_url'), '/').'/i/'.$this->invitation?->slug.'?guest='.$this->code,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
