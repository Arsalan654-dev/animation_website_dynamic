<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvitationDesignVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'invitation_design_id',
        'version',
        'snapshot',
        'label',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
        ];
    }

    public function design(): BelongsTo
    {
        return $this->belongsTo(InvitationDesign::class, 'invitation_design_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
