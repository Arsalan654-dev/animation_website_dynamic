<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitation_guests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 60)->nullable();
            $table->string('code', 40)->unique();
            $table->unsignedTinyInteger('max_guests')->default(2);
            $table->boolean('is_allowed')->default(true);
            $table->text('notes')->nullable();
            $table->foreignId('rsvp_submission_id')->nullable()->constrained('rsvp_submissions')->nullOnDelete();
            $table->timestamps();

            $table->index(['invitation_id', 'is_allowed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitation_guests');
    }
};
