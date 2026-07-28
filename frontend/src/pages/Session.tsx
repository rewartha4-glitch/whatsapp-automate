import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function Session() {
  const [status, setStatus] = useState<string>('STOPPED');
  const [qr, setQr] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status !== 'STOPPED' && status !== 'LOGGED_IN' && status !== 'ERROR' && status !== 'TIMEOUT') {
      interval = setInterval(fetchStatus, 2000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/session/status');
      const data = await res.json();
      setStatus(data.status);
      setQr(data.qr);
      setErrorMsg(data.error);
    } catch (e) {
      console.error(e);
    }
  };

  const startSession = async () => {
    setLoading(true);
    try {
      await fetch('/api/session/start', { method: 'POST' });
      setStatus('STARTING');
      setQr(null);
      setErrorMsg(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async () => {
    setLoading(true);
    try {
      await fetch('/api/session/stop', { method: 'POST' });
      setStatus('STOPPED');
      setQr(null);
      setErrorMsg(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const logoutSession = async () => {
    if (!window.confirm("Are you sure you want to log out? This will delete the current session and require you to scan a QR code again.")) return;
    
    setLoading(true);
    try {
      await fetch('/api/session/logout', { method: 'POST' });
      setStatus('STOPPED');
      setQr(null);
      setErrorMsg(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp Session</h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Scan the QR Code below to connect your WhatsApp account to the automation system.
        </p>
      </div>
      
      <div className="card flex flex-col items-center justify-center p-8 gap-6 min-h-[400px]">
        {status === 'STOPPED' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <span className="text-2xl">📱</span>
            </div>
            <h3 className="text-lg font-medium">No Active Session</h3>
            <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Click the button below to generate a new QR code for login.
            </p>
            <button className="btn btn-primary" onClick={startSession} disabled={loading}>
              Generate New Session
            </button>
          </div>
        )}

        {(status === 'STARTING' || status === 'WAITING_FOR_QR') && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
            <p>Starting browser and generating QR code...</p>
            <button className="btn" onClick={stopSession} disabled={loading}>Cancel</button>
          </div>
        )}

        {status === 'QR_READY' && qr && (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-medium text-indigo-400">Scan this QR Code</h3>
            <div className="p-4 bg-white rounded-xl">
              <QRCodeSVG value={qr} size={256} />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Open WhatsApp on your phone &gt; Linked Devices &gt; Link a Device
            </p>
            <button className="btn" onClick={stopSession} disabled={loading}>Cancel</button>
          </div>
        )}

        {status === 'LOGGED_IN' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-400">Successfully Logged In!</h3>
            <p className="text-center text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Your session is now active and the bot can start sending messages.
            </p>
            <button className="btn" onClick={logoutSession} disabled={loading} style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
              Logout / Create New Session
            </button>
          </div>
        )}
        
        {(status === 'ERROR' || status === 'TIMEOUT') && (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-medium text-red-400">Login Failed</h3>
            <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              The process timed out or encountered an error. Please try again.
            </p>
            {errorMsg && (
              <div className="w-full bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-xs font-mono text-red-300 overflow-auto text-left max-h-[150px]">
                {errorMsg}
              </div>
            )}
            <button className="btn btn-primary" onClick={startSession} disabled={loading}>
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
