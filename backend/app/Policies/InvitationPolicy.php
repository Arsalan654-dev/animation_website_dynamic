<?php

namespace App\Policies;

use App\Models\Invitation;
use App\Models\User;

class InvitationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Invitation $invitation): bool
    {
        return $user->canManageInvitation($invitation);
    }

    public function create(User $user): bool
    {
        return $user->is_active;
    }

    public function update(User $user, Invitation $invitation): bool
    {
        return $user->canManageInvitation($invitation);
    }

    public function delete(User $user, Invitation $invitation): bool
    {
        return $user->canManageInvitation($invitation);
    }

    public function duplicate(User $user, Invitation $invitation): bool
    {
        return $user->canManageInvitation($invitation);
    }

    public function publish(User $user, Invitation $invitation): bool
    {
        return $user->canManageInvitation($invitation);
    }
}
