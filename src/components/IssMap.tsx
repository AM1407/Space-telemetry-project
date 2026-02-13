/**
 * IssMap island — Leaflet map showing ISS ground track.
 * Hydration: client:visible  (heavy component — only hydrate when scrolled into view)
 *
 * Leaflet JS/CSS is loaded via CDN in the Astro layout <head>.
 * We access it through window.L at runtime.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { addLogEntry, utcStamp } from '../stores/dashboard';
import { PHP_BASE } from '../lib/config';

declare const L: any;          // provided by CDN script

export default function IssMap() {
  const mapEl = useRef<HTMLDivElement>(null);

  const [lat, setLat]       = useState('——');
  const [lng, setLng]       = useState('——');
  const [alt, setAlt]       = useState('——');
  const [vel, setVel]       = useState('——');
  const [ts,  setTs]        = useState('——');
  const [source, setSource] = useState('cURL → Open Notify API · updates every 5 s');

  useEffect(() => {
    if (!mapEl.current || typeof L === 'undefined') return;

    /* ── Icon ── */
    const issIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:20px; height:20px; border-radius:50%;
        background:var(--c-accent,#6b9fcc);
        border:2px solid #e2e8f0;
        box-shadow:0 0 12px rgba(107,159,204,.6),0 0 24px rgba(107,159,204,.3);
      "></div>`,
      iconSize:   [20, 20],
      iconAnchor: [10, 10],
    });

    /* ── Map ── */
    const map = L.map(mapEl.current, {
      center: [0, 0], zoom: 2,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18, subdomains: 'abcd',
    }).addTo(map);
    L.control.attribution({ prefix: false }).addTo(map);

    const marker = L.marker([0, 0], { icon: issIcon }).addTo(map);
    const trailCoords: number[][] = [];
    const trail = L.polyline(trailCoords, {
      color: 'rgba(107,159,204,.45)', weight: 2, dashArray: '4 6',
    }).addTo(map);

    let firstPosition = true;

    async function fetchISSPosition() {
      try {
        const res = await fetch(`${PHP_BASE}/api/position.php`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Position unavailable');

        const posLat = data.latitude;
        const posLng = data.longitude;

        setLat(posLat.toFixed(4));
        setLng(posLng.toFixed(4));
        setAlt(Math.round(data.altitude).toLocaleString());
        setVel(Math.round(data.velocity).toLocaleString());
        setTs(utcStamp());

        marker.setLatLng([posLat, posLng]);

        // Handle date-line wrapping
        if (trailCoords.length > 0 && Math.abs(posLng - trailCoords[trailCoords.length - 1][1]) > 180) {
          trailCoords.length = 0;
        }
        trailCoords.push([posLat, posLng]);
        if (trailCoords.length > 120) trailCoords.shift();
        trail.setLatLngs(trailCoords);

        if (firstPosition) {
          map.setView([posLat, posLng], 3);
          firstPosition = false;
          addLogEntry(`ISS position acquired via cURL — ${posLat.toFixed(2)}°, ${posLng.toFixed(2)}°`, 'info');
        }

        if (data.source) setSource(`cURL → ${data.source} · updates every 5 s`);
      } catch (e: any) {
        addLogEntry(`ISS position fetch failed: ${e.message}`, 'warning');
      }
    }

    fetchISSPosition();
    const id = setInterval(fetchISSPosition, 5000);

    return () => { clearInterval(id); map.remove(); };
  }, []);

  return (
    <div class="map-panel">
      <div class="panel-header">
        <span class="panel-title">ISS GROUND TRACK</span>
        <span class="panel-meta">{source}</span>
      </div>
      <div ref={mapEl} style={{ width: '100%', height: '320px', background: '#0d1117' }} />
      <div class="map-readouts">
        <span>LAT <strong>{lat}</strong>°</span>
        <span>LNG <strong>{lng}</strong>°</span>
        <span>ALT <strong>{alt}</strong> km</span>
        <span>VEL <strong>{vel}</strong> km/h</span>
        <span>UPDATED <strong>{ts}</strong></span>
      </div>
    </div>
  );
}
