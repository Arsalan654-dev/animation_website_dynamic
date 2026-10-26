<?php

namespace App\Services;

use App\Models\Invitation;
use App\Models\Template;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class InvitationService
{
    public function __construct(private readonly InvitationDesignService $designs) {}

    public function create(User $user, array $data): Invitation
    {
        return DB::transaction(function () use ($user, $data) {
            $template = isset($data['template_id'])
                ? Template::query()->find($data['template_id'])
                : null;

            $themeId = $data['theme_id']
                ?? $template?->default_theme_id;

            $couple = $this->coupleDefaults($this->sanitizeTextArray($data['couple_details'] ?? []));
            $monogram = $this->monogram($couple);

            $invitation = Invitation::query()->create([
                'user_id' => $user->id,
                'template_id' => $template?->id,
                'theme_id' => $themeId,
                'title' => $data['title'],
                'slug' => $this->uniqueSlug($data['slug'] ?? $data['title']),
                'status' => 'draft',
                'cover_image_path' => $data['cover_image_path'] ?? null,
                'envelope' => array_replace($this->envelopeDefaults($monogram), $data['envelope'] ?? []),
                'couple_details' => $couple,
                'event_at' => $this->toUtc($data['event_at'] ?? null, $data['timezone'] ?? 'Asia/Karachi'),
                'timezone' => $data['timezone'] ?? 'Asia/Karachi',
                'venue_name' => $data['venue_name'] ?? null,
                'venue_address' => $data['venue_address'] ?? null,
                'venue_map_url' => $data['venue_map_url'] ?? null,
                'venue_map_embed' => $data['venue_map_embed'] ?? null,
                'rsvp_settings' => array_replace(
                    config('wedding.default_rsvp_settings'),
                    $data['rsvp_settings'] ?? []
                ),
                'design_config' => array_replace([
                    'animation' => ['preset' => null, 'disabled' => false],
                    'theme_tokens' => [],
                ], $data['design_config'] ?? []),
            ]);

            if ($template && ($data['apply_template_sections'] ?? true)) {
                $this->copyTemplateSections($invitation, $template);
            }

            $this->designs->ensureDefaultDesign($invitation, $user);

            ActivityLogger::log($invitation, $user, 'created', 'Invitation created');

            return $invitation->fresh(['theme', 'template', 'sections', 'events']);
        });
    }

    public function update(Invitation $invitation, array $data, ?User $user = null): Invitation
    {
        return DB::transaction(function () use ($invitation, $data, $user) {
            $payload = collect($data)->only([
                'title', 'theme_id', 'template_id', 'cover_image_path',
                'couple_details', 'timezone', 'venue_name', 'venue_address',
                'venue_map_url', 'venue_map_embed', 'rsvp_settings', 'design_config',
                'envelope',
            ])->all();

            if (array_key_exists('slug', $data)) {
                $payload['slug'] = $this->uniqueSlug($data['slug'], $invitation->id);
            }

            if (isset($payload['couple_details'])) {
                $payload['couple_details'] = $this->coupleDefaults(
                    $this->sanitizeTextArray(array_replace($invitation->couple_details ?? [], $payload['couple_details']))
                );
            }

            if (isset($payload['envelope'])) {
                $payload['envelope'] = array_replace($invitation->envelope ?? [], $payload['envelope']);
            }

            if (isset($payload['rsvp_settings'])) {
                $payload['rsvp_settings'] = array_replace(
                    $invitation->rsvpConfig(),
                    $payload['rsvp_settings']
                );
            }

            if (isset($payload['design_config'])) {
                $payload['design_config'] = array_replace_recursive(
                    $invitation->design_config ?? [],
                    $payload['design_config']
                );
            }

            if (array_key_exists('event_at', $data)) {
                $payload['event_at'] = $this->toUtc(
                    $data['event_at'],
                    $data['timezone'] ?? $invitation->timezone
                );
            } elseif (array_key_exists('timezone', $data) && $invitation->event_at) {
                // Keep the same wall-clock time when the timezone changes.
                $local = $invitation->event_at->copy()->setTimezone($invitation->timezone);
                $payload['event_at'] = Carbon::createFromFormat(
                    'Y-m-d H:i:s',
                    $local->format('Y-m-d H:i:s'),
                    $data['timezone']
                )->utc();
            }

            $invitation->update($payload);

            if ($user) {
                ActivityLogger::log($invitation, $user, 'updated', 'Invitation details updated');
            }

            return $invitation->fresh(['theme', 'template', 'sections', 'events']);
        });
    }

    public function publish(Invitation $invitation, User $user): Invitation
    {
        $errors = [];

        if (! $invitation->theme_id) {
            $errors['theme_id'] = 'Choose a theme before publishing.';
        }

        if (! $invitation->sections()->where('is_visible', true)->exists()) {
            $errors['sections'] = 'Add at least one visible section before publishing.';
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        $invitation->update([
            'status' => 'published',
            'published_at' => $invitation->published_at ?? now(),
            'archived_at' => null,
        ]);

        ActivityLogger::log($invitation, $user, 'published', 'Invitation published');

        return $invitation->fresh();
    }

    public function unpublish(Invitation $invitation, User $user): Invitation
    {
        $invitation->update(['status' => 'draft', 'published_at' => null]);
        ActivityLogger::log($invitation, $user, 'unpublished', 'Invitation unpublished');

        return $invitation->fresh();
    }

    public function archive(Invitation $invitation, User $user): Invitation
    {
        $invitation->update([
            'status' => 'archived',
            'published_at' => null,
            'archived_at' => now(),
        ]);
        ActivityLogger::log($invitation, $user, 'archived', 'Invitation archived');

        return $invitation->fresh();
    }

    public function restore(Invitation $invitation, User $user): Invitation
    {
        $invitation->update(['status' => 'draft', 'archived_at' => null]);
        ActivityLogger::log($invitation, $user, 'restored', 'Invitation restored to drafts');

        return $invitation->fresh();
    }

    public function duplicate(Invitation $invitation, User $user): Invitation
    {
        return DB::transaction(function () use ($invitation, $user) {
            $copy = $invitation->replicate([
                'slug', 'status', 'published_at', 'archived_at',
            ]);

            $copy->title = $invitation->title.' (Copy)';
            $copy->slug = $this->uniqueSlug($invitation->slug);
            $copy->status = 'draft';
            $copy->published_at = null;
            $copy->archived_at = null;
            $copy->user_id = $user->id;
            $copy->save();

            foreach ($invitation->sections as $section) {
                $copy->sections()->create($section->only([
                    'type', 'title', 'content', 'design',
                    'animation_preset_id', 'animation_config',
                    'sort_order', 'is_visible',
                ]));
            }

            foreach ($invitation->events as $event) {
                $copy->events()->create($event->only([
                    'title', 'description', 'event_at', 'timezone', 'venue_name',
                    'venue_address', 'map_url', 'dress_code', 'image_media_id',
                    'rsvp_enabled', 'sort_order',
                ]));
            }

            $this->designs->ensureDefaultDesign($copy, $user);

            ActivityLogger::log($copy, $user, 'duplicated', 'Invitation duplicated from '.$invitation->title);

            return $copy->fresh(['theme', 'template', 'sections', 'events']);
        });
    }

    public function uniqueSlug(string $value, ?int $exceptId = null): string
    {
        $base = Str::slug($value) ?: 'invitation';
        $slug = $base;
        $counter = 2;

        while (
            Invitation::query()
                ->where('slug', $slug)
                ->when($exceptId, fn ($query) => $query->whereKeyNot($exceptId))
                ->exists()
        ) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }

    public function toUtc(?string $value, string $timezone): ?Carbon
    {
        if (! $value) {
            return null;
        }

        try {
            return Carbon::createFromFormat('Y-m-d\TH:i', $value, $timezone)->utc();
        } catch (\Throwable) {
            return Carbon::parse($value, $timezone)->utc();
        }
    }

    private function copyTemplateSections(Invitation $invitation, Template $template): void
    {
        $layout = $template->layout['sections'] ?? $template->layout ?? [];

        foreach (array_values($layout) as $index => $section) {
            if (! isset($section['type'])) {
                continue;
            }

            $invitation->sections()->create([
                'type' => $section['type'],
                'title' => $section['title'] ?? null,
                'content' => $section['content'] ?? [],
                'design' => $section['design'] ?? null,
                'animation_config' => $section['animation_config'] ?? null,
                'sort_order' => $section['sort_order'] ?? $index,
                'is_visible' => $section['is_visible'] ?? true,
            ]);
        }
    }

    private function coupleDefaults(array $couple): array
    {
        return array_replace([
            'partner_one' => 'Partner One',
            'partner_two' => 'Partner Two',
            'title' => 'Together with their families',
            'subtitle' => 'request the pleasure of your company',
            'hashtag' => null,
            'quote' => null,
            'message' => null,
            'families' => null,
            'story_heading' => 'Our Story',
            'story_body' => null,
            'story_image_id' => null,
        ], $couple);
    }

    private function envelopeDefaults(string $monogram): array
    {
        return [
            'enabled' => true,
            'style' => 'classic',
            'monogram' => $monogram,
            'seal_text' => $monogram,
            'prompt' => 'Open the invitation',
            'cover_media_id' => null,
            'card_media_id' => null,
            'seal_media_id' => null,
            'card_message' => 'Together with their families',
        ];
    }

    private function monogram(array $couple): string
    {
        $one = Str::substr($couple['partner_one'] ?? 'P', 0, 1);
        $two = Str::substr($couple['partner_two'] ?? 'P', 0, 1);

        return Str::upper($one.' & '.$two);
    }

    private function sanitizeTextArray(array $values): array
    {
        return array_map(function ($value) {
            return is_string($value) ? strip_tags($value) : $value;
        }, $values);
    }
}
