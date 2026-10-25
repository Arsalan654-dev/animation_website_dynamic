<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\InvitationSectionRequest;
use App\Http\Requests\ReorderSectionsRequest;
use App\Http\Resources\InvitationSectionResource;
use App\Models\Invitation;
use App\Models\InvitationSection;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class InvitationSectionController extends Controller
{
    public function index(Invitation $invitation): JsonResponse
    {
        $this->authorize('view', $invitation);

        return response()->json([
            'data' => InvitationSectionResource::collection(
                $invitation->sections()->with('animationPreset')->get()
            ),
        ]);
    }

    public function store(InvitationSectionRequest $request, Invitation $invitation): JsonResponse
    {
        $data = $request->validated();
        $data['sort_order'] = $data['sort_order'] ?? ((int) $invitation->sections()->max('sort_order') + 1);
        $data['is_visible'] = $data['is_visible'] ?? true;

        $section = $invitation->sections()->create($data);
        ActivityLogger::log($invitation, $request->user(), 'section_added', ucfirst($section->type).' section added');

        return response()->json([
            'data' => new InvitationSectionResource($section->load('animationPreset')),
            'message' => 'Section added.',
        ], 201);
    }

    public function update(
        InvitationSectionRequest $request,
        Invitation $invitation,
        InvitationSection $section
    ): JsonResponse {
        $this->ensureBelongs($invitation, $section);

        $section->update($request->validated());
        ActivityLogger::log($invitation, $request->user(), 'section_updated', ucfirst($section->type).' section updated');

        return response()->json([
            'data' => new InvitationSectionResource($section->fresh('animationPreset')),
            'message' => 'Section saved.',
        ]);
    }

    public function destroy(Request $request, Invitation $invitation, InvitationSection $section): JsonResponse
    {
        $this->authorize('update', $invitation);
        $this->ensureBelongs($invitation, $section);

        $type = $section->type;
        $section->delete();
        ActivityLogger::log($invitation, $request->user(), 'section_deleted', ucfirst($type).' section deleted');

        return response()->json(['message' => 'Section deleted.']);
    }

    public function duplicate(Request $request, Invitation $invitation, InvitationSection $section): JsonResponse
    {
        $this->authorize('update', $invitation);
        $this->ensureBelongs($invitation, $section);

        $copy = $invitation->sections()->create([
            'type' => $section->type,
            'title' => $section->title ? $section->title.' (Copy)' : null,
            'content' => $section->content,
            'design' => $section->design,
            'animation_preset_id' => $section->animation_preset_id,
            'animation_config' => $section->animation_config,
            'sort_order' => (int) $invitation->sections()->max('sort_order') + 1,
            'is_visible' => $section->is_visible,
        ]);

        ActivityLogger::log($invitation, $request->user(), 'section_duplicated', ucfirst($section->type).' section duplicated');

        return response()->json([
            'data' => new InvitationSectionResource($copy->load('animationPreset')),
            'message' => 'Section duplicated.',
        ], 201);
    }

    public function reorder(ReorderSectionsRequest $request, Invitation $invitation): JsonResponse
    {
        $ids = collect($request->validated()['sections'])->pluck('id');
        $owned = $invitation->sections()->whereIn('id', $ids)->pluck('id');

        if ($owned->count() !== $ids->count()) {
            abort(422, 'One or more sections do not belong to this invitation.');
        }

        DB::transaction(function () use ($request, $invitation) {
            foreach ($request->validated()['sections'] as $row) {
                $invitation->sections()->whereKey($row['id'])->update(['sort_order' => $row['sort_order']]);
            }
        });

        ActivityLogger::log($invitation, $request->user(), 'sections_reordered', 'Section order updated');

        return response()->json([
            'data' => InvitationSectionResource::collection(
                $invitation->sections()->with('animationPreset')->get()
            ),
            'message' => 'Section order saved.',
        ]);
    }

    private function ensureBelongs(Invitation $invitation, InvitationSection $section): void
    {
        abort_unless($section->invitation_id === $invitation->id, 404);
    }
}
