<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\MediaUpdateRequest;
use App\Http\Requests\MediaUploadRequest;
use App\Http\Resources\MediaResource;
use App\Models\MediaAsset;
use App\Services\MediaService;
use App\Services\MediaUsageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class MediaController extends Controller
{
    public function __construct(
        private readonly MediaService $media,
        private readonly MediaUsageService $usage,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $assets = MediaAsset::query()
            ->when($request->filled('search'), fn ($q) => $q->where(function ($inner) use ($request) {
                $search = '%'.$request->string('search')->trim().'%';
                $inner->where('original_name', 'like', $search)
                    ->orWhere('alt_text', 'like', $search)
                    ->orWhere('caption', 'like', $search);
            }))
            ->latest()
            ->paginate(24)
            ->withQueryString();

        return response()->json([
            'data' => MediaResource::collection($assets->items())->resolve(),
            'meta' => [
                'current_page' => $assets->currentPage(),
                'last_page' => $assets->lastPage(),
                'per_page' => $assets->perPage(),
                'total' => $assets->total(),
            ],
        ]);
    }

    public function store(MediaUploadRequest $request): JsonResponse
    {
        $asset = $this->media->upload($request->file('file'), $request->user(), $request->validated());

        return response()->json([
            'data' => new MediaResource($asset),
            'message' => 'Image uploaded.',
        ], 201);
    }

    public function show(MediaAsset $asset): JsonResponse
    {
        return response()->json([
            'data' => new MediaResource($asset),
            'usages' => $this->usage->usages($asset),
        ]);
    }

    public function update(MediaUpdateRequest $request, MediaAsset $asset): JsonResponse
    {
        $asset->update($request->validated());

        return response()->json([
            'data' => new MediaResource($asset->fresh()),
            'message' => 'Image details saved.',
        ]);
    }

    public function replace(MediaUploadRequest $request, MediaAsset $asset): JsonResponse
    {
        abort_unless($request->user()->isAdmin() || $asset->user_id === $request->user()->id, 403);

        $asset = $this->media->replace($asset, $request->file('file'));

        return response()->json([
            'data' => new MediaResource($asset),
            'message' => 'Image replaced. Every invitation using it now shows the new file.',
        ]);
    }

    public function destroy(Request $request, MediaAsset $asset): JsonResponse
    {
        abort_unless($request->user()->isAdmin() || $asset->user_id === $request->user()->id, 403);

        $usages = $this->usage->usages($asset);

        if ($usages) {
            return response()->json([
                'message' => 'This image is still in use. Remove it from the items below first.',
                'usages' => $usages,
            ], 409);
        }

        $this->media->deleteStoredFile($asset->disk, $asset->path);
        $asset->delete();

        return response()->json(['message' => 'Image deleted.']);
    }
}
