<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnimationPreset extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'type',
        'defaults',
        'config_schema',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'defaults' => 'array',
            'config_schema' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function sections(): HasMany
    {
        return $this->hasMany(InvitationSection::class);
    }

    public function themes(): HasMany
    {
        return $this->hasMany(Theme::class, 'default_animation_preset_id');
    }
}
