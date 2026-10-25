<?php

namespace App\Services;

use App\Models\MediaAsset;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
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
        $driver = env('MEDIA_DRIVER', 'local');

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
        $token = env('BLOB_READ_WRITE_TOKEN');

        if (! $token) {
            throw new RuntimeException('BLOB_READ_WRITE_TOKEN is not configured.');
        }

        $response = Http::withToken($token)
            ->withHeaders([
                'x-api-version' => '12',
                'x-content-type' => $mime,
                'x-add-random-suffix' => '1',
                'x-cache-control-max-age' => '31536000',
            ])
            ->withBody(file_get_contents($file->getRealPath()), $mime)
            ->put('https://blob.vercel-storage.com/'.$path);

        if (! $response->successful()) {
            throw new RuntimeException('Vercel Blob upload failed: '.$response->body());
        }

        return $response->json('url') ?? throw new RuntimeException('Vercel Blob did not return a URL.');
    }

    private function deleteFromVercelBlob(string $url): void
    {
        $token = env('BLOB_READ_WRITE_TOKEN');

        if (! $token || ! str_starts_with($url, 'http')) {
            return;
        }

        Http::withToken($token)
            ->withHeaders(['x-api-version' => '12'])
            ->post('https://blob.vercel-storage.com/delete', ['urls' => [$url]]);
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
