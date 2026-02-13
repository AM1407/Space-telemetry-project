<?php
/*
 * ══════════════════════════════════════════════════════════════════════
 *  ISS Crew Manifest API — powered by Guzzle
 * ══════════════════════════════════════════════════════════════════════
 *
 *  Uses the Guzzle HTTP client library (installed via Composer) to
 *  fetch the current list of humans in space from the Open Notify API,
 *  then filters down to ISS crew members.
 *
 *  Technology demonstrated: ✦ Guzzle (HTTP client)
 * ══════════════════════════════════════════════════════════════════════
 */

require_once __DIR__ . '/../vendor/autoload.php';

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache');

try {
    // ── Create a Guzzle HTTP client ──────────────────────────────
    $client = new Client([
        'timeout'  => 10,
        'headers'  => [
            'User-Agent' => 'ISS-UPA-Telemetry-Dashboard/1.0',
            'Accept'     => 'application/json',
        ],
    ]);

    // ── GET request via Guzzle ───────────────────────────────────
    $response = $client->request('GET', 'http://api.open-notify.org/astros.json');
    $data     = json_decode($response->getBody()->getContents(), true);

    // ── Filter to ISS crew only ──────────────────────────────────
    $issCrew = array_values(
        array_filter($data['people'] ?? [], function ($person) {
            return stripos($person['craft'] ?? '', 'iss') !== false;
        })
    );

    echo json_encode([
        'success'        => true,
        'total_in_space' => $data['number'] ?? count($data['people'] ?? []),
        'iss_crew_count' => count($issCrew),
        'crew'           => $issCrew,
        'timestamp'      => time(),
        'source'         => 'api.open-notify.org',
        'method'         => 'guzzle',
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (RequestException $e) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'error'   => 'Guzzle request failed — could not reach crew API',
        'detail'  => $e->getMessage(),
        'method'  => 'guzzle',
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage(),
        'method'  => 'guzzle',
    ], JSON_PRETTY_PRINT);
}
