<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');
        $template = $this->route('template');

        return [
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:160'],
            'slug' => [
                'sometimes', 'nullable', 'string', 'max:160',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('templates', 'slug')->ignore($template?->id),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'category' => ['sometimes', 'string', 'max:80'],
            'thumbnail_path' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'default_theme_id' => ['sometimes', 'nullable', 'integer', 'exists:themes,id'],
            'layout' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'layout.sections' => ['sometimes', 'array'],
            'layout.sections.*.type' => ['required_with:layout.sections', Rule::in(config('wedding.section_types'))],
            'layout.sections.*.title' => ['sometimes', 'nullable', 'string', 'max:180'],
            'layout.sections.*.content' => ['sometimes', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
