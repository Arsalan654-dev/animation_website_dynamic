<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'category',
        'thumbnail_path',
        'default_theme_id',
        'layout',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'layout' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function defaultTheme(): BelongsTo
    {
        return $this->belongsTo(Theme::class, 'default_theme_id');
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }
}
