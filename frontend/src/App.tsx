import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Journeys from './pages/Journeys';
import AddJourney from './pages/AddJourney';
import Scheduler from './pages/Scheduler';
import Session from './pages/Session';

// Simple Auth Guard
const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const auth = localStorage.getItem('auth');
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }>
          <Route index element={<Dashboard />} />
          <Route path="journeys" element={<Journeys />} />
          <Route path="add" element={<AddJourney />} />
          <Route path="schedule" element={<Scheduler />} />
          <Route path="session" element={<Session />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
