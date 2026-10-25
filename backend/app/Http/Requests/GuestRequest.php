<?php

namespace App\Http\Requests;

use App\Models\Invitation;
use Illuminate\Foundation\Http\FormRequest;

class GuestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $invitation = $this->route('invitation');

        return $invitation instanceof Invitation
            && $this->user()->can('update', $invitation);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:60'],
            'max_guests' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'is_allowed' => ['sometimes', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
