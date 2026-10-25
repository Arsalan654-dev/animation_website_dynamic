<?php

namespace App\Support;

use App\Models\MediaAsset;
use Illuminate\Support\Collection;

class MediaHydrator
{
    /**
     * Recursively resolve any { mediaId: 12 } node into a renderable asset.
     * This keeps public JSON stable when a media row is replaced.
     */
    public static function hydrate(array $payload, Collection $assets): array
    {
        $map = $assets->keyBy('id');

        return self::walk($payload, $map);
    }

    private static function walk(mixed $value, Collection $map): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        if (array_key_exists('mediaId', $value)) {
            $asset = $map->get((int) $value['mediaId']);

            if ($asset instanceof MediaAsset) {
                $value['url'] = $asset->url;
                $value['width'] = $asset->width;
                $value['height'] = $asset->height;
                $value['alt'] = $value['alt'] ?? $asset->alt_text ?? '';
                $value['caption'] = $value['caption'] ?? $asset->caption ?? '';
            }
        }

        foreach ($value as $key => $child) {
            $value[$key] = self::walk($child, $map);
        }

        return $value;
    }

    /**
     * Collect every media id referenced in nested section/event payloads.
     *
     * @return array<int, int>
     */
    public static function referencedIds(array $payload): array
    {
        $ids = [];

        array_walk_recursive($payload, function ($value, $key) use (&$ids) {
            $isMediaKey = $key === 'mediaId'
                || $key === 'story_image_id'
                || $key === 'image_media_id'
                || str_ends_with((string) $key, '_media_id')
                || str_ends_with((string) $key, 'MediaId');

            if ($isMediaKey && is_numeric($value)) {
                $ids[] = (int) $value;
            }
        });

        return array_values(array_unique($ids));
    }
}
