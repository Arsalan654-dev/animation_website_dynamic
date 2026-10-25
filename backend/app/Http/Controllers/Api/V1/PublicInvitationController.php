<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Invitation;
use App\Services\PublicInvitationPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class PublicInvitationController extends Controller
{
    public function show(string $slug, PublicInvitationPresenter $presenter): JsonResponse
    {
        $invitation = Invitation::query()
            ->published()
            ->where('slug', $slug)
            ->first();

        if (! $invitation) {
            return response()->json([
                'message' => 'This invitation is not published or does not exist.',
            ], 404);
        }

        return response()->json([
            'data' => $presenter->present($invitation),
        ])->header('Cache-Control', 'public, max-age=60');
    }
}
