<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Font registry
    |--------------------------------------------------------------------------
    | Only fonts listed here may be referenced by a theme. The frontend maps
    | these names to self-hosted/Google font families in its font registry.
    */
    'fonts' => [
        'Cormorant Garamond', 'Playfair Display', 'EB Garamond', 'Cinzel',
        'Lora', 'Libre Baskerville', 'Great Vibes', 'Pinyon Script', 'Allura',
        'Jost', 'Inter', 'Montserrat', 'Source Sans 3', 'Manrope', 'DM Sans',
    ],

    'default_theme_tokens' => [
        'colors' => [
            'primary' => '#4a1f2c',
            'secondary' => '#6d6b4e',
            'accent' => '#b99358',
            'surface' => '#f7f1e6',
            'surfaceAlt' => '#efe5d5',
            'text' => '#2c211b',
            'muted' => '#6f6154',
            'line' => 'rgba(74, 31, 44, 0.18)',
            'onPrimary' => '#fffaf2',
        ],
        'typography' => [
            'headingFont' => 'Cormorant Garamond',
            'bodyFont' => 'Jost',
            'scriptFont' => 'Great Vibes',
            'baseSize' => 16,
            'headingWeight' => 500,
            'bodyWeight' => 400,
            'headingScale' => 1.5,
            'bodyLineHeight' => 1.75,
            'letterSpacing' => 0.02,
        ],
        'surfaces' => [
            'pageBackground' => '#f7f1e6',
            'cardBackground' => 'rgba(255, 251, 244, 0.72)',
            'cardBorder' => 'rgba(74, 31, 44, 0.16)',
            'cardRadius' => 4,
            'paperTexture' => 'grain',
            'paperTextureOpacity' => 0.32,
            'shadow' => 'soft',
            'sectionSpacing' => 96,
            'contentWidth' => 1160,
        ],
        'buttons' => [
            'radius' => 999,
            'style' => 'outline',
            'letterSpacing' => 0.14,
            'textTransform' => 'uppercase',
        ],
        'ornaments' => [
            'divider' => 'botanical',
            'corner' => 'branch',
            'overlayMediaId' => null,
        ],
        'layout' => [
            'imageAspect' => '4/5',
            'gallery' => 'masonry',
            'align' => 'center',
        ],
        'animation' => [
            'preset' => 'fade-up',
            'disabled' => false,
        ],
    ],

    'animation' => [
        'duration' => 0.8,
        'delay' => 0.05,
        'easing' => 'easeOut',
        'distance' => 40,
        'scale' => 1,
        'stagger' => 0.12,
        'once' => true,
        'direction' => 'up',
        'parallax' => 0.18,
        'mobile' => true,
        'reduced_motion' => 'fade',
    ],

    'theme_presets' => [
        'blue-toile' => [
            'name' => 'Blue Toile',
            'description' => 'Ivory paper with delicate blue botanicals and collectible porcelain charm.',
            'colors' => ['primary' => '#2f4a68', 'secondary' => '#7893a8', 'accent' => '#b98a4d', 'surface' => '#f6f3ea', 'surfaceAlt' => '#e8eef2', 'text' => '#1f2c39', 'muted' => '#5e7080', 'line' => 'rgba(47, 74, 104, 0.18)', 'onPrimary' => '#fbf8f0'],
            'typography' => ['headingFont' => 'Cormorant Garamond', 'bodyFont' => 'Jost', 'scriptFont' => 'Pinyon Script'],
            'surfaces' => ['pageBackground' => '#f6f3ea', 'paperTexture' => 'linen', 'paperTextureOpacity' => 0.4, 'shadow' => 'soft'],
            'ornaments' => ['divider' => 'botanical', 'corner' => 'floral'],
            'animation' => ['preset' => 'soft-zoom'],
        ],
        'burgundy-olive' => [
            'name' => 'Burgundy & Olive',
            'description' => 'Deep burgundy, muted olive and antique gold for an editorial, romantic celebration.',
            'colors' => ['primary' => '#4a1f2c', 'secondary' => '#6d6b4e', 'accent' => '#b99358', 'surface' => '#f4eee1', 'surfaceAlt' => '#e8dfcc', 'text' => '#2c211b', 'muted' => '#75675a', 'line' => 'rgba(74, 31, 44, 0.18)', 'onPrimary' => '#fffaf2'],
            'typography' => ['headingFont' => 'Cormorant Garamond', 'bodyFont' => 'Jost', 'scriptFont' => 'Great Vibes'],
            'surfaces' => ['pageBackground' => '#f4eee1', 'paperTexture' => 'grain', 'paperTextureOpacity' => 0.35, 'shadow' => 'soft'],
            'ornaments' => ['divider' => 'botanical', 'corner' => 'branch'],
            'animation' => ['preset' => 'fade-up'],
        ],
        'brown-ivory' => [
            'name' => 'Brown & Ivory',
            'description' => 'Warm cocoa, vintage paper and a hand-pressed wax seal.',
            'colors' => ['primary' => '#4b3527', 'secondary' => '#8c6f54', 'accent' => '#c2a077', 'surface' => '#f3ecdd', 'surfaceAlt' => '#e9ddc9', 'text' => '#33251c', 'muted' => '#7c6858', 'line' => 'rgba(75, 53, 39, 0.2)', 'onPrimary' => '#fbf6ec'],
            'typography' => ['headingFont' => 'Playfair Display', 'bodyFont' => 'Lora', 'scriptFont' => 'Allura'],
            'surfaces' => ['pageBackground' => '#f3ecdd', 'paperTexture' => 'grain', 'paperTextureOpacity' => 0.5, 'shadow' => 'deep'],
            'ornaments' => ['divider' => 'diamond', 'corner' => 'branch'],
            'animation' => ['preset' => 'slide-in'],
        ],
        'sage-cream' => [
            'name' => 'Sage & Cream',
            'description' => 'Quiet garden greens, warm cream and loose botanical linework.',
            'colors' => ['primary' => '#53604a', 'secondary' => '#8b9a7b', 'accent' => '#b79c6b', 'surface' => '#f7f2e7', 'surfaceAlt' => '#e9e8d8', 'text' => '#2f352c', 'muted' => '#6e7666', 'line' => 'rgba(83, 96, 74, 0.2)', 'onPrimary' => '#fcf9f1'],
            'typography' => ['headingFont' => 'EB Garamond', 'bodyFont' => 'Manrope', 'scriptFont' => 'Allura'],
            'surfaces' => ['pageBackground' => '#f7f2e7', 'paperTexture' => 'linen', 'paperTextureOpacity' => 0.28, 'shadow' => 'soft'],
            'ornaments' => ['divider' => 'botanical', 'corner' => 'branch'],
            'animation' => ['preset' => 'stagger-reveal'],
        ],
        'blush-floral' => [
            'name' => 'Blush Floral',
            'description' => 'Pale blush, rose ink and romantic floral accents.',
            'colors' => ['primary' => '#8b4f52', 'secondary' => '#b98284', 'accent' => '#c6a26a', 'surface' => '#fbf2ed', 'surfaceAlt' => '#f3e3dc', 'text' => '#3d2a2a', 'muted' => '#82676a', 'line' => 'rgba(139, 79, 82, 0.18)', 'onPrimary' => '#fff9f5'],
            'typography' => ['headingFont' => 'Cormorant Garamond', 'bodyFont' => 'DM Sans', 'scriptFont' => 'Pinyon Script'],
            'surfaces' => ['pageBackground' => '#fbf2ed', 'paperTexture' => 'plain', 'paperTextureOpacity' => 0.18, 'shadow' => 'soft'],
            'ornaments' => ['divider' => 'botanical', 'corner' => 'floral'],
            'animation' => ['preset' => 'fade-up'],
        ],
        'black-gold' => [
            'name' => 'Black & Gold',
            'description' => 'Inky midnight surfaces, luminous gold detail and cinematic contrast.',
            'colors' => ['primary' => '#c8a564', 'secondary' => '#8c794f', 'accent' => '#e6cf9a', 'surface' => '#11100e', 'surfaceAlt' => '#1c1915', 'text' => '#f1e8d6', 'muted' => '#b7aa94', 'line' => 'rgba(200, 165, 100, 0.26)', 'onPrimary' => '#171410'],
            'typography' => ['headingFont' => 'Cinzel', 'bodyFont' => 'Montserrat', 'scriptFont' => 'Great Vibes'],
            'surfaces' => ['pageBackground' => '#11100e', 'cardBackground' => 'rgba(29, 25, 20, 0.78)', 'cardBorder' => 'rgba(200, 165, 100, 0.28)', 'paperTexture' => 'plain', 'paperTextureOpacity' => 0.12, 'shadow' => 'deep'],
            'ornaments' => ['divider' => 'diamond', 'corner' => 'none'],
            'animation' => ['preset' => 'parallax'],
        ],
    ],

    'section_types' => [
        'hero', 'story', 'events', 'gallery', 'countdown', 'venue', 'rsvp',
        'text', 'quote', 'wedding_party', 'gifts', 'travel', 'video',
        'contact', 'image_text', 'divider',
    ],

    'default_rsvp_settings' => [
        'enabled' => true,
        'deadline' => null,
        'max_guests_per_submission' => 6,
        'allow_decline' => true,
        'require_guest_code' => false,
        'collect_phone' => true,
        'questions' => [],
        'success_message' => 'Thank you — your response has been received. We cannot wait to celebrate with you.',
    ],

    'upload' => [
        'max_kb' => 10240,
        'mime_types' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ],
];
