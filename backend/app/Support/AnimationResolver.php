<?php

namespace App\Support;

use App\Models\AnimationPreset;
use App\Models\Invitation;
use App\Models\InvitationSection;
use App\Models\Theme;
use Illuminate\Support\Collection;

class AnimationResolver
{
    /**
     * Resolve animation settings using the documented hierarchy:
     * app defaults -> selected preset -> theme -> invitation -> section.
     */
    public static function resolve(
        ?AnimationPreset $preset,
        array $themeConfig,
        array $invitationConfig,
        array $sectionConfig,
        bool $globallyEnabled,
    ): array {
        $resolved = array_replace(config('wedding.animation'), $preset?->defaults ?? []);
        $resolved = array_replace($resolved, self::overrides($themeConfig));
        $resolved = array_replace($resolved, self::overrides($invitationConfig));
        $resolved = array_replace($resolved, self::overrides($sectionConfig));

        $disabled = ! $globallyEnabled
            || (bool) ($themeConfig['disabled'] ?? false)
            || (bool) ($invitationConfig['disabled'] ?? false)
            || (bool) ($sectionConfig['disabled'] ?? false);

        return [
            'enabled' => ! $disabled,
            'preset_slug' => $preset?->slug ?? 'fade-up',
            'preset_type' => $preset?->type ?? 'fade_up',
            'name' => $preset?->name ?? 'Fade Up',
            'config' => $resolved,
        ];
    }

    /**
     * Strip selection metadata, leaving only numeric/string animation values.
     */
    private static function overrides(?array $config): array
    {
        if (! $config) {
            return [];
        }

        $nested = is_array($config['overrides'] ?? null) ? $config['overrides'] : [];
        unset($config['preset'], $config['preset_slug'], $config['disabled'], $config['overrides']);

        $config = array_merge($config, $nested);

        return array_filter($config, fn ($value) => ! is_array($value));
    }

    /**
     * Build every section's resolved animation in one pass.
     *
     * @param  Collection<int, InvitationSection>  $sections
     * @param  Collection<int, AnimationPreset>  $presets
     * @return array<int, array>
     */
    public static function resolveForSections(
        Invitation $invitation,
        Theme $theme,
        Collection $sections,
        Collection $presets,
        bool $globallyEnabled,
    ): array {
        $themeConfig = $theme->tokens['animation'] ?? [];
        $invitationConfig = $invitation->design_config['animation'] ?? [];

        $themePreset = $theme->defaultAnimationPreset
            ?? $presets->firstWhere('slug', ($themeConfig['preset'] ?? 'fade-up'));
        $invitationPreset = ! empty($invitationConfig['preset'])
            ? $presets->firstWhere('slug', $invitationConfig['preset'])
            : null;

        $resolved = [];

        foreach ($sections as $section) {
            $preset = $section->animationPreset
                ?? $invitationPreset
                ?? $themePreset;

            $resolved[$section->id] = self::resolve(
                preset: $preset,
                themeConfig: $themeConfig,
                invitationConfig: $invitationConfig,
                sectionConfig: $section->animation_config ?? [],
                globallyEnabled: $globallyEnabled,
            );
        }

        return $resolved;
    }
}
