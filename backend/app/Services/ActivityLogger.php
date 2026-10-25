<?php

namespace App\Services;

use App\Models\Invitation;
use App\Models\InvitationActivity;
use App\Models\User;

class ActivityLogger
{
    public static function log(
        Invitation $invitation,
        ?User $user,
        string $type,
        string $description,
        array $meta = []
    ): InvitationActivity {
        return InvitationActivity::query()->create([
            'invitation_id' => $invitation->id,
            'user_id' => $user?->id,
            'type' => $type,
            'description' => $description,
            'meta' => $meta ?: null,
        ]);
    }
}
