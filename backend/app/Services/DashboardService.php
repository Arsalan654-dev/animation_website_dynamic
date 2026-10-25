<?php

namespace App\Services;

use App\Models\Invitation;
use App\Models\InvitationActivity;
use App\Models\RsvpSubmission;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function metrics(): array
    {
        $statusCounts = Invitation::query()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $rsvpTotal = RsvpSubmission::query()->count();
        $attendingResponses = RsvpSubmission::query()->where('attendance', 'attending')->count();
        $declinedResponses = RsvpSubmission::query()->where('attendance', 'declined')->count();
        $confirmedGuests = (int) RsvpSubmission::query()->where('attendance', 'attending')->sum('guest_count');
        $totalInvitations = Invitation::query()->count();
        $published = (int) ($statusCounts['published'] ?? 0);

        $recentRsvps = RsvpSubmission::query()
            ->with('invitation:id,title,slug')
            ->latest()
            ->limit(6)
            ->get();

        $activities = InvitationActivity::query()
            ->with(['invitation:id,title,slug', 'user:id,name'])
            ->latest()
            ->limit(8)
            ->get();

        $perInvitation = Invitation::query()
            ->withCount([
                'rsvps',
                'rsvps as attending_responses_count' => fn ($query) => $query->where('attendance', 'attending'),
            ])
            ->withSum([
                'rsvps as confirmed_guests_sum' => fn ($query) => $query->where('attendance', 'attending'),
            ], 'guest_count')
            ->latest()
            ->limit(5)
            ->get(['id', 'title', 'slug', 'status', 'event_at', 'timezone']);

        return [
            'invitations' => [
                'total' => $totalInvitations,
                'draft' => (int) ($statusCounts['draft'] ?? 0),
                'published' => $published,
                'archived' => (int) ($statusCounts['archived'] ?? 0),
            ],
            'rsvps' => [
                'total' => $rsvpTotal,
                'attending_responses' => $attendingResponses,
                'declined_responses' => $declinedResponses,
                'confirmed_guests' => $confirmedGuests,
            ],
            'attendance_rate' => $rsvpTotal > 0 ? round(($attendingResponses / $rsvpTotal) * 100) : 0,
            'recent_rsvps' => $recentRsvps,
            'recent_activity' => $activities,
            'invitation_breakdown' => $perInvitation,
        ];
    }

    public function attendanceFor(Invitation $invitation): array
    {
        $rows = RsvpSubmission::query()
            ->where('invitation_id', $invitation->id)
            ->select('attendance', DB::raw('count(*) as responses, sum(guest_count) as guests'))
            ->groupBy('attendance')
            ->get()
            ->keyBy('attendance');

        return [
            'total_responses' => (int) $rows->sum('responses'),
            'attending_responses' => (int) ($rows['attending']->responses ?? 0),
            'declined_responses' => (int) ($rows['declined']->responses ?? 0),
            'confirmed_guests' => (int) ($rows['attending']->guests ?? 0),
        ];
    }
}
