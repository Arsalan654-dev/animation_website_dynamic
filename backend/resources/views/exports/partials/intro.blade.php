@if(($eyebrow ?? null) || ($heading ?? null) || ($intro ?? null))
    <div class="ea-intro {{ ($align ?? 'center') === 'left' ? 'ea-intro--left' : '' }}">
        @if($eyebrow ?? null)
            <p class="ea-eyebrow">{{ $eyebrow }}</p>
        @endif
        @if($heading ?? null)
            <h2 class="ea-display">{{ $heading }}</h2>
        @endif
        <div class="ea-intro__ornament">
            {!! \App\Support\ExportMarkup::ornament($theme['ornaments']['divider'] ?? 'botanical', 96) !!}
        </div>
        @if($intro ?? null)
            <p>{{ $intro }}</p>
        @endif
    </div>
@endif
