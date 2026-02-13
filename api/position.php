<?php
/*
 * ══════════════════════════════════════════════════════════════════════
 *  ISS Position API — powered by cURL
 * ══════════════════════════════════════════════════════════════════════
 *
 *  Uses PHP's cURL extension to fetch the current latitude / longitude
 *  of the International Space Station from public APIs.
 *
 *  Primary source:   api.open-notify.org/iss-now.json
 *  Fallback source:  api.wheretheiss.at/v1/satellites/25544
 *
 *  Technology demonstrated: ✦ cURL
 * ══════════════════════════════════════════════════════════════════════
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache');

// ── Helper: fetch a URL with cURL ────────────────────────────────
function curlFetch(string $url): array
{
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'ISS-UPA-Telemetry-Dashboard/1.0',
        CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    ]);

    $body     = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error    = curl_error($ch);
    curl_close($ch);

    return [
        'body'     => $body,
        'httpCode' => $httpCode,
        'error'    => $error,
    ];
}

// ── 1. Try Open Notify API (primary) ─────────────────────────────
$primary = curlFetch('http://api.open-notify.org/iss-now.json');

if (!$primary['error'] && $primary['httpCode'] === 200) {
    $data = json_decode($primary['body'], true);

    if (isset($data['iss_position'])) {
        echo json_encode([
            'success'   => true,
            'latitude'  => (float) $data['iss_position']['latitude'],
            'longitude' => (float) $data['iss_position']['longitude'],
            'altitude'  => 408.0,    // average ISS altitude in km
            'velocity'  => 27600.0,  // average ISS velocity in km/h
            'timestamp' => $data['timestamp'] ?? time(),
            'source'    => 'api.open-notify.org',
            'method'    => 'curl',
        ], JSON_PRETTY_PRINT);
        exit;
    }
}

// ── 2. Fallback: Where The ISS At ───────────────────────────────
$fallback = curlFetch('https://api.wheretheiss.at/v1/satellites/25544');

if (!$fallback['error'] && $fallback['httpCode'] === 200) {
    $data = json_decode($fallback['body'], true);

    echo json_encode([
        'success'   => true,
        'latitude'  => (float) ($data['latitude']  ?? 0),
        'longitude' => (float) ($data['longitude'] ?? 0),
        'altitude'  => (float) ($data['altitude']  ?? 408),
        'velocity'  => (float) ($data['velocity']  ?? 27600),
        'timestamp' => time(),
        'source'    => 'api.wheretheiss.at (fallback)',
        'method'    => 'curl',
    ], JSON_PRETTY_PRINT);
    exit;
}

// ── Both failed ──────────────────────────────────────────────────
http_response_code(502);
echo json_encode([
    'success' => false,
    'error'   => 'Failed to fetch ISS position from both sources',
    'detail'  => $primary['error'] ?: "HTTP {$primary['httpCode']}",
    'method'  => 'curl',
], JSON_PRETTY_PRINT);
