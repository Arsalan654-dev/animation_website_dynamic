<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InvitationDesign extends Model
{
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'name',
        'description',
        'snapshot',
        'is_active',
        'version',
        'created_by',
        'updated_by',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
            'is_active' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(InvitationDesignVersion::class)->orderByDesc('version');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
