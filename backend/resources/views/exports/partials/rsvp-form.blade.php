@php
    $rsvpEnabled = (bool) ($rsvp['enabled'] ?? true);
    $deadlinePassed = (bool) ($rsvp['deadline_passed'] ?? false);
    $allowDecline = (bool) ($rsvp['allow_decline'] ?? true);
    $collectPhone = (bool) ($rsvp['collect_phone'] ?? true);
    $requireCode = (bool) ($rsvp['require_guest_code'] ?? false);
    $maxGuests = max(1, (int) ($rsvp['max_guests_per_submission'] ?? 6));
    $questions = is_array($rsvp['questions'] ?? null) ? $rsvp['questions'] : [];
@endphp

@if(! $rsvpEnabled || $deadlinePassed)
    <div class="ea-card ea-rsvp__success" style="max-width: 36rem; margin-inline: auto;">
        <div class="ea-rsvp__success-icon">{{ $rsvpEnabled ? '◷' : '♡' }}</div>
        <h3 class="ea-display">{{ $rsvpEnabled ? 'The reply date has passed' : 'RSVP is closed' }}</h3>
        <p>{{ $rsvpEnabled
            ? 'The family is busy with final arrangements. Please contact them directly if there is anything they should know.'
            : 'Please reach out to the family directly if you would like to share your wishes.' }}</p>
    </div>
@else
    <form class="ea-rsvp" data-ea-rsvp data-success-message="{{ $content['success_message'] ?? '' }}">
        @if($requireCode)
            <div class="ea-card" style="padding: 1.25rem; margin-bottom: 1rem;">
                <label class="ea-label" for="ea-guest-code">Your personal invitation</label>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    <input id="ea-guest-code" class="ea-input" style="flex: 1 1 12rem;" data-ea-guest-code placeholder="Enter your guest code" autocomplete="one-time-code" aria-label="Guest code">
                    <button type="button" class="ea-btn ea-btn--outline" data-ea-verify-code>Verify</button>
                </div>
                <p class="ea-body" style="margin-top: 0.5rem; font-size: 0.74rem; color: var(--w-muted);" data-ea-code-message></p>
            </div>
        @endif

        <div class="ea-card ea-rsvp__card">
            <div class="ea-rsvp__grid">
                <div class="ea-rsvp__field--full">
                    <label class="ea-label" for="ea-guest-name">Your name</label>
                    <input id="ea-guest-name" class="ea-input" name="guest_name" placeholder="Full name" autocomplete="name" required>
                </div>

                <div>
                    <label class="ea-label" for="ea-guest-email">Email {{ $collectPhone ? '' : '(optional)' }}</label>
                    <input id="ea-guest-email" class="ea-input" type="email" name="email" placeholder="you@example.com" autocomplete="email">
                </div>

                @if($collectPhone)
                    <div>
                        <label class="ea-label" for="ea-guest-phone">Phone (optional)</label>
                        <input id="ea-guest-phone" class="ea-input" type="tel" name="phone" placeholder="+92 300 0000000" autocomplete="tel">
                    </div>
                @endif

                <div class="ea-rsvp__field--full">
                    <p class="ea-label">Will you join us?</p>
                    <div class="ea-choice">
                        <label class="ea-choice__option">
                            <span>Joyfully accept</span>
                            <input type="radio" name="attendance" value="attending" checked>
                            <span class="ea-choice__dot"></span>
                        </label>
                        @if($allowDecline)
                            <label class="ea-choice__option">
                                <span>Regretfully decline</span>
                                <input type="radio" name="attendance" value="declined">
                                <span class="ea-choice__dot"></span>
                            </label>
                        @endif
                    </div>
                </div>

                <div data-ea-count-wrap>
                    <label class="ea-label" for="ea-guest-count">Number of guests</label>
                    <select id="ea-guest-count" class="ea-input" name="guest_count">
                        @for($i = 1; $i <= $maxGuests; $i++)
                            <option value="{{ $i }}">{{ $i }} {{ $i === 1 ? 'guest' : 'guests' }} (including you)</option>
                        @endfor
                    </select>
                </div>

                @foreach($questions as $question)
                    @php
                        $questionId = (string) ($question['id'] ?? $loop->index);
                        $questionType = in_array($question['type'] ?? 'text', ['text', 'textarea', 'select'], true) ? $question['type'] : 'text';
                    @endphp
                    <div class="{{ $questionType === 'textarea' ? 'ea-rsvp__field--full' : '' }}">
                        <label class="ea-label" for="ea-question-{{ $questionId }}">
                            {{ $question['label'] ?? 'Question' }}{{ ! empty($question['required']) ? ' *' : '' }}
                        </label>
                        @if($questionType === 'select')
                            <select id="ea-question-{{ $questionId }}" class="ea-input" data-ea-question="{{ $questionId }}" @if(! empty($question['required'])) required @endif>
                                <option value="">Please choose</option>
                                @foreach(($question['options'] ?? []) as $option)
                                    <option value="{{ $option }}">{{ $option }}</option>
                                @endforeach
                            </select>
                        @elseif($questionType === 'textarea')
                            <textarea id="ea-question-{{ $questionId }}" class="ea-input" data-ea-question="{{ $questionId }}" @if(! empty($question['required'])) required @endif></textarea>
                        @else
                            <input id="ea-question-{{ $questionId }}" class="ea-input" data-ea-question="{{ $questionId }}" @if(! empty($question['required'])) required @endif>
                        @endif
                    </div>
                @endforeach

                <div class="ea-rsvp__field--full">
                    <label class="ea-label" for="ea-guest-message">A note for the couple (optional)</label>
                    <textarea id="ea-guest-message" class="ea-input" name="message" placeholder="Share a wish, a memory or a dietary note…"></textarea>
                </div>
            </div>

            <div class="ea-rsvp__alert" data-ea-rsvp-error hidden></div>

            <div style="margin-top: 1.6rem; text-align: center;">
                <button type="submit" class="ea-btn ea-btn--fill" style="min-width: 16rem;">Send my RSVP</button>
                @if($rsvp['deadline'] ?? null)
                    <p class="ea-rsvp__deadline">Kindly reply by {{ \Illuminate\Support\Carbon::parse($rsvp['deadline'])->format('F j, Y') }}</p>
                @endif
            </div>
        </div>
    </form>

    <div class="ea-card ea-rsvp__success" data-ea-rsvp-success hidden style="max-width: 42rem; margin-inline: auto;">
        <div class="ea-rsvp__success-icon">✓</div>
        <h3 class="ea-display">Thank you</h3>
        <p data-ea-success-message>{{ $content['success_message'] ?? $rsvp['success_message'] ?? 'Your response has been received with love.' }}</p>
        <div class="ea-rsvp__thanks" data-ea-success-summary></div>
        <p class="ea-eyebrow" style="margin-top: 1.5rem;">With love, {{ $names }}</p>
    </div>
@endif
