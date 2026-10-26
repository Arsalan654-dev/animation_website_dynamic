<?php

namespace Database\Factories;

use App\Models\InvitationDesign;
use App\Models\InvitationDesignVersion;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvitationDesignVersionFactory extends Factory
{
    protected $model = InvitationDesignVersion::class;

    public function definition(): array
    {
        return [
            'invitation_design_id' => InvitationDesign::factory(),
            'version' => 1,
            'snapshot' => [
                'theme_id' => null,
                'design_config' => [],
                'envelope' => [],
                'cover_image_path' => null,
                'sections' => [],
            ],
            'label' => $this->faker->sentence(3),
            'created_by' => User::factory(),
        ];
    }
}
