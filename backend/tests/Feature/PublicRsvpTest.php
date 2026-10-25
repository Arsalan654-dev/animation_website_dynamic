<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\InvitationGuest;
use App\Models\RsvpSubmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class PublicRsvpTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_submit_an_rsvp_for_a_published_invitation(): void
    {
        $invitation = Invitation::factory()->published()->create();

        $response = $this->submitRsvp($invitation);

        $response->assertCreated()
            ->assertJsonPath('updated', false)
            ->assertJsonPath('data.guest_name', 'Sara Khan')
            ->assertJsonPath('data.attendance', 'attending')
            ->assertJsonPath('data.guest_count', 2);

        $this->assertDatabaseHas('rsvp_submissions', [
            'invitation_id' => $invitation->id,
            'email' => 'sara@example.test',
            'attendance' => 'attending',
            'guest_count' => 2,
        ]);

        $this->assertDatabaseHas('invitation_activities', [
            'invitation_id' => $invitation->id,
            'type' => 'rsvp_received',
        ]);
    }

    public function test_repeat_rsvp_with_the_same_email_updates_the_existing_response(): void
    {
        $invitation = Invitation::factory()->published()->create();

        $this->submitRsvp($invitation)->assertCreated();

        $this->submitRsvp($invitation, [
            'guest_name' => 'Sara Khan Updated',
            'guest_count' => 3,
        ])
            ->assertOk()
            ->assertJsonPath('updated', true)
            ->assertJsonPath('data.guest_name', 'Sara Khan Updated')
            ->assertJsonPath('data.guest_count', 3);

        $this->assertDatabaseCount('rsvp_submissions', 1);
        $this->assertDatabaseHas('rsvp_submissions', [
            'invitation_id' => $invitation->id,
            'guest_name' => 'Sara Khan Updated',
            'guest_count' => 3,
        ]);
    }

    public function test_rsvp_is_rejected_when_disabled_or_past_the_deadline(): void
    {
        $disabled = Invitation::factory()->published()->create([
            'rsvp_settings' => ['enabled' => false],
        ]);

        $this->submitRsvp($disabled)
            ->assertStatus(422)
            ->assertJsonValidationErrors('rsvp');

        $expired = Invitation::factory()->published()->create([
            'rsvp_settings' => ['deadline' => now()->subDay()->toDateString()],
        ]);

        $this->submitRsvp($expired)
            ->assertStatus(422)
            ->assertJsonValidationErrors('rsvp');
    }

    public function test_rsvp_enforces_the_guest_limit_and_decline_setting(): void
    {
        $invitation = Invitation::factory()->published()->create([
            'rsvp_settings' => [
                'max_guests_per_submission' => 2,
                'allow_decline' => false,
            ],
        ]);

        $this->submitRsvp($invitation, ['guest_count' => 3])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guest_count');

        $this->submitRsvp($invitation, ['attendance' => 'declined'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('attendance');
    }

    public function test_guest_code_is_required_and_enforces_the_guest_allowance(): void
    {
        $invitation = Invitation::factory()->published()->create([
            'rsvp_settings' => ['require_guest_code' => true],
        ]);

        $guest = InvitationGuest::factory()->for($invitation)->create([
            'name' => 'Ayesha Malik',
            'code' => 'WEDDING123',
            'max_guests' => 3,
        ]);

        $this->submitRsvp($invitation)
            ->assertStatus(422)
            ->assertJsonValidationErrors('guest_code');

        $this->submitRsvp($invitation, ['guest_code' => 'NOT-A-CODE'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guest_code');

        $this->submitRsvp($invitation, [
            'guest_code' => 'WEDDING123',
            'guest_count' => 4,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guest_count');

        $response = $this->submitRsvp($invitation, [
            'guest_code' => 'WEDDING123',
            'guest_count' => 3,
        ])->assertCreated();

        $this->assertDatabaseHas('invitation_guests', [
            'id' => $guest->id,
            'rsvp_submission_id' => $response->json('data.id'),
        ]);
    }

    public function test_optional_guest_code_is_recorded_and_marks_the_guest_as_responded(): void
    {
        $invitation = Invitation::factory()->published()->create([
            'rsvp_settings' => ['require_guest_code' => false],
        ]);

        $guest = InvitationGuest::factory()->for($invitation)->create([
            'name' => 'Ayesha Malik',
            'code' => 'OPTIONAL123',
            'max_guests' => 2,
        ]);

        $this->submitRsvp($invitation, [
            'guest_code' => 'OPTIONAL123',
            'guest_count' => 3,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('guest_count');

        $response = $this->submitRsvp($invitation, [
            'guest_code' => 'OPTIONAL123',
            'guest_count' => 2,
        ])->assertCreated();

        $this->assertDatabaseHas('rsvp_submissions', [
            'id' => $response->json('data.id'),
            'guest_code' => 'OPTIONAL123',
        ]);

        $this->assertDatabaseHas('invitation_guests', [
            'id' => $guest->id,
            'rsvp_submission_id' => $response->json('data.id'),
        ]);

        $this->getJson('/api/v1/public/invitations/'.$invitation->slug.'/guest-code/OPTIONAL123')
            ->assertOk()
            ->assertJsonPath('data.already_responded', true);
    }

    public function test_guest_code_verification_returns_the_guest_details(): void
    {
        $invitation = Invitation::factory()->published()->create();
        InvitationGuest::factory()->for($invitation)->create([
            'name' => 'Ayesha Malik',
            'code' => 'WEDDING123',
            'max_guests' => 3,
        ]);

        $this->getJson('/api/v1/public/invitations/'.$invitation->slug.'/guest-code/WEDDING123')
            ->assertOk()
            ->assertJsonPath('data.name', 'Ayesha Malik')
            ->assertJsonPath('data.first_name', 'Ayesha')
            ->assertJsonPath('data.max_guests', 3)
            ->assertJsonPath('data.already_responded', false);

        $this->getJson('/api/v1/public/invitations/'.$invitation->slug.'/guest-code/UNKNOWN')
            ->assertNotFound();
    }

    public function test_guest_code_verification_is_not_available_for_unpublished_invitations(): void
    {
        $invitation = Invitation::factory()->create();
        InvitationGuest::factory()->for($invitation)->create(['code' => 'WEDDING123']);

        $this->getJson('/api/v1/public/invitations/'.$invitation->slug.'/guest-code/WEDDING123')
            ->assertNotFound();
    }

    public function test_required_custom_questions_are_validated_and_saved(): void
    {
        $invitation = Invitation::factory()->published()->create([
            'rsvp_settings' => [
                'questions' => [[
                    'id' => 'meal',
                    'label' => 'Meal preference',
                    'type' => 'select',
                    'required' => true,
                    'options' => ['Chicken', 'Fish'],
                ]],
            ],
        ]);

        $this->submitRsvp($invitation, ['answers' => []])
            ->assertStatus(422)
            ->assertJsonValidationErrors('answers.meal');

        $this->submitRsvp($invitation, ['answers' => ['meal' => 'Pasta']])
            ->assertStatus(422)
            ->assertJsonValidationErrors('answers.meal');

        $response = $this->submitRsvp($invitation, ['answers' => ['meal' => 'Fish']])
            ->assertCreated();

        $submission = RsvpSubmission::query()->findOrFail($response->json('data.id'));

        $this->assertSame(['meal' => 'Fish'], $submission->answers);
    }

    public function test_rsvp_cannot_be_submitted_for_an_unpublished_invitation(): void
    {
        $invitation = Invitation::factory()->create();

        $this->submitRsvp($invitation)->assertNotFound();
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function submitRsvp(Invitation $invitation, array $overrides = []): TestResponse
    {
        return $this->postJson(
            '/api/v1/public/invitations/'.$invitation->slug.'/rsvp',
            array_merge([
                'guest_name' => 'Sara Khan',
                'email' => 'sara@example.test',
                'phone' => '+92 300 0000000',
                'attendance' => 'attending',
                'guest_count' => 2,
                'message' => 'Cannot wait to celebrate with you.',
            ], $overrides)
        );
    }
}
