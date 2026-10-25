<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        Setting::put('animations_enabled', true);
        Setting::put('site_name', 'Ever After Studio');
    }
}
