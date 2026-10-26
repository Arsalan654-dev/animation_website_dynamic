<?php

namespace App\Services;

use App\Models\AnimationPreset;
use App\Models\Invitation;
use App\Models\InvitationDesign;
use App\Models\InvitationDesignVersion;
use App\Models\MediaAsset;
use App\Models\Setting;
use App\Models\Theme;
use App\Models\User;
use App\Support\AnimationResolver;
use App\Support\DatePayload;
use App\Support\MediaHydrator;
use App\Support\ThemeTokens;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InvitationDesignService
{
    private const MAX_SECTIONS = 100;

    private const MAX_VERSIONS = 50;

    /**
     * Capture everything that makes an invitation look the way it does.
     * Project-level data (couple, events, RSVP settings, guests) stays shared.
     */
    public function snapshot(Invitation $invitation): array
    {
        $invitation->loadMissing(['sections']);

        return [
            'theme_id' => $invitation->theme_id,
            'design_config' => $this->normalizeDesignConfig($invitation->design_config ?? []),
            'envelope' => $this->normalizeEnvelope($invitation->envelope ?? []),
            'cover_image_path' => $invitation->cover_image_path,
            'sections' => $invitation->sections
                ->sortBy('sort_order')
                ->values()
                ->map(fn ($section) => [
                    'type' => $section->type,
                    'title' => $section->title,
                    'content' => $section->content ?? [],
                    'design' => $section->design,
                    'animation_preset_id' => $section->animation_preset_id,
                    'animation_config' => $section->animation_config,
                    'sort_order' => $section->sort_order,
                    'is_visible' => $section->is_visible,
                ])
                ->all(),
        ];
    }

    public function create(Invitation $invitation, User $user, array $data): InvitationDesign
    {
        return DB::transaction(function () use ($invitation, $user, $data) {
            $fromCurrent = ! isset($data['snapshot']);
            $snapshot = $this->normalizeSnapshot($data['snapshot'] ?? $this->snapshot($invitation));
            $count = $invitation->designs()->count();

            $design = $invitation->designs()->create([
                'name' => $this->cleanName($data['name'] ?? 'Design '.($count + 1)),
                'description' => isset($data['description']) ? Str::limit((string) $data['description'], 1000, '') : null,
                'snapshot' => $snapshot,
                'is_active' => false,
                'version' => 1,
                'created_by' => $user->id,
                'updated_by' => $user->id,
            ]);

            $this->recordVersion($design, $user, 'Initial version');

            $shouldActivate = (bool) ($data['activate'] ?? $count === 0);

            if ($shouldActivate) {
                if ($fromCurrent) {
                    $this->markActive($invitation, $design, apply: false);
                } else {
                    $this->activate($design->fresh('invitation'), $user);
                }
            }

            ActivityLogger::log(
                $invitation,
                $user,
                'design_created',
                'Design "'.$design->name.'" created',
                ['design_id' => $design->id]
            );

            return $design->fresh(['creator', 'updater']);
        });
    }

    public function update(InvitationDesign $design, User $user, array $data): InvitationDesign
    {
        return DB::transaction(function () use ($design, $user, $data) {
            $payload = [];

            if (array_key_exists('name', $data)) {
                $payload['name'] = $this->cleanName($data['name']);
            }

            if (array_key_exists('description', $data)) {
                $payload['description'] = $data['description'] !== null
                    ? Str::limit((string) $data['description'], 1000, '')
                    : null;
            }

            $snapshotChanged = array_key_exists('snapshot', $data);

            if ($snapshotChanged) {
                $payload['snapshot'] = $this->normalizeSnapshot($data['snapshot']);
                $payload['version'] = $design->version + 1;
            }

            $payload['updated_by'] = $user->id;
            $design->update($payload);
            $design = $design->fresh('invitation');

            if ($snapshotChanged) {
                $this->recordVersion(
                    $design,
                    $user,
                    isset($data['label']) ? Str::limit((string) $data['label'], 120, '') : 'Saved from the visual studio'
                );
            }

            if ((bool) ($data['apply'] ?? false)) {
                $this->markActive($design->invitation, $design, apply: true);
            }

            ActivityLogger::log(
                $design->invitation,
                $user,
                'design_updated',
                'Design "'.$design->name.'" saved',
                ['design_id' => $design->id, 'version' => $design->version]
            );

            return $design->fresh(['creator', 'updater']);
        });
    }

    public function activate(InvitationDesign $design, User $user): InvitationDesign
    {
        return DB::transaction(function () use ($design, $user) {
            $design->loadMissing('invitation');
            $invitation = $design->invitation;

            $current = $this->snapshot($invitation);
            $incoming = $this->normalizeSnapshot($design->snapshot);

            $this->markActive($invitation, $design, apply: $current != $incoming);

            ActivityLogger::log(
                $invitation,
                $user,
                'design_activated',
                'Design "'.$design->name.'" is now live',
                ['design_id' => $design->id]
            );

            return $design->fresh(['creator', 'updater']);
        });
    }

    public function saveCurrent(InvitationDesign $design, Invitation $invitation, User $user, ?string $label = null): InvitationDesign
    {
        return DB::transaction(function () use ($design, $invitation, $user, $label) {
            $design->update([
                'snapshot' => $this->normalizeSnapshot($this->snapshot($invitation)),
                'version' => $design->version + 1,
                'updated_by' => $user->id,
            ]);

            $this->recordVersion($design->fresh(), $user, $label ?? 'Saved from the current invitation');

            ActivityLogger::log(
                $invitation,
                $user,
                'design_saved',
                'Design "'.$design->name.'" updated from the invitation',
                ['design_id' => $design->id, 'version' => $design->version]
            );

            return $design->fresh(['creator', 'updater']);
        });
    }

    public function duplicate(InvitationDesign $design, User $user): InvitationDesign
    {
        return DB::transaction(function () use ($design, $user) {
            $copy = $design->replicate(['created_by', 'updated_by', 'published_at']);
            $copy->name = $this->uniqueName($design->invitation, $design->name.' Copy');
            $copy->is_active = false;
            $copy->version = 1;
            $copy->created_by = $user->id;
            $copy->updated_by = $user->id;
            $copy->save();

            $this->recordVersion($copy, $user, 'Duplicated from "'.$design->name.'"');

            ActivityLogger::log(
                $design->invitation,
                $user,
                'design_duplicated',
                'Design "'.$design->name.'" duplicated',
                ['design_id' => $copy->id, 'source_design_id' => $design->id]
            );

            return $copy->fresh(['creator', 'updater']);
        });
    }

    public function delete(InvitationDesign $design, User $user): void
    {
        DB::transaction(function () use ($design, $user) {
            $design->loadMissing('invitation');

            if ($design->is_active) {
                throw ValidationException::withMessages([
                    'design' => 'Activate another design before deleting the live one.',
                ]);
            }

            if ($design->invitation->designs()->count() <= 1) {
                throw ValidationException::withMessages([
                    'design' => 'An invitation must keep at least one design.',
                ]);
            }

            $invitation = $design->invitation;
            $name = $design->name;
            $design->delete();

            ActivityLogger::log(
                $invitation,
                $user,
                'design_deleted',
                'Design "'.$name.'" deleted'
            );
        });
    }

    public function restoreVersion(InvitationDesign $design, InvitationDesignVersion $version, User $user): InvitationDesign
    {
        return DB::transaction(function () use ($design, $version, $user) {
            $design->update([
                'snapshot' => $this->normalizeSnapshot($version->snapshot),
                'version' => $design->version + 1,
                'updated_by' => $user->id,
            ]);

            $fresh = $design->fresh('invitation');

            $this->recordVersion($fresh, $user, 'Restored from version '.$version->version);

            if ($fresh->is_active) {
                $this->applySnapshot($fresh->invitation, $fresh->snapshot);
                $fresh->forceFill(['published_at' => now()])->save();
            }

            ActivityLogger::log(
                $fresh->invitation,
                $user,
                'design_version_restored',
                'Design "'.$fresh->name.'" restored from version '.$version->version,
                ['design_id' => $fresh->id, 'version_id' => $version->id]
            );

            return $fresh->fresh(['creator', 'updater']);
        });
    }

    public function ensureDefaultDesign(Invitation $invitation, ?User $user = null): InvitationDesign
    {
        $existing = $invitation->designs()->first();

        if ($existing) {
            return $existing;
        }

        $snapshot = $this->normalizeSnapshot($this->snapshot($invitation));

        $design = $invitation->designs()->create([
            'name' => 'Original',
            'description' => 'Created automatically from this invitation.',
            'snapshot' => $snapshot,
            'is_active' => true,
            'version' => 1,
            'created_by' => $user?->id,
            'updated_by' => $user?->id,
            'published_at' => now(),
        ]);

        $this->recordVersion($design, $user, 'Initial version');

        return $design;
    }

    /**
     * Apply a saved design to the invitation itself. The public site keeps
     * reading the invitation tables, so there is only one rendering path.
     */
    public function applySnapshot(Invitation $invitation, array $snapshot): void
    {
        $snapshot = $this->normalizeSnapshot($snapshot);

        $invitation->update([
            'theme_id' => $snapshot['theme_id'] ?: $invitation->theme_id,
            'design_config' => $snapshot['design_config'],
            'envelope' => $snapshot['envelope'],
            'cover_image_path' => $snapshot['cover_image_path'] ?? null,
        ]);

        $invitation->sections()->delete();

        foreach ($snapshot['sections'] as $index => $section) {
            $invitation->sections()->create([
                'type' => $section['type'],
                'title' => $section['title'],
                'content' => $section['content'],
                'design' => $section['design'],
                'animation_preset_id' => $section['animation_preset_id'],
                'animation_config' => $section['animation_config'],
                'sort_order' => $index,
                'is_visible' => $section['is_visible'],
            ]);
        }
    }

    public function normalizeSnapshot(array $snapshot): array
    {
        $sections = collect($snapshot['sections'] ?? [])
            ->filter(fn ($section) => is_array($section))
            ->take(self::MAX_SECTIONS)
            ->values()
            ->map(fn ($section, $index) => $this->normalizeSection($section, $index))
            ->filter()
            ->values()
            ->all();

        return [
            'theme_id' => is_numeric($snapshot['theme_id'] ?? null) ? (int) $snapshot['theme_id'] : null,
            'design_config' => $this->normalizeDesignConfig(
                is_array($snapshot['design_config'] ?? null) ? $snapshot['design_config'] : []
            ),
            'envelope' => $this->normalizeEnvelope(
                is_array($snapshot['envelope'] ?? null) ? $snapshot['envelope'] : []
            ),
            'cover_image_path' => isset($snapshot['cover_image_path']) && is_string($snapshot['cover_image_path'])
                ? Str::limit($snapshot['cover_image_path'], 2048, '')
                : null,
            'sections' => $sections,
        ];
    }

    public function normalizeDesignConfig(array $config): array
    {
        $animation = is_array($config['animation'] ?? null) ? $config['animation'] : [];
        $effects = is_array($config['effects'] ?? null) ? $config['effects'] : [];
        $page = is_array($config['page'] ?? null) ? $config['page'] : [];

        $effects = array_replace([
            'scroll_reveal' => true,
            'hover_lift' => true,
            'image_zoom' => true,
            'parallax' => false,
            'grain' => true,
            'sticky_nav' => true,
            'scroll_progress' => false,
            'cursor_glow' => false,
        ], $effects);

        foreach ($effects as $key => $value) {
            $effects[$key] = (bool) $value;
        }

        return [
            'animation' => [
                'preset' => isset($animation['preset']) && is_string($animation['preset'])
                    ? Str::limit($animation['preset'], 80, '')
                    : null,
                'disabled' => (bool) ($animation['disabled'] ?? false),
                'overrides' => is_array($animation['overrides'] ?? null) ? $animation['overrides'] : [],
            ],
            'theme_tokens' => is_array($config['theme_tokens'] ?? null) ? $config['theme_tokens'] : [],
            'effects' => $effects,
            'custom_css' => $this->sanitizeCss((string) ($config['custom_css'] ?? '')),
            'page' => [
                'background_image' => is_array($page['background_image'] ?? null) ? $page['background_image'] : null,
                'overlay' => is_numeric($page['overlay'] ?? null) ? max(0, min(0.9, (float) $page['overlay'])) : 0.0,
                'nav_style' => in_array($page['nav_style'] ?? null, ['glass', 'solid', 'transparent'], true)
                    ? $page['nav_style']
                    : 'glass',
            ],
        ];
    }

    /**
     * Build the hydrated payload used by the standalone HTML exporter.
     */
    public function exportPayload(Invitation $invitation, InvitationDesign $design): array
    {
        $invitation->loadMissing(['events', 'theme.defaultAnimationPreset']);
        $snapshot = $this->normalizeSnapshot($design->snapshot);

        $theme = $invitation->theme;
        if ($snapshot['theme_id']) {
            $theme = Theme::query()->with('defaultAnimationPreset')->find($snapshot['theme_id']) ?? $theme;
        }

        $tokens = ThemeTokens::sanitize(ThemeTokens::merge(array_replace_recursive(
            $theme?->tokens ?? [],
            $snapshot['design_config']['theme_tokens'] ?? []
        )));

        $mediaIds = array_unique(array_merge(
            MediaHydrator::referencedIds($snapshot['envelope']),
            MediaHydrator::referencedIds($snapshot['design_config']),
            ...array_map(
                fn ($section) => MediaHydrator::referencedIds($section['content'] ?? []),
                $snapshot['sections']
            ),
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
        ], MediaHydrator::hydrate($snapshot['envelope'], $assets));

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

        $presets = AnimationPreset::query()->where('is_active', true)->get();
        $presetsById = $presets->keyBy('id');
        $presetsBySlug = $presets->keyBy('slug');
        $animationsEnabled = (bool) Setting::value('animations_enabled', true);
        $themeTokens = $theme?->tokens ?? [];
        $themeConfig = is_array($themeTokens['animation'] ?? null) ? $themeTokens['animation'] : [];
        $invitationConfig = $snapshot['design_config']['animation'] ?? [];
        $themePreset = $theme?->defaultAnimationPreset
            ?? $presetsBySlug->get($themeConfig['preset'] ?? 'fade-up');
        $invitationPreset = ! empty($invitationConfig['preset'])
            ? $presetsBySlug->get($invitationConfig['preset'])
            : null;

        $sections = collect($snapshot['sections'])->map(function (array $section) use (
            $assets,
            $presetsById,
            $themeConfig,
            $invitationConfig,
            $themePreset,
            $invitationPreset,
            $animationsEnabled
        ) {
            $preset = $presetsById->get((int) ($section['animation_preset_id'] ?? 0))
                ?? $invitationPreset
                ?? $themePreset;

            $animation = AnimationResolver::resolve(
                preset: $preset,
                themeConfig: $themeConfig,
                invitationConfig: $invitationConfig,
                sectionConfig: $section['animation_config'] ?? [],
                globallyEnabled: $animationsEnabled,
            );

            return [
                'type' => $section['type'],
                'title' => $section['title'],
                'content' => MediaHydrator::hydrate($section['content'] ?? [], $assets),
                'design' => $section['design'] ?? null,
                'is_visible' => $section['is_visible'],
                'sort_order' => $section['sort_order'],
                'animation' => $animation,
            ];
        })->values()->all();

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
                    'url' => $image->url,
                    'alt' => $image->alt_text,
                    'width' => $image->width,
                    'height' => $image->height,
                ] : null,
            ];
        })->values()->all();

        $rsvp = $invitation->rsvpConfig();
        $deadline = $rsvp['deadline'] ?? null;
        $deadlinePassed = $deadline && now()->greaterThan($deadline);

        return [
            'invitation' => [
                'id' => $invitation->id,
                'title' => $invitation->title,
                'slug' => $invitation->slug,
                'couple' => $invitation->couple_details ?? [],
                'monogram' => $envelope['monogram'] ?: $this->monogram($invitation->couple_details ?? []),
                'event' => $invitation->eventPayload(),
                'venue' => [
                    'name' => $invitation->venue_name,
                    'address' => $invitation->venue_address,
                    'map_url' => $invitation->venue_map_url,
                    'map_embed' => $invitation->venue_map_embed,
                ],
                'cover_image' => $this->resolveUrl($invitation->cover_image_path),
                'events' => $events,
                'rsvp' => [
                    'enabled' => (bool) ($rsvp['enabled'] ?? true),
                    'open' => (bool) ($rsvp['enabled'] ?? true) && ! $deadlinePassed,
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
            ],
            'design' => [
                'id' => $design->id,
                'name' => $design->name,
                'version' => $design->version,
                'theme_name' => $theme?->name ?? 'Classic',
                'theme_slug' => $theme?->slug ?? 'classic',
                'tokens' => $tokens,
                'design_config' => $snapshot['design_config'],
                'envelope' => $envelope,
                'cover_image_path' => $snapshot['cover_image_path'],
                'cover_image' => $this->resolveUrl($snapshot['cover_image_path']),
                'sections' => $sections,
            ],
            'api_base' => rtrim(config('app.url'), '/').'/api/v1',
            'site_name' => Setting::value('site_name', 'Ever After Studio'),
            'exported_at' => now()->toIso8601String(),
        ];
    }

    public function uniqueName(Invitation $invitation, string $name): string
    {
        $base = $this->cleanName($name);
        $candidate = $base;
        $counter = 2;

        while ($invitation->designs()->where('name', $candidate)->exists()) {
            $candidate = $base.' '.$counter;
            $counter++;
        }

        return $candidate;
    }

    private function markActive(Invitation $invitation, InvitationDesign $design, bool $apply): void
    {
        $invitation->designs()->whereKeyNot($design->id)->update(['is_active' => false]);

        $design->forceFill([
            'is_active' => true,
            'published_at' => now(),
            'updated_by' => $design->updated_by ?? $design->created_by,
        ])->save();

        if ($apply) {
            $this->applySnapshot($invitation, $design->snapshot);
        }
    }

    private function recordVersion(InvitationDesign $design, ?User $user, ?string $label = null): InvitationDesignVersion
    {
        $version = $design->versions()->create([
            'version' => $design->version,
            'snapshot' => $design->snapshot,
            'label' => $label,
            'created_by' => $user?->id,
        ]);

        $stale = $design->versions()
            ->orderByDesc('version')
            ->skip(self::MAX_VERSIONS)
            ->take(100)
            ->pluck('id');

        if ($stale->isNotEmpty()) {
            InvitationDesignVersion::query()->whereIn('id', $stale)->delete();
        }

        return $version;
    }

    private function normalizeSection(array $section, int $index): ?array
    {
        $type = is_string($section['type'] ?? null) ? $section['type'] : null;

        if (! $type || ! in_array($type, config('wedding.section_types'), true)) {
            return null;
        }

        return [
            'type' => $type,
            'title' => isset($section['title']) && is_string($section['title'])
                ? Str::limit($section['title'], 180, '')
                : null,
            'content' => is_array($section['content'] ?? null) ? $section['content'] : [],
            'design' => is_array($section['design'] ?? null) ? $section['design'] : null,
            'animation_preset_id' => is_numeric($section['animation_preset_id'] ?? null)
                ? (int) $section['animation_preset_id']
                : null,
            'animation_config' => is_array($section['animation_config'] ?? null)
                ? $section['animation_config']
                : null,
            'sort_order' => is_numeric($section['sort_order'] ?? null)
                ? max(0, (int) $section['sort_order'])
                : $index,
            'is_visible' => (bool) ($section['is_visible'] ?? true),
        ];
    }

    private function normalizeEnvelope(array $envelope): array
    {
        return array_replace([
            'enabled' => true,
            'style' => 'classic',
            'monogram' => '',
            'seal_text' => '',
            'prompt' => 'Open the invitation',
            'cover_media_id' => null,
            'card_media_id' => null,
            'seal_media_id' => null,
            'card_message' => '',
        ], $envelope);
    }

    private function cleanName(?string $name): string
    {
        $clean = trim(strip_tags((string) $name));

        return $clean !== '' ? Str::limit($clean, 120, '') : 'Untitled design';
    }

    private function sanitizeCss(string $css): string
    {
        $css = Str::limit($css, 30000, '');
        $css = preg_replace('/<\/?style[^>]*>/i', '', $css) ?? '';
        $css = preg_replace('/<\?php/i', '', $css) ?? '';
        $css = preg_replace('/@import\s+[^;]+;/i', '', $css) ?? '';
        $css = preg_replace('/expression\s*\(/i', '', $css) ?? '';
        $css = preg_replace('/url\s*\(\s*["\']?\s*javascript:/i', 'url(', $css) ?? '';

        return trim($css);
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

    private function monogram(array $couple): string
    {
        $one = Str::substr($couple['partner_one'] ?? 'P', 0, 1);
        $two = Str::substr($couple['partner_two'] ?? 'P', 0, 1);

        return Str::upper($one.' & '.$two);
    }
}
