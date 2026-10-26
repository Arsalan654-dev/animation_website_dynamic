@php
    $couple = $invitation['couple'] ?? [];
    $event = $invitation['event'] ?? null;
    $venue = $invitation['venue'] ?? [];
    $rsvp = $invitation['rsvp'] ?? [];
    $names = trim(($couple['partner_one'] ?? '').' & '.($couple['partner_two'] ?? ''));
    $monogram = $invitation['monogram'] ?: 'E&';
    $divider = $theme['ornaments']['divider'] ?? 'botanical';
    $corner = $theme['ornaments']['corner'] ?? 'branch';
    $sectionType = $section['type'] ?? 'text';
    $content = $section['content'] ?? [];
@endphp

@switch($sectionType)
    @case('hero')
        @php
            $background = $content['background']['url'] ?? $cover;
            $overlay = is_numeric($content['overlay_opacity'] ?? null) ? max(0, min(0.9, (float) $content['overlay_opacity'])) : 0.4;
            $heading = $content['heading'] ?? $names;
            $ctaHref = $content['primary_cta']['href'] ?? ($rsvpId ? '#'.$rsvpId : '#');
            $heroParallax = (bool) ($design['design_config']['effects']['parallax'] ?? false);
        @endphp
        <section class="ea-hero" @if($heroParallax && $background) data-ea-hero-parallax @endif>
            @if($background)
                <img class="ea-hero__bg ea-photo" src="{{ $background }}" alt="{{ $content['background']['alt'] ?? '' }}">
            @else
                <div class="ea-hero__gradient"></div>
            @endif
            <div class="ea-hero__overlay" style="background: linear-gradient(180deg, rgba(18,12,10,{{ min($overlay + 0.14, 0.86) }}) 0%, rgba(18,12,10,{{ $overlay }}) 42%, rgba(18,12,10,{{ min($overlay + 0.32, 0.92) }}) 100%)"></div>
            @if($corner !== 'none')
                <div class="ea-corner ea-corner--tl">{!! \App\Support\ExportMarkup::cornerBranch() !!}</div>
                <div class="ea-corner ea-corner--tr">{!! \App\Support\ExportMarkup::cornerBranch() !!}</div>
            @endif
            <div class="ea-hero__content">
                <p class="ea-eyebrow ea-hero__eyebrow">{{ $content['eyebrow'] ?? $couple['title'] ?? 'Together with their families' }}</p>
                <h1 class="ea-display ea-hero__name">{{ $heading }}</h1>
                <div style="margin-top: 1.4rem;">
                    {!! \App\Support\ExportMarkup::ornament($divider, 130) !!}
                </div>
                <p class="ea-hero__sub">{{ $content['subheading'] ?? $couple['subtitle'] ?? 'invite you to celebrate their wedding' }}</p>
                <div class="ea-hero__meta">
                    <span>{{ $content['date_label'] ?? $event['formatted'] ?? '' }}</span>
                    <i></i>
                    <span>{{ $venue['name'] ?? '' }}</span>
                </div>
                @if(($content['show_countdown'] ?? false) && ($event['iso'] ?? null))
                    <div style="margin-top: 2rem;">
                        <div class="ea-countdown ea-countdown--compact" data-ea-countdown data-target="{{ $event['iso'] }}">
                            <div class="ea-countdown__unit"><span class="ea-countdown__value" data-ea-days>00</span><span class="ea-countdown__label">Days</span></div>
                            <div class="ea-countdown__unit"><span class="ea-countdown__value" data-ea-hours>00</span><span class="ea-countdown__label">Hours</span></div>
                            <div class="ea-countdown__unit"><span class="ea-countdown__value" data-ea-minutes>00</span><span class="ea-countdown__label">Minutes</span></div>
                            <div class="ea-countdown__unit"><span class="ea-countdown__value" data-ea-seconds>00</span><span class="ea-countdown__label">Seconds</span></div>
                        </div>
                    </div>
                @endif
                <div class="ea-hero__actions">
                    <a href="{{ $ctaHref }}" class="ea-btn ea-btn--white">{{ $content['primary_cta']['label'] ?? 'RSVP' }}</a>
                    @if($background)
                        <button type="button" class="ea-btn ea-btn--light" data-ea-lightbox-src="{{ $background }}" data-ea-lightbox-alt="{{ $content['background']['alt'] ?? 'Cover photograph' }}">View cover</button>
                    @endif
                </div>
            </div>
            <div class="ea-scroll"><span>Scroll</span><span></span></div>
        </section>
        @break

    @case('countdown')
        <section class="ea-section ea-section--alt">
            <div class="ea-container">
                @include('exports.partials.intro', [
                    'eyebrow' => $content['eyebrow'] ?? null,
                    'heading' => $content['heading'] ?? null,
                    'intro' => $content['intro'] ?? null,
                ])
                <div style="margin-top: 2.4rem;">
                    @if($event['iso'] ?? null)
                        <div class="ea-countdown" data-ea-countdown data-target="{{ $event['iso'] }}" data-complete="{{ $content['completed_message'] ?? 'We are married!' }}">
                            <div class="ea-countdown__unit"><span class="ea-countdown__value" data-ea-days>00</span><span class="ea-countdown__label">Days</span></div>
                            <div class="ea-countdown__unit"><span class="ea-countdown__value" data-ea-hours>00</span><span class="ea-countdown__label">Hours</span></div>
                            <div class="ea-countdown__unit"><span class="ea-countdown__value" data-ea-minutes>00</span><span class="ea-countdown__label">Minutes</span></div>
                            <div class="ea-countdown__unit"><span class="ea-countdown__value" data-ea-seconds>00</span><span class="ea-countdown__label">Seconds</span></div>
                        </div>
                    @else
                        <p class="ea-body" style="margin: 0; text-align: center; font-size: 0.82rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--w-muted);">The date is being lovingly finalised.</p>
                    @endif
                </div>
            </div>
        </section>
        @break

    @case('story')
        @php
            $image = $content['image']['url'] ?? null;
            $heading = $content['heading'] ?? $couple['story_heading'] ?? 'Our Story';
            $body = $content['body'] ?? $couple['story_body'] ?? '';
            $timeline = is_array($content['timeline'] ?? null) ? $content['timeline'] : [];
            $imageRight = ($content['image_position'] ?? '') === 'right';
        @endphp
        <section class="ea-section">
            <div class="ea-container ea-split {{ $imageRight ? 'ea-split--reverse' : '' }}">
                <div class="ea-split__media">
                    @if($image)
                        <div class="ea-split__frame"></div>
                        <img class="ea-split__image ea-split__image--framed ea-photo ea-shadow-soft" src="{{ $image }}" alt="{{ $content['image']['alt'] ?? 'The couple' }}" loading="lazy">
                        <p class="ea-split__monogram">{{ mb_substr($couple['partner_one'] ?? 'A', 0, 1) }}<span style="font-size: 1.3rem; margin-inline: 0.25rem;">&amp;</span>{{ mb_substr($couple['partner_two'] ?? 'Z', 0, 1) }}</p>
                    @else
                        <div class="ea-party__placeholder">{{ $monogram }}</div>
                    @endif
                </div>
                <div class="ea-split__body">
                    <p class="ea-eyebrow">{{ $content['eyebrow'] ?? 'Our beginning' }}</p>
                    <h2 class="ea-display" style="margin-top: 0.75rem; font-size: clamp(2.2rem, 5vw, 3.6rem);">{{ $heading }}</h2>
                    <div style="margin-top: 1.2rem;">
                        {!! \App\Support\ExportMarkup::ornament($divider, 90) !!}
                    </div>
                    @if($content['intro'] ?? null)
                        <p class="ea-body" style="margin-top: 1.1rem; font-size: 0.98rem; line-height: 1.8; color: var(--w-muted);">{{ $content['intro'] }}</p>
                    @endif
                    <div class="ea-prose ea-body" style="margin-top: 1.1rem; font-size: 0.94rem; line-height: 1.8;">
                        @foreach(\App\Support\ExportMarkup::splitParagraphs($body) as $paragraph)
                            <p>{{ $paragraph }}</p>
                        @endforeach
                    </div>
                    @if(count($timeline))
                        <div class="ea-timeline">
                            @foreach($timeline as $entry)
                                <div class="ea-timeline__item">
                                    @if($entry['date'] ?? null)<p class="ea-timeline__date">{{ $entry['date'] }}</p>@endif
                                    @if($entry['title'] ?? null)<p class="ea-timeline__title">{{ $entry['title'] }}</p>@endif
                                    @if($entry['text'] ?? null)<p class="ea-timeline__text">{{ $entry['text'] }}</p>@endif
                                </div>
                            @endforeach
                        </div>
                    @endif
                    @if($content['signature'] ?? null)
                        <p class="ea-script" style="margin-top: 1.6rem; font-size: 2.4rem; color: var(--w-primary);">{{ $content['signature'] }}</p>
                    @endif
                </div>
            </div>
        </section>
        @break

    @case('quote')
        <section class="ea-section ea-section--alt">
            <div class="ea-container ea-quote">
                <span class="ea-quote__mark" aria-hidden="true">&ldquo;</span>
                <div>{!! \App\Support\ExportMarkup::ornament($divider, 82) !!}</div>
                <blockquote>{{ $content['quote'] ?? $couple['quote'] ?? '' }}</blockquote>
                @if($content['attribution'] ?? null)
                    <p class="ea-eyebrow ea-quote__attribution">{{ $content['attribution'] }}</p>
                @endif
            </div>
        </section>
        @break

    @case('events')
        <section class="ea-section">
            <div class="ea-container">
                @include('exports.partials.intro', [
                    'eyebrow' => $content['eyebrow'] ?? 'The celebrations',
                    'heading' => $content['heading'] ?? null,
                    'intro' => $content['intro'] ?? null,
                ])
                <div class="ea-events">
                    @foreach($events as $eventIndex => $eventItem)
                        @php
                            $date = $eventItem['date'] ?? null;
                            $image = $eventItem['image']['url'] ?? null;
                            $map = \App\Support\ExportMarkup::safeUrl($eventItem['map_url'] ?? null);
                            $location = trim(($eventItem['venue_name'] ?? '').', '.($eventItem['venue_address'] ?? ''), ', ');
                            $calendar = $date ? \App\Support\ExportMarkup::calendarUrl($date, ($eventItem['title'] ?? '').' — '.$names, $eventItem['description'] ?? null, $location) : null;
                        @endphp
                        <article class="ea-card ea-event">
                            <div class="ea-event__grid">
                                @if($image)
                                    <div class="ea-event__media">
                                        <img class="ea-event__image ea-photo" src="{{ $image }}" alt="{{ $eventItem['image']['alt'] ?? $eventItem['title'] ?? 'Celebration' }}" loading="lazy">
                                    </div>
                                @endif
                                <div class="ea-event__body">
                                    <div class="ea-event__top">
                                        @if($date)
                                            <div class="ea-event__date">
                                                <p class="ea-event__day">{{ $date['day'] ?? '' }}</p>
                                                <p class="ea-event__month">{{ $date['month'] ?? '' }}</p>
                                                <p class="ea-event__year">{{ $date['year'] ?? '' }}</p>
                                            </div>
                                        @endif
                                        <div style="min-width: 0;">
                                            <p class="ea-eyebrow">{{ $eventIndex === 0 ? 'The celebrations begin' : 'Join us for' }}</p>
                                            <h3 class="ea-display ea-event__title">{{ $eventItem['title'] ?? '' }}</h3>
                                            @if($date)
                                                <p class="ea-event__meta">
                                                    <span>{{ $date['formatted'] ?? '' }}</span>
                                                    <span>{{ $date['time_formatted'] ?? '' }}</span>
                                                </p>
                                            @endif
                                        </div>
                                    </div>
                                    @if($eventItem['description'] ?? null)
                                        <p class="ea-event__description">{{ $eventItem['description'] }}</p>
                                    @endif
                                    @if($eventItem['venue_name'] ?? null)
                                        <p class="ea-event__place">
                                            {{ $eventItem['venue_name'] }}
                                            @if($eventItem['venue_address'] ?? null)<small>{{ $eventItem['venue_address'] }}</small>@endif
                                        </p>
                                    @endif
                                    @if($eventItem['dress_code'] ?? null)
                                        <p class="ea-event__dress">Dress code — {{ $eventItem['dress_code'] }}</p>
                                    @endif
                                    <div class="ea-event__actions">
                                        @if($map)
                                            <a href="{{ $map }}" target="_blank" rel="noreferrer" class="ea-btn ea-btn--text">Directions ↗</a>
                                        @endif
                                        @if($calendar)
                                            <a href="{{ $calendar }}" target="_blank" rel="noreferrer" class="ea-btn ea-btn--text">Add to calendar</a>
                                        @endif
                                    </div>
                                </div>
                            </div>
                        </article>
                    @endforeach
                </div>
                @if($content['note'] ?? null)
                    <p class="ea-body" style="margin: 1.75rem auto 0; max-width: 34rem; text-align: center; font-size: 0.78rem; line-height: 1.8; color: var(--w-muted);">{{ $content['note'] }}</p>
                @endif
            </div>
        </section>
        @break

    @case('gallery')
        @php
            $images = array_values(array_filter(
                is_array($content['images'] ?? null) ? $content['images'] : [],
                fn ($image) => is_array($image) && ! empty($image['url'])
            ));
            $galleryLayout = ($content['layout'] ?? $theme['layout']['gallery'] ?? 'masonry') === 'grid' ? 'grid' : 'masonry';
        @endphp
        @if(count($images))
            <section class="ea-section ea-section--alt">
                <div class="ea-container">
                    @include('exports.partials.intro', [
                        'eyebrow' => $content['eyebrow'] ?? 'A few favourite moments',
                        'heading' => $content['heading'] ?? null,
                        'intro' => $content['intro'] ?? null,
                    ])
                    <div class="ea-gallery ea-gallery--{{ $galleryLayout }}">
                        @foreach($images as $image)
                            <button type="button" class="ea-gallery__item" data-ea-lightbox-src="{{ $image['url'] }}" data-ea-lightbox-alt="{{ $image['alt'] ?? $image['caption'] ?? 'Wedding photograph' }}" data-ea-lightbox-caption="{{ $image['caption'] ?? '' }}" aria-label="Open photograph {{ $loop->iteration }}">
                                <img class="ea-gallery__image ea-photo" src="{{ $image['url'] }}" alt="{{ $image['alt'] ?? $image['caption'] ?? 'Wedding photograph' }}" loading="lazy">
                                @if($image['caption'] ?? null)
                                    <span class="ea-gallery__caption">{{ $image['caption'] }}</span>
                                @endif
                            </button>
                        @endforeach
                    </div>
                    <p class="ea-gallery__hint">Select a photograph to view the gallery</p>
                </div>
            </section>
        @endif
        @break

    @case('venue')
        @php
            $name = $content['name'] ?? $venue['name'] ?? '';
            $address = $content['address'] ?? $venue['address'] ?? '';
            $mapUrl = \App\Support\ExportMarkup::safeUrl($content['map_url'] ?? $venue['map_url'] ?? null);
            $embed = $content['map_embed'] ?? $venue['map_embed'] ?? null;
            $iframe = \App\Support\ExportMarkup::extractIframeSource($embed);
            $image = $content['image']['url'] ?? null;
        @endphp
        <section class="ea-section">
            <div class="ea-container">
                @include('exports.partials.intro', [
                    'eyebrow' => $content['eyebrow'] ?? 'Where we will celebrate',
                    'heading' => $content['heading'] ?? null,
                    'intro' => $content['intro'] ?? null,
                ])
                <div class="ea-venue">
                    <div>
                        @if($image)
                            <img class="ea-venue__image ea-photo ea-shadow-soft" src="{{ $image }}" alt="{{ $content['image']['alt'] ?? $name ?: 'The venue' }}" loading="lazy">
                        @endif
                        <div class="ea-card ea-venue__card">
                            <p class="ea-eyebrow">The place</p>
                            <h3 class="ea-display ea-venue__name">{{ $name }}</h3>
                            @if($address)
                                <p class="ea-venue__address">{{ $address }}</p>
                            @endif
                            @if($mapUrl)
                                <a href="{{ $mapUrl }}" target="_blank" rel="noreferrer" class="ea-btn ea-btn--fill" style="margin-top: 1.1rem;">Get directions</a>
                            @endif
                            @if($content['notes'] ?? null)
                                <p class="ea-venue__notes">{{ $content['notes'] }}</p>
                            @endif
                        </div>
                    </div>
                    <div class="ea-map">
                        @if($iframe)
                            <iframe src="{{ $iframe }}" title="Map to {{ $name }}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
                        @else
                            <div class="ea-map__fallback">
                                <div class="ea-map__grid"></div>
                                <span class="ea-map__pin">⌖</span>
                                <p class="ea-map__name">{{ $name }}</p>
                                @if($address)<p class="ea-map__address">{{ $address }}</p>@endif
                                @if($mapUrl)
                                    <a href="{{ $mapUrl }}" target="_blank" rel="noreferrer" class="ea-btn ea-btn--text" style="position: relative; margin-top: 1rem;">Open in maps ↗</a>
                                @endif
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </section>
        @break

    @case('rsvp')
        <section class="ea-section ea-section--alt">
            <div class="ea-container">
                @include('exports.partials.intro', [
                    'eyebrow' => $content['eyebrow'] ?? 'Your presence means the world',
                    'heading' => $content['heading'] ?? 'Will You Join Us?',
                    'intro' => $content['intro'] ?? null,
                ])
                @if($content['note'] ?? null)
                    <p class="ea-body" style="margin: 1rem auto 0; max-width: 34rem; text-align: center; font-size: 0.78rem; line-height: 1.8; color: var(--w-muted);">{{ $content['note'] }}</p>
                @endif
                <div style="margin-top: 2.2rem;">
                    @include('exports.partials.rsvp-form', [
                        'content' => $content,
                        'invitation' => $invitation,
                        'rsvp' => $rsvp,
                        'apiBase' => $apiBase,
                        'names' => $names,
                    ])
                </div>
            </div>
        </section>
        @break

    @case('text')
        @php
            $align = ($content['align'] ?? 'center') === 'left' ? 'left' : 'center';
        @endphp
        <section class="ea-section">
            <div class="ea-container" style="max-width: 48rem; {{ $align === 'center' ? 'text-align: center;' : '' }}">
                @include('exports.partials.intro', [
                    'eyebrow' => $content['eyebrow'] ?? null,
                    'heading' => $content['heading'] ?? null,
                    'intro' => $content['intro'] ?? null,
                    'align' => $align,
                ])
                <div class="ea-prose ea-body" style="margin-top: 1.2rem; font-size: 0.95rem; line-height: 1.8; {{ $align === 'center' ? 'max-width: 42rem; margin-inline: auto;' : '' }}">
                    @foreach(\App\Support\ExportMarkup::splitParagraphs($content['body'] ?? null) as $paragraph)
                        <p>{{ $paragraph }}</p>
                    @endforeach
                </div>
                @if(($content['cta']['label'] ?? null) && ($content['cta']['href'] ?? null))
                    <a href="{{ $content['cta']['href'] }}" class="ea-btn ea-btn--outline" style="margin-top: 1.4rem;">{{ $content['cta']['label'] }}</a>
                @endif
            </div>
        </section>
        @break

    @case('image_text')
        @php
            $image = $content['image']['url'] ?? null;
            $imageRight = ($content['image_position'] ?? '') === 'right';
        @endphp
        <section class="ea-section">
            <div class="ea-container ea-split ea-split--even {{ $imageRight ? 'ea-split--reverse' : '' }}">
                <div>
                    @if($image)
                        <img class="ea-split__image ea-photo ea-shadow-soft" src="{{ $image }}" alt="{{ $content['image']['alt'] ?? $content['heading'] ?? 'Photograph' }}" loading="lazy">
                    @else
                        <div class="ea-party__placeholder">{!! \App\Support\ExportMarkup::ornament($divider, 120) !!}</div>
                    @endif
                </div>
                <div>
                    @include('exports.partials.intro', [
                        'eyebrow' => $content['eyebrow'] ?? null,
                        'heading' => $content['heading'] ?? null,
                        'intro' => $content['intro'] ?? null,
                        'align' => 'left',
                    ])
                    <div class="ea-prose ea-body" style="margin-top: 1rem; font-size: 0.94rem; line-height: 1.8;">
                        @foreach(\App\Support\ExportMarkup::splitParagraphs($content['body'] ?? null) as $paragraph)
                            <p>{{ $paragraph }}</p>
                        @endforeach
                    </div>
                    @if(($content['cta']['label'] ?? null) && ($content['cta']['href'] ?? null))
                        <a href="{{ $content['cta']['href'] }}" class="ea-btn ea-btn--outline" style="margin-top: 1.2rem;">{{ $content['cta']['label'] }}</a>
                    @endif
                </div>
            </div>
        </section>
        @break

    @case('wedding_party')
        @php
            $members = is_array($content['members'] ?? null) ? $content['members'] : [];
        @endphp
        <section class="ea-section ea-section--alt">
            <div class="ea-container">
                @include('exports.partials.intro', [
                    'eyebrow' => $content['eyebrow'] ?? 'Standing beside us',
                    'heading' => $content['heading'] ?? null,
                    'intro' => $content['intro'] ?? null,
                ])
                <div class="ea-party">
                    @foreach($members as $member)
                        <div class="ea-party__member">
                            @if($member['url'] ?? null)
                                <img class="ea-party__image ea-photo ea-shadow-soft" src="{{ $member['url'] }}" alt="{{ $member['alt'] ?? $member['name'] ?? 'Wedding party' }}" loading="lazy">
                            @else
                                <div class="ea-party__placeholder">{{ \App\Support\ExportMarkup::initials($member['name'] ?? '') }}</div>
                            @endif
                            <h3 class="ea-display ea-party__name">{{ $member['name'] ?? '' }}</h3>
                            @if($member['role'] ?? null)
                                <p class="ea-eyebrow ea-party__role">{{ $member['role'] }}</p>
                            @endif
                            @if($member['bio'] ?? null)
                                <p class="ea-party__bio">{{ $member['bio'] }}</p>
                            @endif
                        </div>
                    @endforeach
                </div>
            </div>
        </section>
        @break

    @case('gifts')
        @php
            $links = is_array($content['links'] ?? null) ? $content['links'] : [];
        @endphp
        <section class="ea-section">
            <div class="ea-container ea-gifts">
                @include('exports.partials.intro', [
                    'eyebrow' => $content['eyebrow'] ?? 'With gratitude',
                    'heading' => $content['heading'] ?? null,
                    'intro' => $content['intro'] ?? null,
                ])
                <div class="ea-card ea-gifts__card">
                    <div class="ea-gifts__icon">♡</div>
                    <div class="ea-prose ea-body" style="margin-top: 1rem; font-size: 0.95rem; line-height: 1.8;">
                        @foreach(\App\Support\ExportMarkup::splitParagraphs($content['body'] ?? null) as $paragraph)
                            <p>{{ $paragraph }}</p>
                        @endforeach
                    </div>
                    @if($content['note'] ?? null)
                        <p class="ea-gifts__note">{{ $content['note'] }}</p>
                    @endif
                    @if(count($links))
                        <div class="ea-gifts__links">
                            @foreach($links as $link)
                                @php $url = \App\Support\ExportMarkup::safeUrl($link['url'] ?? null); @endphp
                                @if($url)
                                    <a href="{{ $url }}" target="_blank" rel="noreferrer" class="ea-btn ea-btn--outline">{{ $link['label'] ?? 'View' }} ↗</a>
                                @endif
                            @endforeach
                        </div>
                    @endif
                </div>
            </div>
        </section>
        @break

    @case('travel')
        @php
            $hotels = is_array($content['hotels'] ?? null) ? $content['hotels'] : [];
        @endphp
        <section class="ea-section ea-section--alt">
            <div class="ea-container">
                @include('exports.partials.intro', [
                    'eyebrow' => $content['eyebrow'] ?? 'For guests from near & far',
                    'heading' => $content['heading'] ?? null,
                    'intro' => $content['intro'] ?? null,
                ])
                <div class="ea-travel">
                    @foreach($hotels as $hotel)
                        @php $url = \App\Support\ExportMarkup::safeUrl($hotel['url'] ?? null); @endphp
                        <div class="ea-card ea-travel__card">
                            <p class="ea-eyebrow">Stay</p>
                            <h3 class="ea-display ea-travel__name">{{ $hotel['name'] ?? '' }}</h3>
                            @if($hotel['description'] ?? null)<p class="ea-travel__description">{{ $hotel['description'] }}</p>@endif
                            @if($hotel['address'] ?? null)<p class="ea-travel__address">{{ $hotel['address'] }}</p>@endif
                            @if($url)
                                <a href="{{ $url }}" target="_blank" rel="noreferrer" class="ea-btn ea-btn--text" style="margin-top: 1rem;">View stay ↗</a>
                            @endif
                        </div>
                    @endforeach
                </div>
                @if($content['body'] ?? null)
                    <p class="ea-body" style="margin: 1.5rem auto 0; max-width: 42rem; text-align: center; font-size: 0.88rem; line-height: 1.8; color: var(--w-muted);">{{ $content['body'] }}</p>
                @endif
                @if($content['note'] ?? null)
                    <p style="margin-top: 0.75rem; text-align: center; font-size: 0.78rem; font-style: italic; color: var(--w-muted);">{{ $content['note'] }}</p>
                @endif
            </div>
        </section>
        @break

    @case('video')
        @php
            $provider = ($content['provider'] ?? 'youtube') === 'vimeo' ? 'vimeo' : 'youtube';
            $embed = $provider === 'vimeo'
                ? \App\Support\ExportMarkup::vimeoEmbed($content['video_url'] ?? null)
                : \App\Support\ExportMarkup::youtubeEmbed($content['video_url'] ?? null);
            $direct = \App\Support\ExportMarkup::safeUrl($content['video_url'] ?? null);
        @endphp
        <section class="ea-section">
            <div class="ea-container">
                @include('exports.partials.intro', [
                    'eyebrow' => $content['eyebrow'] ?? 'A film',
                    'heading' => $content['heading'] ?? null,
                    'intro' => $content['intro'] ?? null,
                ])
                <div class="ea-video">
                    @if($embed)
                        <div class="ea-video__frame">
                            <iframe src="{{ $embed }}" title="{{ $content['heading'] ?? 'Wedding film' }}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    @else
                        <div class="ea-video__fallback">
                            <span style="font-size: 2rem;">▶</span>
                            <p style="max-width: 24rem; margin: 0; font-size: 0.86rem;">{{ $direct ? 'Watch the film in a new window.' : 'Add a YouTube or Vimeo link to share your film.' }}</p>
                            @if($direct)
                                <a href="{{ $direct }}" target="_blank" rel="noreferrer" class="ea-btn ea-btn--light">Watch film ↗</a>
                            @endif
                        </div>
                    @endif
                </div>
                @if($content['caption'] ?? null)
                    <p class="ea-video__caption">{{ $content['caption'] }}</p>
                @endif
            </div>
        </section>
        @break

    @case('contact')
        @php
            $contacts = is_array($content['contacts'] ?? null) ? $content['contacts'] : [];
        @endphp
        <section class="ea-section">
            <div class="ea-container">
                @include('exports.partials.intro', [
                    'eyebrow' => $content['eyebrow'] ?? 'Here to help',
                    'heading' => $content['heading'] ?? 'With a Little Help',
                    'intro' => $content['intro'] ?? null,
                ])
                <div class="ea-contact">
                    @foreach($contacts as $contact)
                        <div class="ea-card ea-contact__card">
                            <p class="ea-contact__name">{{ $contact['name'] ?? '' }}</p>
                            @if($contact['role'] ?? null)
                                <p class="ea-eyebrow ea-contact__role">{{ $contact['role'] }}</p>
                            @endif
                            <div class="ea-contact__links">
                                @if($contact['phone'] ?? null)
                                    <a href="tel:{{ preg_replace('/[^0-9+]/', '', $contact['phone']) }}">☎ {{ $contact['phone'] }}</a>
                                @endif
                                @if($contact['email'] ?? null)
                                    <a href="mailto:{{ $contact['email'] }}">✉ {{ $contact['email'] }}</a>
                                @endif
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        </section>
        @break

    @case('divider')
        <section class="ea-divider">
            {!! \App\Support\ExportMarkup::ornament($divider, 110) !!}
        </section>
        @break

    @default
        <section class="ea-section">
            <div class="ea-container">
                @include('exports.partials.intro', [
                    'eyebrow' => $content['eyebrow'] ?? null,
                    'heading' => $content['heading'] ?? null,
                    'intro' => $content['intro'] ?? null,
                ])
                <div class="ea-prose ea-body" style="margin-top: 1.2rem; font-size: 0.95rem; line-height: 1.8;">
                    @foreach(\App\Support\ExportMarkup::splitParagraphs($content['body'] ?? $content['message'] ?? null) as $paragraph)
                        <p>{{ $paragraph }}</p>
                    @endforeach
                </div>
            </div>
        </section>
@endswitch
