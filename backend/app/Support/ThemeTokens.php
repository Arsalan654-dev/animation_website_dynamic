<?php

namespace App\Support;

class ThemeTokens
{
    public static function defaults(): array
    {
        return config('wedding.default_theme_tokens');
    }

    /**
     * Recursively merge a theme token payload over the app defaults.
     * Values are scalar-safe; the frontend maps them to CSS variables.
     */
    public static function merge(?array $tokens): array
    {
        return self::mergeRecursive(self::defaults(), $tokens ?? []);
    }

    /**
     * Merge only the whitelisted theme keys so stray JSON cannot leak
     * executable or arbitrary CSS values into public responses.
     */
    public static function sanitize(array $tokens): array
    {
        $defaults = self::defaults();
        $clean = [];

        foreach ($defaults as $group => $values) {
            if (! isset($tokens[$group]) || ! is_array($tokens[$group])) {
                $clean[$group] = $values;

                continue;
            }

            $clean[$group] = array_replace($values, array_intersect_key($tokens[$group], $values));
        }

        return $clean;
    }

    private static function mergeRecursive(array $base, array $overrides): array
    {
        foreach ($overrides as $key => $value) {
            if (is_array($value) && isset($base[$key]) && is_array($base[$key])) {
                $base[$key] = self::mergeRecursive($base[$key], $value);
            } else {
                $base[$key] = $value;
            }
        }

        return $base;
    }
}
