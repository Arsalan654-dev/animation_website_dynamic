<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        try {
            DB::select('select 1');
            $database = 'ok';
            $status = 200;
        } catch (\Throwable) {
            $database = 'unavailable';
            $status = 503;
        }

        return response()->json([
            'data' => [
                'status' => $status === 200 ? 'ok' : 'degraded',
                'database' => $database,
                'timestamp' => now()->toIso8601String(),
            ],
        ], $status);
    }
}
