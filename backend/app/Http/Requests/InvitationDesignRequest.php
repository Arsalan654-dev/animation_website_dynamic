<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InvitationDesignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $nameRule = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'name' => [$nameRule, 'string', 'max:120'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'snapshot' => ['sometimes', 'array'],
            'snapshot.theme_id' => ['sometimes', 'nullable', 'integer', 'exists:themes,id'],
            'snapshot.design_config' => ['sometimes', 'array'],
            'snapshot.envelope' => ['sometimes', 'array'],
            'snapshot.cover_image_path' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'snapshot.sections' => ['sometimes', 'array', 'max:100'],
            'snapshot.sections.*.type' => ['required', 'string', Rule::in(config('wedding.section_types'))],
            'snapshot.sections.*.title' => ['sometimes', 'nullable', 'string', 'max:180'],
            'snapshot.sections.*.content' => ['sometimes', 'array'],
            'snapshot.sections.*.design' => ['sometimes', 'nullable', 'array'],
            'snapshot.sections.*.animation_preset_id' => ['sometimes', 'nullable', 'integer', 'exists:animation_presets,id'],
            'snapshot.sections.*.animation_config' => ['sometimes', 'nullable', 'array'],
            'snapshot.sections.*.sort_order' => ['sometimes', 'integer', 'min:0'],
            'snapshot.sections.*.is_visible' => ['sometimes', 'boolean'],
            'activate' => ['sometimes', 'boolean'],
            'apply' => ['sometimes', 'boolean'],
            'label' => ['sometimes', 'nullable', 'string', 'max:120'],
        ];
    }
}
