<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\InvitationRequest;
use App\Http\Resources\InvitationResource;
use App\Http\Resources\InvitationSummaryResource;
use App\Models\Invitation;
use App\Services\InvitationService;
use App\Services\PublicInvitationPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Gate;

class InvitationController extends Controller
{
    public function __construct(private readonly InvitationService $service)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $query = Invitation::query()
            ->with('theme')
            ->withCount(['sections', 'rsvps'])
            ->withSum([
                'rsvps as confirmed_guests_sum' => fn ($q) => $q->where('attendance', 'attending'),
            ], 'guest_count')
            ->when(! $user->isAdmin(), fn ($q) => $q->where('user_id', $user->id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when(! $request->filled('status') && ! $request->boolean('include_archived'), fn ($q) => $q->where('status', '!=', 'archived'))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = '%'.$request->string('search')->trim().'%';
                $q->where(function ($inner) use ($search) {
                    $inner->where('title', 'like', $search)
                        ->orWhere('slug', 'like', $search)
                        ->orWhere('couple_details->partner_one', 'like', $search)
                        ->orWhere('couple_details->partner_two', 'like', $search)
                        ->orWhere('venue_name', 'like', $search);
                });
            });

        $sort = in_array($request->string('sort')->toString(), ['title', 'event_at', 'created_at', 'updated_at'], true)
            ? $request->string('sort')->toString()
            : 'updated_at';
        $direction = $request->string('direction')->toString() === 'asc' ? 'asc' : 'desc';

        $invitations = $query->orderBy($sort, $direction)->paginate(12)->withQueryString();

        return InvitationSummaryResource::collection($invitations);
    }

    public function store(InvitationRequest $request): JsonResponse
    {
        Gate::authorize('create', Invitation::class);

        $invitation = $this->service->create($request->user(), $request->validated());

        return response()->json([
            'data' => new InvitationResource($this->loadFull($invitation)),
            'message' => 'Invitation created as a draft.',
        ], 201);
    }

    public function show(Invitation $invitation): JsonResponse
    {
        Gate::authorize('view', $invitation);

        return response()->json(['data' => new InvitationResource($this->loadFull($invitation))]);
    }

    public function update(InvitationRequest $request, Invitation $invitation): JsonResponse
    {
        $this->authorize('update', $invitation);

        $invitation = $this->service->update($invitation, $request->validated(), $request->user());

        return response()->json([
            'data' => new InvitationResource($this->loadFull($invitation)),
            'message' => 'Invitation saved.',
        ]);
    }

    public function destroy(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorize('delete', $invitation);
        $invitation->delete();

        return response()->json(['message' => 'Invitation deleted.']);
    }

    public function publish(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorize('publish', $invitation);
        $invitation = $this->service->publish($invitation, $request->user());

        return response()->json([
            'data' => new InvitationResource($this->loadFull($invitation)),
            'message' => 'Invitation published.',
        ]);
    }

    public function unpublish(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorize('update', $invitation);
        $invitation = $this->service->unpublish($invitation, $request->user());

        return response()->json([
            'data' => new InvitationResource($this->loadFull($invitation)),
            'message' => 'Invitation moved back to drafts.',
        ]);
    }

    public function archive(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorize('update', $invitation);
        $invitation = $this->service->archive($invitation, $request->user());

        return response()->json([
            'data' => new InvitationResource($this->loadFull($invitation)),
            'message' => 'Invitation archived.',
        ]);
    }

    public function restore(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorize('update', $invitation);
        $invitation = $this->service->restore($invitation, $request->user());

        return response()->json([
            'data' => new InvitationResource($this->loadFull($invitation)),
            'message' => 'Invitation restored to drafts.',
        ]);
    }

    public function duplicate(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorize('duplicate', $invitation);
        $copy = $this->service->duplicate($invitation, $request->user());

        return response()->json([
            'data' => new InvitationResource($this->loadFull($copy)),
            'message' => 'Invitation duplicated as a draft.',
        ], 201);
    }

    public function preview(Invitation $invitation, PublicInvitationPresenter $presenter): JsonResponse
    {
        Gate::authorize('view', $invitation);

        return response()->json([
            'data' => $presenter->present($invitation, includeHidden: false),
            'preview' => true,
        ])->header('Cache-Control', 'no-store');
    }

    private function loadFull(Invitation $invitation): Invitation
    {
        $invitation->load([
            'theme.defaultAnimationPreset',
            'template',
            'sections.animationPreset',
            'events.image',
        ]);

        $invitation->loadCount(['sections', 'rsvps', 'guests']);
        $invitation->loadCount(['rsvps as attending_responses_count' => fn ($q) => $q->where('attendance', 'attending')]);
        $invitation->loadSum([
            'rsvps as confirmed_guests_sum' => fn ($q) => $q->where('attendance', 'attending'),
        ], 'guest_count');

        $mediaIds = collect()
            ->merge(\App\Support\MediaHydrator::referencedIds($invitation->envelope ?? []))
            ->merge($invitation->sections->flatMap(
                fn ($section) => \App\Support\MediaHydrator::referencedIds($section->content ?? [])
            ))
            ->merge($invitation->events->pluck('image_media_id')->filter())
            ->push($invitation->couple_details['story_image_id'] ?? null)
            ->filter()
            ->unique()
            ->values();

        $invitation->setAttribute(
            'media_assets',
            \App\Models\MediaAsset::query()->whereIn('id', $mediaIds)->get()
        );

        return $invitation;
    }
}
