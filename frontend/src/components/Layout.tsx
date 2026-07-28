import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, PlusCircle, Clock, LogOut, Smartphone } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'History', icon: Activity },
    { path: '/journeys', label: 'Journeys', icon: PlusCircle },
    { path: '/add', label: 'Add Journey', icon: PlusCircle },
    { path: '/schedule', label: 'Scheduler', icon: Clock },
    { path: '/session', label: 'Session QR', icon: Smartphone },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Toaster position="top-right" />
      {/* Sidebar */}
      <div style={{ 
        width: '250px', 
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h1 className="text-xl font-bold mb-6 text-center" style={{ color: 'var(--accent-primary)' }}>
          WhatsApp QA Bot
        </h1>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={handleLogout}
          className="btn"
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--error)',
            backgroundColor: 'transparent',
            justifyContent: 'flex-start',
            padding: '0.75rem 1rem'
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
