/**
 * CrewPanel island — ISS crew manifest from PHP Guzzle endpoint.
 * Hydration: client:idle  (not urgent — loads when browser is idle)
 */
import { useEffect, useState } from 'preact/hooks';
import { addLogEntry } from '../stores/dashboard';
import { PHP_BASE } from '../lib/config';

interface CrewMember { name: string; craft: string; }

export default function CrewPanel() {
  const [crew, setCrew]             = useState<CrewMember[]>([]);
  const [issCount, setIssCount]     = useState('—');
  const [spaceCount, setSpaceCount] = useState('—');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);

  useEffect(() => {
    async function fetchCrew() {
      try {
        const res = await fetch(`${PHP_BASE}/api/crew.php`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Crew data unavailable');

        setIssCount(data.iss_crew_count ?? '—');
        setSpaceCount(data.total_in_space ?? '—');
        setCrew(data.crew || []);
        setLoading(false);
        setError(false);
        addLogEntry(`Crew manifest loaded via Guzzle — ${data.iss_crew_count} aboard ISS`, 'info');
      } catch (e: any) {
        setLoading(false);
        setError(true);
        addLogEntry(`Crew fetch failed: ${e.message}`, 'warning');
      }
    }

    fetchCrew();
    const id = setInterval(fetchCrew, 300_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div class="sidebar-panel">
      <div class="panel-header">
        <span class="panel-title">CREW MANIFEST</span>
        <span class="panel-meta">Guzzle → Open Notify API</span>
      </div>
      <div class="crew-summary">
        <strong>{issCount}</strong> aboard ISS{' '}
        <span class="crew-total">(<strong>{spaceCount}</strong> humans in space)</span>
      </div>
      <ul class="crew-list">
        {loading && <li class="placeholder">Loading crew data…</li>}
        {error && <li class="placeholder">Crew data unavailable — is PHP running?</li>}
        {!loading && !error && crew.length === 0 && <li class="placeholder">No ISS crew data available</li>}
        {crew.map((p, i) => (
          <li key={i}>
            <span class="crew-dot" />
            <span class="crew-name">{p.name}</span>
            <span class="crew-craft">{p.craft}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
