<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\RsvpResource;
use App\Models\RsvpSubmission;
use App\Services\DashboardService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RsvpAdminController extends Controller
{
    public function index(Request $request, DashboardService $dashboard): JsonResponse
    {
        $query = $this->filteredQuery($request)->with('invitation:id,title,slug');
        $summaryQuery = clone $query;

        $summaryRows = $summaryQuery
            ->reorder()
            ->selectRaw("attendance, count(*) as responses, coalesce(sum(guest_count), 0) as guests")
            ->groupBy('attendance')
            ->get()
            ->keyBy('attendance');

        $rows = $query->latest()->paginate(20)->withQueryString();

        return response()->json([
            'data' => RsvpResource::collection($rows->items())->resolve(),
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
                'summary' => [
                    'total_responses' => $summaryRows->sum(fn ($row) => (int) $row->responses),
                    'attending_responses' => (int) ($summaryRows['attending']->responses ?? 0),
                    'declined_responses' => (int) ($summaryRows['declined']->responses ?? 0),
                    'confirmed_guests' => (int) ($summaryRows['attending']->guests ?? 0),
                ],
            ],
        ]);
    }

    public function show(Request $request, RsvpSubmission $rsvp): JsonResponse
    {
        $this->authorizeAccess($request, $rsvp->invitation);

        return response()->json([
            'data' => new RsvpResource($rsvp->load('invitation:id,title,slug')),
        ]);
    }

    public function update(Request $request, RsvpSubmission $rsvp): JsonResponse
    {
        $this->authorizeAccess($request, $rsvp->invitation);

        $data = $request->validate([
            'admin_notes' => ['sometimes', 'nullable', 'string', 'max:3000'],
        ]);

        $rsvp->update($data);

        return response()->json([
            'data' => new RsvpResource($rsvp->fresh('invitation')),
            'message' => 'RSVP notes saved.',
        ]);
    }

    public function destroy(Request $request, RsvpSubmission $rsvp): JsonResponse
    {
        $this->authorizeAccess($request, $rsvp->invitation);
        $rsvp->delete();

        return response()->json(['message' => 'RSVP deleted.']);
    }

    public function export(Request $request): StreamedResponse
    {
        $rows = $this->filteredQuery($request)->with('invitation:id,title,slug')->latest()->get();
        $filename = 'rsvps-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, [
                'ID', 'Invitation', 'Guest name', 'Email', 'Phone', 'Attendance',
                'Guest count', 'Message', 'Custom answers', 'Guest code', 'Submitted at',
            ]);

            foreach ($rows as $row) {
                fputcsv($out, [
                    $row->id,
                    $row->invitation?->title,
                    $row->guest_name,
                    $row->email,
                    $row->phone,
                    $row->attendance,
                    $row->guest_count,
                    $row->message,
                    $row->answers ? json_encode($row->answers, JSON_UNESCAPED_UNICODE) : '',
                    $row->guest_code,
                    $row->created_at?->toIso8601String(),
                ]);
            }

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store',
        ]);
    }

    private function filteredQuery(Request $request): Builder
    {
        $user = $request->user();

        return RsvpSubmission::query()
            ->when(! $user->isAdmin(), fn ($q) => $q->whereHas(
                'invitation',
                fn ($inner) => $inner->where('user_id', $user->id)
            ))
            ->when($request->filled('invitation_id'), fn ($q) => $q->where('invitation_id', $request->integer('invitation_id')))
            ->when($request->filled('attendance'), fn ($q) => $q->where('attendance', $request->string('attendance')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = '%'.$request->string('search')->trim().'%';
                $q->where(function ($inner) use ($search) {
                    $inner->where('guest_name', 'like', $search)
                        ->orWhere('email', 'like', $search)
                        ->orWhere('phone', 'like', $search);
                });
            })
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date('to')));
    }

    private function authorizeAccess(Request $request, $invitation): void
    {
        abort_unless(
            $request->user()->isAdmin() || $invitation->user_id === $request->user()->id,
            403
        );
    }
}
