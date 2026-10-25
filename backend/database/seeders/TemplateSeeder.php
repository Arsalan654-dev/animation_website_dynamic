<?php

namespace Database\Seeders;

use App\Models\Template;
use App\Models\Theme;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    public function run(): void
    {
        $themes = Theme::query()->pluck('id', 'slug');

        $templates = [
            [
                'name' => 'The Heritage Envelope',
                'slug' => 'heritage-envelope',
                'category' => 'classic',
                'description' => 'A formal celebration layout with countdown, story, schedule, gallery and gifts.',
                'theme' => 'burgundy-olive',
                'thumbnail_path' => '/demo/florals.jpg',
                'sections' => [
                    ['type' => 'hero', 'content' => ['eyebrow' => 'Together with their families', 'subheading' => 'invite you to celebrate their wedding', 'show_countdown' => true]],
                    ['type' => 'countdown', 'content' => ['heading' => 'Counting Down to Forever', 'intro' => 'Every moment brings us closer to the day we say yes.']],
                    ['type' => 'story', 'content' => ['heading' => 'Our Story', 'body' => 'Tell the story of how you met, the little moments that mattered, and the life you are building together.']],
                    ['type' => 'events', 'content' => ['heading' => 'The Celebrations', 'intro' => 'Join us for the moments that make up our wedding week.']],
                    ['type' => 'gallery', 'content' => ['heading' => 'Moments', 'intro' => 'A collection of memories leading us here.', 'layout' => 'masonry', 'images' => []]],
                    ['type' => 'venue', 'content' => ['heading' => 'The Venue', 'notes' => 'We look forward to welcoming you.']],
                    ['type' => 'gifts', 'content' => ['heading' => 'With Gratitude', 'body' => 'Your presence is the greatest gift. Should you wish to honour us further, a contribution to our new beginning would be warmly received.', 'links' => []]],
                    ['type' => 'rsvp', 'content' => ['heading' => 'Will You Join Us?', 'intro' => 'Kindly let us know if you will be able to celebrate with us.', 'note' => 'Please respond before the deadline.']],
                ],
            ],
            [
                'name' => 'Toile Garden Romance',
                'slug' => 'toile-garden-romance',
                'category' => 'garden',
                'description' => 'A blue-and-ivory editorial layout with a quote, travel notes and a romantic gallery.',
                'theme' => 'blue-toile',
                'thumbnail_path' => '/demo/garden.jpg',
                'sections' => [
                    ['type' => 'hero', 'content' => ['eyebrow' => 'A garden celebration', 'subheading' => 'request the pleasure of your company', 'show_countdown' => true]],
                    ['type' => 'quote', 'content' => ['quote' => 'And so, with a garden full of love, we begin the rest of our lives.', 'attribution' => 'The couple']],
                    ['type' => 'story', 'content' => ['heading' => 'How It Began', 'body' => 'Share the moments that brought you here.']],
                    ['type' => 'events', 'content' => ['heading' => 'A Weekend of Celebration']],
                    ['type' => 'gallery', 'content' => ['heading' => 'A Few Favourite Things', 'layout' => 'grid', 'images' => []]],
                    ['type' => 'venue', 'content' => ['heading' => 'Directions & Details']],
                    ['type' => 'travel', 'content' => ['heading' => 'Travel & Stay', 'body' => 'A little guidance for guests joining us from out of town.', 'hotels' => []]],
                    ['type' => 'rsvp', 'content' => ['heading' => 'Will You Join Us?']],
                ],
            ],
            [
                'name' => 'Gilded Evening',
                'slug' => 'gilded-evening',
                'category' => 'modern',
                'description' => 'A dark, cinematic layout with gold detailing, designed for a black-tie evening.',
                'theme' => 'black-gold',
                'thumbnail_path' => '/demo/venue.jpg',
                'sections' => [
                    ['type' => 'hero', 'content' => ['eyebrow' => 'A black-tie celebration', 'subheading' => 'invite you to an evening to remember', 'show_countdown' => false]],
                    ['type' => 'events', 'content' => ['heading' => 'The Evening']],
                    ['type' => 'story', 'content' => ['heading' => 'Our Story', 'body' => 'An editorial retelling of the moments that brought you together.']],
                    ['type' => 'gallery', 'content' => ['heading' => 'The Gallery', 'layout' => 'masonry', 'images' => []]],
                    ['type' => 'venue', 'content' => ['heading' => 'The Setting']],
                    ['type' => 'gifts', 'content' => ['heading' => 'Gifts', 'body' => 'Your presence is gift enough.']],
                    ['type' => 'rsvp', 'content' => ['heading' => 'Kindly Reply']],
                ],
            ],
            [
                'name' => 'Sage Garden Party',
                'slug' => 'sage-garden-party',
                'category' => 'garden',
                'description' => 'Soft sage, cream and botanical details for an intimate outdoor gathering.',
                'theme' => 'sage-cream',
                'thumbnail_path' => '/demo/ceremony.jpg',
                'sections' => [
                    ['type' => 'hero', 'content' => ['eyebrow' => 'Together with their families', 'subheading' => 'invite you to celebrate in the garden', 'show_countdown' => true]],
                    ['type' => 'story', 'content' => ['heading' => 'Our Story', 'body' => 'Tell your story in your own words.']],
                    ['type' => 'events', 'content' => ['heading' => 'The Celebration']],
                    ['type' => 'gallery', 'content' => ['heading' => 'Moments', 'layout' => 'grid', 'images' => []]],
                    ['type' => 'countdown', 'content' => ['heading' => 'The Countdown']],
                    ['type' => 'venue', 'content' => ['heading' => 'The Garden']],
                    ['type' => 'rsvp', 'content' => ['heading' => 'Will You Join Us?']],
                ],
            ],
        ];

        foreach ($templates as $template) {
            Template::query()->updateOrCreate(
                ['slug' => $template['slug']],
                [
                    'name' => $template['name'],
                    'description' => $template['description'],
                    'category' => $template['category'],
                    'thumbnail_path' => $template['thumbnail_path'],
                    'default_theme_id' => $themes[$template['theme']] ?? null,
                    'layout' => ['sections' => $template['sections']],
                    'is_active' => true,
                ]
            );
        }
    }
}
