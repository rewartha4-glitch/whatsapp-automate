import { useEffect, useState } from 'react';
import { Edit, Trash2, PlusCircle, Play, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Journeys() {
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();

  const fetchJourneys = async () => {
    try {
      const res = await fetch('/api/journeys');
      const data = await res.json();
      setJourneys(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this journey?')) return;
    try {
      const res = await fetch(`/api/journey/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setJourneys(journeys.filter((j: any) => j.id !== id));
        toast.success('Journey deleted');
      } else {
        toast.error('Failed to delete journey');
      }
    } catch (e) {
      toast.error('Error deleting journey');
    }
  };

  const handleRunSingle = async (id: string) => {
    try {
      const res = await fetch('/api/journey/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journeyId: id })
      });
      if (res.ok) {
        toast.success('Journey queued for execution!');
        navigate('/');
      } else {
        toast.error('Failed to run journey');
      }
    } catch (e) {
      toast.error('Error running journey');
    }
  };

  const filteredJourneys = journeys
    .filter((j: any) => 
      j.id.toLowerCase().includes(search.toLowerCase()) || 
      (j.description && j.description.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a: any, b: any) => {
      const cmp = (a.description || '').localeCompare(b.description || '');
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Journeys</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your automation flows</p>
        </div>
        <div className="flex gap-4 items-center">
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder="Search journeys..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '250px' }}
            />
          </div>
          <Link to="/add" className="btn btn-primary">
            <PlusCircle size={18} style={{ marginRight: '0.5rem' }} />
            Add New Journey
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="text-center" style={{ padding: '2rem' }}>Loading journeys...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '1rem', fontWeight: 600 }}>ID</th>
                <th style={{ padding: '1rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                  Description {sortOrder === 'asc' ? '↑' : '↓'}
                </th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Phone</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Steps / Version</th>
                <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJourneys.map((j: any) => (
                <tr key={j.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{j.id}</td>
                  <td style={{ padding: '1rem' }}>{j.description}</td>
                  <td style={{ padding: '1rem' }}>{j.phone}</td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{j.step_count}</span> steps (v{j.version})
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => handleRunSingle(j.id)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem', color: 'var(--success)' }}
                        title="Run this journey"
                      >
                        <Play size={16} />
                      </button>
                      <Link 
                        to={`/add?id=${j.id}`}
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem' }}
                        title="Edit journey"
                      >
                        <Edit size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(j.id)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.5rem', color: 'var(--error)' }}
                        title="Delete journey"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredJourneys.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center" style={{ padding: '2rem' }}>No journeys found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
