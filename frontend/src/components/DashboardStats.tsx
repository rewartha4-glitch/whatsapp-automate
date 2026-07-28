import { Activity, CheckCircle, Clock, List } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalJourneys: 0,
    successRate: 0,
    avgDuration: 0,
    runsLast24h: 0
  });

  useEffect(() => {
    // In a real app, this would be an API call.
    // We're calculating from history for now.
    const fetchStats = async () => {
      try {
        const [journeysRes, historyRes] = await Promise.all([
          fetch('/api/journeys'),
          fetch('/api/history?limit=100')
        ]);
        const journeys = await journeysRes.json();
        const history = await historyRes.json();

        const passCount = Array.isArray(history) ? history.filter((h: any) => h.status === 'PASS').length : 0;
        const totalFinished = Array.isArray(history) ? history.filter((h: any) => h.status === 'PASS' || h.status === 'FAIL').length : 0;
        const successRate = totalFinished ? Math.round((passCount / totalFinished) * 100) : 0;
        
        const durations = Array.isArray(history) ? history.filter((h: any) => h.duration_ms).map((h: any) => h.duration_ms) : [];
        const avgDuration = durations.length ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length : 0;

        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const runsLast24h = Array.isArray(history) ? history.filter((h: any) => new Date(h.start_time).getTime() > oneDayAgo).length : 0;

        setStats({
          totalJourneys: Array.isArray(journeys) ? journeys.length : 0,
          successRate,
          avgDuration,
          runsLast24h
        });
      } catch (e) {
        console.error('Failed to fetch stats', e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
      <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--accent-primary)' }}>
          <List size={24} />
        </div>
        <div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Active Journeys</div>
          <div className="text-2xl font-bold">{stats.totalJourneys}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--success)' }}>
          <CheckCircle size={24} />
        </div>
        <div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Success Rate</div>
          <div className="text-2xl font-bold">{stats.successRate}%</div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: 'var(--error)' }}>
          <Clock size={24} />
        </div>
        <div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg. Duration</div>
          <div className="text-2xl font-bold">{(stats.avgDuration / 1000).toFixed(1)}s</div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: '#f59e0b' }}>
          <Activity size={24} />
        </div>
        <div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Runs (24h)</div>
          <div className="text-2xl font-bold">{stats.runsLast24h}</div>
        </div>
      </div>
    </div>
  );
}
