/**
 * StatsPanel island — fetches system stats from the PHP API.
 * Hydration: client:load
 */
import { useEffect, useState } from 'preact/hooks';
import { addLogEntry } from '../stores/dashboard';
import { API_URL } from '../lib/config';

const DEFAULT_STATS: Record<string, string> = {
  total:    '2,847 L',
  cycles:   '1,206',
  recovery: '~93.5%',
  crew:     '7',
  purge:    '2026-02-18 14:00 UTC',
};

export default function StatsPanel() {
  const [stats, setStats] = useState(DEFAULT_STATS);

  useEffect(() => {
    fetch(API_URL)
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => {
        if (data.stats) {
          setStats(prev => ({ ...prev, ...data.stats }));
          addLogEntry('PHP stats loaded — values updated', 'info');
        }
      })
      .catch(() => { /* defaults already applied */ });
  }, []);

  return (
    <div class="panel">
      <div class="section-title">System Summary</div>
      {[
        ['Total Processed (L)', stats.total],
        ['Distillation Cycles', stats.cycles],
        ['Recovery Rate',       stats.recovery],
        ['Crew Complement',     stats.crew],
        ['Next Purge Window',   stats.purge],
      ].map(([label, value]) => (
        <div class="stat-row" key={label}>
          <span class="stat-label">{label}</span>
          <span class="stat-value">{value}</span>
        </div>
      ))}
    </div>
  );
}
