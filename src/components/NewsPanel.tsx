/**
 * NewsPanel island — NASA news from PHP web-crawler endpoint.
 * Hydration: client:idle  (not critical — loads when browser is idle)
 */
import { useEffect, useState } from 'preact/hooks';
import { addLogEntry } from '../stores/dashboard';
import { PHP_BASE } from '../lib/config';

interface Article { title: string; link: string; date: string; excerpt?: string; }

export default function NewsPanel() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch(`${PHP_BASE}/api/news.php`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'News unavailable');

        setArticles(data.articles || []);
        setLoading(false);
        setError(false);
        addLogEntry(`NASA news crawled — ${data.count} articles from RSS feed`, 'info');
      } catch (e: any) {
        setLoading(false);
        setError(true);
        addLogEntry(`News crawl failed: ${e.message}`, 'warning');
      }
    }

    fetchNews();
    const id = setInterval(fetchNews, 300_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div class="sidebar-panel">
      <div class="panel-header">
        <span class="panel-title">NASA UPDATES</span>
        <span class="panel-meta">Crawler → NASA Blog RSS</span>
      </div>
      <ul class="news-list">
        {loading && <li class="placeholder">Crawling NASA feed…</li>}
        {error && <li class="placeholder">News feed unavailable — is PHP running?</li>}
        {!loading && !error && articles.length === 0 && <li class="placeholder">No articles found</li>}
        {articles.map((a, i) => (
          <li key={i}>
            <a class="news-title" href={a.link} target="_blank" rel="noopener">{a.title}</a>
            <div class="news-date">{a.date}</div>
            {a.excerpt && <div class="news-excerpt">{a.excerpt}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
