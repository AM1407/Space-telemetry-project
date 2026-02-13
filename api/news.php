<?php
/*
 * ══════════════════════════════════════════════════════════════════════
 *  NASA News Crawler — powered by DOMDocument / DOMXPath
 * ══════════════════════════════════════════════════════════════════════
 *
 *  Crawls the NASA Space Station blog RSS feed, traverses the XML DOM
 *  tree with DOMXPath queries, and extracts the latest news articles.
 *
 *  Technology demonstrated: ✦ Web Crawler (DOMDocument + DOMXPath)
 * ══════════════════════════════════════════════════════════════════════
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache');

$feedUrl  = 'https://blogs.nasa.gov/spacestation/feed/';
$maxItems = 5;

// ── 1. Fetch the RSS feed ────────────────────────────────────────
// Try file_get_contents first, fall back to cURL.
$xml = false;

$context = stream_context_create([
    'http' => [
        'timeout'    => 10,
        'user_agent' => 'ISS-UPA-Telemetry-Dashboard/1.0',
    ],
    'ssl' => [
        'verify_peer'      => false,
        'verify_peer_name' => false,
    ],
]);

$xml = @file_get_contents($feedUrl, false, $context);

if ($xml === false && function_exists('curl_init')) {
    $ch = curl_init($feedUrl);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT      => 'ISS-UPA-Telemetry-Dashboard/1.0',
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $xml = curl_exec($ch);
    curl_close($ch);
}

if (!$xml) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'error'   => 'Failed to fetch NASA RSS feed',
        'url'     => $feedUrl,
        'method'  => 'crawler',
    ], JSON_PRETTY_PRINT);
    exit;
}

// ── 2. Parse the XML with DOMDocument ────────────────────────────
libxml_use_internal_errors(true);

$doc = new DOMDocument();
$doc->loadXML($xml);

$errors = libxml_get_errors();
libxml_clear_errors();

if (!$doc->documentElement) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'error'   => 'Failed to parse RSS XML',
        'method'  => 'crawler',
    ], JSON_PRETTY_PRINT);
    exit;
}

// ── 3. Crawl the DOM with XPath ──────────────────────────────────
$xpath = new DOMXPath($doc);
$items = $xpath->query('//channel/item');

$news  = [];
$count = 0;

foreach ($items as $item) {
    if ($count >= $maxItems) break;

    $titleNode   = $xpath->query('title', $item)->item(0);
    $linkNode    = $xpath->query('link', $item)->item(0);
    $pubNode     = $xpath->query('pubDate', $item)->item(0);
    $descNode    = $xpath->query('description', $item)->item(0);

    // Clean description — strip HTML, collapse whitespace, truncate
    $excerpt = '';
    if ($descNode) {
        $excerpt = strip_tags($descNode->textContent);
        $excerpt = preg_replace('/\s+/', ' ', trim($excerpt));
        if (mb_strlen($excerpt) > 180) {
            $excerpt = mb_substr($excerpt, 0, 180) . '…';
        }
    }

    // Format date nicely
    $dateFormatted = '';
    if ($pubNode) {
        $ts = strtotime($pubNode->textContent);
        $dateFormatted = $ts ? gmdate('M j, Y · H:i UTC', $ts) : $pubNode->textContent;
    }

    $news[] = [
        'title'   => $titleNode ? trim($titleNode->textContent) : 'Untitled',
        'link'    => $linkNode  ? trim($linkNode->textContent)  : '#',
        'date'    => $dateFormatted,
        'excerpt' => $excerpt,
    ];

    $count++;
}

// ── 4. Return structured JSON ────────────────────────────────────
echo json_encode([
    'success'    => true,
    'count'      => count($news),
    'articles'   => $news,
    'source'     => $feedUrl,
    'crawled_at' => gmdate('Y-m-d\TH:i:s\Z'),
    'method'     => 'crawler (DOMDocument + DOMXPath)',
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
