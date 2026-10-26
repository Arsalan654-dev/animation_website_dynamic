@php
    $theme = $design['tokens'];
    $colors = $theme['colors'];
    $type = $theme['typography'];
    $surfaces = $theme['surfaces'];
    $buttons = $theme['buttons'];
    $ornaments = $theme['ornaments'];
    $layout = $theme['layout'];
    $config = $design['design_config'];
    $effects = $config['effects'] ?? [];
    $page = $config['page'] ?? [];
    $pageBackground = $page['background_image']['url'] ?? null;
    $pageOverlay = is_numeric($page['overlay'] ?? null) ? max(0, min(0.9, (float) $page['overlay'])) : 0.0;
    $navStyle = in_array($page['nav_style'] ?? null, ['glass', 'solid', 'transparent'], true)
        ? $page['nav_style']
        : 'glass';
    $stickyNav = (bool) ($effects['sticky_nav'] ?? true);
    $scrollProgress = (bool) ($effects['scroll_progress'] ?? false);
    $cursorGlow = (bool) ($effects['cursor_glow'] ?? false);
    $envelope = $design['envelope'];
    $couple = $invitation['couple'];
    $names = trim(($couple['partner_one'] ?? '').' & '.($couple['partner_two'] ?? ''));
    $event = $invitation['event'];
    $rsvp = $invitation['rsvp'];
    $visibleSections = collect($design['sections'] ?? [])
        ->where('is_visible', true)
        ->sortBy('sort_order')
        ->values();
    $rsvpIndex = null;
    foreach ($visibleSections as $i => $s) {
        if (($s['type'] ?? '') === 'rsvp') {
            $rsvpIndex = $i;
            break;
        }
    }
    $rsvpId = $rsvpIndex !== null ? 'ea-rsvp-'.$rsvpIndex : null;
    $navLabels = [
        'story' => 'Our Story',
        'events' => 'Celebrations',
        'gallery' => 'Gallery',
        'venue' => 'Venue',
        'countdown' => 'Countdown',
        'travel' => 'Travel',
        'wedding_party' => 'The Party',
        'gifts' => 'Gifts',
        'contact' => 'Contact',
    ];
    $navItems = [];
    $seenNav = [];
    foreach ($visibleSections as $i => $s) {
        $sectionType = $s['type'] ?? '';
        if (isset($navLabels[$sectionType]) && ! isset($seenNav[$sectionType])) {
            $seenNav[$sectionType] = true;
            $navItems[] = ['id' => 'ea-'.$sectionType.'-'.$i, 'label' => $navLabels[$sectionType]];
        }
    }
    $events = $invitation['events'] ?? [];
    if (empty($events) && ! empty($event)) {
        $events = [[
            'id' => 0,
            'title' => $names,
            'description' => $couple['message'] ?? null,
            'date' => $event,
            'timezone' => $event['timezone'] ?? 'UTC',
            'venue_name' => $invitation['venue']['name'] ?? null,
            'venue_address' => $invitation['venue']['address'] ?? null,
            'map_url' => $invitation['venue']['map_url'] ?? null,
            'dress_code' => null,
            'rsvp_enabled' => true,
            'image' => null,
        ]];
    }
    $envelopeEnabled = (bool) ($envelope['enabled'] ?? true);
    $envelopeCover = $envelope['cover_image']['url'] ?? $design['cover_image'] ?? $invitation['cover_image'] ?? null;
    $cover = $design['cover_image'] ?? $invitation['cover_image'] ?? null;
    $firstSectionType = $visibleSections->first()['type'] ?? null;
    $hasHero = $firstSectionType === 'hero';
    $buttonTransform = $buttons['textTransform'] ?? 'uppercase';
    $buttonTransform = in_array($buttonTransform, ['uppercase', 'none', 'capitalize'], true)
        ? $buttonTransform
        : 'uppercase';
    $fontsUrl = \App\Support\ExportMarkup::googleFontsUrl($theme);
    $bodyClasses = [];
    if ($effects['grain'] ?? true) {
        $bodyClasses[] = 'ea-grain';
    }
    if ($effects['hover_lift'] ?? true) {
        $bodyClasses[] = 'ea-hover-lift-on';
    }
    if ($effects['image_zoom'] ?? true) {
        $bodyClasses[] = 'ea-image-zoom-on';
    }
    $bodyClasses[] = 'ea-nav-'.$navStyle;
    if (! $stickyNav) {
        $bodyClasses[] = 'ea-nav-static';
    }
    if ($scrollProgress) {
        $bodyClasses[] = 'ea-scroll-progress-on';
    }
    if ($cursorGlow) {
        $bodyClasses[] = 'ea-cursor-on';
    }
    $easeMap = [
        'easeOut' => 'cubic-bezier(0.16, 1, 0.3, 1)',
        'easeIn' => 'cubic-bezier(0.7, 0, 0.84, 0)',
        'easeInOut' => 'cubic-bezier(0.65, 0, 0.35, 1)',
        'linear' => 'linear',
        'spring' => 'cubic-bezier(0.16, 1, 0.3, 1)',
    ];
    $color = fn ($key, $fallback) => \App\Support\ExportMarkup::cssValue($colors[$key] ?? null, $fallback);
    $num = fn ($value, $fallback, $min, $max) => is_numeric($value) ? max($min, min($max, (float) $value)) : $fallback;
@endphp
<!doctype html>
<html lang="en" class="{{ $envelopeEnabled ? 'ea-has-envelope' : 'ea-no-envelope' }} {{ $hasHero ? 'ea-has-hero' : 'ea-no-hero' }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="{{ $names }} — wedding invitation. {{ $event['formatted'] ?? '' }}">
    <meta name="theme-color" content="{{ $color('primary', '#4a1f2c') }}">
    <title>{{ $names }} — Wedding Invitation</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="{{ $fontsUrl }}" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

    <script>
        try {
            if (sessionStorage.getItem('ea-opened:{{ $invitation['slug'] }}')) {
                document.documentElement.classList.add('ea-opened');
            }
        } catch (e) {}
    </script>

    <style>
        :root {
            --w-primary: {{ $color('primary', '#4a1f2c') }};
            --w-secondary: {{ $color('secondary', '#6d6b4e') }};
            --w-accent: {{ $color('accent', '#b99358') }};
            --w-surface: {{ $color('surface', '#f7f1e6') }};
            --w-surface-alt: {{ $color('surfaceAlt', '#efe5d5') }};
            --w-text: {{ $color('text', '#2c211b') }};
            --w-muted: {{ $color('muted', '#6f6154') }};
            --w-line: {{ $color('line', 'rgba(74, 31, 44, 0.18)') }};
            --w-on-primary: {{ $color('onPrimary', '#fffaf2') }};
            --w-page-bg: {{ \App\Support\ExportMarkup::cssValue($surfaces['pageBackground'] ?? null, '#f7f1e6') }};
            --w-card-bg: {{ \App\Support\ExportMarkup::cssValue($surfaces['cardBackground'] ?? null, 'rgba(255, 251, 244, 0.72)') }};
            --w-card-border: {{ \App\Support\ExportMarkup::cssValue($surfaces['cardBorder'] ?? null, 'rgba(74, 31, 44, 0.16)') }};
            --w-card-radius: {{ $num($surfaces['cardRadius'] ?? null, 4, 0, 48) }}px;
            --w-paper-opacity: {{ $num($surfaces['paperTextureOpacity'] ?? null, 0.32, 0, 1) }};
            --w-section-spacing: {{ $num($surfaces['sectionSpacing'] ?? null, 96, 48, 240) }}px;
            --w-content-width: {{ $num($surfaces['contentWidth'] ?? null, 1160, 720, 1600) }}px;
            --w-heading-font: {!! \App\Support\ExportMarkup::fontStack($type['headingFont'] ?? 'Cormorant Garamond') !!};
            --w-body-font: {!! \App\Support\ExportMarkup::fontStack($type['bodyFont'] ?? 'Jost') !!};
            --w-script-font: {!! \App\Support\ExportMarkup::fontStack($type['scriptFont'] ?? 'Great Vibes') !!};
            --w-base-size: {{ $num($type['baseSize'] ?? null, 16, 12, 22) }}px;
            --w-heading-weight: {{ $num($type['headingWeight'] ?? null, 500, 300, 800) }};
            --w-body-weight: {{ $num($type['bodyWeight'] ?? null, 400, 300, 700) }};
            --w-line-height: {{ $num($type['bodyLineHeight'] ?? null, 1.75, 1.2, 2.2) }};
            --w-letter-spacing: {{ $num($type['letterSpacing'] ?? null, 0.02, 0, 0.3) }}em;
            --w-btn-radius: {{ $num($buttons['radius'] ?? null, 999, 0, 999) }}px;
            --w-btn-spacing: {{ $num($buttons['letterSpacing'] ?? null, 0.14, 0, 0.4) }}em;
            --w-btn-transform: {{ $buttonTransform }};
            --w-image-aspect: {{ str_replace('/', ' / ', \App\Support\ExportMarkup::cssValue($layout['imageAspect'] ?? null, '4/5')) }};
            --ea-content-max: var(--w-content-width);
            --ea-section-pad: var(--w-section-spacing);
        }

        *, *::before, *::after { box-sizing: border-box; }
        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
        body {
            margin: 0;
            background: var(--w-page-bg);
            color: var(--w-text);
            font-family: var(--w-body-font);
            font-size: var(--w-base-size);
            line-height: var(--w-line-height);
            letter-spacing: var(--w-letter-spacing);
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
        }
        body.ea-locked { overflow: hidden; }
        img { max-width: 100%; display: block; }
        a { color: inherit; text-decoration: none; }
        button, input, select, textarea { font: inherit; }
        ::selection { background: var(--w-primary); color: var(--w-on-primary); }

        body.ea-grain::before {
            content: '';
            position: fixed;
            inset: 0;
            z-index: 1;
            pointer-events: none;
            opacity: var(--w-paper-opacity);
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
            mix-blend-mode: multiply;
        }

        .ea-site { position: relative; z-index: 2; }
        .ea-no-hero .ea-site { padding-top: 4.5rem; }
        .ea-section-wrap { scroll-margin-top: 4.5rem; }

        .ea-page-bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
        .ea-page-bg img { width: 100%; height: 100%; object-fit: cover; }
        .ea-page-bg span { position: absolute; inset: 0; }

        .ea-progress {
            position: fixed;
            top: 0;
            left: 0;
            z-index: 80;
            height: 2px;
            width: 0;
            background: var(--w-accent);
            pointer-events: none;
        }

        .ea-cursor {
            position: fixed;
            inset: 0;
            z-index: 3;
            opacity: 0;
            pointer-events: none;
            background: radial-gradient(
                320px circle at var(--ea-cursor-x, 50%) var(--ea-cursor-y, 50%),
                color-mix(in srgb, var(--w-accent) 13%, transparent),
                transparent 65%
            );
            transition: opacity 0.4s ease;
        }
        body.ea-cursor-on .ea-cursor { opacity: 1; }
        @media (pointer: coarse) {
            .ea-cursor { display: none; }
        }

        .ea-container {
            width: 100%;
            max-width: var(--ea-content-max);
            margin-inline: auto;
            padding-inline: clamp(1.25rem, 5vw, 3rem);
        }
        .ea-section {
            position: relative;
            padding-block: clamp(4rem, 9vw, var(--ea-section-pad));
            scroll-margin-top: 4.5rem;
        }
        .ea-section--alt { background: var(--ea-section-bg, var(--w-surface-alt)); }
        .ea-section--flush { padding-block: 0; }

        .ea-display {
            font-family: var(--w-heading-font);
            font-weight: var(--w-heading-weight);
            letter-spacing: var(--w-letter-spacing);
            line-height: 1.05;
            margin: 0;
        }
        .ea-script { font-family: var(--w-script-font); }
        .ea-body { font-family: var(--w-body-font); font-weight: var(--w-body-weight); }
        .ea-eyebrow {
            margin: 0;
            font-size: 0.66rem;
            font-weight: 500;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: var(--w-muted);
        }
        .ea-intro { max-width: 42rem; margin-inline: auto; text-align: center; }
        .ea-intro--left { margin-inline: 0; text-align: left; }
        .ea-intro h2 { margin-top: 0.75rem; font-size: clamp(2.2rem, 5vw, 3.6rem); }
        .ea-intro__ornament { margin-top: 1.15rem; }
        .ea-intro p { margin: 1.1rem auto 0; max-width: 34rem; font-size: 0.95rem; line-height: 1.8; color: var(--w-muted); }
        .ea-intro--left p { margin-inline: 0; }
        .ea-prose p { margin: 0 0 0.9rem; color: color-mix(in srgb, var(--w-text) 82%, transparent); }
        .ea-prose p:last-child { margin-bottom: 0; }

        .ea-ornament { color: var(--w-accent); margin-inline: auto; display: block; }
        .ea-ornament--line, .ea-ornament--diamond { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; }
        .ea-ornament--line span, .ea-ornament--diamond span { display: block; height: 1px; width: 4rem; background: var(--w-line); }
        .ea-ornament--line i { display: block; width: 0.28rem; height: 0.28rem; transform: rotate(45deg); background: var(--w-accent); }
        .ea-ornament--diamond i { display: block; width: 0.65rem; height: 0.65rem; transform: rotate(45deg); border: 1px solid var(--w-accent); }
        .ea-ornament--botanical { max-width: 100%; height: auto; }
        .ea-corner { position: absolute; width: 8rem; height: 8rem; color: var(--w-accent); opacity: 0.5; pointer-events: none; z-index: 1; }
        .ea-corner--tl { top: 0; left: 0; }
        .ea-corner--tr { top: 0; right: 0; transform: scaleX(-1); }

        .ea-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            border: 1px solid transparent;
            padding: 0.85rem 1.5rem;
            border-radius: var(--w-btn-radius);
            font-size: 0.62rem;
            letter-spacing: var(--w-btn-spacing);
            text-transform: var(--w-btn-transform);
            line-height: 1;
            cursor: pointer;
            transition: background 0.35s ease, color 0.35s ease, border-color 0.35s ease, transform 0.35s ease, box-shadow 0.35s ease;
        }
        .ea-btn--fill { background: var(--w-primary); color: var(--w-on-primary); }
        .ea-btn--fill:hover { background: color-mix(in srgb, var(--w-primary) 82%, black); color: var(--w-on-primary); transform: translateY(-2px); }
        .ea-btn--outline { border-color: var(--w-primary); color: var(--w-primary); background: transparent; }
        .ea-btn--outline:hover { background: var(--w-primary); color: var(--w-on-primary); transform: translateY(-2px); }
        .ea-btn--text { padding: 0.35rem 0; border: 0; border-bottom: 1px solid var(--w-line); border-radius: 0; color: var(--w-primary); background: transparent; }
        .ea-btn--text:hover { border-color: var(--w-primary); color: var(--w-primary); }
        .ea-btn--light { border-color: color-mix(in srgb, var(--w-on-primary) 45%, transparent); color: var(--w-on-primary); background: transparent; }
        .ea-btn--light:hover { background: color-mix(in srgb, var(--w-on-primary) 14%, transparent); color: var(--w-on-primary); }
        .ea-btn--white { background: var(--w-on-primary); color: var(--w-primary); border-color: var(--w-on-primary); }
        .ea-btn--white:hover { background: #fff; color: var(--w-primary); transform: translateY(-2px); }

        .ea-card {
            background: var(--w-card-bg);
            border: 1px solid var(--w-card-border);
            border-radius: var(--w-card-radius);
            box-shadow: 0 24px 60px -34px color-mix(in srgb, var(--w-text) 38%, transparent);
        }
        .ea-shadow-soft { box-shadow: 0 30px 70px -42px color-mix(in srgb, var(--w-text) 45%, transparent); }
        .ea-shadow-deep { box-shadow: 0 36px 90px -36px color-mix(in srgb, var(--w-text) 62%, transparent); }

        .ea-hero {
            position: relative;
            min-height: 100svh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            padding: 7rem 1.25rem 5rem;
            text-align: center;
            color: var(--w-on-primary);
            isolation: isolate;
        }
        .ea-hero__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -3; }
        .ea-hero__gradient {
            position: absolute;
            inset: 0;
            z-index: -2;
            background: radial-gradient(120% 100% at 50% 0%, var(--w-secondary) 0%, var(--w-primary) 55%, var(--w-text) 100%);
        }
        .ea-hero__overlay { position: absolute; inset: 0; z-index: -1; }
        .ea-hero__content { position: relative; z-index: 3; width: 100%; max-width: 64rem; display: flex; flex-direction: column; align-items: center; }
        .ea-hero__eyebrow { font-size: 0.58rem; letter-spacing: 0.45em; text-transform: uppercase; color: color-mix(in srgb, var(--w-on-primary) 70%, transparent); }
        .ea-hero__name {
            margin: 1.2rem 0 0;
            font-size: clamp(3.1rem, 10vw, 7.6rem);
            color: var(--w-on-primary);
            text-wrap: balance;
            text-shadow: 0 3px 24px rgba(0, 0, 0, 0.35);
        }
        .ea-hero__sub { margin: 1.4rem 0 0; max-width: 36rem; font-size: 0.78rem; letter-spacing: 0.26em; text-transform: uppercase; color: color-mix(in srgb, var(--w-on-primary) 78%, transparent); }
        .ea-hero__meta { margin-top: 1.6rem; display: flex; flex-direction: column; align-items: center; gap: 0.55rem; font-size: 0.7rem; letter-spacing: 0.22em; text-transform: uppercase; color: color-mix(in srgb, var(--w-on-primary) 88%, transparent); }
        .ea-hero__meta i { display: block; width: 1px; height: 0.85rem; background: color-mix(in srgb, var(--w-on-primary) 32%, transparent); }
        .ea-hero__actions { margin-top: 2.1rem; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; }
        .ea-scroll { position: absolute; bottom: 1.8rem; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 0.55rem; color: color-mix(in srgb, var(--w-on-primary) 45%, transparent); z-index: 3; }
        .ea-scroll span:first-child { font-size: 0.5rem; letter-spacing: 0.4em; text-transform: uppercase; }
        .ea-scroll span:last-child { display: block; width: 1px; height: 2.6rem; background: linear-gradient(to bottom, color-mix(in srgb, var(--w-on-primary) 48%, transparent), transparent); }

        .ea-nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 50;
            transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
            border-bottom: 1px solid transparent;
        }
        .ea-nav--scrolled {
            background: color-mix(in srgb, var(--w-page-bg) 90%, transparent);
            border-color: var(--w-line);
            box-shadow: 0 18px 40px -32px color-mix(in srgb, var(--w-text) 50%, transparent);
            backdrop-filter: blur(16px);
        }
        .ea-nav__inner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-block: 0.9rem; }
        .ea-nav__brand { font-family: var(--w-heading-font); font-size: 1.05rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--w-primary); }
        .ea-nav__links { display: none; align-items: center; gap: 1.5rem; font-size: 0.58rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--w-muted); }
        .ea-nav__links a { transition: color 0.25s ease; }
        .ea-nav__links a:hover { color: var(--w-primary); }
        .ea-nav__links .ea-nav__rsvp { color: var(--w-primary); border-bottom: 1px solid var(--w-primary); padding-bottom: 0.2rem; }
        .ea-nav__toggle { display: inline-flex; align-items: center; justify-content: center; width: 2.4rem; height: 2.4rem; border: 1px solid var(--w-line); border-radius: 999px; background: transparent; color: var(--w-primary); }
        .ea-nav--over-hero:not(.ea-nav--scrolled) .ea-nav__brand { color: var(--w-on-primary); text-shadow: 0 2px 14px rgba(0, 0, 0, 0.35); }
        .ea-nav--over-hero:not(.ea-nav--scrolled) .ea-nav__links { color: color-mix(in srgb, var(--w-on-primary) 78%, transparent); }
        .ea-nav--over-hero:not(.ea-nav--scrolled) .ea-nav__links .ea-nav__rsvp { color: var(--w-on-primary); border-color: var(--w-on-primary); }
        .ea-nav--over-hero:not(.ea-nav--scrolled) .ea-nav__toggle { color: var(--w-on-primary); border-color: color-mix(in srgb, var(--w-on-primary) 38%, transparent); }
        body.ea-nav-glass .ea-nav {
            background: color-mix(in srgb, var(--w-page-bg) 88%, transparent);
            backdrop-filter: blur(16px);
            border-color: var(--w-line);
        }
        body.ea-nav-solid .ea-nav {
            background: var(--w-page-bg);
            border-color: var(--w-line);
        }
        body.ea-nav-transparent .ea-nav,
        body.ea-nav-transparent .ea-nav.ea-nav--scrolled {
            background: transparent;
            border-color: transparent;
            box-shadow: none;
            backdrop-filter: none;
        }
        body.ea-nav-glass .ea-nav--over-hero:not(.ea-nav--scrolled) .ea-nav__brand,
        body.ea-nav-solid .ea-nav--over-hero:not(.ea-nav--scrolled) .ea-nav__brand {
            color: var(--w-primary);
            text-shadow: none;
        }
        body.ea-nav-glass .ea-nav--over-hero:not(.ea-nav--scrolled) .ea-nav__links,
        body.ea-nav-solid .ea-nav--over-hero:not(.ea-nav--scrolled) .ea-nav__links {
            color: var(--w-muted);
        }
        body.ea-nav-glass .ea-nav--over-hero:not(.ea-nav--scrolled) .ea-nav__links .ea-nav__rsvp,
        body.ea-nav-solid .ea-nav--over-hero:not(.ea-nav--scrolled) .ea-nav__links .ea-nav__rsvp {
            color: var(--w-primary);
            border-color: var(--w-primary);
        }
        body.ea-nav-glass .ea-nav--over-hero:not(.ea-nav--scrolled) .ea-nav__toggle,
        body.ea-nav-solid .ea-nav--over-hero:not(.ea-nav--scrolled) .ea-nav__toggle {
            color: var(--w-primary);
            border-color: var(--w-line);
        }
        body.ea-nav-static .ea-nav { position: absolute; }
        .ea-mobile-menu { display: none; flex-direction: column; gap: 1rem; padding: 1rem 1.25rem 1.5rem; background: color-mix(in srgb, var(--w-page-bg) 97%, transparent); border-bottom: 1px solid var(--w-line); }
        .ea-mobile-menu.is-open { display: flex; }
        .ea-mobile-menu a { font-size: 0.7rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--w-muted); }
        @media (min-width: 900px) {
            .ea-nav__links { display: flex; }
            .ea-nav__toggle { display: none; }
            .ea-mobile-menu { display: none !important; }
        }

        .ea-split { display: grid; gap: 2.6rem; align-items: center; }
        .ea-split__media { position: relative; }
        .ea-split__image { width: 100%; aspect-ratio: var(--w-image-aspect); object-fit: cover; border-radius: var(--w-card-radius); }
        .ea-split__image--framed { position: relative; z-index: 1; }
        .ea-split__frame { position: absolute; inset: -0.75rem; border: 1px solid color-mix(in srgb, var(--w-accent) 35%, transparent); border-radius: var(--w-card-radius); }
        .ea-split__monogram { position: absolute; right: -0.5rem; bottom: -1.25rem; z-index: 2; padding: 0.25rem 1rem; background: var(--w-page-bg); font-family: var(--w-script-font); font-size: 2.2rem; color: var(--w-primary); }
        .ea-split__body { min-width: 0; }
        @media (min-width: 900px) {
            .ea-split { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 3.6rem; }
            .ea-split--reverse .ea-split__media { order: 2; }
            .ea-split--even { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        .ea-timeline { margin-top: 2rem; border-left: 1px solid var(--w-line); padding-left: 1.25rem; display: grid; gap: 1.2rem; }
        .ea-timeline__item { position: relative; }
        .ea-timeline__item::before { content: ''; position: absolute; left: -1.42rem; top: 0.42rem; width: 0.38rem; height: 0.38rem; border-radius: 50%; background: var(--w-accent); }
        .ea-timeline__date { font-size: 0.58rem; letter-spacing: 0.24em; text-transform: uppercase; color: var(--w-accent); }
        .ea-timeline__title { margin-top: 0.15rem; font-family: var(--w-heading-font); font-size: 1.25rem; line-height: 1.2; }
        .ea-timeline__text { margin-top: 0.25rem; font-size: 0.86rem; line-height: 1.7; color: var(--w-muted); }

        .ea-quote { position: relative; max-width: 50rem; margin-inline: auto; text-align: center; }
        .ea-quote__mark { position: absolute; top: -4rem; left: 50%; transform: translateX(-50%); font-family: var(--w-heading-font); font-size: 10rem; line-height: 1; color: color-mix(in srgb, var(--w-accent) 20%, transparent); pointer-events: none; }
        .ea-quote blockquote { position: relative; margin: 0; font-family: var(--w-heading-font); font-style: italic; font-size: clamp(1.9rem, 4.5vw, 3.2rem); line-height: 1.25; color: var(--w-primary); }
        .ea-quote__attribution { margin-top: 1.4rem; display: inline-flex; align-items: center; gap: 0.75rem; }
        .ea-quote__attribution::before, .ea-quote__attribution::after { content: ''; display: block; width: 1.5rem; height: 1px; background: var(--w-line); }

        .ea-events { margin-top: 2.5rem; display: grid; gap: 1.5rem; }
        .ea-event { overflow: hidden; }
        .ea-event__grid { display: grid; }
        .ea-event__media { min-height: 14rem; }
        .ea-event__image { width: 100%; height: 100%; min-height: 14rem; object-fit: cover; transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .ea-event:hover .ea-event__image { transform: scale(1.02); }
        .ea-event__body { display: flex; flex-direction: column; justify-content: center; padding: 1.6rem; }
        .ea-event__top { display: flex; align-items: flex-start; gap: 1.25rem; }
        .ea-event__date { flex: 0 0 auto; border-right: 1px solid var(--w-line); padding-right: 1.25rem; text-align: center; }
        .ea-event__day { font-family: var(--w-heading-font); font-size: 2.4rem; line-height: 1; color: var(--w-primary); }
        .ea-event__month, .ea-event__year { font-size: 0.55rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--w-muted); }
        .ea-event__title { margin: 0.2rem 0 0; font-size: clamp(1.8rem, 3vw, 2.4rem); }
        .ea-event__meta { margin-top: 0.55rem; display: flex; flex-wrap: wrap; gap: 0.45rem 0.9rem; font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--w-muted); }
        .ea-event__description { margin-top: 0.9rem; font-size: 0.9rem; line-height: 1.75; color: var(--w-muted); }
        .ea-event__place { margin-top: 0.9rem; font-size: 0.9rem; color: color-mix(in srgb, var(--w-text) 84%, transparent); }
        .ea-event__place small { display: block; margin-top: 0.15rem; font-size: 0.78rem; color: var(--w-muted); }
        .ea-event__dress { margin-top: 0.5rem; font-size: 0.6rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--w-muted); }
        .ea-event__actions { margin-top: 1.1rem; display: flex; flex-wrap: wrap; gap: 1rem; }
        @media (min-width: 800px) {
            .ea-event__grid { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); }
            .ea-event:nth-child(even) .ea-event__grid { direction: rtl; }
            .ea-event:nth-child(even) .ea-event__grid > * { direction: ltr; }
            .ea-event__media, .ea-event__image { min-height: 19rem; }
            .ea-event__body { padding: 2rem; }
        }

        .ea-gallery { margin-top: 2.5rem; }
        .ea-gallery--grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
        .ea-gallery--masonry { columns: 2; column-gap: 0.75rem; }
        .ea-gallery--masonry .ea-gallery__item { break-inside: avoid; margin-bottom: 0.75rem; }
        .ea-gallery__item { position: relative; display: block; width: 100%; padding: 0; border: 0; background: var(--w-surface); border-radius: var(--w-card-radius); overflow: hidden; cursor: zoom-in; }
        .ea-gallery--grid .ea-gallery__item { aspect-ratio: 1; }
        .ea-gallery__image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .ea-gallery__item:hover .ea-gallery__image { transform: scale(1.04); }
        .ea-gallery__caption { position: absolute; inset-inline: 0; bottom: 0; padding: 2rem 0.75rem 0.6rem; background: linear-gradient(to top, rgba(20, 14, 10, 0.75), transparent); color: rgba(255, 255, 255, 0.85); font-size: 0.62rem; letter-spacing: 0.16em; text-transform: uppercase; text-align: left; opacity: 0; transform: translateY(0.5rem); transition: opacity 0.35s ease, transform 0.35s ease; }
        .ea-gallery__item:hover .ea-gallery__caption { opacity: 1; transform: translateY(0); }
        @media (min-width: 700px) {
            .ea-gallery--grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
            .ea-gallery--masonry { columns: 3; column-gap: 1rem; }
            .ea-gallery--masonry .ea-gallery__item { margin-bottom: 1rem; }
        }
        .ea-gallery__hint { margin-top: 1.5rem; text-align: center; font-size: 0.58rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--w-muted); }

        .ea-countdown { display: flex; justify-content: center; gap: clamp(0.9rem, 4vw, 2.4rem); }
        .ea-countdown__unit { min-width: 3.6rem; text-align: center; }
        .ea-countdown__value { display: block; font-family: var(--w-heading-font); font-size: clamp(2rem, 6vw, 3.4rem); line-height: 1; color: var(--w-primary); font-variant-numeric: tabular-nums; }
        .ea-countdown__label { display: block; margin-top: 0.35rem; font-size: 0.52rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--w-muted); }
        .ea-countdown--compact .ea-countdown__value { font-size: clamp(1.4rem, 4vw, 2.2rem); color: var(--w-on-primary); }
        .ea-countdown--compact .ea-countdown__label { color: color-mix(in srgb, var(--w-on-primary) 60%, transparent); }
        .ea-countdown--compact .ea-countdown__unit { min-width: 2.6rem; }

        .ea-venue { display: grid; gap: 1.5rem; margin-top: 2.5rem; }
        .ea-venue__image { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: var(--w-card-radius); }
        .ea-venue__card { padding: 1.6rem; }
        .ea-venue__name { margin: 0.4rem 0 0; font-size: 1.9rem; }
        .ea-venue__address { margin-top: 0.5rem; font-size: 0.9rem; line-height: 1.7; color: var(--w-muted); }
        .ea-venue__notes { margin-top: 1.1rem; border-top: 1px solid var(--w-card-border); padding-top: 0.9rem; font-size: 0.78rem; line-height: 1.7; color: var(--w-muted); }
        .ea-map { position: relative; overflow: hidden; border: 1px solid var(--w-card-border); border-radius: var(--w-card-radius); min-height: 16rem; }
        .ea-map iframe { width: 100%; height: 100%; min-height: 16rem; border: 0; display: block; }
        .ea-map__fallback { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 16rem; padding: 1.5rem; text-align: center; background: var(--w-surface-alt); }
        .ea-map__grid { position: absolute; inset: 0; opacity: 0.22; background-image: linear-gradient(var(--w-line) 1px, transparent 1px), linear-gradient(90deg, var(--w-line) 1px, transparent 1px); background-size: 38px 38px; }
        .ea-map__pin { position: relative; display: flex; align-items: center; justify-content: center; width: 3rem; height: 3rem; border: 1px solid color-mix(in srgb, var(--w-accent) 45%, transparent); border-radius: 50%; background: var(--w-page-bg); color: var(--w-primary); font-size: 1.2rem; }
        .ea-map__name { position: relative; margin-top: 0.8rem; font-family: var(--w-heading-font); font-size: 1.5rem; }
        .ea-map__address { position: relative; margin-top: 0.25rem; max-width: 20rem; font-size: 0.78rem; line-height: 1.6; color: var(--w-muted); }
        @media (min-width: 900px) {
            .ea-venue { grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
        }

        .ea-party { margin-top: 2.5rem; display: grid; gap: 2rem; }
        .ea-party__member { text-align: center; }
        .ea-party__image { width: 100%; max-width: 18rem; margin-inline: auto; aspect-ratio: 4 / 5; object-fit: cover; border-radius: var(--w-card-radius); }
        .ea-party__placeholder { display: flex; align-items: center; justify-content: center; width: 100%; max-width: 18rem; margin-inline: auto; aspect-ratio: 4 / 5; border: 1px solid var(--w-line); border-radius: var(--w-card-radius); font-family: var(--w-script-font); font-size: 3.4rem; color: color-mix(in srgb, var(--w-primary) 60%, transparent); }
        .ea-party__name { margin: 1rem 0 0; font-size: 1.6rem; }
        .ea-party__role { margin-top: 0.25rem; }
        .ea-party__bio { margin: 0.5rem auto 0; max-width: 18rem; font-size: 0.78rem; line-height: 1.7; color: var(--w-muted); }
        @media (min-width: 700px) { .ea-party { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1000px) { .ea-party { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        .ea-gifts { max-width: 52rem; margin-inline: auto; }
        .ea-gifts__card { margin-top: 2rem; padding: 2rem; text-align: center; }
        .ea-gifts__icon { font-size: 1.4rem; color: var(--w-accent); }
        .ea-gifts__note { margin-top: 1rem; border-top: 1px solid var(--w-card-border); padding-top: 1rem; font-size: 0.78rem; line-height: 1.7; color: var(--w-muted); }
        .ea-gifts__links { margin-top: 1.25rem; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; }

        .ea-travel { margin-top: 2.2rem; display: grid; gap: 1rem; }
        .ea-travel__card { padding: 1.5rem; }
        .ea-travel__name { margin: 0.3rem 0 0; font-size: 1.5rem; }
        .ea-travel__description { margin-top: 0.5rem; font-size: 0.86rem; line-height: 1.7; color: var(--w-muted); }
        .ea-travel__address { margin-top: 0.5rem; font-size: 0.78rem; color: var(--w-muted); }
        @media (min-width: 700px) { .ea-travel { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

        .ea-video { max-width: 60rem; margin: 2rem auto 0; overflow: hidden; border: 1px solid var(--w-card-border); border-radius: var(--w-card-radius); background: var(--w-text); }
        .ea-video__frame { position: relative; aspect-ratio: 16 / 9; }
        .ea-video__frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
        .ea-video__fallback { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.9rem; aspect-ratio: 16 / 9; padding: 1.5rem; text-align: center; color: color-mix(in srgb, var(--w-on-primary) 65%, transparent); }
        .ea-video__caption { margin-top: 0.75rem; text-align: center; font-size: 0.78rem; font-style: italic; color: var(--w-muted); }

        .ea-contact { margin-top: 2rem; display: grid; gap: 1rem; }
        .ea-contact__card { padding: 1.5rem; text-align: center; }
        .ea-contact__name { font-family: var(--w-heading-font); font-size: 1.5rem; }
        .ea-contact__role { margin-top: 0.25rem; }
        .ea-contact__links { margin-top: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.45rem; font-size: 0.86rem; color: var(--w-muted); }
        .ea-contact__links a:hover { color: var(--w-primary); }
        @media (min-width: 700px) { .ea-contact { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1000px) { .ea-contact { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        .ea-divider { padding-block: 2.5rem; text-align: center; }

        .ea-rsvp { max-width: 46rem; margin-inline: auto; }
        .ea-rsvp__card { padding: 1.5rem; }
        .ea-rsvp__grid { display: grid; gap: 1rem; }
        .ea-rsvp__field--full { grid-column: 1 / -1; }
        .ea-label { display: block; margin-bottom: 0.35rem; font-size: 0.58rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--w-muted); }
        .ea-input {
            width: 100%;
            border: 1px solid var(--w-card-border);
            border-radius: var(--w-card-radius);
            background: color-mix(in srgb, var(--w-surface) 55%, transparent);
            color: var(--w-text);
            padding: 0.75rem 0.85rem;
            font-size: 0.9rem;
            outline: none;
            transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .ea-input:focus { border-color: var(--w-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--w-primary) 12%, transparent); }
        textarea.ea-input { min-height: 6rem; resize: vertical; }
        .ea-choice { display: grid; gap: 0.5rem; }
        .ea-choice__option { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; border: 1px solid var(--w-card-border); border-radius: var(--w-card-radius); padding: 0.75rem 0.9rem; font-size: 0.86rem; cursor: pointer; transition: border-color 0.25s ease, background 0.25s ease, color 0.25s ease; }
        .ea-choice__option input { position: absolute; opacity: 0; pointer-events: none; }
        .ea-choice__option:has(input:checked) { background: var(--w-primary); border-color: var(--w-primary); color: var(--w-on-primary); }
        .ea-choice__dot { display: flex; align-items: center; justify-content: center; width: 0.9rem; height: 0.9rem; border: 1px solid currentColor; border-radius: 50%; }
        .ea-choice__option:has(input:checked) .ea-choice__dot::after { content: ''; width: 0.4rem; height: 0.4rem; border-radius: 50%; background: currentColor; }
        .ea-rsvp__error { margin-top: 0.3rem; font-size: 0.72rem; color: #a34d4d; }
        .ea-rsvp__alert { margin-top: 1rem; border: 1px solid color-mix(in srgb, #a34d4d 30%, transparent); border-radius: var(--w-card-radius); background: color-mix(in srgb, #a34d4d 9%, transparent); padding: 0.8rem 1rem; font-size: 0.82rem; color: #8d3f3f; }
        .ea-rsvp__success { padding: 2.4rem 1.5rem; text-align: center; }
        .ea-rsvp__success-icon { display: flex; align-items: center; justify-content: center; width: 3.4rem; height: 3.4rem; margin-inline: auto; border: 1px solid color-mix(in srgb, var(--w-accent) 40%, transparent); border-radius: 50%; background: color-mix(in srgb, var(--w-accent) 10%, transparent); color: var(--w-primary); font-size: 1.4rem; }
        .ea-rsvp__success h3 { margin: 1.2rem 0 0; font-size: 2.2rem; }
        .ea-rsvp__success p { margin: 0.75rem auto 0; max-width: 26rem; font-size: 0.88rem; line-height: 1.8; color: var(--w-muted); }
        .ea-rsvp__thanks { margin-top: 1.5rem; border-top: 1px solid var(--w-card-border); padding-top: 1rem; font-size: 0.82rem; color: var(--w-muted); }
        .ea-rsvp__deadline { margin-top: 1rem; text-align: center; font-size: 0.58rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--w-muted); }
        @media (min-width: 700px) {
            .ea-rsvp__card { padding: 2rem; }
            .ea-rsvp__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .ea-choice { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        .ea-footer { padding-block: 3.5rem; text-align: center; background: var(--w-text); color: var(--w-on-primary); }
        .ea-footer__names { font-family: var(--w-heading-font); font-size: clamp(2rem, 5vw, 3.2rem); line-height: 1.1; }
        .ea-footer__date { margin-top: 0.75rem; font-size: 0.62rem; letter-spacing: 0.24em; text-transform: uppercase; color: color-mix(in srgb, var(--w-on-primary) 65%, transparent); }
        .ea-footer__ornament { margin: 1.4rem auto; color: var(--w-accent); }
        .ea-footer__quote { max-width: 32rem; margin-inline: auto; font-size: 0.86rem; line-height: 1.8; color: color-mix(in srgb, var(--w-on-primary) 68%, transparent); }
        .ea-footer__actions { margin-top: 1.5rem; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; }
        .ea-footer__credit { margin-top: 2.2rem; font-size: 0.52rem; letter-spacing: 0.2em; text-transform: uppercase; color: color-mix(in srgb, var(--w-on-primary) 38%, transparent); }

        .ea-envelope { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1.25rem; overflow: hidden; background: var(--w-text); transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.8s ease; }
        .ea-opened .ea-envelope, .ea-envelope.is-opening { opacity: 0; visibility: hidden; pointer-events: none; }
        .ea-envelope__bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.55; }
        .ea-envelope__veil { position: absolute; inset: 0; background: radial-gradient(120% 100% at 50% 20%, color-mix(in srgb, var(--w-text) 25%, transparent) 0%, color-mix(in srgb, var(--w-text) 88%, transparent) 70%); }
        .ea-envelope__card { position: relative; z-index: 2; width: min(92vw, 33rem); max-height: 88vh; overflow: auto; background: var(--w-surface); color: var(--w-text); border: 1px solid var(--w-line); border-radius: var(--w-card-radius); padding: 2.8rem 1.6rem 2.2rem; text-align: center; box-shadow: 0 40px 100px -30px rgba(0, 0, 0, 0.65); }
        .ea-envelope__card::before { content: ''; position: absolute; inset: 0.55rem; border: 1px solid color-mix(in srgb, var(--w-line) 75%, transparent); border-radius: calc(var(--w-card-radius) * 0.7); pointer-events: none; }
        .ea-envelope__monogram { margin: 1.2rem auto 0; display: flex; align-items: center; justify-content: center; width: 4.4rem; height: 4.4rem; border: 1px solid color-mix(in srgb, var(--w-accent) 45%, transparent); border-radius: 50%; font-family: var(--w-script-font); font-size: 1.7rem; color: var(--w-primary); }
        .ea-envelope__names { margin: 1.2rem 0 0; font-size: clamp(2.2rem, 8vw, 3.4rem); color: var(--w-primary); }
        .ea-envelope__date { margin-top: 0.6rem; }
        .ea-envelope__message { margin: 1.2rem auto 0; max-width: 22rem; font-size: 0.86rem; line-height: 1.8; color: var(--w-muted); }
        .ea-seal { position: relative; display: flex; align-items: center; justify-content: center; width: 5rem; height: 5rem; margin: 1.6rem auto 0; border: 0; border-radius: 50%; background: radial-gradient(circle at 32% 28%, color-mix(in srgb, var(--w-primary) 75%, white), var(--w-primary) 55%, color-mix(in srgb, var(--w-primary) 70%, black)); color: var(--w-on-primary); box-shadow: 0 12px 30px -10px color-mix(in srgb, var(--w-primary) 70%, transparent); cursor: pointer; transition: transform 0.35s ease, box-shadow 0.35s ease; }
        .ea-seal:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 18px 36px -10px color-mix(in srgb, var(--w-primary) 75%, transparent); }
        .ea-seal span { font-family: var(--w-heading-font); font-size: 0.85rem; letter-spacing: 0.12em; text-transform: uppercase; }
        .ea-seal img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .ea-envelope__prompt { margin-top: 0.85rem; font-size: 0.58rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--w-muted); }

        .ea-lightbox { position: fixed; inset: 0; z-index: 120; display: flex; align-items: center; justify-content: center; padding: 1.25rem; background: rgba(12, 9, 7, 0.94); }
        .ea-lightbox[hidden] { display: none; }
        .ea-lightbox__image { max-width: min(92vw, 70rem); max-height: 82vh; object-fit: contain; border-radius: var(--w-card-radius); }
        .ea-lightbox__caption { margin-top: 0.9rem; text-align: center; font-size: 0.68rem; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255, 255, 255, 0.7); }
        .ea-lightbox__close, .ea-lightbox__nav { position: absolute; display: flex; align-items: center; justify-content: center; width: 2.8rem; height: 2.8rem; border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 50%; background: rgba(255, 255, 255, 0.06); color: #fff; cursor: pointer; }
        .ea-lightbox__close { top: 1.25rem; right: 1.25rem; }
        .ea-lightbox__nav--prev { left: 1.25rem; top: 50%; transform: translateY(-50%); }
        .ea-lightbox__nav--next { right: 1.25rem; top: 50%; transform: translateY(-50%); }
        .ea-lightbox__close:hover, .ea-lightbox__nav:hover { background: rgba(255, 255, 255, 0.16); }

        .ea-hide-mobile { display: none !important; }
        @media (min-width: 700px) {
            .ea-hide-mobile { display: block !important; }
            .ea-hide-tablet { display: none !important; }
        }
        @media (min-width: 1024px) {
            .ea-hide-tablet { display: block !important; }
            .ea-hide-desktop { display: none !important; }
        }
        .ea-align-left .ea-intro { margin-inline: 0; text-align: left; }
        .ea-align-left .ea-intro p { margin-inline: 0; }

        .ea-hover-lift { transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease; }
        .ea-hover-lift:hover { transform: translateY(-4px); box-shadow: 0 26px 54px -30px color-mix(in srgb, var(--w-text) 42%, transparent); }
        .ea-hover-zoom .ea-photo, .ea-hover-zoom img.ea-photo { transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .ea-hover-zoom:hover .ea-photo { transform: scale(1.035); }
        .ea-hover-glow { transition: box-shadow 0.45s ease; }
        .ea-hover-glow:hover { box-shadow: 0 0 0 1px color-mix(in srgb, var(--w-accent) 45%, transparent), 0 24px 60px -28px color-mix(in srgb, var(--w-accent) 38%, transparent); }

        body.ea-hover-lift-on .ea-card {
            transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease;
        }
        body.ea-hover-lift-on .ea-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 28px 60px -38px color-mix(in srgb, var(--w-primary) 70%, transparent);
        }
        body.ea-hover-lift-on .ea-btn {
            transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease, color 0.25s ease;
        }
        body.ea-hover-lift-on .ea-btn:hover { transform: translateY(-2px); }
        body.ea-image-zoom-on .ea-photo {
            transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        body.ea-image-zoom-on a:hover .ea-photo,
        body.ea-image-zoom-on button:hover .ea-photo { transform: scale(1.04); }

        .ea-hero__bg { will-change: transform; }

        [data-ea-animation] { will-change: opacity, transform, filter; }
        .ea-anim-ready [data-ea-animation] { opacity: 0; }
        .ea-anim-ready [data-ea-animation="fade_up"], .ea-anim-ready [data-ea-animation="fade"] { transform: translateY(var(--ea-distance, 40px)); }
        .ea-anim-ready [data-ea-animation="stagger"] { transform: translateY(var(--ea-distance, 24px)); }
        .ea-anim-ready [data-ea-animation="zoom"] { transform: scale(var(--ea-scale, 0.94)); }
        .ea-anim-ready [data-ea-animation="slide"][data-ea-direction="up"] { transform: translateY(var(--ea-distance, 56px)); }
        .ea-anim-ready [data-ea-animation="slide"][data-ea-direction="down"] { transform: translateY(calc(var(--ea-distance, 56px) * -1)); }
        .ea-anim-ready [data-ea-animation="slide"][data-ea-direction="left"] { transform: translateX(calc(var(--ea-distance, 56px) * -1)); }
        .ea-anim-ready [data-ea-animation="slide"][data-ea-direction="right"] { transform: translateX(var(--ea-distance, 56px)); }
        .ea-anim-ready [data-ea-animation="parallax"], .ea-anim-ready [data-ea-animation="envelope"] { transform: translateY(var(--ea-distance, 28px)); }
        .ea-anim-ready [data-ea-animation].is-visible {
            opacity: 1;
            transform: none;
            transition:
                opacity var(--ea-duration, 0.8s) var(--ea-ease, cubic-bezier(0.16, 1, 0.3, 1)) var(--ea-delay, 0.05s),
                transform var(--ea-duration, 0.8s) var(--ea-ease, cubic-bezier(0.16, 1, 0.3, 1)) var(--ea-delay, 0.05s);
        }

        @media (prefers-reduced-motion: reduce) {
            html { scroll-behavior: auto; }
            .ea-anim-ready [data-ea-animation] { opacity: 1 !important; transform: none !important; }
            *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }

        @media print {
            .ea-nav, .ea-envelope, .ea-lightbox, .ea-scroll { display: none !important; }
            .ea-hero { min-height: auto; padding-block: 3rem; }
            body { background: #fff; }
        }

        {!! $config['custom_css'] ?? '' !!}
    </style>
</head>
<body class="{{ implode(' ', $bodyClasses) }}">
@if($pageBackground)
    <div class="ea-page-bg" aria-hidden="true">
        <img src="{{ $pageBackground }}" alt="">
        <span style="background: rgba(12, 9, 7, {{ $pageOverlay }})"></span>
    </div>
@endif
@if($scrollProgress)
    <div class="ea-progress" data-ea-progress aria-hidden="true"></div>
@endif
@if($cursorGlow)
    <div class="ea-cursor" data-ea-cursor aria-hidden="true"></div>
@endif
@if($envelopeEnabled)
    <div class="ea-envelope" data-ea-envelope>
        @if($envelopeCover)
            <img class="ea-envelope__bg" src="{{ $envelopeCover }}" alt="">
        @endif
        <div class="ea-envelope__veil"></div>
        <div class="ea-envelope__card">
            <p class="ea-eyebrow">{{ $couple['families'] ?? 'Together with their families' }}</p>
            <div class="ea-envelope__monogram">{{ $envelope['monogram'] ?: ($invitation['monogram'] ?: 'E&') }}</div>
            <h1 class="ea-display ea-envelope__names">{{ $names }}</h1>
            <p class="ea-eyebrow ea-envelope__date">{{ $event['formatted'] ?? '' }}</p>
            @if($envelope['card_message'])
                <p class="ea-envelope__message">{{ $envelope['card_message'] }}</p>
            @endif
            <button type="button" class="ea-seal" data-ea-open aria-label="{{ $envelope['prompt'] ?? 'Open the invitation' }}">
                @if($envelope['seal_image']['url'] ?? null)
                    <img src="{{ $envelope['seal_image']['url'] }}" alt="">
                @else
                    <span>{{ $envelope['seal_text'] ?: 'Open' }}</span>
                @endif
            </button>
            <p class="ea-envelope__prompt">{{ $envelope['prompt'] ?? 'Open the invitation' }}</p>
        </div>
    </div>
@endif

<div class="ea-site" id="top">
    <header class="ea-nav {{ $hasHero ? 'ea-nav--over-hero' : '' }}" data-ea-nav>
        <div class="ea-container ea-nav__inner">
            <a href="#top" class="ea-nav__brand">{{ $invitation['monogram'] ?: $names }}</a>
            <nav class="ea-nav__links" aria-label="Invitation sections">
                @foreach($navItems as $item)
                    <a href="#{{ $item['id'] }}">{{ $item['label'] }}</a>
                @endforeach
                @if($rsvpId)
                    <a href="#{{ $rsvpId }}" class="ea-nav__rsvp">RSVP</a>
                @endif
            </nav>
            <button type="button" class="ea-nav__toggle" data-ea-menu-toggle aria-label="Open menu" aria-expanded="false">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            </button>
        </div>
        <div class="ea-mobile-menu" data-ea-menu>
            @foreach($navItems as $item)
                <a href="#{{ $item['id'] }}">{{ $item['label'] }}</a>
            @endforeach
            @if($rsvpId)
                <a href="#{{ $rsvpId }}">RSVP</a>
            @endif
        </div>
    </header>

    <main>
        @foreach($visibleSections as $index => $section)
            @php
                $sectionType = $section['type'] ?? 'text';
                $sectionId = 'ea-'.$sectionType.'-'.$index;
                $content = $section['content'] ?? [];
                $designMeta = is_array($section['design'] ?? null) ? $section['design'] : [];
                $animation = $section['animation'] ?? null;
                $animEnabled = (bool) ($animation['enabled'] ?? false) && ($effects['scroll_reveal'] ?? true);
                $animType = $animation['preset_type'] ?? 'fade_up';
                $animConfig = $animation['config'] ?? [];
                $easing = $easeMap[$animConfig['easing'] ?? 'easeOut'] ?? $easeMap['easeOut'];
                $distance = $num($animConfig['distance'] ?? null, 40, 0, 160);
                $scale = $num($animConfig['scale'] ?? null, 0.94, 0.8, 1.2);
                $duration = $num($animConfig['duration'] ?? null, 0.8, 0.2, 5);
                $delay = $num($animConfig['delay'] ?? null, 0.05, 0, 3);
                $once = ($animConfig['once'] ?? true) ? '1' : '0';
                $parallax = $num($animConfig['parallax'] ?? null, 0.18, 0, 0.6);
                $sectionClasses = [];
                $hoverEffect = $designMeta['hover_effect'] ?? null;
                if (in_array($hoverEffect, ['lift', 'zoom', 'glow'], true)) {
                    $sectionClasses[] = 'ea-hover-'.$hoverEffect;
                }
                if (! empty($designMeta['hide_on_mobile'])) {
                    $sectionClasses[] = 'ea-hide-mobile';
                }
                if (! empty($designMeta['hide_on_tablet'])) {
                    $sectionClasses[] = 'ea-hide-tablet';
                }
                if (! empty($designMeta['hide_on_desktop'])) {
                    $sectionClasses[] = 'ea-hide-desktop';
                }
                if (($designMeta['align'] ?? null) === 'left') {
                    $sectionClasses[] = 'ea-align-left';
                }
                $sectionStyles = [];
                if (! empty($designMeta['background_color']) || ! empty($designMeta['background_image']['url'])) {
                    $sectionStyles[] = '--ea-section-bg:transparent';
                }
                if (! empty($designMeta['background_color'])) {
                    $sectionStyles[] = 'background-color:'.\App\Support\ExportMarkup::cssValue($designMeta['background_color']);
                }
                if (! empty($designMeta['text_color'])) {
                    $sectionStyles[] = 'color:'.\App\Support\ExportMarkup::cssValue($designMeta['text_color']);
                }
                if (is_numeric($designMeta['padding_y'] ?? null)) {
                    $sectionStyles[] = '--ea-section-pad:'.max(0, min(240, (int) $designMeta['padding_y'])).'px';
                }
                if (is_numeric($designMeta['max_width'] ?? null)) {
                    $sectionStyles[] = '--ea-content-max:'.max(480, min(1600, (int) $designMeta['max_width'])).'px';
                }
                if (! empty($designMeta['background_image']['url'])) {
                    $overlay = $num($designMeta['overlay'] ?? null, 0.35, 0, 0.9);
                    $sectionStyles[] = 'background-image:linear-gradient(rgba(12,9,7,'.$overlay.'),rgba(12,9,7,'.$overlay.')),'.\App\Support\ExportMarkup::cssUrl($designMeta['background_image']['url']);
                    $sectionStyles[] = 'background-size:cover';
                    $sectionStyles[] = 'background-position:center';
                }
                $animStyle = '--ea-duration:'.$duration.'s;--ea-delay:'.$delay.'s;--ea-ease:'.$easing.';--ea-distance:'.$distance.'px;--ea-scale:'.$scale.';';
            @endphp
            <div id="{{ $sectionId }}" class="ea-section-wrap {{ implode(' ', $sectionClasses) }}" style="{{ implode(';', $sectionStyles) }}" data-ea-section @if($animEnabled && $animType === 'parallax') data-ea-parallax="{{ $parallax }}" @endif>
                @if($animEnabled)
                    <div class="ea-reveal" data-ea-animation="{{ $animType }}" data-ea-direction="{{ $animConfig['direction'] ?? 'up' }}" data-ea-once="{{ $once }}" style="{{ $animStyle }}">
                        @include('exports.partials.section', ['section' => $section, 'sectionId' => $sectionId, 'content' => $content, 'invitation' => $invitation, 'design' => $design, 'theme' => $theme, 'events' => $events, 'cover' => $cover, 'rsvpId' => $rsvpId, 'apiBase' => $api_base])
                    </div>
                @else
                    @include('exports.partials.section', ['section' => $section, 'sectionId' => $sectionId, 'content' => $content, 'invitation' => $invitation, 'design' => $design, 'theme' => $theme, 'events' => $events, 'cover' => $cover, 'rsvpId' => $rsvpId, 'apiBase' => $api_base])
                @endif
            </div>
        @endforeach
    </main>

    <footer class="ea-footer">
        <div class="ea-container">
            <p class="ea-footer__names">{{ $names }}</p>
            <p class="ea-footer__date">{{ $event['formatted'] ?? '' }}</p>
            <div class="ea-footer__ornament">{!! \App\Support\ExportMarkup::ornament($ornaments['divider'] ?? 'botanical', 96) !!}</div>
            @if($couple['quote'] ?? null)
                <p class="ea-footer__quote">“{{ $couple['quote'] }}”</p>
            @endif
            <div class="ea-footer__actions">
                @if($rsvpId)
                    <a href="#{{ $rsvpId }}" class="ea-btn ea-btn--white">RSVP</a>
                @endif
                @if($event['iso'] ?? null)
                    <a href="{{ \App\Support\ExportMarkup::calendarUrl($event, $names.' — Wedding', $couple['message'] ?? null, $invitation['venue']['name'] ?? null) }}" target="_blank" rel="noreferrer" class="ea-btn ea-btn--light">Add to calendar</a>
                @endif
            </div>
            <p class="ea-footer__credit">Made with {{ $site_name ?? 'Ever After Studio' }}</p>
        </div>
    </footer>
</div>

<div class="ea-lightbox" data-ea-lightbox hidden>
    <button type="button" class="ea-lightbox__close" data-ea-lightbox-close aria-label="Close gallery">×</button>
    <button type="button" class="ea-lightbox__nav ea-lightbox__nav--prev" data-ea-lightbox-prev aria-label="Previous photograph">‹</button>
    <div>
        <img class="ea-lightbox__image" data-ea-lightbox-image src="" alt="">
        <p class="ea-lightbox__caption" data-ea-lightbox-caption></p>
    </div>
    <button type="button" class="ea-lightbox__nav ea-lightbox__nav--next" data-ea-lightbox-next aria-label="Next photograph">›</button>
</div>

<script>
    (function () {
        'use strict';

        const root = document.documentElement;
        const body = document.body;
        const config = {
            apiBase: @json($api_base),
            slug: @json($invitation['slug']),
            guestCode: new URLSearchParams(window.location.search).get('guest') || '',
            rsvpOpen: @json((bool) ($rsvp['open'] ?? true)),
            requireGuestCode: @json((bool) ($rsvp['require_guest_code'] ?? false)),
            collectPhone: @json((bool) ($rsvp['collect_phone'] ?? true)),
            allowDecline: @json((bool) ($rsvp['allow_decline'] ?? true)),
            maxGuests: @json((int) ($rsvp['max_guests_per_submission'] ?? 6)),
            successMessage: @json($rsvp['success_message'] ?? null),
        };

        const envelope = document.querySelector('[data-ea-envelope]');
        if (envelope && !root.classList.contains('ea-opened')) {
            body.classList.add('ea-locked');
        }

        const openEnvelope = function (instant) {
            const envelope = document.querySelector('[data-ea-envelope]');
            if (!envelope) return;
            envelope.classList.add('is-opening');
            body.classList.remove('ea-locked');
            try { sessionStorage.setItem('ea-opened:{{ $invitation['slug'] }}', '1'); } catch (e) {}
            if (instant) {
                envelope.style.display = 'none';
            }
        };

        if (config.guestCode) {
            openEnvelope(true);
        }

        const openButton = document.querySelector('[data-ea-open]');
        if (openButton) {
            openButton.addEventListener('click', function () { openEnvelope(false); });
        }

        const nav = document.querySelector('[data-ea-nav]');
        const onScroll = function () {
            if (!nav) return;
            nav.classList.toggle('ea-nav--scrolled', window.scrollY > 24);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        const progressBar = document.querySelector('[data-ea-progress]');
        if (progressBar) {
            const updateProgress = function () {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                progressBar.style.width = (max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0) + '%';
            };
            updateProgress();
            window.addEventListener('scroll', updateProgress, { passive: true });
            window.addEventListener('resize', updateProgress);
        }

        const cursorGlow = document.querySelector('[data-ea-cursor]');
        if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
            window.addEventListener('pointermove', function (event) {
                cursorGlow.style.setProperty('--ea-cursor-x', event.clientX + 'px');
                cursorGlow.style.setProperty('--ea-cursor-y', event.clientY + 'px');
            }, { passive: true });
        }

        const menuToggle = document.querySelector('[data-ea-menu-toggle]');
        const menu = document.querySelector('[data-ea-menu]');
        if (menuToggle && menu) {
            menuToggle.addEventListener('click', function () {
                const isOpen = menu.classList.toggle('is-open');
                menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            });
            menu.querySelectorAll('a').forEach(function (link) {
                link.addEventListener('click', function () {
                    menu.classList.remove('is-open');
                    menuToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const revealItems = Array.from(document.querySelectorAll('[data-ea-animation]'));
        if (!reduceMotion && 'IntersectionObserver' in window && revealItems.length) {
            root.classList.add('ea-anim-ready');
            const observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    if (entry.target.getAttribute('data-ea-once') === '1') {
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
            revealItems.forEach(function (item) { observer.observe(item); });
        } else {
            revealItems.forEach(function (item) { item.classList.add('is-visible'); });
        }

        const heroParallax = document.querySelector('[data-ea-hero-parallax]');
        const heroParallaxImage = heroParallax ? heroParallax.querySelector('.ea-hero__bg') : null;
        if (!reduceMotion && heroParallax && heroParallaxImage) {
            const updateHeroParallax = function () {
                const viewport = window.innerHeight || 1;
                const rect = heroParallax.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > viewport) return;
                const progress = (rect.top + rect.height / 2 - viewport / 2) / viewport;
                heroParallaxImage.style.transform = 'translate3d(0,' + (progress * 34).toFixed(2) + 'px,0) scale(1.08)';
            };
            updateHeroParallax();
            window.addEventListener('scroll', updateHeroParallax, { passive: true });
        }

        const parallaxItems = Array.from(document.querySelectorAll('[data-ea-parallax]'));
        if (!reduceMotion && parallaxItems.length) {
            const updateParallax = function () {
                const viewport = window.innerHeight || 1;
                parallaxItems.forEach(function (item) {
                    const rect = item.getBoundingClientRect();
                    if (rect.bottom < 0 || rect.top > viewport) return;
                    const progress = (rect.top + rect.height / 2 - viewport / 2) / viewport;
                    const intensity = parseFloat(item.getAttribute('data-ea-parallax')) || 0.18;
                    item.style.transform = 'translate3d(0,' + (progress * intensity * 80).toFixed(2) + 'px,0)';
                });
            };
            updateParallax();
            window.addEventListener('scroll', updateParallax, { passive: true });
        }

        const countdowns = Array.from(document.querySelectorAll('[data-ea-countdown]'));
        if (countdowns.length) {
            const pad = function (value) { return String(value).padStart(2, '0'); };
            const tick = function () {
                const now = Date.now();
                countdowns.forEach(function (node) {
                    const target = new Date(node.getAttribute('data-target')).getTime();
                    if (!Number.isFinite(target)) return;
                    const diff = Math.max(0, target - now);
                    const days = Math.floor(diff / 86400000);
                    const hours = Math.floor((diff % 86400000) / 3600000);
                    const minutes = Math.floor((diff % 3600000) / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);
                    const set = function (key, value) {
                        const el = node.querySelector('[data-ea-' + key + ']');
                        if (el) el.textContent = value;
                    };
                    set('days', pad(days));
                    set('hours', pad(hours));
                    set('minutes', pad(minutes));
                    set('seconds', pad(seconds));
                    if (diff === 0) {
                        const complete = node.getAttribute('data-complete');
                        if (complete) {
                            node.innerHTML = '<p class="ea-body" style="margin:0;text-align:center">' + complete.replace(/</g, '&lt;') + '</p>';
                        }
                    }
                });
            };
            tick();
            window.setInterval(tick, 1000);
        }

        const lightbox = document.querySelector('[data-ea-lightbox]');
        const lightboxImage = document.querySelector('[data-ea-lightbox-image]');
        const lightboxCaption = document.querySelector('[data-ea-lightbox-caption]');
        let lightboxItems = [];
        let lightboxIndex = 0;

        const renderLightbox = function () {
            if (!lightbox || !lightboxItems.length) return;
            const item = lightboxItems[lightboxIndex];
            lightboxImage.src = item.src;
            lightboxImage.alt = item.alt || '';
            lightboxCaption.textContent = item.caption || '';
        };
        const closeLightbox = function () {
            if (!lightbox) return;
            lightbox.hidden = true;
            body.classList.remove('ea-locked');
        };
        document.addEventListener('click', function (event) {
            const trigger = event.target.closest('[data-ea-lightbox-src]');
            if (trigger) {
                event.preventDefault();
                lightboxItems = Array.from(document.querySelectorAll('[data-ea-lightbox-src]')).map(function (node) {
                    return {
                        src: node.getAttribute('data-ea-lightbox-src'),
                        alt: node.getAttribute('data-ea-lightbox-alt') || '',
                        caption: node.getAttribute('data-ea-lightbox-caption') || '',
                    };
                });
                lightboxIndex = Math.max(0, lightboxItems.findIndex(function (item) { return item.src === trigger.getAttribute('data-ea-lightbox-src'); }));
                renderLightbox();
                lightbox.hidden = false;
                body.classList.add('ea-locked');
                return;
            }
            if (event.target.closest('[data-ea-lightbox-close]')) { closeLightbox(); return; }
            if (event.target.closest('[data-ea-lightbox-prev]')) {
                lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
                renderLightbox();
                return;
            }
            if (event.target.closest('[data-ea-lightbox-next]')) {
                lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
                renderLightbox();
            }
        });
        document.addEventListener('keydown', function (event) {
            if (!lightbox || lightbox.hidden) return;
            if (event.key === 'Escape') closeLightbox();
            if (event.key === 'ArrowLeft') { lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length; renderLightbox(); }
            if (event.key === 'ArrowRight') { lightboxIndex = (lightboxIndex + 1) % lightboxItems.length; renderLightbox(); }
        });

        const rsvpForm = document.querySelector('[data-ea-rsvp]');
        if (rsvpForm) {
            const errorBox = rsvpForm.querySelector('[data-ea-rsvp-error]');
            const successBox = document.querySelector('[data-ea-rsvp-success]');
            const codeInput = rsvpForm.querySelector('[data-ea-guest-code]');
            const verifyButton = rsvpForm.querySelector('[data-ea-verify-code]');
            const codeMessage = rsvpForm.querySelector('[data-ea-code-message]');
            const nameInput = rsvpForm.querySelector('[name="guest_name"]');
            const countSelect = rsvpForm.querySelector('[name="guest_count"]');
            const attendanceInputs = rsvpForm.querySelectorAll('[name="attendance"]');
            const countWrap = rsvpForm.querySelector('[data-ea-count-wrap]');
            let verifiedGuest = null;

            const setError = function (message) {
                if (!errorBox) return;
                errorBox.textContent = message || '';
                errorBox.hidden = !message;
            };

            const verifyCode = async function (code) {
                if (!code) return;
                if (codeMessage) codeMessage.textContent = 'Checking…';
                try {
                    const response = await fetch(config.apiBase + '/public/invitations/' + encodeURIComponent(config.slug) + '/guest-code/' + encodeURIComponent(code), {
                        headers: { 'Accept': 'application/json' },
                    });
                    const payload = await response.json().catch(function () { return {}; });
                    if (!response.ok) throw new Error(payload.message || 'That guest code was not recognised.');
                    verifiedGuest = payload.data;
                    if (nameInput) nameInput.value = verifiedGuest.name || '';
                    if (countSelect) {
                        const max = Math.max(1, verifiedGuest.max_guests || config.maxGuests);
                        countSelect.innerHTML = '';
                        for (let i = 1; i <= max; i += 1) {
                            const option = document.createElement('option');
                            option.value = String(i);
                            option.textContent = i + (i === 1 ? ' guest (including you)' : ' guests (including you)');
                            countSelect.appendChild(option);
                        }
                    }
                    if (codeMessage) codeMessage.textContent = 'Welcome, ' + (verifiedGuest.first_name || verifiedGuest.name) + (verifiedGuest.already_responded ? ' — submitting again will update your reply.' : '.');
                } catch (error) {
                    verifiedGuest = null;
                    if (codeMessage) codeMessage.textContent = error.message || 'That guest code was not recognised.';
                }
            };

            if (codeInput && config.guestCode) {
                codeInput.value = config.guestCode.toUpperCase();
                verifyCode(config.guestCode);
            }
            if (verifyButton && codeInput) {
                verifyButton.addEventListener('click', function () { verifyCode(codeInput.value.trim()); });
            }
            if (attendanceInputs.length && countWrap) {
                const syncCount = function () {
                    const selected = rsvpForm.querySelector('[name="attendance"]:checked');
                    countWrap.hidden = selected && selected.value === 'declined';
                };
                attendanceInputs.forEach(function (input) { input.addEventListener('change', syncCount); });
                syncCount();
            }

            rsvpForm.addEventListener('submit', async function (event) {
                event.preventDefault();
                setError('');
                const formData = new FormData(rsvpForm);
                const attendance = formData.get('attendance') || 'attending';
                const payload = {
                    guest_name: (formData.get('guest_name') || '').trim(),
                    email: (formData.get('email') || '').trim() || null,
                    phone: config.collectPhone ? ((formData.get('phone') || '').trim() || null) : null,
                    attendance: attendance,
                    guest_count: attendance === 'declined' ? 1 : Number(formData.get('guest_count') || 1),
                    message: (formData.get('message') || '').trim() || null,
                    answers: {},
                };
                if (codeInput && codeInput.value.trim()) {
                    payload.guest_code = codeInput.value.trim().toUpperCase();
                }
                if (!payload.guest_name) {
                    setError('Please tell us your name.');
                    return;
                }
                rsvpForm.querySelectorAll('[data-ea-question]').forEach(function (field) {
                    if (field.value && field.value.trim()) {
                        payload.answers[field.getAttribute('data-ea-question')] = field.value.trim();
                    }
                });
                const submit = rsvpForm.querySelector('[type="submit"]');
                if (submit) { submit.disabled = true; submit.dataset.original = submit.textContent; submit.textContent = 'Sending…'; }
                try {
                    const response = await fetch(config.apiBase + '/public/invitations/' + encodeURIComponent(config.slug) + '/rsvp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    const body = await response.json().catch(function () { return {}; });
                    if (!response.ok) {
                        const errors = body.errors || {};
                        const first = Object.keys(errors).map(function (key) { return errors[key][0]; })[0];
                        throw new Error(first || body.message || 'We could not send your reply. Please try again.');
                    }
                    rsvpForm.hidden = true;
                    if (successBox) {
                        successBox.hidden = false;
                        const message = successBox.querySelector('[data-ea-success-message]');
                        if (message) message.textContent = rsvpForm.getAttribute('data-success-message') || config.successMessage || 'Your response has been received with love.';
                        const summary = successBox.querySelector('[data-ea-success-summary]');
                        if (summary) summary.textContent = payload.guest_name + ' — ' + (payload.attendance === 'declined' ? 'Sending love from afar' : 'Joyfully attending — ' + payload.guest_count + (payload.guest_count === 1 ? ' guest' : ' guests'));
                        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                } catch (error) {
                    setError(error.message || 'We could not send your reply. Please try again.');
                } finally {
                    if (submit) { submit.disabled = false; submit.textContent = submit.dataset.original || 'Send my RSVP'; }
                }
            });
        }
    })();
</script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
