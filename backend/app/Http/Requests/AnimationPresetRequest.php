<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnimationPresetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');
        $preset = $this->route('animation_preset');

        return [
            'name' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:120'],
            'slug' => [
                'sometimes', 'nullable', 'string', 'max:120',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('animation_presets', 'slug')->ignore($preset?->id),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'type' => [$isUpdate ? 'sometimes' : 'required', Rule::in(['fade_up', 'stagger', 'zoom', 'parallax', 'slide', 'envelope'])],
            'defaults' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'defaults.duration' => ['sometimes', 'numeric', 'min:0.1', 'max:10'],
            'defaults.delay' => ['sometimes', 'numeric', 'min:0', 'max:5'],
            'defaults.easing' => ['sometimes', Rule::in(['easeOut', 'easeIn', 'easeInOut', 'linear', 'spring'])],
            'defaults.distance' => ['sometimes', 'numeric', 'min:0', 'max:200'],
            'defaults.scale' => ['sometimes', 'numeric', 'min:0.5', 'max:1.5'],
            'defaults.stagger' => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'defaults.once' => ['sometimes', 'boolean'],
            'defaults.direction' => ['sometimes', Rule::in(['up', 'down', 'left', 'right'])],
            'defaults.parallax' => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'defaults.mobile' => ['sometimes', 'boolean'],
            'defaults.reduced_motion' => ['sometimes', Rule::in(['fade', 'none'])],
            'config_schema' => ['sometimes', 'nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
