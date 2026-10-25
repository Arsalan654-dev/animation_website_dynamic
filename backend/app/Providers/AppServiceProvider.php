<?php

namespace App\Providers;

use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('rsvp', function (Request $request) {
            return [
                Limit::perMinute(8)->by('rsvp|'.$request->ip().'|'.$request->route('slug')),
                Limit::perDay(200)->by('rsvp-day|'.$request->ip()),
            ];
        });

        $this->app['router']->aliasMiddleware('active', EnsureUserIsActive::class);
        $this->app['router']->aliasMiddleware('abilities', CheckAbilities::class);
        $this->app['router']->aliasMiddleware('ability', CheckForAnyAbility::class);
    }
}
