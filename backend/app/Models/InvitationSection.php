<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvitationSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'invitation_id',
        'type',
        'title',
        'content',
        'design',
        'animation_preset_id',
        'animation_config',
        'sort_order',
        'is_visible',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'array',
            'design' => 'array',
            'animation_config' => 'array',
            'is_visible' => 'boolean',
        ];
    }

    public function invitation(): BelongsTo
    {
        return $this->belongsTo(Invitation::class);
    }

    public function animationPreset(): BelongsTo
    {
        return $this->belongsTo(AnimationPreset::class);
    }
}
