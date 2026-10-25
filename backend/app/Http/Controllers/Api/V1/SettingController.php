<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Setting;
use App\Http\Requests\SettingsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class SettingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'data' => [
                'animations_enabled' => (bool) Setting::value('animations_enabled', true),
                'site_name' => Setting::value('site_name', 'Ever After Studio'),
            ],
        ]);
    }

    public function update(SettingsRequest $request): JsonResponse
    {
        foreach ($request->validated() as $key => $value) {
            Setting::put($key, $value);
        }

        return response()->json([
            'data' => [
                'animations_enabled' => (bool) Setting::value('animations_enabled', true),
                'site_name' => Setting::value('site_name', 'Ever After Studio'),
            ],
            'message' => 'Studio settings saved.',
        ]);
    }
}
