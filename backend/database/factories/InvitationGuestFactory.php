<?php

namespace Database\Factories;

use App\Models\Invitation;
use App\Models\InvitationGuest;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class InvitationGuestFactory extends Factory
{
    protected $model = InvitationGuest::class;

    public function definition(): array
    {
        return [
            'invitation_id' => Invitation::factory(),
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => null,
            'code' => Str::upper(Str::random(10)),
            'max_guests' => 2,
            'is_allowed' => true,
            'notes' => null,
        ];
    }
}
