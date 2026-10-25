<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\RsvpStoreRequest;
use App\Models\Invitation;
use App\Models\InvitationGuest;
use App\Services\RsvpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PublicRsvpController extends Controller
{
    public function store(RsvpStoreRequest $request, string $slug, RsvpService $service): JsonResponse
    {
        $invitation = Invitation::query()->published()->where('slug', $slug)->first();

        if (! $invitation) {
            abort(404, 'Invitation not found.');
        }

        $result = $service->submit($invitation, $request->validated(), $request);

        return response()->json([
            'data' => [
                'id' => $result['submission']->id,
                'guest_name' => $result['submission']->guest_name,
                'attendance' => $result['submission']->attendance,
                'guest_count' => $result['submission']->guest_count,
            ],
            'updated' => $result['updated'],
            'message' => 'Your RSVP has been received.',
        ], $result['updated'] ? 200 : 201);
    }

    public function verifyGuest(string $slug, string $code): JsonResponse
    {
        $invitation = Invitation::query()->published()->where('slug', $slug)->first();

        if (! $invitation) {
            abort(404, 'Invitation not found.');
        }

        $guest = InvitationGuest::query()
            ->where('invitation_id', $invitation->id)
            ->where('code', $code)
            ->where('is_allowed', true)
            ->first();

        if (! $guest) {
            return response()->json(['message' => 'That guest code was not recognised.'], 404);
        }

        return response()->json([
            'data' => [
                'name' => $guest->name,
                'first_name' => explode(' ', trim($guest->name))[0],
                'max_guests' => $guest->max_guests,
                'already_responded' => $guest->rsvp_submission_id !== null,
            ],
        ]);
    }
}
