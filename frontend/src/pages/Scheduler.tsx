import { useState, useEffect } from 'react';
import { Save, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Scheduler() {
  const [cron, setCron] = useState('0 * * * *');
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/schedule')
      .then(res => res.json())
      .then(data => {
        if (data.cron) setCron(data.cron);
        if (data.enabled !== undefined) setEnabled(data.enabled);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cron, enabled })
      });
      if (res.ok) {
        toast.success('Schedule updated successfully!');
      } else {
        toast.error('Failed to update schedule');
      }
    } catch (e) {
      toast.error('Error updating schedule');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Scheduler Setup</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Configure automatic execution of all flows</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary">
          <Save size={18} style={{ marginRight: '0.5rem' }} />
          Save Schedule
        </button>
      </div>

      <div className="card flex flex-col gap-6">
        <div className="flex items-center gap-4 p-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <Clock size={24} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h3 className="font-bold text-lg">Automated Test Runs</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>When enabled, the system will automatically run all journeys at the specified interval.</p>
          </div>
        </div>

        <div>
          <label className="label">Status</label>
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              checked={enabled} 
              onChange={e => setEnabled(e.target.checked)} 
              style={{ width: '1.2rem', height: '1.2rem' }}
            />
            <span>{enabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>

        <div>
          <label className="label">Cron Expression</label>
          <input 
            className="input" 
            value={cron} 
            onChange={e => setCron(e.target.value)} 
            placeholder="e.g. 0 * * * * for every hour"
          />
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Common patterns:
            <br/>• <code>0 * * * *</code> (Every hour)
            <br/>• <code>0 8 * * *</code> (Every day at 08:00)
            <br/>• <code>*/30 * * * *</code> (Every 30 minutes)
          </p>
        </div>
      </div>
    </div>
  );
}
