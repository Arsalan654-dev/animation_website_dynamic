<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdminCommand extends Command
{
    protected $signature = 'app:create-admin
        {email? : Email address for the administrator}
        {--name= : Display name}
        {--password= : Password (omit for a secure interactive prompt)}';

    protected $description = 'Create or promote an administrator without seeding demo credentials';

    public function handle(): int
    {
        $email = $this->argument('email') ?: $this->ask('Administrator email');
        $name = $this->option('name') ?: $this->ask('Display name', 'Studio Administrator');
        $password = $this->option('password') ?: $this->secret('Password (minimum 10 characters)');

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Enter a valid email address.');

            return self::FAILURE;
        }

        if (strlen((string) $password) < 10) {
            $this->error('Use a password with at least 10 characters.');

            return self::FAILURE;
        }

        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make((string) $password),
                'role' => 'admin',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->info("Administrator ready: {$user->email}");

        return self::SUCCESS;
    }
}
