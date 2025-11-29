import React, { useState, useEffect } from 'react';
import { Layout, Users, LogOut, Menu, X } from 'lucide-react';
import CandidateView from './components/CandidateView';
import RecruiterView from './components/RecruiterView';
import AuthPage from './components/AuthPage';
import Tlogo from './assets/Tlogo.svg';

function App() {
  const [activeTab, setActiveTab] = useState('candidate');
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={Tlogo}
              style={{ width: '32px', height: '32px' }}
            />
            <h1 style={{ fontSize: '20px', color: 'var(--color-primary)' }}>MagentaShift</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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

          {/* Mobile Hamburger Menu */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            {mobileMenuOpen ? <X size={24} color="var(--color-primary)" /> : <Menu size={24} color="var(--color-primary)" />}
          </button>
        </div>

        {/* Mobile Slideout Menu */}
        {mobileMenuOpen && (
          <div
            className="mobile-menu"
            style={{
              display: 'none',
              position: 'fixed',
              top: '64px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'var(--color-surface)',
              zIndex: 1000,
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            {/* Navigation Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <button
                className={`btn ${activeTab === 'candidate' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => {
                  setActiveTab('candidate');
                  setMobileMenuOpen(false);
                }}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '14px 20px' }}
              >
                <Users size={20} style={{ marginRight: '12px' }} />
                Candidate
              </button>
              <button
                className={`btn ${activeTab === 'recruiter' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => {
                  setActiveTab('recruiter');
                  setMobileMenuOpen(false);
                }}
                style={{ width: '100%', justifyContent: 'flex-start', padding: '14px 20px' }}
              >
                <Layout size={20} style={{ marginRight: '12px' }} />
                Recruiter
              </button>
            </div>

            {/* User Info */}
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--color-background)',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{user?.name}</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>{user?.email}</div>
            </div>

            {/* Logout Button */}
            <button
              className="btn btn-outline"
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              style={{ width: '100%', justifyContent: 'center', padding: '14px 20px' }}
            >
              <LogOut size={20} style={{ marginRight: '12px' }} />
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="container" style={{ padding: '32px 20px', flex: 1 }}>
        {activeTab === 'candidate' ? <CandidateView /> : <RecruiterView />}
      </main>
    </div>
  );
}

export default App;
