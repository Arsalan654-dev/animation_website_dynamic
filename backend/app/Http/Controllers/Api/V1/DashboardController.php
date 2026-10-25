<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\ActivityResource;
use App\Http\Resources\RsvpResource;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    public function __invoke(DashboardService $dashboard): JsonResponse
    {
        $metrics = $dashboard->metrics();

        return response()->json([
            'data' => [
                'invitations' => $metrics['invitations'],
                'rsvps' => $metrics['rsvps'],
                'attendance_rate' => $metrics['attendance_rate'],
                'recent_rsvps' => RsvpResource::collection($metrics['recent_rsvps'])->resolve(),
                'recent_activity' => ActivityResource::collection($metrics['recent_activity'])->resolve(),
                'invitation_breakdown' => $metrics['invitation_breakdown']->map(fn ($invitation) => [
                    'id' => $invitation->id,
                    'title' => $invitation->title,
                    'slug' => $invitation->slug,
                    'status' => $invitation->status,
                    'rsvps_count' => (int) $invitation->rsvps_count,
                    'attending_responses_count' => (int) $invitation->attending_responses_count,
                    'confirmed_guests' => (int) ($invitation->confirmed_guests_sum ?? 0),
                ])->values(),
            ],
        ]);
    }
}
