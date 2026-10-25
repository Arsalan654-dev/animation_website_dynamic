<?php

namespace App\Services;

use App\Models\MediaAsset;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class MediaService
{
    /**
     * Store an upload on the configured disk. Vercel Blob is supported for
     * serverless deployments where the local filesystem is ephemeral.
     */
    public function upload(UploadedFile $file, ?User $user, array $meta = []): MediaAsset
    {
        $mime = $file->getMimeType() ?: 'application/octet-stream';
        $extension = $file->guessExtension() ?: 'bin';
        $directory = 'media/'.now()->format('Y/m');
        $filename = Str::uuid().'.'.$extension;

        [$disk, $path] = $this->storeFile($file, $directory.'/'.$filename, $mime);
        [$width, $height] = $this->dimensions($file);

        return MediaAsset::query()->create([
            'user_id' => $user?->id,
            'disk' => $disk,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $mime,
            'size' => $file->getSize(),
            'width' => $width,
            'height' => $height,
            'alt_text' => $meta['alt_text'] ?? null,
            'caption' => $meta['caption'] ?? null,
        ]);
    }

    public function replace(MediaAsset $asset, UploadedFile $file): MediaAsset
    {
        $oldDisk = $asset->disk;
        $oldPath = $asset->path;

        $mime = $file->getMimeType() ?: 'application/octet-stream';
        $extension = $file->guessExtension() ?: 'bin';
        $directory = 'media/'.now()->format('Y/m');
        $filename = Str::uuid().'.'.$extension;

        [$disk, $path] = $this->storeFile($file, $directory.'/'.$filename, $mime);
        [$width, $height] = $this->dimensions($file);

        $asset->update([
            'disk' => $disk,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $mime,
            'size' => $file->getSize(),
            'width' => $width,
            'height' => $height,
        ]);

        $this->deleteStoredFile($oldDisk, $oldPath);

        return $asset->fresh();
    }

    public function deleteStoredFile(string $disk, string $path): void
    {
        if ($disk === 'vercel_blob') {
            $this->deleteFromVercelBlob($path);

            return;
        }

        if ($disk !== 'public_assets') {
            Storage::disk($disk)->delete($path);
        }
    }

    /**
     * @return array{0:string,1:string}
     */
    private function storeFile(UploadedFile $file, string $path, string $mime): array
    {
        $driver = config('wedding.upload.driver', 'local');

        if ($driver === 'vercel_blob') {
            return ['vercel_blob', $this->uploadToVercelBlob($file, $path, $mime)];
        }

        Storage::disk('public')->putFileAs(
            dirname($path),
            $file,
            basename($path),
            ['visibility' => 'public']
        );

        return ['public', $path];
    }

    private function uploadToVercelBlob(UploadedFile $file, string $path, string $mime): string
    {
        $token = $this->vercelBlobToken();
        $storeId = $this->vercelBlobStoreId($token);

        $response = Http::withToken($token)
            ->withHeaders($this->vercelBlobHeaders($storeId) + [
                'x-vercel-blob-access' => config('services.vercel_blob.access', 'public'),
                'x-content-type' => $mime,
                'x-add-random-suffix' => '1',
                'x-cache-control-max-age' => '31536000',
                'x-content-length' => (string) $file->getSize(),
            ])
            ->withBody(file_get_contents($file->getRealPath()), $mime)
            ->put($this->vercelBlobApiUrl().'/?'.http_build_query(
                ['pathname' => $path],
                '',
                '&',
                PHP_QUERY_RFC3986
            ));

        if (! $response->successful()) {
            throw new RuntimeException('Vercel Blob upload failed: '.$response->body());
        }

        return $response->json('url') ?? throw new RuntimeException('Vercel Blob did not return a URL.');
    }

    private function deleteFromVercelBlob(string $url): void
    {
        $token = config('services.vercel_blob.token');

        if (! $token || ! str_starts_with($url, 'http')) {
            return;
        }

        $response = Http::withToken($token)
            ->withHeaders($this->vercelBlobHeaders($this->vercelBlobStoreId($token)))
            ->post($this->vercelBlobApiUrl().'/delete', ['urls' => [$url]]);

        if (! $response->successful()) {
            Log::warning('Vercel Blob delete failed.', [
                'url' => $url,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }
    }

    /**
     * @return array<string, string>
     */
    private function vercelBlobHeaders(string $storeId): array
    {
        return [
            'x-api-version' => '13',
            'x-vercel-blob-store-id' => $storeId,
            'x-api-blob-request-id' => $storeId.':'.now()->getTimestampMs().':'.Str::lower(Str::random(12)),
            'x-api-blob-request-attempt' => '0',
        ];
    }

    private function vercelBlobToken(): string
    {
        $token = config('services.vercel_blob.token');

        if (! $token) {
            throw new RuntimeException('BLOB_READ_WRITE_TOKEN is not configured.');
        }

        return $token;
    }

    private function vercelBlobStoreId(string $token): string
    {
        $storeId = explode('_', $token)[3] ?? '';

        if ($storeId === '') {
            throw new RuntimeException('BLOB_READ_WRITE_TOKEN does not contain a store ID.');
        }

        return $storeId;
    }

    private function vercelBlobApiUrl(): string
    {
        return rtrim(config('services.vercel_blob.api_url', 'https://vercel.com/api/blob'), '/');
    }

    /**
     * @return array{0:?int,1:?int}
     */
    private function dimensions(UploadedFile $file): array
    {
        $size = @getimagesize($file->getRealPath());

        return $size ? [(int) $size[0], (int) $size[1]] : [null, null];
    }
}
