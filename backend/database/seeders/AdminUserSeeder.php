<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $isLocal = app()->environment(['local', 'testing']);
        $email = env('SEED_ADMIN_EMAIL');
        $password = env('SEED_ADMIN_PASSWORD');

        if (! $isLocal && (! $email || ! $password)) {
            $this->command?->warn('Skipping admin seeding. Run php artisan app:create-admin to create the first administrator.');

            return;
        }

        $email ??= 'admin@everafter.test';
        $password ??= 'EverAfter!2026';

        User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => env('SEED_ADMIN_NAME', 'Studio Administrator'),
                'password' => Hash::make($password),
                'role' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        if ($isLocal) {
            $this->command?->info("Development admin: {$email} / {$password}");
        }
    }
}
