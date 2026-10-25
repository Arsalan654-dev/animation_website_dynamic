<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rsvp_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_id')->constrained()->cascadeOnDelete();
            $table->string('guest_name');
            $table->string('email')->nullable();
            $table->string('phone', 60)->nullable();
            $table->string('attendance', 20);
            $table->unsignedTinyInteger('guest_count')->default(1);
            $table->text('message')->nullable();
            $table->json('answers')->nullable();
            $table->string('guest_code', 40)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->text('admin_notes')->nullable();
            $table->string('source', 20)->default('public');
            $table->timestamps();

            $table->index(['invitation_id', 'attendance']);
            $table->index(['invitation_id', 'email']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rsvp_submissions');
    }
};
