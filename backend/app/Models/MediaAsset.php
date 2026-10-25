<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MediaAsset extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
        'width',
        'height',
        'alt_text',
        'caption',
    ];

    protected $appends = ['url', 'is_image'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getUrlAttribute(): string
    {
        if (str_starts_with($this->path, 'http://') || str_starts_with($this->path, 'https://')) {
            return $this->path;
        }

        if ($this->disk === 'public_assets') {
            return asset($this->path);
        }

        return Storage::disk($this->disk)->url($this->path);
    }

    public function getIsImageAttribute(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }
}
