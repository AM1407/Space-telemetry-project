/**
 * HeaderBar island — top bar (clock, connection, signal) + sub bar (feed, GET clock).
 * Hydration: client:load  (needed immediately)
 */
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $connectionState, $signalLocked, $feedSource } from '../stores/dashboard';

export default function HeaderBar() {
  const connectionState = useStore($connectionState);
  const signalLocked    = useStore($signalLocked);
  const feedSource      = useStore($feedSource);

  const [utcTime, setUtcTime] = useState('UTC 00:00:00');
  const [getTime, setGetTime] = useState('000/00:00:00');

  useEffect(() => {
    function tick() {
      const now = new Date();
      setUtcTime(`UTC ${now.toISOString().slice(11, 19)}`);

      // Ground elapsed time (days since ISS Expedition 1: 2000‑11‑02)
      const epoch = new Date('2000-11-02T00:00:00Z');
      const diff  = now.getTime() - epoch.getTime();
      const days  = Math.floor(diff / 86400000);
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const mm = String(now.getUTCMinutes()).padStart(2, '0');
      const ss = String(now.getUTCSeconds()).padStart(2, '0');
      setGetTime(`${days}/${hh}:${mm}:${ss}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const dotClass  = connectionState === 'ok' ? '' : connectionState === 'warn' ? 'warn' : 'danger';
  const connLabel = connectionState === 'ok' ? 'LIVE' : connectionState === 'warn' ? 'RECONNECTING' : 'OFFLINE';
  const sigColor  = signalLocked ? 'var(--c-ok)' : 'var(--c-danger)';

  return (
    <>
      {/* ═══════ TOP BAR ═══════ */}
      <header class="topbar">
        <div class="topbar-left">
          <div>
            <div class="mission-badge">MCC‑H  ·  ISS OPS</div>
            <div class="mission-sub">Urine Processing Assembly — Environmental Control &amp; Life Support</div>
          </div>
        </div>
        <div class="topbar-right">
          <span><span class={`status-dot ${dotClass}`}></span> <span>{connLabel}</span></span>
          <span>|</span>
          <span style={{ color: 'var(--c-accent2)' }}>{utcTime}</span>
          <span>|</span>
          <span>SIGNAL: <span style={{ color: sigColor }}>{signalLocked ? 'LOCKED' : 'NO SIGNAL'}</span></span>
        </div>
      </header>

      {/* ═══════ SUB BAR ═══════ */}
      <div class="subbar">
        <span>SYS: ECLSS &gt; WRS &gt; UPA</span>
        <span>FEED: <span>{feedSource}</span></span>
        <span>GROUND ELAPSED TIME: <span>{getTime}</span></span>
      </div>
    </>
  );
}
