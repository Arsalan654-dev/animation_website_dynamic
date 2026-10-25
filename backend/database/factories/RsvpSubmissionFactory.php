<?php

namespace Database\Factories;

use App\Models\Invitation;
use App\Models\RsvpSubmission;
use Illuminate\Database\Eloquent\Factories\Factory;

class RsvpSubmissionFactory extends Factory
{
    protected $model = RsvpSubmission::class;

    public function definition(): array
    {
        $attending = $this->faker->boolean(75);

        return [
            'invitation_id' => Invitation::factory(),
            'guest_name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'attendance' => $attending ? 'attending' : 'declined',
            'guest_count' => $attending ? $this->faker->numberBetween(1, 4) : 1,
            'message' => $this->faker->sentence(),
            'answers' => null,
            'guest_code' => null,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'source' => 'public',
        ];
    }
}
