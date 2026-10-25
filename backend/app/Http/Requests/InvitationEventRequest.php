<?php

namespace App\Http\Requests;

use App\Models\Invitation;
use App\Models\InvitationEvent;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InvitationEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        $invitation = $this->route('invitation') ?? $this->route('event')?->invitation;

        return $invitation instanceof Invitation
            && $this->user()->can('update', $invitation);
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'title' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'event_at' => ['sometimes', 'nullable', 'date_format:Y-m-d\TH:i'],
            'timezone' => ['sometimes', 'timezone'],
            'venue_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'venue_address' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'map_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'dress_code' => ['sometimes', 'nullable', 'string', 'max:180'],
            'image_media_id' => ['sometimes', 'nullable', 'integer', 'exists:media_assets,id'],
            'rsvp_enabled' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
