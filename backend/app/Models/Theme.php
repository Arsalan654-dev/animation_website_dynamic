<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Theme extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'preview_image_path',
        'tokens',
        'default_animation_preset_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'tokens' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function defaultAnimationPreset(): BelongsTo
    {
        return $this->belongsTo(AnimationPreset::class, 'default_animation_preset_id');
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
