<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvitationSectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invitation_id' => $this->invitation_id,
            'type' => $this->type,
            'title' => $this->title,
            'content' => $this->content ?? [],
            'design' => $this->design,
            'animation_preset_id' => $this->animation_preset_id,
            'animation_preset' => $this->whenLoaded('animationPreset', fn () => new AnimationPresetResource($this->animationPreset)),
            'animation_config' => $this->animation_config,
            'sort_order' => $this->sort_order,
            'is_visible' => $this->is_visible,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
