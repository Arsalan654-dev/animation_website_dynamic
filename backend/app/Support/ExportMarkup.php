<?php

namespace App\Support;

use Carbon\Carbon;

class ExportMarkup
{
    public static function ornament(?string $type = 'botanical', int $width = 120): string
    {
        if ($type === 'none') {
            return '';
        }

        if ($type === 'line') {
            return '<div class="ea-ornament ea-ornament--line" aria-hidden="true"><span></span><i></i><span></span></div>';
        }

        if ($type === 'diamond') {
            return '<div class="ea-ornament ea-ornament--diamond" aria-hidden="true"><span></span><i></i><span></span></div>';
        }

        $height = (int) round($width * 0.32);

        return <<<SVG
<svg class="ea-ornament ea-ornament--botanical" width="{$width}" height="{$height}" viewBox="0 0 120 38" fill="none" aria-hidden="true">
  <path d="M1 19h31" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" opacity="0.55"/>
  <path d="M88 19h31" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" opacity="0.55"/>
  <path d="M48 26c-5.8 0-10.4-3.1-10.4-7 0-3.8 4.2-6.7 9.5-7.3 2.4-.3 5.2.1 7.4 1.2 3.3 1.6 5.3 4.2 5.3 6.8" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
  <path d="M72 26c5.8 0 10.4-3.1 10.4-7 0-3.8-4.2-6.7-9.5-7.3-2.4-.3-5.2.1-7.4 1.2-3.3 1.6-5.3 4.2-5.3 6.8" stroke="currentColor" stroke-width="0.9" stroke-linecap="round"/>
  <path d="M60 11.5v21" stroke="currentColor" stroke-width="0.7" opacity="0.65"/>
  <circle cx="60" cy="9" r="2.4" stroke="currentColor" stroke-width="0.9"/>
  <circle cx="60" cy="9" r="0.9" fill="currentColor"/>
  <path d="M45 12c3.2-.2 6 1.4 7.4 4.2M75 12c-3.2-.2-6 1.4-7.4 4.2" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" opacity="0.75"/>
  <path d="M38 19h-8M90 19h8" stroke="currentColor" stroke-width="0.7" stroke-linecap="round"/>
</svg>
SVG;
    }

    public static function cornerBranch(): string
    {
        return <<<'SVG'
<svg class="ea-corner" viewBox="0 0 140 140" fill="none" aria-hidden="true">
  <path d="M4 4c36 2 74 24 92 62 10 21 13 44 10 70" stroke="currentColor" stroke-width="0.9" opacity="0.55"/>
  <path d="M30 12c4 12 13 20 26 23-14 1-25 8-33 20 2-17 3-30 7-43Z" stroke="currentColor" stroke-width="0.8" opacity="0.7"/>
  <path d="M54 30c8 9 19 13 32 11-12 6-20 16-23 29-4-16-7-28-9-40Z" stroke="currentColor" stroke-width="0.8" opacity="0.7"/>
  <path d="M76 59c10 5 21 5 33-1-9 9-14 21-14 34-8-13-14-24-19-33Z" stroke="currentColor" stroke-width="0.8" opacity="0.6"/>
  <circle cx="28" cy="37" r="2" fill="currentColor" opacity="0.6"/>
  <circle cx="70" cy="50" r="2" fill="currentColor" opacity="0.5"/>
  <circle cx="95" cy="84" r="2" fill="currentColor" opacity="0.5"/>
</svg>
SVG;
    }

    public static function safeUrl(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $url = trim($url);

        if (preg_match('/^(https?:|mailto:|tel:)/i', $url)) {
            return $url;
        }

        if (str_starts_with($url, '/')) {
            return $url;
        }

        return null;
    }

    public static function extractIframeSource(?string $embed): ?string
    {
        if (! $embed) {
            return null;
        }

        if (preg_match('/<iframe[^>]+src=["\']([^"\']+)["\']/i', $embed, $match)) {
            return self::safeUrl($match[1]);
        }

        return self::safeUrl(trim($embed));
    }

    public static function youtubeEmbed(?string $url): ?string
    {
        $safe = self::safeUrl($url);

        if (! $safe) {
            return null;
        }

        $parsed = parse_url($safe);
        if (! $parsed || empty($parsed['host'])) {
            return null;
        }

        $host = strtolower($parsed['host']);
        $path = $parsed['path'] ?? '';

        if (str_contains($host, 'youtu.be')) {
            $id = trim(explode('/', trim($path, '/'))[0] ?? '');

            return $id ? 'https://www.youtube-nocookie.com/embed/'.rawurlencode($id) : null;
        }

        if (str_contains($host, 'youtube.com')) {
            parse_str($parsed['query'] ?? '', $query);
            if (! empty($query['v'])) {
                return 'https://www.youtube-nocookie.com/embed/'.rawurlencode((string) $query['v']);
            }

            if (preg_match('#/embed/([^/]+)#', $path, $match)) {
                return 'https://www.youtube-nocookie.com/embed/'.rawurlencode($match[1]);
            }
        }

        return null;
    }

    public static function vimeoEmbed(?string $url): ?string
    {
        $safe = self::safeUrl($url);

        if (! $safe) {
            return null;
        }

        $parsed = parse_url($safe);
        if (! $parsed || empty($parsed['host']) || ! str_contains(strtolower($parsed['host']), 'vimeo.com')) {
            return null;
        }

        if (preg_match('/(\d+)/', $parsed['path'] ?? '', $match)) {
            return 'https://player.vimeo.com/video/'.$match[1];
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    public static function splitParagraphs(?string $text): array
    {
        if (! $text) {
            return [];
        }

        $paragraphs = preg_split('/\R{2,}/', trim($text)) ?: [];

        return array_values(array_filter(array_map('trim', $paragraphs), fn ($value) => $value !== ''));
    }

    public static function calendarUrl(?array $event, string $title, ?string $details = null, ?string $location = null): ?string
    {
        if (! $event || empty($event['iso'])) {
            return null;
        }

        try {
            $start = Carbon::parse($event['iso']);
            $end = $start->copy()->addHours(2);
        } catch (\Throwable) {
            return null;
        }

        $params = [
            'action' => 'TEMPLATE',
            'text' => $title,
            'dates' => $start->utc()->format('Ymd\THis\Z').'/'.$end->utc()->format('Ymd\THis\Z'),
            'details' => $details ?? '',
            'location' => $location ?? '',
            'ctz' => $event['timezone'] ?? 'UTC',
        ];

        return 'https://calendar.google.com/calendar/render?'.http_build_query($params);
    }

    public static function googleFontsUrl(array $tokens): string
    {
        $fonts = array_unique(array_filter([
            self::fontName($tokens['typography']['headingFont'] ?? null),
            self::fontName($tokens['typography']['bodyFont'] ?? null),
            self::fontName($tokens['typography']['scriptFont'] ?? null),
        ]));

        $weights = [
            'Cormorant Garamond' => 'wght@400;500;600;700',
            'Playfair Display' => 'wght@400;500;600;700',
            'EB Garamond' => 'wght@400;500;600',
            'Cinzel' => 'wght@400;500;600;700',
            'Lora' => 'wght@400;500;600',
            'Libre Baskerville' => 'wght@400;700',
            'Great Vibes' => '',
            'Pinyon Script' => '',
            'Allura' => '',
            'Jost' => 'wght@300;400;500;600',
            'Inter' => 'wght@300;400;500;600',
            'Montserrat' => 'wght@300;400;500;600',
            'Source Sans 3' => 'wght@300;400;500;600',
            'Manrope' => 'wght@300;400;500;600',
            'DM Sans' => 'wght@300;400;500;600',
        ];

        $families = [];
        foreach ($fonts as $font) {
            $family = str_replace(' ', '+', $font);
            $weight = $weights[$font] ?? 'wght@400;500;600';
            $families[] = 'family='.$family.($weight ? ':'.$weight : '');
        }

        return 'https://fonts.googleapis.com/css2?'.implode('&', $families).'&display=swap';
    }

    public static function fontStack(string $font): string
    {
        $font = self::fontName($font);
        $serif = ['Cormorant Garamond', 'Playfair Display', 'EB Garamond', 'Cinzel', 'Lora', 'Libre Baskerville'];
        $script = ['Great Vibes', 'Pinyon Script', 'Allura'];

        if (in_array($font, $script, true)) {
            return '"'.$font.'", cursive';
        }

        if (in_array($font, $serif, true)) {
            return '"'.$font.'", Georgia, serif';
        }

        return '"'.$font.'", system-ui, sans-serif';
    }

    public static function fontName(?string $font): string
    {
        $font = preg_replace('/[^a-zA-Z0-9 \-]/', '', (string) $font) ?? '';

        return trim($font) !== '' ? trim($font) : 'Cormorant Garamond';
    }

    /**
     * Keep a CSS value from breaking out of the declaration or style block.
     */
    public static function cssValue(?string $value, string $fallback = ''): string
    {
        $value = trim((string) $value);
        $value = preg_replace('/[;{}<>\\\\]/', '', $value) ?? '';

        return $value !== '' ? $value : $fallback;
    }

    public static function cssUrl(?string $url): string
    {
        $url = self::safeUrl($url);

        return $url ? 'url("'.str_replace(['"', "'"], '', $url).'")' : 'none';
    }

    public static function initials(?string $name): string
    {
        $name = trim((string) $name);

        return $name !== '' ? strtoupper(substr($name, 0, 1)) : '?';
    }

    public static function jsonForScript(mixed $value): string
    {
        return json_encode(
            $value,
            JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES
        ) ?: 'null';
    }
}
