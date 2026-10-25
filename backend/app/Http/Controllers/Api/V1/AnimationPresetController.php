<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\AnimationPresetRequest;
use App\Http\Resources\AnimationPresetResource;
use App\Models\AnimationPreset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class AnimationPresetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $presets = AnimationPreset::query()
            ->withCount('sections')
            ->when($request->filled('active'), fn ($q) => $q->where('is_active', $request->boolean('active')))
            ->orderBy('name')
            ->get();

        return response()->json(['data' => AnimationPresetResource::collection($presets)]);
    }

    public function store(AnimationPresetRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = $this->uniqueSlug($data['slug'] ?? $data['name']);
        $data['is_active'] = $data['is_active'] ?? true;

        $preset = AnimationPreset::query()->create($data);

        return response()->json([
            'data' => new AnimationPresetResource($preset),
            'message' => 'Animation preset created.',
        ], 201);
    }

    public function show(AnimationPreset $animationPreset): JsonResponse
    {
        return response()->json([
            'data' => new AnimationPresetResource($animationPreset->loadCount('sections')),
        ]);
    }

    public function update(AnimationPresetRequest $request, AnimationPreset $animationPreset): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $animationPreset->id);
        }

        $animationPreset->update($data);

        return response()->json([
            'data' => new AnimationPresetResource($animationPreset->fresh()->loadCount('sections')),
            'message' => 'Animation preset saved.',
        ]);
    }

    public function destroy(AnimationPreset $animationPreset): JsonResponse
    {
        if ($animationPreset->sections()->exists() || $animationPreset->themes()->exists()) {
            return response()->json([
                'message' => 'This preset is in use. Remove it from themes and sections before deleting it.',
            ], 409);
        }

        $animationPreset->delete();

        return response()->json(['message' => 'Animation preset deleted.']);
    }

    public function duplicate(AnimationPreset $animationPreset): JsonResponse
    {
        $copy = $animationPreset->replicate(['slug']);
        $copy->name = $animationPreset->name.' Copy';
        $copy->slug = $this->uniqueSlug($animationPreset->slug.'-copy');
        $copy->is_active = false;
        $copy->save();

        return response()->json([
            'data' => new AnimationPresetResource($copy),
            'message' => 'Animation preset duplicated.',
        ], 201);
    }

    private function uniqueSlug(string $value, ?int $exceptId = null): string
    {
        $base = Str::slug($value) ?: 'animation';
        $slug = $base;
        $counter = 2;

        while (AnimationPreset::query()->where('slug', $slug)->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}
