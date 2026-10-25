<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_sign_in_and_receive_an_admin_token(): void
    {
        $user = User::factory()->create([
            'email' => 'studio@example.test',
            'password' => 'correct-horse-battery',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'studio@example.test',
            'password' => 'correct-horse-battery',
            'device_name' => 'phpunit',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.email', 'studio@example.test')
            ->assertJsonPath('data.user.role', 'admin')
            ->assertJsonPath('data.user.is_active', true)
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email', 'role', 'is_active'],
                    'token',
                    'expires_at',
                ],
            ]);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'phpunit',
        ]);
    }

    public function test_invalid_credentials_are_rejected_without_creating_a_token(): void
    {
        User::factory()->create([
            'email' => 'studio@example.test',
            'password' => 'correct-horse-battery',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'studio@example.test',
            'password' => 'wrong-password',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_disabled_accounts_cannot_sign_in(): void
    {
        User::factory()->create([
            'email' => 'disabled@example.test',
            'password' => 'correct-horse-battery',
            'is_active' => false,
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'disabled@example.test',
            'password' => 'correct-horse-battery',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_authenticated_admin_can_read_their_profile(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user, ['admin']);

        $this->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_admin_routes_require_authentication(): void
    {
        $this->getJson('/api/v1/dashboard')->assertUnauthorized();
        $this->getJson('/api/v1/invitations')->assertUnauthorized();
    }

    public function test_tokens_without_the_admin_ability_are_forbidden(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('limited', ['viewer'])->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/dashboard')
            ->assertForbidden();
    }

    public function test_logout_revokes_the_current_access_token(): void
    {
        $user = User::factory()->create([
            'email' => 'logout@example.test',
            'password' => 'correct-horse-battery',
        ]);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'logout@example.test',
            'password' => 'correct-horse-battery',
        ])->json('data.token');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);

        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }
}
