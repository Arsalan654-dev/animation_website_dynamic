<?php

namespace App\Http\Requests;

use App\Models\Invitation;
use App\Models\InvitationSection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InvitationSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $invitation = $this->route('invitation') ?? $this->route('section')?->invitation;

        return $invitation instanceof Invitation
            && $this->user()->can('update', $invitation);
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');
        $section = $this->route('section');
        $sectionId = $section instanceof InvitationSection ? $section->id : null;

        return [
            'type' => [$isUpdate ? 'sometimes' : 'required', Rule::in(config('wedding.section_types'))],
            'title' => ['sometimes', 'nullable', 'string', 'max:180'],
            'content' => [$isUpdate ? 'sometimes' : 'required', 'array'],
            'design' => ['sometimes', 'nullable', 'array'],
            'animation_preset_id' => ['sometimes', 'nullable', 'integer', 'exists:animation_presets,id'],
            'animation_config' => ['sometimes', 'nullable', 'array'],
            'animation_config.duration' => ['sometimes', 'numeric', 'min:0.1', 'max:10'],
            'animation_config.delay' => ['sometimes', 'numeric', 'min:0', 'max:5'],
            'animation_config.easing' => ['sometimes', Rule::in(['easeOut', 'easeIn', 'easeInOut', 'linear', 'spring'])],
            'animation_config.distance' => ['sometimes', 'numeric', 'min:0', 'max:200'],
            'animation_config.scale' => ['sometimes', 'numeric', 'min:0.5', 'max:1.5'],
            'animation_config.stagger' => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'animation_config.once' => ['sometimes', 'boolean'],
            'animation_config.direction' => ['sometimes', Rule::in(['up', 'down', 'left', 'right'])],
            'animation_config.parallax' => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'animation_config.mobile' => ['sometimes', 'boolean'],
            'animation_config.disabled' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_visible' => ['sometimes', 'boolean'],
        ];
    }
}
