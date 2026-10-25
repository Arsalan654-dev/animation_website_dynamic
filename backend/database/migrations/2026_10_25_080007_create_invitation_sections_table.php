<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitation_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_id')->constrained()->cascadeOnDelete();
            $table->string('type', 60);
            $table->string('title')->nullable();
            $table->json('content');
            $table->json('design')->nullable();
            $table->foreignId('animation_preset_id')->nullable()->constrained('animation_presets')->nullOnDelete();
            $table->json('animation_config')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->index(['invitation_id', 'sort_order']);
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitation_sections');
    }
};
