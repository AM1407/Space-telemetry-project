/**
 * Shared state store (nanostores) — enables cross-island communication.
 * Any island can read/write these atoms; subscribers re-render automatically.
 */
import { atom } from 'nanostores';

/* ── Types ─────────────────────────────────────────────── */
export interface LogEntry {
  time: string;
  tag: string;
  message: string;
}

/* ── Atoms ─────────────────────────────────────────────── */
export const $eventLog        = atom<LogEntry[]>([
  { time: '--:--:--', tag: 'info', message: 'Awaiting telemetry stream…' },
]);
export const $connectionState = atom<'ok' | 'warn' | 'danger'>('danger');
export const $signalLocked    = atom(false);
export const $feedSource      = atom('——');

/* ── Helpers ───────────────────────────────────────────── */
export function utcStamp(): string {
  return new Date().toISOString().slice(11, 19);
}

export function addLogEntry(message: string, tag = 'info') {
  const time = utcStamp();
  const current = $eventLog.get();
  $eventLog.set([{ time, tag, message }, ...current].slice(0, 80));
}
