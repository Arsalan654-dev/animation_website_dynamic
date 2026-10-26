<?php

namespace App\Models;

use App\Support\DatePayload;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Invitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'template_id',
        'theme_id',
        'title',
        'slug',
        'status',
        'cover_image_path',
        'envelope',
        'couple_details',
        'event_at',
        'timezone',
        'venue_name',
        'venue_address',
        'venue_map_url',
        'venue_map_embed',
        'rsvp_settings',
        'design_config',
        'published_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'envelope' => 'array',
            'couple_details' => 'array',
            'rsvp_settings' => 'array',
            'design_config' => 'array',
            'event_at' => 'datetime',
            'published_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function theme(): BelongsTo
    {
        return $this->belongsTo(Theme::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function sections(): HasMany
    {
        return $this->hasMany(InvitationSection::class)->orderBy('sort_order');
    }

    public function designs(): HasMany
    {
        return $this->hasMany(InvitationDesign::class)->orderByDesc('updated_at');
    }

    public function activeDesign(): HasOne
    {
        return $this->hasOne(InvitationDesign::class)->where('is_active', true);
    }

    public function events(): HasMany
    {
        return $this->hasMany(InvitationEvent::class)->orderBy('sort_order');
    }

    public function rsvps(): HasMany
    {
        return $this->hasMany(RsvpSubmission::class);
    }

    public function guests(): HasMany
    {
        return $this->hasMany(InvitationGuest::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(InvitationActivity::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')->whereNotNull('published_at');
    }

    public function isPublished(): bool
    {
        return $this->status === 'published' && $this->published_at !== null;
    }

    public function rsvpConfig(): array
    {
        return array_replace(config('wedding.default_rsvp_settings'), $this->rsvp_settings ?? []);
    }

    public function eventPayload(): ?array
    {
        return DatePayload::make($this->event_at, $this->timezone);
    }

    public function isRsvpOpen(): bool
    {
        $settings = $this->rsvpConfig();

        if (! ($settings['enabled'] ?? true)) {
            return false;
        }

        if (! empty($settings['deadline'])) {
            return now()->lessThanOrEqualTo($settings['deadline']);
        }

        return true;
    }
}
