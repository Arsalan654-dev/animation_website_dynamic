<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\InvitationDesignRequest;
use App\Http\Resources\InvitationDesignResource;
use App\Http\Resources\InvitationDesignSummaryResource;
use App\Http\Resources\InvitationDesignVersionResource;
use App\Models\Invitation;
use App\Models\InvitationDesign;
use App\Services\InvitationDesignService;
use App\Services\InvitationExportRenderer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class InvitationDesignController extends Controller
{
    public function __construct(private readonly InvitationDesignService $service) {}

    public function library(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $query = InvitationDesign::query()
            ->with(['invitation', 'creator'])
            ->when(! $user->isAdmin(), fn ($q) => $q->whereHas(
                'invitation',
                fn ($invitationQuery) => $invitationQuery->where('user_id', $user->id)
            ))
            ->when($request->filled('invitation_id'), fn ($q) => $q->where('invitation_id', $request->integer('invitation_id')))
            ->when($request->filled('active'), fn ($q) => $q->where('is_active', $request->boolean('active')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = '%'.$request->string('search')->trim().'%';
                $q->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', $search)
                        ->orWhere('description', 'like', $search)
                        ->orWhereHas('invitation', function ($invitationQuery) use ($search) {
                            $invitationQuery->where('title', 'like', $search)
                                ->orWhere('slug', 'like', $search);
                        });
                });
            });

        $designs = $query
            ->orderByDesc('is_active')
            ->orderByDesc('updated_at')
            ->paginate(24)
            ->withQueryString();

        return InvitationDesignSummaryResource::collection($designs);
    }

    public function index(Request $request, Invitation $invitation): AnonymousResourceCollection
    {
        $this->authorize('view', $invitation);

        $this->service->ensureDefaultDesign($invitation, $request->user());

        $designs = $invitation->designs()
            ->with('creator')
            ->withCount('versions')
            ->get();

        return InvitationDesignSummaryResource::collection($designs);
    }

    public function store(InvitationDesignRequest $request, Invitation $invitation): JsonResponse
    {
        $this->authorize('update', $invitation);

        $design = $this->service->create($invitation, $request->user(), $request->validated());
        $design->load(['creator', 'updater'])->loadCount('versions');

        return response()->json([
            'data' => new InvitationDesignResource($design),
            'message' => 'Design saved.',
        ], 201);
    }

    public function show(Invitation $invitation, InvitationDesign $design): JsonResponse
    {
        $this->authorize('view', $invitation);
        $this->ensureBelongs($invitation, $design);

        $design->load(['creator', 'updater'])->loadCount('versions');

        return response()->json(['data' => new InvitationDesignResource($design)]);
    }

    public function update(InvitationDesignRequest $request, Invitation $invitation, InvitationDesign $design): JsonResponse
    {
        $this->authorize('update', $invitation);
        $this->ensureBelongs($invitation, $design);

        $design = $this->service->update($design, $request->user(), $request->validated());
        $design->load(['creator', 'updater'])->loadCount('versions');

        return response()->json([
            'data' => new InvitationDesignResource($design),
            'message' => 'Design updated.',
        ]);
    }

    public function activate(Request $request, Invitation $invitation, InvitationDesign $design): JsonResponse
    {
        $this->authorize('update', $invitation);
        $this->ensureBelongs($invitation, $design);

        $design = $this->service->activate($design, $request->user());
        $design->load(['creator', 'updater'])->loadCount('versions');

        return response()->json([
            'data' => new InvitationDesignResource($design),
            'message' => 'Design is now live on the invitation.',
        ]);
    }

    public function saveCurrent(Request $request, Invitation $invitation, InvitationDesign $design): JsonResponse
    {
        $this->authorize('update', $invitation);
        $this->ensureBelongs($invitation, $design);

        $design = $this->service->saveCurrent(
            $design,
            $invitation,
            $request->user(),
            $request->input('label')
        );
        $design->load(['creator', 'updater'])->loadCount('versions');

        return response()->json([
            'data' => new InvitationDesignResource($design),
            'message' => 'Current invitation saved into the design.',
        ]);
    }

    public function duplicate(Request $request, Invitation $invitation, InvitationDesign $design): JsonResponse
    {
        $this->authorize('update', $invitation);
        $this->ensureBelongs($invitation, $design);

        $copy = $this->service->duplicate($design, $request->user());
        $copy->load(['creator', 'updater'])->loadCount('versions');

        return response()->json([
            'data' => new InvitationDesignResource($copy),
            'message' => 'Design duplicated.',
        ], 201);
    }

    public function destroy(Request $request, Invitation $invitation, InvitationDesign $design): JsonResponse
    {
        $this->authorize('update', $invitation);
        $this->ensureBelongs($invitation, $design);

        $this->service->delete($design, $request->user());

        return response()->json(['message' => 'Design deleted.']);
    }

    public function versions(Invitation $invitation, InvitationDesign $design): AnonymousResourceCollection
    {
        $this->authorize('view', $invitation);
        $this->ensureBelongs($invitation, $design);

        $versions = $design->versions()
            ->with('creator')
            ->paginate(30)
            ->withQueryString();

        return InvitationDesignVersionResource::collection($versions);
    }

    public function restoreVersion(Request $request, Invitation $invitation, InvitationDesign $design, int $version): JsonResponse
    {
        $this->authorize('update', $invitation);
        $this->ensureBelongs($invitation, $design);

        $versionModel = $design->versions()->whereKey($version)->firstOrFail();
        $design = $this->service->restoreVersion($design, $versionModel, $request->user());
        $design->load(['creator', 'updater'])->loadCount('versions');

        return response()->json([
            'data' => new InvitationDesignResource($design),
            'message' => 'Version restored.',
        ]);
    }

    public function export(
        Request $request,
        Invitation $invitation,
        InvitationDesign $design,
        InvitationExportRenderer $renderer
    ): Response {
        $this->authorize('view', $invitation);
        $this->ensureBelongs($invitation, $design);

        $html = $renderer->render($invitation, $design);
        $filename = Str::slug($invitation->slug.'-'.$design->name).'.html';
        $inline = $request->boolean('inline');

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => ($inline ? 'inline' : 'attachment').'; filename="'.$filename.'"',
            'Cache-Control' => 'no-store, max-age=0',
        ]);
    }

    private function ensureBelongs(Invitation $invitation, InvitationDesign $design): void
    {
        abort_unless((int) $design->invitation_id === (int) $invitation->id, 404);
    }
}
