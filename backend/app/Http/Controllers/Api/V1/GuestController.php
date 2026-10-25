<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\GuestRequest;
use App\Http\Resources\GuestResource;
use App\Models\Invitation;
use App\Models\InvitationGuest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GuestController extends Controller
{
    public function index(Invitation $invitation): JsonResponse
    {
        $this->authorize('view', $invitation);

        return response()->json([
            'data' => GuestResource::collection(
                $invitation->guests()->with('invitation')->latest()->get()
            ),
        ]);
    }

    public function store(GuestRequest $request, Invitation $invitation): JsonResponse
    {
        $data = $request->validated();
        $data['code'] = $this->uniqueCode();
        $data['max_guests'] = $data['max_guests'] ?? 2;
        $data['is_allowed'] = $data['is_allowed'] ?? true;

        $guest = $invitation->guests()->create($data);

        return response()->json([
            'data' => new GuestResource($guest->load('invitation')),
            'message' => 'Guest added.',
        ], 201);
    }

    public function update(GuestRequest $request, Invitation $invitation, InvitationGuest $guest): JsonResponse
    {
        $this->authorize('update', $invitation);
        abort_unless($guest->invitation_id === $invitation->id, 404);

        $guest->update($request->validated());

        return response()->json([
            'data' => new GuestResource($guest->fresh('invitation')),
            'message' => 'Guest saved.',
        ]);
    }

    public function destroy(Request $request, Invitation $invitation, InvitationGuest $guest): JsonResponse
    {
        $this->authorize('update', $invitation);
        abort_unless($guest->invitation_id === $invitation->id, 404);

        $guest->delete();

        return response()->json(['message' => 'Guest removed.']);
    }

    private function uniqueCode(): string
    {
        do {
            $code = Str::upper(Str::random(10));
        } while (InvitationGuest::query()->where('code', $code)->exists());

        return $code;
    }
}
