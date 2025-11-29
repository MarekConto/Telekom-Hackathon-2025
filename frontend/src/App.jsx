import React, { useState, useEffect } from 'react';
import { Layout, Users, LogOut } from 'lucide-react';
import CandidateView from './components/CandidateView';
import RecruiterView from './components/RecruiterView';
import AuthPage from './components/AuthPage';

function App() {
  const [activeTab, setActiveTab] = useState('candidate');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-background)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // Show main app if authenticated
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--color-primary)', borderRadius: '6px' }}></div>
            <h1 style={{ fontSize: '20px', color: 'var(--color-primary)' }}>MagentaShift</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                className={`btn ${activeTab === 'candidate' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('candidate')}
              >
                <Users size={18} style={{ marginRight: '8px' }} />
                Candidate
              </button>
              <button
                className={`btn ${activeTab === 'recruiter' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('recruiter')}
              >
                <Layout size={18} style={{ marginRight: '8px' }} />
                Recruiter
              </button>
            </div>

            {/* User Info and Logout */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingLeft: '16px',
              borderLeft: '1px solid var(--color-border)'
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '500' }}>{user?.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{user?.email}</div>
              </div>
              <button
                className="btn btn-outline"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container" style={{ padding: '32px 20px', flex: 1 }}>
        {activeTab === 'candidate' ? <CandidateView /> : <RecruiterView />}
      </main>
    </div>
  );
}

export default App;
