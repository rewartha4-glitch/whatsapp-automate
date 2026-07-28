import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { PlayCircle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardStats from '../components/DashboardStats';

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history?limit=20');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        console.error('Invalid history response:', data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAll = async () => {
    try {
      await fetch('/api/journey/run-all', { method: 'POST' });
      toast.success('All flows queued for execution!');
      fetchHistory();
    } catch (e) {
      toast.error('Failed to run all flows');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this execution?')) return;
    try {
      const res = await fetch(`/api/journey/cancel/${id}`, { method: 'POST' });
      if (res.ok) {
        toast.success('Execution cancelled');
        fetchHistory();
      } else {
        toast.error('Failed to cancel');
      }
    } catch (e) {
      toast.error('Error cancelling');
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Execution History</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>View the recent WhatsApp automation runs</p>
        </div>
        <button onClick={handleRunAll} className="btn btn-primary">
          <PlayCircle size={18} style={{ marginRight: '0.5rem' }} />
          Run All Flows Now
        </button>
      </div>

      <DashboardStats />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="text-center" style={{ padding: '2rem' }}>Loading history...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem', fontWeight: 600 }}>ID</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Journey ID</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Duration</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Start Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((exec: any) => (
                <tr key={exec.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{exec.id.substring(0, 8)}...</td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{exec.journey_id}</td>
                  <td style={{ padding: '1rem' }}>
                    {exec.status === 'PASS' ? (
                      <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={16}/> PASS</span>
                    ) : exec.status === 'RUNNING' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>RUNNING</span>
                        <button 
                          onClick={() => handleCancel(exec.id)}
                          style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--error)', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : exec.status === 'CANCELLED' ? (
                      <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>CANCELLED</span>
                    ) : (
                      <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={16}/> FAIL</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>{exec.duration_ms ? `${(exec.duration_ms / 1000).toFixed(1)}s` : '-'}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {format(new Date(exec.start_time), 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center" style={{ padding: '2rem' }}>No history found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
