<?php

namespace App\Support;

use Carbon\Carbon;

class DatePayload
{
    public static function make(?Carbon $utc, string $timezone): ?array
    {
        if (! $utc) {
            return null;
        }

        $local = $utc->copy()->setTimezone($timezone);

        return [
            'iso' => $utc->copy()->utc()->toIso8601String(),
            'local_iso' => $local->format('Y-m-d\TH:i'),
            'date' => $local->format('Y-m-d'),
            'time' => $local->format('H:i'),
            'formatted' => $local->format('l, F j, Y'),
            'short_date' => $local->format('M j, Y'),
            'time_formatted' => $local->format('g:i A'),
            'day' => $local->format('d'),
            'month' => $local->format('M'),
            'year' => $local->format('Y'),
            'timezone' => $timezone,
        ];
    }
}
