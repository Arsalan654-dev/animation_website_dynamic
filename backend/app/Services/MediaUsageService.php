<?php

namespace App\Services;

use App\Models\Invitation;
use App\Models\InvitationEvent;
use App\Models\InvitationSection;
use App\Models\MediaAsset;
use App\Models\Template;
use App\Models\Theme;
use App\Support\MediaHydrator;

class MediaUsageService
{
    /**
     * Find every reference to a media asset across structured content.
     *
     * @return array<int, array{type:string,id:int,label:string}>
     */
    public function usages(MediaAsset $asset): array
    {
        $usages = [];

        $themes = Theme::query()->get(['id', 'name', 'preview_image_path', 'tokens']);
        foreach ($themes as $theme) {
            $referenced = MediaHydrator::referencedIds([$theme->tokens]);
            if (in_array($asset->id, $referenced, true) || $theme->preview_image_path === $asset->url) {
                $usages[] = ['type' => 'theme', 'id' => $theme->id, 'label' => "Theme: {$theme->name}"];
            }
        }

        $templates = Template::query()->get(['id', 'name', 'thumbnail_path', 'layout']);
        foreach ($templates as $template) {
            $referenced = MediaHydrator::referencedIds([$template->layout]);
            if (in_array($asset->id, $referenced, true) || $template->thumbnail_path === $asset->url) {
                $usages[] = ['type' => 'template', 'id' => $template->id, 'label' => "Template: {$template->name}"];
            }
        }

        $events = InvitationEvent::query()->with('invitation:id,title')->get();
        foreach ($events as $event) {
            if ($event->image_media_id === $asset->id) {
                $usages[] = [
                    'type' => 'event',
                    'id' => $event->id,
                    'label' => "Event {$event->title} · ".($event->invitation?->title ?? 'Invitation'),
                ];
            }
        }

        $invitations = Invitation::query()->get(['id', 'title', 'envelope', 'couple_details', 'design_config', 'cover_image_path']);
        foreach ($invitations as $invitation) {
            $referenced = MediaHydrator::referencedIds([
                $invitation->envelope ?? [],
                $invitation->couple_details ?? [],
                $invitation->design_config ?? [],
            ]);

            if (in_array($asset->id, $referenced, true) || $invitation->cover_image_path === $asset->url) {
                $usages[] = [
                    'type' => 'invitation',
                    'id' => $invitation->id,
                    'label' => "Invitation: {$invitation->title}",
                ];
            }
        }

        $sections = InvitationSection::query()
            ->with('invitation:id,title')
            ->get(['id', 'invitation_id', 'type', 'title', 'content']);

        foreach ($sections as $section) {
            if (in_array($asset->id, MediaHydrator::referencedIds([$section->content ?? []]), true)) {
                $usages[] = [
                    'type' => 'section',
                    'id' => $section->id,
                    'label' => ucfirst($section->type).' section · '.($section->invitation?->title ?? 'Invitation'),
                ];
            }
        }

        return $usages;
    }

    public function isInUse(MediaAsset $asset): bool
    {
        return count($this->usages($asset)) > 0;
    }
}
