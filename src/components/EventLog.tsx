/**
 * EventLog island — subscribes to the shared event-log store.
 * Hydration: client:load  (shows live events from all islands)
 */
import { useStore } from '@nanostores/preact';
import { $eventLog } from '../stores/dashboard';

export default function EventLog() {
  const entries = useStore($eventLog);

  return (
    <div class="panel">
      <div class="section-title">Event Log</div>
      <ul class="log-list">
        {entries.map((entry, i) => (
          <li key={i}>
            <span class="log-time">{entry.time}</span>
            <span class={`log-tag ${entry.tag}`}>{entry.tag.toUpperCase()}</span>
            <span>{entry.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
