<?php

namespace App\Console\Commands;

use App\Models\Invitation;
use App\Services\InvitationDesignService;
use Illuminate\Console\Command;

class BackfillInvitationDesigns extends Command
{
    protected $signature = 'designs:backfill {--dry-run : Report how many designs would be created without writing}';

    protected $description = 'Create a default design snapshot for every invitation that does not have one';

    public function handle(InvitationDesignService $service): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $created = 0;

        Invitation::query()
            ->with('user')
            ->doesntHave('designs')
            ->chunkById(100, function ($invitations) use ($service, $dryRun, &$created) {
                foreach ($invitations as $invitation) {
                    if (! $dryRun) {
                        $service->ensureDefaultDesign($invitation, $invitation->user);
                    }

                    $created++;
                }
            });

        $verb = $dryRun ? 'Would create' : 'Created';

        $this->info($verb.' '.$created.' default design(s).');

        return self::SUCCESS;
    }
}
