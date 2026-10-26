<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class InvitationDesignResource extends InvitationDesignSummaryResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'snapshot' => $this->snapshot ?? [],
            'versions_count' => $this->whenCounted('versions'),
        ]);
    }
}
