<?php
/*
 * ══════════════════════════════════════════════════════════════════════
 *  ISS UPA Telemetry — PHP Support API
 * ══════════════════════════════════════════════════════════════════════
 *
 *  The live tank‑level data comes straight from NASA's Lightstreamer
 *  feed (push.lightstreamer.com / ISSLIVE) via the JS client on the
 *  frontend.  This PHP endpoint supplies supplementary stats and
 *  config the dashboard cannot get from Lightstreamer alone.
 *
 *  ── HOW TO EXTEND ──────────────────────────────────────────────────
 *  • Hook up a database: replace the hard‑coded $stats values below
 *    with queries against your own MySQL / SQLite / etc.
 *  • Store history: have the frontend POST each reading here so you
 *    can persist a time‑series table and compute averages.
 *  • Add auth: wrap everything in a session / token check.
 *
 *  JSON shape returned:
 *  {
 *      "lightstreamer": {               ← passed to the JS client
 *          "server":  "https://push.lightstreamer.com",
 *          "adapter": "ISSLIVE",
 *          "items":   { … mapping … },
 *          "fields":  ["Value","Status","TimeStamp"]
 *      },
 *      "stats": { … dashboard sidebar data … }
 *  }
 * ══════════════════════════════════════════════════════════════════════
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-cache');

/* ── Lightstreamer config ──────────────────────────────────────────
 *  The frontend reads this so every setting lives in one place (here).
 *  "items" maps a Lightstreamer item‑name ➜ dashboard card‑id.
 *
 *  NODE3000005 = UPA Waste Storage Tank level  (confirmed by NASA ISS Live)
 *  TIME_000001 = Telemetry signal heartbeat / status
 *
 *  ➜ When you discover more item IDs, just add them to this array.
 *    The dashboard will create a card for each entry automatically.
 */
$lightstreamer = [
    'server'  => 'https://push.lightstreamer.com',
    'adapter' => 'ISSLIVE',
    'items'   => [
        // 'LightstreamerItemID' => [ dashboard‑card‑id, display label, full description ]
        'NODE3000005' => [
            'id'       => 'wsta',
            'label'    => 'WSTA',
            'fullName' => 'Waste Storage Tank Assembly',
        ],
        // ── ADD MORE TANKS HERE as you find the real telemetry IDs ──
        // 'NODE3000002' => [
        //     'id'       => 'edv',
        //     'label'    => 'EDV‑U',
        //     'fullName' => 'External Distillation Void',
        // ],
        // 'NODE3000003' => [
        //     'id'       => 'rfta',
        //     'label'    => 'RFTA',
        //     'fullName' => 'Recycle Filter Tank Assembly',
        // ],
    ],
    'signal_item' => 'TIME_000001',          // heartbeat / signal quality
    'fields'      => ['Value', 'Status', 'TimeStamp'],
    'signal_fields' => ['Status.Class', 'Status', 'TimeStamp'],
];

/* ── Supplementary stats ───────────────────────────────────────────
 *  Fill these in from your own data source (DB, file, calculation…).
 *  The dashboard reads every key it finds here.
 */

// ── Replace with real DB queries when you have a data source ──────
// For now these are realistic reference values for ISS Expedition 72.
$stats = [
    'total'    => '2,847 L',         // Total litres processed through UPA
    'cycles'   => '1,206',            // Number of distillation cycles completed
    'recovery' => '~93.5%',           // Overall water-recovery percentage
    'crew'     => '7',                // Current crew complement aboard ISS
    'purge'    => '2026-02-18 14:00 UTC',  // Next scheduled purge window
];

/* ── Build response ────────────────────────────────────────────────*/
echo json_encode([
    'lightstreamer' => $lightstreamer,
    'stats'         => $stats,
    'generated_at'  => gmdate('Y-m-d\TH:i:s\Z'),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
