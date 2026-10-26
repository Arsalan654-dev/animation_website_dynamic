<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitation_design_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_design_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->json('snapshot');
            $table->string('label')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['invitation_design_id', 'version']);
            $table->index(['invitation_design_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitation_design_versions');
    }
};
