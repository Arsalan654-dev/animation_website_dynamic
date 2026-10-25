<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MediaUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $maxKb = config('wedding.upload.max_kb');

        return [
            'file' => [
                'required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif',
                'max:'.$maxKb, 'dimensions:max_width=9000,max_height=9000',
            ],
            'alt_text' => ['nullable', 'string', 'max:250'],
            'caption' => ['nullable', 'string', 'max:250'],
        ];
    }
}
