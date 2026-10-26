<?php

namespace App\Services;

use App\Models\AnimationPreset;
use App\Models\Invitation;
use App\Models\MediaAsset;
use App\Models\Setting;
use App\Support\AnimationResolver;
use App\Support\DatePayload;
use App\Support\MediaHydrator;
use App\Support\ThemeTokens;

class PublicInvitationPresenter
{
    public function present(Invitation $invitation, bool $includeHidden = false): array
    {
        $invitation->loadMissing([
            'theme.defaultAnimationPreset',
            'sections.animationPreset',
            'events',
        ]);

        $theme = $invitation->theme;
        $sections = $invitation->sections
            ->when(! $includeHidden, fn ($collection) => $collection->where('is_visible', true))
            ->values();

        $design = $invitation->design_config ?? [];
        $themeOverrides = $design['theme_tokens'] ?? [];
        $tokens = ThemeTokens::sanitize(
            ThemeTokens::merge(array_replace_recursive(
                $theme?->tokens ?? [],
                $themeOverrides
            ))
        );

        $allPresets = AnimationPreset::query()
            ->where('is_active', true)
            ->get()
            ->keyBy('slug');

        $animationsEnabled = (bool) Setting::value('animations_enabled', true);
        $animationsBySection = $theme
            ? AnimationResolver::resolveForSections(
                $invitation,
                $theme,
                $sections,
                $allPresets,
                $animationsEnabled,
            )
            : [];

        $mediaIds = array_unique(array_merge(
            MediaHydrator::referencedIds($invitation->envelope ?? []),
            MediaHydrator::referencedIds($invitation->couple_details ?? []),
            MediaHydrator::referencedIds($design ?? []),
            $invitation->events->pluck('image_media_id')->filter()->all(),
            ...$sections->map(fn ($section) => array_merge(
                MediaHydrator::referencedIds($section->content ?? []),
                MediaHydrator::referencedIds(is_array($section->design) ? $section->design : []),
            ))->all(),
        ));

        $assets = MediaAsset::query()->whereIn('id', $mediaIds)->get()->keyBy('id');

        $envelope = array_replace([
            'enabled' => true,
            'style' => 'classic',
            'monogram' => '',
            'seal_text' => '',
            'prompt' => 'Open the invitation',
            'cover_media_id' => null,
            'card_media_id' => null,
            'seal_media_id' => null,
            'card_message' => '',
        ], MediaHydrator::hydrate($invitation->envelope ?? [], $assets));

        foreach (['cover', 'card', 'seal'] as $slot) {
            $mediaId = $envelope[$slot.'_media_id'] ?? null;
            $asset = $mediaId ? $assets->get((int) $mediaId) : null;
            $envelope[$slot.'_image'] = $asset ? [
                'id' => $asset->id,
                'mediaId' => $asset->id,
                'url' => $asset->url,
                'alt' => $asset->alt_text,
                'width' => $asset->width,
                'height' => $asset->height,
            ] : null;
        }

        $events = $invitation->events->map(function ($event) use ($assets) {
            $image = $event->image_media_id ? $assets->get($event->image_media_id) : null;

            return [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'date' => DatePayload::make($event->event_at, $event->timezone),
                'timezone' => $event->timezone,
                'venue_name' => $event->venue_name,
                'venue_address' => $event->venue_address,
                'map_url' => $event->map_url,
                'dress_code' => $event->dress_code,
                'rsvp_enabled' => $event->rsvp_enabled,
                'image' => $image ? [
                    'id' => $image->id,
                    'url' => $image->url,
                    'alt' => $image->alt_text,
                    'width' => $image->width,
                    'height' => $image->height,
                ] : null,
            ];
        })->values();

        $publicSections = $sections->map(function ($section) use ($assets, $animationsBySection) {
            return [
                'id' => $section->id,
                'type' => $section->type,
                'title' => $section->title,
                'content' => MediaHydrator::hydrate($section->content ?? [], $assets),
                'design' => is_array($section->design)
                    ? MediaHydrator::hydrate($section->design, $assets)
                    : $section->design,
                'is_visible' => $section->is_visible,
                'sort_order' => $section->sort_order,
                'animation' => $animationsBySection[$section->id] ?? null,
            ];
        })->values();

        $rsvp = $invitation->rsvpConfig();
        $deadline = $rsvp['deadline'] ?? null;
        $deadlinePassed = $deadline && now()->greaterThan($deadline);
        $isOpen = (bool) ($rsvp['enabled'] ?? true) && ! $deadlinePassed;

        return [
            'id' => $invitation->id,
            'title' => $invitation->title,
            'slug' => $invitation->slug,
            'status' => $invitation->status,
            'published_at' => $invitation->published_at?->toIso8601String(),
            'cover_image' => $this->resolveUrl($invitation->cover_image_path),
            'theme' => [
                'id' => $theme?->id,
                'name' => $theme?->name ?? 'Classic',
                'slug' => $theme?->slug ?? 'classic',
                'tokens' => $tokens,
                'preview_image_url' => $theme?->preview_image_path
                    ? (str_starts_with($theme->preview_image_path, 'http') ? $theme->preview_image_path : asset($theme->preview_image_path))
                    : null,
            ],
            'couple' => $invitation->couple_details ?? [],
            'monogram' => $envelope['monogram'] ?? '',
            'event' => $invitation->eventPayload(),
            'venue' => [
                'name' => $invitation->venue_name,
                'address' => $invitation->venue_address,
                'map_url' => $invitation->venue_map_url,
                'map_embed' => $invitation->venue_map_embed,
            ],
            'envelope' => $envelope,
            'design' => [
                'animation' => $design['animation'] ?? null,
                'effects' => $design['effects'] ?? null,
                'page' => $design['page'] ?? null,
                'custom_css' => $design['custom_css'] ?? null,
            ],
            'events' => $events,
            'sections' => $publicSections,
            'rsvp' => [
                'enabled' => (bool) ($rsvp['enabled'] ?? true),
                'open' => $isOpen,
                'deadline' => $deadline,
                'deadline_passed' => $deadlinePassed,
                'max_guests_per_submission' => (int) ($rsvp['max_guests_per_submission'] ?? 6),
                'allow_decline' => (bool) ($rsvp['allow_decline'] ?? true),
                'require_guest_code' => (bool) ($rsvp['require_guest_code'] ?? false),
                'collect_phone' => (bool) ($rsvp['collect_phone'] ?? true),
                'questions' => array_map(fn ($question) => [
                    'id' => $question['id'] ?? null,
                    'label' => $question['label'] ?? '',
                    'type' => $question['type'] ?? 'text',
                    'required' => (bool) ($question['required'] ?? false),
                    'options' => $question['options'] ?? [],
                ], $rsvp['questions'] ?? []),
                'success_message' => $rsvp['success_message'] ?? null,
            ],
            'animations_enabled' => $animationsEnabled,
            'site_name' => Setting::value('site_name', 'Ever After Studio'),
        ];
    }

    private function resolveUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return str_starts_with($path, 'http://') || str_starts_with($path, 'https://')
            ? $path
            : asset($path);
    }
}
