/**
 * TelemetryPanel island — tank cards + Lightstreamer connection.
 * Hydration: client:load  (core feature — needs data immediately)
 */
import { useEffect, useState } from 'preact/hooks';
import { addLogEntry, $connectionState, $signalLocked, $feedSource } from '../stores/dashboard';
import { LS_CONFIG } from '../lib/config';

/* ── helpers ─────────────────────────────────── */
interface TankState {
  value: string;
  pct: number;
  cls: string;
  statusText: string;
  statusCls: string;
  timestamp: string;
}

function classify(pct: number) {
  if (pct >= 90) return 'danger';
  if (pct >= 75) return 'warn';
  return '';
}

function statusLabel(pct: number) {
  if (pct >= 90) return { text: 'CRITICAL', cls: 'danger' };
  if (pct >= 75) return { text: 'CAUTION',  cls: 'warn'   };
  return { text: 'NOMINAL', cls: '' };
}

/* ── component ───────────────────────────────── */
export default function TelemetryPanel() {
  const [tanks, setTanks] = useState<Record<string, TankState>>({});
  const [badge, setBadge] = useState<{ text: string; cls: string }>({ text: 'STANDBY', cls: 'nominal' });

  /* Initialise tanks + connect Lightstreamer */
  useEffect(() => {
    // Seed empty tank states
    const initial: Record<string, TankState> = {};
    for (const meta of Object.values(LS_CONFIG.items)) {
      initial[meta.id] = { value: '——', pct: 0, cls: '', statusText: 'STANDBY', statusCls: '', timestamp: '' };
    }
    setTanks(initial);

    $feedSource.set(`${LS_CONFIG.server} / ${LS_CONFIG.adapter}`);

    // Dynamic import — only runs in the browser
    import('lightstreamer-client-web').then(({ LightstreamerClient, Subscription }) => {
      const lsClient = new LightstreamerClient(LS_CONFIG.server, LS_CONFIG.adapter);

      // Connection status → shared store
      lsClient.addListener({
        onStatusChange: (status: string) => {
          addLogEntry(`LS status → ${status}`, 'info');
          if (status.startsWith('CONNECTED'))                   $connectionState.set('ok');
          else if (status.startsWith('STALLED') || status.startsWith('DISCONNECTED:WILL-RETRY')) $connectionState.set('warn');
          else if (status.startsWith('DISCONNECTED'))            $connectionState.set('danger');
        },
      });

      const itemNames = Object.keys(LS_CONFIG.items);
      const itemMeta: Record<string, { id: string; label: string; fullName: string }> = {};
      for (const [lsItem, meta] of Object.entries(LS_CONFIG.items)) itemMeta[lsItem] = meta;

      // Tank data subscription (MERGE)
      if (itemNames.length > 0) {
        const tankSub = new Subscription('MERGE', itemNames, LS_CONFIG.fields);
        tankSub.setRequestedSnapshot('yes');

        tankSub.addListener({
          onItemUpdate: (update: any) => {
            const lsItem = update.getItemName();
            const meta   = itemMeta[lsItem];
            if (!meta) return;

            const pct = parseFloat(update.getValue('Value')) || 0;
            const cls = classify(pct);
            const st  = statusLabel(pct);

            let timestamp = '';
            const tsRaw = update.getValue('TimeStamp');
            if (tsRaw) {
              const d = new Date(parseFloat(tsRaw) * 1000);
              timestamp = isNaN(d.getTime()) ? tsRaw : `Last update: ${d.toISOString().slice(11, 19)} UTC`;
            }

            setTanks(prev => ({
              ...prev,
              [meta.id]: { value: pct.toFixed(1), pct, cls, statusText: st.text, statusCls: st.cls, timestamp },
            }));

            if (pct >= 90)      addLogEntry(`${meta.label} at ${pct.toFixed(1)}% — CRITICAL`, 'alert');
            else if (pct >= 75) addLogEntry(`${meta.label} at ${pct.toFixed(1)}% — CAUTION`, 'warning');
          },
        });

        lsClient.subscribe(tankSub);
        addLogEntry(`Subscribed to ${itemNames.length} telemetry item(s): ${itemNames.join(', ')}`, 'info');
      }

      // Signal‑quality subscription
      if (LS_CONFIG.signal_item) {
        const sigSub = new Subscription('MERGE', [LS_CONFIG.signal_item], LS_CONFIG.signal_fields);
        sigSub.addListener({
          onItemUpdate: (update: any) => {
            $signalLocked.set(update.getValue('Status.Class') === '24');
          },
        });
        lsClient.subscribe(sigSub);
      }

      lsClient.connect();
      addLogEntry('Lightstreamer client connecting…', 'info');
      addLogEntry('Dashboard initialised — live telemetry stream active', 'info');
    });
  }, []);

  /* Update system badge whenever tank states change */
  useEffect(() => {
    let worst = '';
    for (const t of Object.values(tanks)) {
      if (t.cls === 'danger') worst = 'danger';
      else if (t.cls === 'warn' && worst !== 'danger') worst = 'warn';
    }
    if (worst === 'danger')     setBadge({ text: 'ALERT',   cls: 'alert'   });
    else if (worst === 'warn')  setBadge({ text: 'CAUTION', cls: 'caution' });
    else                        setBadge({ text: 'NOMINAL', cls: 'nominal' });
  }, [tanks]);

  return (
    <section class="island">
      <div class="island-header">
        <div>
          <div class="island-title">UPA TANK TELEMETRY</div>
          <div class="island-subtitle">Real‑time fluid levels · International Space Station · Lightstreamer ISSLIVE</div>
        </div>
        <div class={`island-badge ${badge.cls}`}>{badge.text}</div>
      </div>

      <div class="tank-grid">
        {Object.entries(LS_CONFIG.items).map(([lsItem, meta]) => {
          const t = tanks[meta.id];
          if (!t) return null;
          return (
            <div class="tank-card" key={meta.id}>
              <div class="tank-label">{meta.label}</div>
              <div class="tank-fullname">{meta.fullName}</div>
              <div class="tank-ls-id">TELEM ID: {lsItem}</div>
              <div class="gauge-track">
                <div class={`gauge-fill ${t.cls}`} style={{ width: `${Math.min(t.pct, 100)}%` }} />
              </div>
              <div class="tank-readout">
                <div class="tank-value"><span>{t.value}</span><span class="unit">%</span></div>
                <div class={`tank-status ${t.statusCls}`}>{t.statusText}</div>
              </div>
              {t.timestamp && <div class="tank-ts">{t.timestamp}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
