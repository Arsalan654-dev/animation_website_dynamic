<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'description' => $this->description,
            'meta' => $this->meta,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
            ]),
            'invitation' => $this->whenLoaded('invitation', fn () => $this->invitation ? [
                'id' => $this->invitation->id,
                'title' => $this->invitation->title,
                'slug' => $this->invitation->slug,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
