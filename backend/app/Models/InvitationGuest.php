<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvitationGuest extends Model
{
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'name',
        'email',
        'phone',
        'code',
        'max_guests',
        'is_allowed',
        'notes',
        'rsvp_submission_id',
    ];

    protected function casts(): array
    {
        return [
            'is_allowed' => 'boolean',
            'max_guests' => 'integer',
        ];
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    public function rsvpSubmission(): BelongsTo
    {
        return $this->belongsTo(RsvpSubmission::class);
    }
}
