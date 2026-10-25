<?php

namespace App\Http\Requests;

use App\Models\Theme;
use App\Support\ThemeTokens;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ThemeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');
        $theme = $this->route('theme');
        $presence = $isUpdate ? 'sometimes' : 'required';
        $fonts = config('wedding.fonts');
        $color = ['sometimes', 'nullable', 'string', 'max:80', 'regex:/^(#[0-9a-fA-F]{3,8}|rgba?\([0-9.,%\s]+\))$/'];

        return [
            'name' => [$presence, 'string', 'max:160'],
            'slug' => [
                'sometimes', 'nullable', 'string', 'max:160',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('themes', 'slug')->ignore($theme?->id),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'preview_image_path' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'default_animation_preset_id' => ['sometimes', 'nullable', 'integer', 'exists:animation_presets,id'],
            'is_active' => ['sometimes', 'boolean'],
            'tokens' => [$presence, 'array'],
            'tokens.colors.primary' => $color,
            'tokens.colors.secondary' => $color,
            'tokens.colors.accent' => $color,
            'tokens.colors.surface' => $color,
            'tokens.colors.surfaceAlt' => $color,
            'tokens.colors.text' => $color,
            'tokens.colors.muted' => $color,
            'tokens.colors.line' => $color,
            'tokens.colors.onPrimary' => $color,
            'tokens.typography.headingFont' => ['sometimes', Rule::in($fonts)],
            'tokens.typography.bodyFont' => ['sometimes', Rule::in($fonts)],
            'tokens.typography.scriptFont' => ['sometimes', Rule::in($fonts)],
            'tokens.typography.baseSize' => ['sometimes', 'numeric', 'min:13', 'max:22'],
            'tokens.typography.headingWeight' => ['sometimes', 'integer', 'min:300', 'max:800'],
            'tokens.typography.bodyWeight' => ['sometimes', 'integer', 'min:300', 'max:700'],
            'tokens.typography.headingScale' => ['sometimes', 'numeric', 'min:1.1', 'max:2.2'],
            'tokens.typography.bodyLineHeight' => ['sometimes', 'numeric', 'min:1.2', 'max:2.2'],
            'tokens.typography.letterSpacing' => ['sometimes', 'numeric', 'min:0', 'max:0.3'],
            'tokens.surfaces.cardRadius' => ['sometimes', 'numeric', 'min:0', 'max:40'],
            'tokens.surfaces.paperTexture' => ['sometimes', Rule::in(['grain', 'linen', 'plain'])],
            'tokens.surfaces.paperTextureOpacity' => ['sometimes', 'numeric', 'min:0', 'max:1'],
            'tokens.surfaces.shadow' => ['sometimes', Rule::in(['soft', 'deep', 'none'])],
            'tokens.surfaces.sectionSpacing' => ['sometimes', 'integer', 'min:40', 'max:200'],
            'tokens.surfaces.contentWidth' => ['sometimes', 'integer', 'min:800', 'max:1600'],
            'tokens.buttons.radius' => ['sometimes', 'integer', 'min:0', 'max:999'],
            'tokens.buttons.style' => ['sometimes', Rule::in(['outline', 'fill', 'text'])],
            'tokens.buttons.letterSpacing' => ['sometimes', 'numeric', 'min:0', 'max:0.4'],
            'tokens.buttons.textTransform' => ['sometimes', Rule::in(['uppercase', 'none', 'capitalize'])],
            'tokens.ornaments.divider' => ['sometimes', Rule::in(['botanical', 'line', 'diamond', 'none'])],
            'tokens.ornaments.corner' => ['sometimes', Rule::in(['branch', 'floral', 'none'])],
            'tokens.ornaments.overlayMediaId' => ['sometimes', 'nullable', 'integer', 'exists:media_assets,id'],
            'tokens.layout.imageAspect' => ['sometimes', Rule::in(['1/1', '4/5', '3/4', '2/3', '16/10'])],
            'tokens.layout.gallery' => ['sometimes', Rule::in(['masonry', 'grid'])],
            'tokens.layout.align' => ['sometimes', Rule::in(['left', 'center'])],
            'tokens.animation.preset' => ['sometimes', 'nullable', 'string', Rule::exists('animation_presets', 'slug')],
            'tokens.animation.disabled' => ['sometimes', 'boolean'],
        ];
    }

    public function validated($key = null, $default = null): mixed
    {
        $data = parent::validated($key, $default);

        if (isset($data['tokens'])) {
            $data['tokens'] = ThemeTokens::sanitize($data['tokens']);
        }

        return $data;
    }
}
