<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('template_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('theme_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('status', 20)->default('draft');
            $table->string('cover_image_path', 2048)->nullable();
            $table->json('envelope')->nullable();
            $table->json('couple_details');
            $table->timestamp('event_at')->nullable();
            $table->string('timezone', 80)->default('Asia/Karachi');
            $table->string('venue_name')->nullable();
            $table->string('venue_address')->nullable();
            $table->string('venue_map_url', 2048)->nullable();
            $table->text('venue_map_embed')->nullable();
            $table->json('rsvp_settings')->nullable();
            $table->json('design_config')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
