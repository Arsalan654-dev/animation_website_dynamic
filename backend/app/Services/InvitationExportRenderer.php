<?php

namespace App\Services;

use App\Models\Invitation;
use App\Models\InvitationDesign;

class InvitationExportRenderer
{
    public function __construct(private readonly InvitationDesignService $designs) {}

    public function render(Invitation $invitation, InvitationDesign $design): string
    {
        return view('exports.invitation', $this->designs->exportPayload($invitation, $design))->render();
    }
}
