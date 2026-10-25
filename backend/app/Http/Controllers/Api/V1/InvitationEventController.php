<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\InvitationEventRequest;
use App\Http\Resources\InvitationEventResource;
use App\Models\Invitation;
use App\Models\InvitationEvent;
use App\Services\ActivityLogger;
use App\Services\InvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class InvitationEventController extends Controller
{
    public function __construct(private readonly InvitationService $invitations)
    {
    }

    public function index(Invitation $invitation): JsonResponse
    {
        $this->authorize('view', $invitation);

        return response()->json([
            'data' => InvitationEventResource::collection($invitation->events()->with('image')->get()),
        ]);
    }

    public function store(InvitationEventRequest $request, Invitation $invitation): JsonResponse
    {
        $data = $request->validated();
        $data['timezone'] = $data['timezone'] ?? $invitation->timezone;
        $data['event_at'] = $this->invitations->toUtc($data['event_at'] ?? null, $data['timezone']);
        $data['sort_order'] = $data['sort_order'] ?? ((int) $invitation->events()->max('sort_order') + 1);

        $event = $invitation->events()->create($data);
        ActivityLogger::log($invitation, $request->user(), 'event_added', "Event {$event->title} added");

        return response()->json([
            'data' => new InvitationEventResource($event->load('image')),
            'message' => 'Event added.',
        ], 201);
    }

    public function update(InvitationEventRequest $request, Invitation $invitation, InvitationEvent $event): JsonResponse
    {
        $this->ensureBelongs($invitation, $event);
        $data = $request->validated();

        if (array_key_exists('event_at', $data)) {
            $data['event_at'] = $this->invitations->toUtc(
                $data['event_at'],
                $data['timezone'] ?? $event->timezone
            );
        }

        $event->update($data);
        ActivityLogger::log($invitation, $request->user(), 'event_updated', "Event {$event->title} updated");

        return response()->json([
            'data' => new InvitationEventResource($event->fresh('image')),
            'message' => 'Event saved.',
        ]);
    }

    public function destroy(Request $request, Invitation $invitation, InvitationEvent $event): JsonResponse
    {
        $this->authorize('update', $invitation);
        $this->ensureBelongs($invitation, $event);

        $title = $event->title;
        $event->delete();
        ActivityLogger::log($invitation, $request->user(), 'event_deleted', "Event {$title} deleted");

        return response()->json(['message' => 'Event deleted.']);
    }

    private function ensureBelongs(Invitation $invitation, InvitationEvent $event): void
    {
        abort_unless($event->invitation_id === $invitation->id, 404);
    }
}
