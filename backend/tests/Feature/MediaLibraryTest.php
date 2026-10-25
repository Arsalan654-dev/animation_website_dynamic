<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\MediaAsset;
use App\Models\User;
use App\Services\MediaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MediaLibraryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    public function test_admin_can_upload_an_image_and_edit_its_metadata(): void
    {
        Sanctum::actingAs($this->admin(), ['admin']);

        $response = $this->post('/api/v1/media', [
            'file' => UploadedFile::fake()->image('hero.jpg', 1600, 1000),
            'alt_text' => 'Couple portrait',
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('data.original_name', 'hero.jpg')
            ->assertJsonPath('data.alt_text', 'Couple portrait')
            ->assertJsonPath('data.width', 1600)
            ->assertJsonPath('data.height', 1000)
            ->assertJsonPath('data.is_image', true)
            ->assertJsonPath('data.disk', 'public');

        $assetId = $response->json('data.id');
        $path = $response->json('data.path');

        Storage::disk('public')->assertExists($path);

        $this->patchJson('/api/v1/media/'.$assetId, [
            'alt_text' => 'Ayesha and Hamza on the terrace',
            'caption' => 'Golden hour',
        ])
            ->assertOk()
            ->assertJsonPath('data.alt_text', 'Ayesha and Hamza on the terrace')
            ->assertJsonPath('data.caption', 'Golden hour');
    }

    public function test_admin_can_replace_an_image_and_the_old_file_is_removed(): void
    {
        Sanctum::actingAs($this->admin(), ['admin']);

        $created = $this->post('/api/v1/media', [
            'file' => UploadedFile::fake()->image('original.jpg', 1200, 800),
        ], ['Accept' => 'application/json'])->assertCreated();

        $assetId = $created->json('data.id');
        $oldPath = $created->json('data.path');

        $replaced = $this->post('/api/v1/media/'.$assetId.'/replace', [
            'file' => UploadedFile::fake()->image('replacement.png', 800, 600),
        ], ['Accept' => 'application/json']);

        $replaced->assertOk()
            ->assertJsonPath('data.original_name', 'replacement.png')
            ->assertJsonPath('data.width', 800)
            ->assertJsonPath('data.height', 600);

        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($replaced->json('data.path'));
    }

    public function test_unused_media_can_be_deleted(): void
    {
        Sanctum::actingAs($this->admin(), ['admin']);

        $created = $this->post('/api/v1/media', [
            'file' => UploadedFile::fake()->image('unused.jpg', 900, 600),
        ], ['Accept' => 'application/json'])->assertCreated();

        $assetId = $created->json('data.id');
        $path = $created->json('data.path');

        $this->deleteJson('/api/v1/media/'.$assetId)->assertOk();

        Storage::disk('public')->assertMissing($path);
        $this->assertDatabaseMissing('media_assets', ['id' => $assetId]);
    }

    public function test_media_that_is_still_referenced_cannot_be_deleted(): void
    {
        $admin = $this->admin();
        $asset = MediaAsset::factory()->create();

        $invitation = Invitation::factory()->for($admin)->create();
        $envelope = $invitation->envelope;
        $envelope['cover_media_id'] = $asset->id;
        $invitation->update(['envelope' => $envelope]);

        Sanctum::actingAs($admin, ['admin']);

        $this->deleteJson('/api/v1/media/'.$asset->id)
            ->assertStatus(409)
            ->assertJsonPath('usages.0.type', 'invitation')
            ->assertJsonPath('usages.0.id', $invitation->id);
    }

    public function test_media_index_supports_search_and_reports_pagination_meta(): void
    {
        Sanctum::actingAs($this->admin(), ['admin']);

        MediaAsset::factory()->create(['original_name' => 'sunset-portrait.jpg']);
        MediaAsset::factory()->create(['original_name' => 'garden-detail.jpg']);

        $this->getJson('/api/v1/media?search=sunset')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.original_name', 'sunset-portrait.jpg')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_upload_validation_rejects_non_image_files(): void
    {
        Sanctum::actingAs($this->admin(), ['admin']);

        $this->post('/api/v1/media', [
            'file' => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf'),
        ], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    }

    public function test_planners_cannot_delete_another_planners_media(): void
    {
        $owner = User::factory()->create(['role' => 'planner']);
        $other = User::factory()->create(['role' => 'planner']);
        $asset = MediaAsset::factory()->create(['user_id' => $owner->id]);

        Sanctum::actingAs($other, ['admin']);

        $this->deleteJson('/api/v1/media/'.$asset->id)->assertForbidden();
        $this->assertDatabaseHas('media_assets', ['id' => $asset->id]);
    }

    public function test_vercel_blob_uploads_use_the_current_blob_api(): void
    {
        config([
            'wedding.upload.driver' => 'vercel_blob',
            'services.vercel_blob.token' => 'vercel_blob_rw_teststore123_secret',
            'services.vercel_blob.access' => 'public',
        ]);

        Http::fake([
            'vercel.com/api/blob/*' => Http::response([
                'url' => 'https://teststore123.public.blob.vercel-storage.com/media/2026/10/hero.jpg',
                'pathname' => 'media/2026/10/hero.jpg',
            ]),
        ]);

        $asset = app(MediaService::class)->upload(
            UploadedFile::fake()->image('hero.jpg', 1200, 800),
            $this->admin()
        );

        $this->assertSame('vercel_blob', $asset->disk);
        $this->assertSame(
            'https://teststore123.public.blob.vercel-storage.com/media/2026/10/hero.jpg',
            $asset->path
        );

        Http::assertSent(fn (Request $request): bool => $request->method() === 'PUT'
            && str_starts_with($request->url(), 'https://vercel.com/api/blob/?pathname=media%2F')
            && $request->hasHeader('x-api-version', '13')
            && $request->hasHeader('x-vercel-blob-store-id', 'teststore123')
            && $request->hasHeader('x-vercel-blob-access', 'public')
            && $request->hasHeader('x-content-type', 'image/jpeg')
            && $request->hasHeader('authorization', 'Bearer vercel_blob_rw_teststore123_secret'));
    }

    public function test_vercel_blob_deletes_use_the_current_blob_api(): void
    {
        config([
            'services.vercel_blob.token' => 'vercel_blob_rw_teststore123_secret',
        ]);

        Http::fake([
            'vercel.com/api/blob/delete' => Http::response(['deleted' => true]),
        ]);

        $url = 'https://teststore123.public.blob.vercel-storage.com/media/2026/10/hero.jpg';

        app(MediaService::class)->deleteStoredFile('vercel_blob', $url);

        Http::assertSent(fn (Request $request): bool => $request->method() === 'POST'
            && $request->url() === 'https://vercel.com/api/blob/delete'
            && $request['urls'] === [$url]
            && $request->hasHeader('x-api-version', '13')
            && $request->hasHeader('x-vercel-blob-store-id', 'teststore123'));
    }

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }
}
