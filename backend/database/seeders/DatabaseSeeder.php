<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AnimationPresetSeeder::class,
            ThemeSeeder::class,
            TemplateSeeder::class,
            SettingSeeder::class,
            AdminUserSeeder::class,
        ]);

        if (app()->environment(['local', 'testing']) || env('SEED_DEMO_DATA', false)) {
            $this->call(DemoDataSeeder::class);
        }
    }
}
