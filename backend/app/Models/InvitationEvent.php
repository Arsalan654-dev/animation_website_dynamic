<?php

namespace App\Models;

use App\Support\DatePayload;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvitationEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'title',
        'description',
        'event_at',
        'timezone',
        'venue_name',
        'venue_address',
        'map_url',
        'dress_code',
        'image_media_id',
        'rsvp_enabled',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'event_at' => 'datetime',
            'rsvp_enabled' => 'boolean',
        ];
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    public function image(): BelongsTo
    {
        return $this->belongsTo(MediaAsset::class, 'image_media_id');
    }

    public function datePayload(): ?array
    {
        return DatePayload::make($this->event_at, $this->timezone);
    }
}
