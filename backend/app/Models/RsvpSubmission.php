<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RsvpSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'guest_name',
        'email',
        'phone',
        'attendance',
        'guest_count',
        'message',
        'answers',
        'guest_code',
        'ip_address',
        'user_agent',
        'admin_notes',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'guest_count' => 'integer',
        ];
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(InvitationGuest::class, 'guest_code', 'code');
    }

    public function isAttending(): bool
    {
        return $this->attendance === 'attending';
    }
}
