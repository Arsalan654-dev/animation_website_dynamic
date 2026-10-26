<?php

use App\Http\Controllers\Api\V1\AnimationPresetController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\GuestController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\InvitationController;
use App\Http\Controllers\Api\V1\InvitationDesignController;
use App\Http\Controllers\Api\V1\InvitationEventController;
use App\Http\Controllers\Api\V1\InvitationSectionController;
use App\Http\Controllers\Api\V1\MediaController;
use App\Http\Controllers\Api\V1\PublicInvitationController;
use App\Http\Controllers\Api\V1\PublicRsvpController;
use App\Http\Controllers\Api\V1\RsvpAdminController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\TemplateController;
use App\Http\Controllers\Api\V1\ThemeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', HealthController::class);

    /*
    |--------------------------------------------------------------------------
    | Public API
    |--------------------------------------------------------------------------
    */
    Route::prefix('public')->group(function () {
        Route::get('/invitations/{slug}', [PublicInvitationController::class, 'show']);
        Route::get('/invitations/{slug}/guest-code/{code}', [PublicRsvpController::class, 'verifyGuest'])
            ->middleware('throttle:20,1');
        Route::post('/invitations/{slug}/rsvp', [PublicRsvpController::class, 'store'])
            ->middleware('throttle:rsvp');
    });

    /*
    |--------------------------------------------------------------------------
    | Admin authentication
    |--------------------------------------------------------------------------
    */
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    /*
    |--------------------------------------------------------------------------
    | Admin API
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:sanctum', 'active', 'abilities:admin'])->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::get('/dashboard', DashboardController::class);

        Route::get('/settings', [SettingController::class, 'show']);
        Route::patch('/settings', [SettingController::class, 'update']);

        Route::apiResource('themes', ThemeController::class);
        Route::post('/themes/{theme}/duplicate', [ThemeController::class, 'duplicate']);

        Route::apiResource('templates', TemplateController::class);
        Route::post('/templates/{template}/duplicate', [TemplateController::class, 'duplicate']);

        Route::apiResource('animation-presets', AnimationPresetController::class);
        Route::post('/animation-presets/{animationPreset}/duplicate', [AnimationPresetController::class, 'duplicate']);

        Route::get('/media', [MediaController::class, 'index']);
        Route::post('/media', [MediaController::class, 'store']);
        Route::get('/media/{asset}', [MediaController::class, 'show']);
        Route::patch('/media/{asset}', [MediaController::class, 'update']);
        Route::post('/media/{asset}/replace', [MediaController::class, 'replace']);
        Route::delete('/media/{asset}', [MediaController::class, 'destroy']);

        Route::apiResource('invitations', InvitationController::class);
        Route::get('/invitations/{invitation}/preview', [InvitationController::class, 'preview']);
        Route::post('/invitations/{invitation}/publish', [InvitationController::class, 'publish']);
        Route::post('/invitations/{invitation}/unpublish', [InvitationController::class, 'unpublish']);
        Route::post('/invitations/{invitation}/archive', [InvitationController::class, 'archive']);
        Route::post('/invitations/{invitation}/restore', [InvitationController::class, 'restore']);
        Route::post('/invitations/{invitation}/duplicate', [InvitationController::class, 'duplicate']);

        Route::get('/designs', [InvitationDesignController::class, 'library']);
        Route::get('/invitations/{invitation}/designs', [InvitationDesignController::class, 'index']);
        Route::post('/invitations/{invitation}/designs', [InvitationDesignController::class, 'store']);
        Route::get('/invitations/{invitation}/designs/{design}', [InvitationDesignController::class, 'show']);
        Route::patch('/invitations/{invitation}/designs/{design}', [InvitationDesignController::class, 'update']);
        Route::post('/invitations/{invitation}/designs/{design}/activate', [InvitationDesignController::class, 'activate']);
        Route::post('/invitations/{invitation}/designs/{design}/save-current', [InvitationDesignController::class, 'saveCurrent']);
        Route::post('/invitations/{invitation}/designs/{design}/duplicate', [InvitationDesignController::class, 'duplicate']);
        Route::delete('/invitations/{invitation}/designs/{design}', [InvitationDesignController::class, 'destroy']);
        Route::get('/invitations/{invitation}/designs/{design}/versions', [InvitationDesignController::class, 'versions']);
        Route::post('/invitations/{invitation}/designs/{design}/versions/{version}/restore', [InvitationDesignController::class, 'restoreVersion']);
        Route::get('/invitations/{invitation}/designs/{design}/export', [InvitationDesignController::class, 'export']);

        Route::get('/invitations/{invitation}/sections', [InvitationSectionController::class, 'index']);
        Route::post('/invitations/{invitation}/sections', [InvitationSectionController::class, 'store']);
        Route::post('/invitations/{invitation}/sections/reorder', [InvitationSectionController::class, 'reorder']);
        Route::put('/invitations/{invitation}/sections/{section}', [InvitationSectionController::class, 'update']);
        Route::patch('/invitations/{invitation}/sections/{section}', [InvitationSectionController::class, 'update']);
        Route::delete('/invitations/{invitation}/sections/{section}', [InvitationSectionController::class, 'destroy']);
        Route::post('/invitations/{invitation}/sections/{section}/duplicate', [InvitationSectionController::class, 'duplicate']);

        Route::get('/invitations/{invitation}/events', [InvitationEventController::class, 'index']);
        Route::post('/invitations/{invitation}/events', [InvitationEventController::class, 'store']);
        Route::put('/invitations/{invitation}/events/{event}', [InvitationEventController::class, 'update']);
        Route::delete('/invitations/{invitation}/events/{event}', [InvitationEventController::class, 'destroy']);

        Route::get('/invitations/{invitation}/guests', [GuestController::class, 'index']);
        Route::post('/invitations/{invitation}/guests', [GuestController::class, 'store']);
        Route::put('/invitations/{invitation}/guests/{guest}', [GuestController::class, 'update']);
        Route::delete('/invitations/{invitation}/guests/{guest}', [GuestController::class, 'destroy']);

        Route::get('/rsvps', [RsvpAdminController::class, 'index']);
        Route::get('/rsvps/export', [RsvpAdminController::class, 'export']);
        Route::get('/rsvps/{rsvp}', [RsvpAdminController::class, 'show']);
        Route::patch('/rsvps/{rsvp}', [RsvpAdminController::class, 'update']);
        Route::delete('/rsvps/{rsvp}', [RsvpAdminController::class, 'destroy']);
    });
});
