<?php

namespace App\Services;

use App\Models\Invitation;
use App\Models\InvitationGuest;
use App\Models\RsvpSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RsvpService
{
    /**
     * Validate the RSVP against the invitation configuration then persist it.
     *
     * @return array{submission: RsvpSubmission, updated: bool}
     */
    public function submit(Invitation $invitation, array $data, Request $request): array
    {
        if (! $invitation->isRsvpOpen()) {
            throw ValidationException::withMessages([
                'rsvp' => 'RSVP is closed for this invitation.',
            ]);
        }

        $settings = $invitation->rsvpConfig();
        $guest = null;
        $code = trim((string) ($data['guest_code'] ?? ''));

        if ($code !== '') {
            $guest = InvitationGuest::query()
                ->where('invitation_id', $invitation->id)
                ->where('code', $code)
                ->where('is_allowed', true)
                ->first();
        }

        if (! empty($settings['require_guest_code']) && ! $guest) {
            throw ValidationException::withMessages([
                'guest_code' => 'That guest code is not valid for this invitation.',
            ]);
        }

        $maxGuests = min(
            (int) ($settings['max_guests_per_submission'] ?? 6),
            $guest?->max_guests ?? (int) ($settings['max_guests_per_submission'] ?? 6),
        );

        if ((int) ($data['guest_count'] ?? 1) > $maxGuests) {
            throw ValidationException::withMessages([
                'guest_count' => "You may RSVP for up to {$maxGuests} guests.",
            ]);
        }

        $answers = $this->validateAnswers($settings['questions'] ?? [], $data['answers'] ?? []);

        if (! ($settings['allow_decline'] ?? true) && ($data['attendance'] ?? 'attending') === 'declined') {
            throw ValidationException::withMessages([
                'attendance' => 'Declining is not available for this invitation.',
            ]);
        }

        $existing = null;
        $guestCode = $guest?->code;

        if (! empty($data['email'])) {
            $existing = RsvpSubmission::query()
                ->where('invitation_id', $invitation->id)
                ->whereRaw('LOWER(email) = ?', [mb_strtolower($data['email'])])
                ->first();
        }

        if (! $existing && $guestCode) {
            $existing = RsvpSubmission::query()
                ->where('invitation_id', $invitation->id)
                ->where('guest_code', $guestCode)
                ->first();
        }

        return DB::transaction(function () use ($invitation, $data, $answers, $existing, $guest, $request, $guestCode) {
            $payload = [
                'guest_name' => $data['guest_name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'attendance' => $data['attendance'],
                'guest_count' => (int) $data['guest_count'],
                'message' => $data['message'] ?? null,
                'answers' => $answers ?: null,
                'guest_code' => $guestCode,
                'ip_address' => $request->ip(),
                'user_agent' => mb_substr((string) $request->userAgent(), 0, 1000),
                'source' => 'public',
            ];

            if ($existing) {
                $existing->update($payload);
                $submission = $existing;
            } else {
                $submission = $invitation->rsvps()->create($payload);
            }

            if ($guest) {
                $guest->update(['rsvp_submission_id' => $submission->id]);
            }

            ActivityLogger::log(
                $invitation,
                null,
                $existing ? 'rsvp_updated' : 'rsvp_received',
                ($existing ? 'RSVP updated' : 'New RSVP').' from '.$submission->guest_name,
                ['attendance' => $submission->attendance],
            );

            return ['submission' => $submission->fresh(), 'updated' => (bool) $existing];
        });
    }

    private function validateAnswers(array $questions, array $answers): array
    {
        $clean = [];
        $errors = [];

        foreach ($questions as $index => $question) {
            $key = (string) ($question['id'] ?? $index);
            $value = $answers[$key] ?? null;

            if (! empty($question['required']) && ($value === null || $value === '')) {
                $errors["answers.{$key}"] = ($question['label'] ?? 'This question').' is required.';

                continue;
            }

            if ($value === null || $value === '') {
                continue;
            }

            if (is_string($value) && mb_strlen($value) > 500) {
                $errors["answers.{$key}"] = 'Answer is too long.';

                continue;
            }

            if (($question['type'] ?? 'text') === 'select') {
                $allowed = $question['options'] ?? [];

                if (! in_array($value, $allowed, true)) {
                    $errors["answers.{$key}"] = 'Choose one of the available options.';

                    continue;
                }
            }

            $clean[$key] = $value;
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        return $clean;
    }
}
