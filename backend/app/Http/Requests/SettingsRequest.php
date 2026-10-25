<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'animations_enabled' => ['sometimes', 'boolean'],
            'site_name' => ['sometimes', 'string', 'max:120'],
        ];
    }
}
