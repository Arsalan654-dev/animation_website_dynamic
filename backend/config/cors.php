<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => (function () {
        $origins = array_values(array_filter(array_map('trim', explode(',', env(
            'CORS_ALLOWED_ORIGINS',
            env('FRONTEND_URL', 'http://localhost:5173').',http://localhost:5173,http://127.0.0.1:5173'
        )))));

        return in_array('*', $origins, true) ? ['*'] : $origins;
    })(),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 3600,

    'supports_credentials' => false,

];
