<?php

namespace App\Http\Requests;

use App\Models\Invitation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->isMethod('post') && ! $this->route('invitation')) {
            return $this->user() !== null;
        }

        $invitation = $this->route('invitation');

        return $invitation instanceof Invitation
            && $this->user()->can('update', $invitation);
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');
        $invitation = $this->route('invitation');
        $presence = $isUpdate ? 'sometimes' : 'required';

        return [
            'title' => [$presence, 'string', 'max:180'],
            'slug' => [
                'sometimes', 'nullable', 'string', 'max:160',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('invitations', 'slug')->ignore($invitation?->id),
            ],
            'theme_id' => [$presence, 'integer', 'exists:themes,id'],
            'template_id' => ['sometimes', 'nullable', 'integer', 'exists:templates,id'],
            'apply_template_sections' => ['sometimes', 'boolean'],
            'cover_image_path' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'couple_details' => [$presence, 'array'],
            'couple_details.partner_one' => ['sometimes', 'required', 'string', 'max:120'],
            'couple_details.partner_two' => ['sometimes', 'required', 'string', 'max:120'],
            'couple_details.title' => ['sometimes', 'nullable', 'string', 'max:180'],
            'couple_details.subtitle' => ['sometimes', 'nullable', 'string', 'max:240'],
            'couple_details.hashtag' => ['sometimes', 'nullable', 'string', 'max:120'],
            'couple_details.quote' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'couple_details.message' => ['sometimes', 'nullable', 'string', 'max:3000'],
            'couple_details.families' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'couple_details.story_heading' => ['sometimes', 'nullable', 'string', 'max:180'],
            'couple_details.story_body' => ['sometimes', 'nullable', 'string', 'max:8000'],
            'couple_details.story_image_id' => ['sometimes', 'nullable', 'integer', 'exists:media_assets,id'],
            'event_at' => ['sometimes', 'nullable', 'date_format:Y-m-d\TH:i'],
            'timezone' => [$presence, 'timezone'],
            'venue_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'venue_address' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'venue_map_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'venue_map_embed' => ['sometimes', 'nullable', 'string', 'max:4000'],
            'envelope' => ['sometimes', 'array'],
            'envelope.enabled' => ['sometimes', 'boolean'],
            'envelope.style' => ['sometimes', 'string', Rule::in(['classic', 'wax', 'botanical', 'minimal', 'gilded'])],
            'envelope.monogram' => ['sometimes', 'nullable', 'string', 'max:80'],
            'envelope.seal_text' => ['sometimes', 'nullable', 'string', 'max:80'],
            'envelope.prompt' => ['sometimes', 'nullable', 'string', 'max:120'],
            'envelope.cover_media_id' => ['sometimes', 'nullable', 'integer', 'exists:media_assets,id'],
            'envelope.card_media_id' => ['sometimes', 'nullable', 'integer', 'exists:media_assets,id'],
            'envelope.seal_media_id' => ['sometimes', 'nullable', 'integer', 'exists:media_assets,id'],
            'envelope.card_message' => ['sometimes', 'nullable', 'string', 'max:500'],
            'rsvp_settings' => ['sometimes', 'array'],
            'rsvp_settings.enabled' => ['sometimes', 'boolean'],
            'rsvp_settings.deadline' => ['sometimes', 'nullable', 'date'],
            'rsvp_settings.max_guests_per_submission' => ['sometimes', 'integer', 'min:1', 'max:50'],
            'rsvp_settings.allow_decline' => ['sometimes', 'boolean'],
            'rsvp_settings.require_guest_code' => ['sometimes', 'boolean'],
            'rsvp_settings.collect_phone' => ['sometimes', 'boolean'],
            'rsvp_settings.success_message' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'rsvp_settings.questions' => ['sometimes', 'array', 'max:20'],
            'rsvp_settings.questions.*.id' => ['required_with:rsvp_settings.questions', 'string', 'max:60'],
            'rsvp_settings.questions.*.label' => ['required_with:rsvp_settings.questions', 'string', 'max:240'],
            'rsvp_settings.questions.*.type' => ['required_with:rsvp_settings.questions', Rule::in(['text', 'textarea', 'select'])],
            'rsvp_settings.questions.*.required' => ['boolean'],
            'rsvp_settings.questions.*.options' => ['array', 'max:20'],
            'design_config' => ['sometimes', 'array'],
            'design_config.animation' => ['sometimes', 'array'],
            'design_config.animation.preset' => ['sometimes', 'nullable', 'string', Rule::exists('animation_presets', 'slug')],
            'design_config.animation.disabled' => ['sometimes', 'boolean'],
            'design_config.animation.overrides' => ['sometimes', 'array'],
            'design_config.animation.overrides.duration' => ['sometimes', 'numeric', 'min:0.1', 'max:10'],
            'design_config.animation.overrides.delay' => ['sometimes', 'numeric', 'min:0', 'max:5'],
            'design_config.animation.overrides.distance' => ['sometimes', 'numeric', 'min:0', 'max:200'],
            'design_config.animation.overrides.stagger' => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'design_config.animation.overrides.easing' => ['sometimes', Rule::in(['easeOut', 'easeIn', 'easeInOut', 'linear', 'spring'])],
            'design_config.theme_tokens' => ['sometimes', 'array'],
        ];
    }
}
