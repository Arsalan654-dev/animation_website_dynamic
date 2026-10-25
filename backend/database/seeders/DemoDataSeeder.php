<?php

namespace Database\Seeders;

use App\Models\Invitation;
use App\Models\InvitationActivity;
use App\Models\InvitationEvent;
use App\Models\InvitationGuest;
use App\Models\MediaAsset;
use App\Models\RsvpSubmission;
use App\Models\Template;
use App\Models\Theme;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    private array $media = [];

    public function run(): void
    {
        $owner = User::query()->where('role', 'admin')->first();

        if (! $owner) {
            $this->command?->warn('Demo data requires an administrator. Run the admin seeder first.');

            return;
        }

        $this->seedMedia();

        $themes = Theme::query()->pluck('id', 'slug');
        $templates = Template::query()->pluck('id', 'slug');

        $this->seedMaheenAndUzair($owner, $themes, $templates);
        $this->seedAmaraAndZayd($owner, $themes, $templates);
    }

    private function seedMedia(): void
    {
        $files = [
            'hero' => ['hero-couple.jpg', 'Bride and groom beneath a floral arch', 'A quiet moment beneath the florals'],
            'portrait' => ['couple-portrait.jpg', 'The couple in an editorial portrait', null],
            'walk' => ['couple-walk.jpg', 'The couple walking together at golden hour', 'Golden hour'],
            'florals' => ['florals.jpg', 'Loose garden flowers in soft light', null],
            'venue' => ['venue.jpg', 'An elegant candlelit reception table', 'The reception'],
            'rings' => ['rings.jpg', 'Wedding rings resting on ivory paper', null],
            'ceremony' => ['ceremony.jpg', 'An intimate outdoor ceremony', 'The ceremony'],
            'garden' => ['garden.jpg', 'A lush garden path in the afternoon', null],
            'details' => ['details.jpg', 'Bridal details on textured paper', null],
            'portrait_two' => ['portrait-two.jpg', 'A second portrait of the couple', null],
        ];

        foreach ($files as $key => [$file, $alt, $caption]) {
            $path = public_path('demo/'.$file);
            $dimensions = file_exists($path) ? @getimagesize($path) : false;

            $this->media[$key] = MediaAsset::query()->updateOrCreate(
                ['disk' => 'public_assets', 'path' => '/demo/'.$file],
                [
                    'user_id' => null,
                    'original_name' => $file,
                    'mime_type' => 'image/jpeg',
                    'size' => file_exists($path) ? filesize($path) : 0,
                    'width' => $dimensions ? $dimensions[0] : null,
                    'height' => $dimensions ? $dimensions[1] : null,
                    'alt_text' => $alt,
                    'caption' => $caption,
                ]
            );
        }
    }

    private function seedMaheenAndUzair(User $owner, $themes, $templates): void
    {
        $wedding = Carbon::now('Asia/Karachi')->addMonths(3)->startOfMonth()->addDays(11)->setTime(19, 30);
        $weddingUtc = $wedding->copy()->utc();
        $dateLabel = $wedding->copy()->format('l, F j, Y');

        $invitation = Invitation::query()->updateOrCreate(
            ['slug' => 'maheen-and-uzair'],
            [
                'user_id' => $owner->id,
                'theme_id' => $themes['burgundy-olive'] ?? null,
                'template_id' => $templates['heritage-envelope'] ?? null,
                'title' => 'Maheen & Uzair',
                'status' => 'published',
                'cover_image_path' => '/demo/hero-couple.jpg',
                'envelope' => [
                    'enabled' => true,
                    'style' => 'wax',
                    'monogram' => 'M & U',
                    'seal_text' => 'M & U',
                    'prompt' => 'Open the invitation',
                    'cover_media_id' => $this->media['florals']->id,
                    'card_media_id' => $this->media['hero']->id,
                    'seal_media_id' => null,
                    'card_message' => 'Together with their families',
                ],
                'couple_details' => [
                    'partner_one' => 'Maheen',
                    'partner_two' => 'Uzair',
                    'title' => 'Together with their families',
                    'subtitle' => 'request the pleasure of your company as they begin their forever',
                    'hashtag' => '#MaheenAndUzair',
                    'quote' => 'I have found the one whom my soul loves.',
                    'message' => 'With grateful hearts, we invite you to share in the joy of our wedding celebration.',
                    'families' => 'Daughter of Mr. & Mrs. Imran Siddiqui · Son of Mr. & Mrs. Faisal Ahmed',
                    'story_heading' => 'Our Story',
                    'story_body' => "It began with a cup of chai and a conversation that refused to end. What followed was a season of long walks, shared dreams, and a quiet certainty that this was the beginning of something lasting.\n\nNow, surrounded by the people we love most, we are ready to say yes to forever.",
                    'story_image_id' => $this->media['portrait']->id,
                ],
                'event_at' => $weddingUtc,
                'timezone' => 'Asia/Karachi',
                'venue_name' => 'The Marquee, Ocean Mall',
                'venue_address' => 'Ocean Mall, Clifton, Karachi, Pakistan',
                'venue_map_url' => 'https://maps.google.com/?q=Ocean+Mall+Clifton+Karachi',
                'venue_map_embed' => null,
                'rsvp_settings' => [
                    'enabled' => true,
                    'deadline' => now()->addMonths(2)->endOfDay()->utc()->toIso8601String(),
                    'max_guests_per_submission' => 6,
                    'allow_decline' => true,
                    'require_guest_code' => false,
                    'collect_phone' => true,
                    'questions' => [
                        ['id' => 'meal', 'label' => 'Meal preference', 'type' => 'select', 'required' => true, 'options' => ['Chicken', 'Fish', 'Vegetarian']],
                        ['id' => 'song', 'label' => 'A song that will get you on the dance floor', 'type' => 'text', 'required' => false, 'options' => []],
                    ],
                    'success_message' => 'Thank you, Maheen and Uzair cannot wait to celebrate with you.',
                ],
                'design_config' => [
                    'animation' => ['preset' => 'fade-up', 'disabled' => false, 'overrides' => ['duration' => 0.9, 'distance' => 36]],
                    'theme_tokens' => [],
                ],
                'published_at' => now()->subDays(12),
            ]
        );

        $invitation->sections()->delete();

        $sections = [
            ['hero', 'Hero', [
                'eyebrow' => 'Together with their families',
                'heading' => 'Maheen & Uzair',
                'subheading' => 'invite you to celebrate their wedding',
                'message' => 'A celebration of love, family and the beautiful beginning of forever.',
                'date_label' => $dateLabel,
                'background' => ['mediaId' => $this->media['hero']->id, 'alt' => 'The couple beneath a floral arch'],
                'show_countdown' => true,
                'primary_cta' => ['label' => 'RSVP', 'href' => '#rsvp'],
                'overlay_opacity' => 0.46,
            ]],
            ['countdown', 'Countdown', [
                'heading' => 'Counting Down to Forever',
                'intro' => 'Every second brings us closer to the moment we say yes.',
                'completed_message' => 'Today is the day. We cannot wait to celebrate with you.',
            ]],
            ['story', 'Our Story', [
                'heading' => 'Our Story',
                'intro' => 'A chance meeting, a shared cup of chai, a love that grew quietly and completely.',
                'body' => "It began with a cup of chai and a conversation that refused to end. What followed was a season of long walks, shared dreams, and a quiet certainty that this was the beginning of something lasting.\n\nNow, surrounded by the people we love most, we are ready to say yes to forever.",
                'image' => ['mediaId' => $this->media['portrait']->id, 'alt' => 'The couple in an editorial portrait'],
                'signature' => 'Maheen & Uzair',
                'timeline' => [
                    ['date' => 'Spring 2022', 'title' => 'The first hello', 'text' => 'A mutual friend introduced us over chai in Karachi. One conversation turned into four hours.'],
                    ['date' => 'Winter 2023', 'title' => 'A family affair', 'text' => 'Our families met over dinner, and what had felt like a secret became a shared joy.'],
                    ['date' => 'Summer 2025', 'title' => 'The question', 'text' => 'Under a sky full of stars, Uzair asked, and Maheen said yes before he had finished.'],
                ],
            ]],
            ['quote', 'Quote', [
                'quote' => 'I have found the one whom my soul loves.',
                'attribution' => 'Song of Solomon 3:4',
            ]],
            ['events', 'Events', [
                'heading' => 'The Celebrations',
                'intro' => 'Four days of colour, music, prayer and joy. We would be honoured by your presence at every moment.',
                'note' => 'Directions and timing details are included with each event.',
            ]],
            ['gallery', 'Gallery', [
                'heading' => 'Moments',
                'intro' => 'A few pieces of our story, collected along the way.',
                'layout' => 'masonry',
                'images' => [
                    ['mediaId' => $this->media['portrait']->id, 'alt' => 'The couple', 'caption' => 'Before the celebrations'],
                    ['mediaId' => $this->media['walk']->id, 'alt' => 'Golden hour walk', 'caption' => 'Golden hour'],
                    ['mediaId' => $this->media['rings']->id, 'alt' => 'Wedding rings', 'caption' => 'The details'],
                    ['mediaId' => $this->media['portrait_two']->id, 'alt' => 'The couple portrait', 'caption' => 'Just us'],
                    ['mediaId' => $this->media['florals']->id, 'alt' => 'Flowers', 'caption' => 'Florals in bloom'],
                    ['mediaId' => $this->media['details']->id, 'alt' => 'Bridal details', 'caption' => 'Something borrowed'],
                ],
            ]],
            ['venue', 'Venue', [
                'heading' => 'The Venue',
                'name' => 'The Marquee, Ocean Mall',
                'address' => 'Ocean Mall, Clifton, Karachi, Pakistan',
                'map_url' => 'https://maps.google.com/?q=Ocean+Mall+Clifton+Karachi',
                'image' => ['mediaId' => $this->media['venue']->id, 'alt' => 'A candlelit reception table'],
                'notes' => 'Valet parking is available at the main entrance. Please arrive thirty minutes before the ceremony.',
            ]],
            ['gifts', 'Gifts', [
                'heading' => 'With Gratitude',
                'body' => 'Your presence is the greatest gift we could ask for. Should you wish to honour us further, a contribution towards our home and honeymoon would be received with love.',
                'note' => 'There will be a card box at the reception, or you may send a gift directly to the family home.',
                'links' => [],
            ]],
            ['rsvp', 'RSVP', [
                'heading' => 'Will You Join Us?',
                'intro' => 'We would love to know if you can celebrate with us. Please reply by the deadline below.',
                'note' => 'If you have any dietary requirements, kindly mention them in your message.',
                'success_message' => 'Thank you. Your response is safely with us and we cannot wait to celebrate together.',
            ]],
        ];

        $this->createSections($invitation, $sections);

        $events = [
            ['Mehndi', 'An evening of henna, music and marigolds at the family home.', $wedding->copy()->subDays(3)->setTime(16, 0)->utc(), 'Siddiqui Family Residence, Clifton', 'Vibrant greens, yellows and florals', 'details'],
            ['Baraat', 'The groom’s procession, followed by dinner and dhol.', $wedding->copy()->subDays(2)->setTime(19, 0)->utc(), 'Pearl Continental Hotel, Karachi', 'Traditional formal', 'hero'],
            ['Nikah', 'The wedding ceremony, held at sunset.', $wedding->copy()->subDay()->setTime(17, 30)->utc(), 'The Marquee, Ocean Mall', 'Formal Eastern', 'ceremony'],
            ['Reception', 'Dinner, speeches and dancing beneath the chandeliers.', $weddingUtc->copy(), 'The Marquee, Ocean Mall', 'Black tie', 'venue'],
        ];

        $invitation->events()->delete();
        foreach ($events as $index => $event) {
            InvitationEvent::query()->create([
                'invitation_id' => $invitation->id,
                'title' => $event[0],
                'description' => $event[1],
                'event_at' => $event[2],
                'timezone' => 'Asia/Karachi',
                'venue_name' => $event[3],
                'venue_address' => $event[3].', Karachi',
                'map_url' => 'https://maps.google.com/?q='.urlencode($event[3]),
                'dress_code' => $event[4],
                'image_media_id' => $this->media[$event[5]]->id ?? null,
                'rsvp_enabled' => true,
                'sort_order' => $index,
            ]);
        }

        $this->seedRsvps($invitation, [
            ['Ayesha Khan', 'ayesha@example.com', 'attending', 2, 'Cannot wait!', ['meal' => 'Chicken', 'song' => 'Dil Diyan Gallan']],
            ['Bilal Ahmed', 'bilal@example.com', 'attending', 1, 'So happy for you both.', ['meal' => 'Fish', 'song' => 'Uptown Funk']],
            ['Sana Ali', 'sana@example.com', 'declined', 1, 'With you in spirit — sending so much love.', ['meal' => 'Vegetarian', 'song' => '']],
            ['Hamza Malik', 'hamza@example.com', 'attending', 3, 'The whole family will be there.', ['meal' => 'Chicken', 'song' => 'Desi Girl']],
            ['Zara Sheikh', 'zara@example.com', 'attending', 2, 'Congratulations!', ['meal' => 'Vegetarian', 'song' => 'Perfect']],
            ['Omar Farooq', 'omar@example.com', 'declined', 1, 'Sadly we are travelling that week.', ['meal' => 'Chicken', 'song' => '']],
        ]);

        InvitationGuest::query()->updateOrCreate(
            ['invitation_id' => $invitation->id, 'code' => 'MAHEENVIP'],
            [
                'name' => 'Ayesha Khan',
                'email' => 'ayesha@example.com',
                'max_guests' => 4,
                'is_allowed' => true,
                'notes' => 'Sample restricted guest with code MAHEENVIP.',
            ]
        );

        $this->seedActivities($invitation, $owner);
    }

    private function seedAmaraAndZayd(User $owner, $themes, $templates): void
    {
        $wedding = Carbon::now('Asia/Karachi')->addMonths(5)->startOfMonth()->addDays(20)->setTime(18, 0);
        $weddingUtc = $wedding->copy()->utc();
        $dateLabel = $wedding->copy()->format('l, F j, Y');

        $invitation = Invitation::query()->updateOrCreate(
            ['slug' => 'amara-and-zayd'],
            [
                'user_id' => $owner->id,
                'theme_id' => $themes['blue-toile'] ?? null,
                'template_id' => $templates['toile-garden-romance'] ?? null,
                'title' => 'Amara & Zayd',
                'status' => 'published',
                'cover_image_path' => '/demo/garden.jpg',
                'envelope' => [
                    'enabled' => true,
                    'style' => 'botanical',
                    'monogram' => 'A & Z',
                    'seal_text' => 'A & Z',
                    'prompt' => 'Open the invitation',
                    'cover_media_id' => $this->media['garden']->id,
                    'card_media_id' => $this->media['ceremony']->id,
                    'seal_media_id' => null,
                    'card_message' => 'A garden celebration awaits',
                ],
                'couple_details' => [
                    'partner_one' => 'Amara',
                    'partner_two' => 'Zayd',
                    'title' => 'Together with their families',
                    'subtitle' => 'invite you to a garden celebration of their marriage',
                    'hashtag' => '#AmaraAndZayd',
                    'quote' => 'Whatever our souls are made of, his and mine are the same.',
                    'message' => 'Please join us for an afternoon in the garden as we celebrate love, laughter and a lifetime together.',
                    'families' => 'Daughter of Mr. & Mrs. Tariq Jamil · Son of Mr. & Mrs. Kamran Yousuf',
                    'story_heading' => 'How It Began',
                    'story_body' => "We met at a bookshop in Lahore, both reaching for the same battered copy of a favourite novel. Zayd let Amara have it. She still has it on her bedside table.\n\nSeven years later, we are choosing each other all over again — this time in front of everyone we love.",
                    'story_image_id' => $this->media['walk']->id,
                ],
                'event_at' => $weddingUtc,
                'timezone' => 'Asia/Karachi',
                'venue_name' => 'The Garden Courtyard',
                'venue_address' => 'Old Lawrence Road, Lahore, Pakistan',
                'venue_map_url' => 'https://maps.google.com/?q=Lahore+Pakistan',
                'venue_map_embed' => null,
                'rsvp_settings' => [
                    'enabled' => true,
                    'deadline' => now()->addMonths(4)->endOfDay()->utc()->toIso8601String(),
                    'max_guests_per_submission' => 4,
                    'allow_decline' => true,
                    'require_guest_code' => false,
                    'collect_phone' => true,
                    'questions' => [
                        ['id' => 'meal', 'label' => 'Meal preference', 'type' => 'select', 'required' => true, 'options' => ['Chicken', 'Fish', 'Vegetarian']],
                    ],
                    'success_message' => 'Thank you for your reply. We look forward to seeing you in the garden.',
                ],
                'design_config' => [
                    'animation' => ['preset' => 'soft-zoom', 'disabled' => false, 'overrides' => ['duration' => 1.1, 'scale' => 0.95]],
                    'theme_tokens' => [],
                ],
                'published_at' => now()->subDays(5),
            ]
        );

        $invitation->sections()->delete();

        $sections = [
            ['hero', 'Hero', [
                'eyebrow' => 'A garden celebration',
                'heading' => 'Amara & Zayd',
                'subheading' => 'are getting married',
                'message' => 'Join us as we exchange vows beneath the jacaranda trees.',
                'date_label' => $dateLabel,
                'background' => ['mediaId' => $this->media['garden']->id, 'alt' => 'A garden path'],
                'show_countdown' => true,
                'primary_cta' => ['label' => 'RSVP', 'href' => '#rsvp'],
                'overlay_opacity' => 0.32,
            ]],
            ['quote', 'Quote', [
                'quote' => 'Whatever our souls are made of, his and mine are the same.',
                'attribution' => 'Emily Brontë',
            ]],
            ['story', 'Our Story', [
                'heading' => 'How It Began',
                'intro' => 'A bookshop, a borrowed novel, and seven years of choosing each other.',
                'body' => "We met at a bookshop in Lahore, both reaching for the same battered copy of a favourite novel. Zayd let Amara have it. She still has it on her bedside table.\n\nSeven years later, we are choosing each other all over again — this time in front of everyone we love.",
                'image' => ['mediaId' => $this->media['walk']->id, 'alt' => 'The couple walking at golden hour'],
                'signature' => 'Amara & Zayd',
                'timeline' => [
                    ['date' => '2019', 'title' => 'The bookshop', 'text' => 'A shared novel and a phone number written on the inside cover.'],
                    ['date' => '2022', 'title' => 'The move', 'text' => 'We built a home full of books, plants and far too many cups of tea.'],
                    ['date' => '2026', 'title' => 'The yes', 'text' => 'In the garden where we had our first picnic, Zayd proposed.'],
                ],
            ]],
            ['events', 'Celebrations', [
                'heading' => 'A Weekend in the Garden',
                'intro' => 'Two days of quiet celebration with our favourite people.',
                'note' => 'Garden attire is encouraged. The ceremony will take place outdoors, weather permitting.',
            ]],
            ['gallery', 'Gallery', [
                'heading' => 'A Few Favourite Things',
                'intro' => 'Books, gardens, golden light and each other.',
                'layout' => 'grid',
                'images' => [
                    ['mediaId' => $this->media['portrait_two']->id, 'alt' => 'The couple', 'caption' => 'Us'],
                    ['mediaId' => $this->media['garden']->id, 'alt' => 'Garden path', 'caption' => 'The garden'],
                    ['mediaId' => $this->media['ceremony']->id, 'alt' => 'Ceremony setting', 'caption' => 'Where we will say yes'],
                    ['mediaId' => $this->media['rings']->id, 'alt' => 'Wedding rings', 'caption' => 'The rings'],
                    ['mediaId' => $this->media['florals']->id, 'alt' => 'Flowers', 'caption' => 'In bloom'],
                ],
            ]],
            ['venue', 'Venue', [
                'heading' => 'The Garden Courtyard',
                'name' => 'The Garden Courtyard',
                'address' => 'Old Lawrence Road, Lahore, Pakistan',
                'map_url' => 'https://maps.google.com/?q=Lahore+Pakistan',
                'image' => ['mediaId' => $this->media['ceremony']->id, 'alt' => 'Ceremony under the trees'],
                'notes' => 'Parking is available on site. The garden path is gravel, so please choose your shoes accordingly.',
            ]],
            ['travel', 'Travel', [
                'heading' => 'Travel & Stay',
                'body' => 'For guests joining us from out of town, here are a few places we love.',
                'hotels' => [
                    ['name' => 'The Lawrence Hotel', 'description' => 'A quiet boutique hotel ten minutes from the venue.', 'address' => 'Lawrence Road, Lahore', 'url' => 'https://maps.google.com/?q=Lahore'],
                    ['name' => 'The Courtyard Guest House', 'description' => 'Family-run, with a beautiful garden breakfast.', 'address' => 'Gulberg, Lahore', 'url' => 'https://maps.google.com/?q=Lahore'],
                ],
                'note' => 'Mention the Amara & Zayd wedding when booking for a preferred rate.',
            ]],
            ['wedding_party', 'Wedding Party', [
                'heading' => 'Our Favourite People',
                'intro' => 'The friends and family standing beside us.',
                'members' => [
                    ['name' => 'Hana Jamil', 'role' => 'Maid of Honour', 'bio' => 'Amara’s sister, keeper of secrets and excellent speech-writer.', 'mediaId' => $this->media['portrait']->id],
                    ['name' => 'Ibrahim Yousuf', 'role' => 'Best Man', 'bio' => 'Zayd’s brother and the reason half the guest list is laughing.', 'mediaId' => $this->media['portrait_two']->id],
                    ['name' => 'Noor Saeed', 'role' => 'Bridesmaid', 'bio' => 'The friend who introduced us to the bookshop in the first place.', 'mediaId' => $this->media['florals']->id],
                ],
            ]],
            ['rsvp', 'RSVP', [
                'heading' => 'Will You Join Us?',
                'intro' => 'Please let us know if you can join us in the garden.',
                'note' => 'The RSVP deadline is listed below. Please include any dietary requirements in your message.',
                'success_message' => 'Thank you for your reply. The garden gate will be open for you.',
            ]],
        ];

        $this->createSections($invitation, $sections);

        $invitation->events()->delete();
        $events = [
            ['Nikah', 'An intimate ceremony beneath the jacaranda trees.', $wedding->copy()->subDay()->setTime(16, 0)->utc(), 'The Garden Courtyard, Lahore', 'Garden formal', 'ceremony'],
            ['Dinner & Dancing', 'A long-table dinner, toasts and dancing under the stars.', $weddingUtc->copy(), 'The Garden Courtyard, Lahore', 'Garden formal', 'venue'],
        ];

        foreach ($events as $index => $event) {
            InvitationEvent::query()->create([
                'invitation_id' => $invitation->id,
                'title' => $event[0],
                'description' => $event[1],
                'event_at' => $event[2],
                'timezone' => 'Asia/Karachi',
                'venue_name' => $event[3],
                'venue_address' => $event[3],
                'map_url' => 'https://maps.google.com/?q=Lahore+Pakistan',
                'dress_code' => $event[4],
                'image_media_id' => $this->media[$event[5]]->id ?? null,
                'rsvp_enabled' => true,
                'sort_order' => $index,
            ]);
        }

        $this->seedRsvps($invitation, [
            ['Noor Saeed', 'noor@example.com', 'attending', 2, 'Would not miss it for the world.', ['meal' => 'Vegetarian']],
            ['Hana Jamil', 'hana@example.com', 'attending', 1, 'Already practicing my speech.', ['meal' => 'Chicken']],
            ['Ibrahim Yousuf', 'ibrahim@example.com', 'attending', 2, 'See you in the garden.', ['meal' => 'Fish']],
            ['Maryam Iqbal', 'maryam@example.com', 'declined', 1, 'Sending all my love from London.', ['meal' => 'Chicken']],
        ]);

        $this->seedActivities($invitation, $owner);
    }

    private function createSections(Invitation $invitation, array $sections): void
    {
        $animationId = \App\Models\AnimationPreset::query()->where('slug', 'fade-up')->value('id');

        foreach ($sections as $index => [$type, $title, $content]) {
            $invitation->sections()->create([
                'type' => $type,
                'title' => $title,
                'content' => $content,
                'animation_preset_id' => $animationId,
                'animation_config' => ['once' => true],
                'sort_order' => $index,
                'is_visible' => true,
            ]);
        }
    }

    private function seedRsvps(Invitation $invitation, array $rows): void
    {
        foreach ($rows as $index => [$name, $email, $attendance, $count, $message, $answers]) {
            RsvpSubmission::query()->updateOrCreate(
                ['invitation_id' => $invitation->id, 'email' => $email],
                [
                    'guest_name' => $name,
                    'phone' => null,
                    'attendance' => $attendance,
                    'guest_count' => $count,
                    'message' => $message,
                    'answers' => $answers,
                    'ip_address' => '127.0.0.1',
                    'user_agent' => 'DemoDataSeeder',
                    'source' => 'public',
                    'admin_notes' => $index === 0 ? 'Sample note: confirmed dietary requirement with the caterer.' : null,
                    'created_at' => now()->subDays(6 - $index)->subHours($index * 3),
                    'updated_at' => now()->subDays(6 - $index),
                ]
            );
        }
    }

    private function seedActivities(Invitation $invitation, User $owner): void
    {
        $invitation->activities()->delete();

        InvitationActivity::query()->create([
            'invitation_id' => $invitation->id,
            'user_id' => $owner->id,
            'type' => 'created',
            'description' => 'Demo invitation created',
            'created_at' => now()->subDays(14),
            'updated_at' => now()->subDays(14),
        ]);
        InvitationActivity::query()->create([
            'invitation_id' => $invitation->id,
            'user_id' => $owner->id,
            'type' => 'published',
            'description' => 'Invitation published to the world',
            'created_at' => now()->subDays(12),
            'updated_at' => now()->subDays(12),
        ]);
        InvitationActivity::query()->create([
            'invitation_id' => $invitation->id,
            'user_id' => null,
            'type' => 'rsvp_received',
            'description' => 'New RSVP from Ayesha Khan',
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);
    }
}
