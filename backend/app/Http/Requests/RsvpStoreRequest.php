<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RsvpStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'guest_name' => ['required', 'string', 'max:160'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:60'],
            'attendance' => ['required', Rule::in(['attending', 'declined'])],
            'guest_count' => ['required', 'integer', 'min:1', 'max:50'],
            'message' => ['nullable', 'string', 'max:2000'],
            'answers' => ['nullable', 'array'],
            'answers.*' => ['nullable', 'max:500'],
            'guest_code' => ['nullable', 'string', 'max:80'],
        ];
    }
}
