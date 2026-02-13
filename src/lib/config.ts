/** Shared constants used across all islands */

// PHP API base — adjust to your PHP server
// Dev: PHP runs on localhost:8000 (via php -S localhost:8000)
// Prod: set to "" for same-origin
export const PHP_BASE = "http://localhost:8000";
export const API_URL  = `${PHP_BASE}/api/api.php`;

// Lightstreamer configuration (NASA's public endpoint)
export const LS_CONFIG = {
  server:  "https://push.lightstreamer.com",
  adapter: "ISSLIVE",
  items: {
    "NODE3000005": { id: "wsta", label: "WSTA", fullName: "Waste Storage Tank Assembly" },
    // Uncomment / add more when you find their IDs:
    // "NODE3000002": { id: "edv",  label: "EDV‑U",    fullName: "External Distillation Void" },
    // "NODE3000003": { id: "rfta", label: "RFTA",      fullName: "Recycle Filter Tank Assembly" },
  } as Record<string, { id: string; label: string; fullName: string }>,
  signal_item:   "TIME_000001",
  fields:        ["Value", "Status", "TimeStamp"],
  signal_fields: ["Status.Class", "Status", "TimeStamp"],
};
