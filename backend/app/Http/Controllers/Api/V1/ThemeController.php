<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ThemeRequest;
use App\Http\Resources\ThemeResource;
use App\Models\Theme;
use App\Support\ThemeTokens;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ThemeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $themes = Theme::query()
            ->with('defaultAnimationPreset')
            ->withCount('invitations')
            ->when($request->filled('active'), fn ($q) => $q->where('is_active', $request->boolean('active')))
            ->orderBy('name')
            ->get();

        return response()->json(['data' => ThemeResource::collection($themes)]);
    }

    public function store(ThemeRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = $this->uniqueSlug($data['slug'] ?? $data['name']);
        $data['tokens'] = ThemeTokens::sanitize($data['tokens']);
        $data['is_active'] = $data['is_active'] ?? true;

        $theme = Theme::query()->create($data);

        return response()->json([
            'data' => new ThemeResource($theme->load('defaultAnimationPreset')),
            'message' => 'Theme created.',
        ], 201);
    }

    public function show(Theme $theme): JsonResponse
    {
        return response()->json([
            'data' => new ThemeResource($theme->load('defaultAnimationPreset')->loadCount('invitations')),
        ]);
    }

    public function update(ThemeRequest $request, Theme $theme): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $theme->id);
        }

        if (isset($data['tokens'])) {
            $data['tokens'] = ThemeTokens::sanitize($data['tokens']);
        }

        $theme->update($data);

        return response()->json([
            'data' => new ThemeResource($theme->fresh('defaultAnimationPreset')->loadCount('invitations')),
            'message' => 'Theme saved.',
        ]);
    }

    public function destroy(Theme $theme): JsonResponse
    {
        if ($theme->invitations()->exists()) {
            return response()->json([
                'message' => 'This theme is assigned to invitations. Reassign them before deleting it.',
            ], 409);
        }

        $theme->delete();

        return response()->json(['message' => 'Theme deleted.']);
    }

    public function duplicate(Theme $theme): JsonResponse
    {
        $copy = $theme->replicate(['slug']);
        $copy->name = $theme->name.' Copy';
        $copy->slug = $this->uniqueSlug($theme->slug.'-copy');
        $copy->is_active = false;
        $copy->save();

        return response()->json([
            'data' => new ThemeResource($copy->load('defaultAnimationPreset')),
            'message' => 'Theme duplicated.',
        ], 201);
    }

    private function uniqueSlug(string $value, ?int $exceptId = null): string
    {
        $base = Str::slug($value) ?: 'theme';
        $slug = $base;
        $counter = 2;

        while (Theme::query()->where('slug', $slug)->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}
