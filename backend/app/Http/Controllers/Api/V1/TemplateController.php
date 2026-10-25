<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\TemplateRequest;
use App\Http\Resources\TemplateResource;
use App\Models\Template;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class TemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $templates = Template::query()
            ->with('defaultTheme')
            ->withCount('invitations')
            ->when($request->filled('active'), fn ($q) => $q->where('is_active', $request->boolean('active')))
            ->orderBy('name')
            ->get();

        return response()->json(['data' => TemplateResource::collection($templates)]);
    }

    public function store(TemplateRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = $this->uniqueSlug($data['slug'] ?? $data['name']);
        $data['is_active'] = $data['is_active'] ?? true;
        $data['layout'] = $this->normalizeLayout($data['layout']);

        $template = Template::query()->create($data);

        return response()->json([
            'data' => new TemplateResource($template->load('defaultTheme')),
            'message' => 'Template created.',
        ], 201);
    }

    public function show(Template $template): JsonResponse
    {
        return response()->json([
            'data' => new TemplateResource($template->load('defaultTheme')->loadCount('invitations')),
        ]);
    }

    public function update(TemplateRequest $request, Template $template): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['slug'])) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $template->id);
        }

        if (isset($data['layout'])) {
            $data['layout'] = $this->normalizeLayout($data['layout']);
        }

        $template->update($data);

        return response()->json([
            'data' => new TemplateResource($template->fresh('defaultTheme')->loadCount('invitations')),
            'message' => 'Template saved.',
        ]);
    }

    public function destroy(Template $template): JsonResponse
    {
        if ($template->invitations()->exists()) {
            return response()->json([
                'message' => 'This template is used by invitations. Reassign them before deleting it.',
            ], 409);
        }

        $template->delete();

        return response()->json(['message' => 'Template deleted.']);
    }

    public function duplicate(Template $template): JsonResponse
    {
        $copy = $template->replicate(['slug']);
        $copy->name = $template->name.' Copy';
        $copy->slug = $this->uniqueSlug($template->slug.'-copy');
        $copy->is_active = false;
        $copy->save();

        return response()->json([
            'data' => new TemplateResource($copy->load('defaultTheme')),
            'message' => 'Template duplicated.',
        ], 201);
    }

    private function normalizeLayout(array $layout): array
    {
        if (isset($layout['sections']) && is_array($layout['sections'])) {
            return $layout;
        }

        return ['sections' => array_values($layout)];
    }

    private function uniqueSlug(string $value, ?int $exceptId = null): string
    {
        $base = Str::slug($value) ?: 'template';
        $slug = $base;
        $counter = 2;

        while (Template::query()->where('slug', $slug)->when($exceptId, fn ($q) => $q->whereKeyNot($exceptId))->exists()) {
            $slug = $base.'-'.$counter++;
        }

        return $slug;
    }
}
