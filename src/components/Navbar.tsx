import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy, Menu, User, LogOut, X,
  Circle, Zap, Activity,
  Maximize, Layers, Repeat, Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useIsMobile from '../hooks/useIsMobile';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isAdmin, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile(768);

  // Close drawer on route change
  useEffect(() => {
    setIsDrawerOpen(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  const sports = [
    { name: 'Basquetball', icon: <Circle size={16} /> },
    { name: 'Front Tenis', icon: <Repeat size={16} />, disabled: true },
    { name: 'Futbol', icon: <Circle size={16} /> },
    { name: 'Padel', icon: <Layers size={16} />, disabled: true },
    { name: 'Pickleball', icon: <Target size={16} /> },
    { name: 'Racquetball', icon: <Maximize size={16} /> },
    { name: 'Squash', icon: <Activity size={16} />, disabled: true },
    { name: 'Tenis', icon: <Zap size={16} />, disabled: true }
  ];

  const activeSports = sports.filter(s => !s.disabled);

  // === MOBILE LAYOUT ===
  if (isMobile) {
    return (
      <>
        <nav className="glass-card" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none',
          padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trophy color="#00f2fe" size={26} />
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.4rem' }}>MatchUp</h2>
            </Link>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            style={{
              background: 'none', border: 'none', color: 'white',
              cursor: 'pointer', padding: '8px', display: 'flex'
            }}
          >
            <Menu size={26} />
          </button>
        </nav>

        {/* Mobile Drawer */}
        {isDrawerOpen && (
          <>
            <div className="mobile-drawer-overlay" onClick={() => setIsDrawerOpen(false)} />
            <div className="mobile-drawer">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="gradient-text" style={{ margin: 0, fontSize: '1.3rem' }}>Menú</h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', display: 'flex' }}
                >
                  <X size={24} />
                </button>
              </div>

              {/* User info */}
              {isAdmin && user && (
                <div style={{
                  padding: '1rem', background: 'rgba(0, 242, 254, 0.05)',
                  borderRadius: '12px', marginBottom: '1rem',
                  border: '1px solid rgba(0, 242, 254, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={18} color="var(--primary)" />
                    <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{user.username}</span>
                  </div>
                </div>
              )}

              {/* Nav Links */}
              <Link to="/" style={drawerLinkStyle}>
                Inicio
              </Link>
              {isAdmin && (
                <Link to="/create" style={drawerLinkStyle}>
                  Crear Torneo
                </Link>
              )}
              <Link to="/explore" style={drawerLinkStyle}>
                Explorar Deportes
              </Link>

              {/* Sports divider */}
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.5rem 0' }} />
              <span style={{ fontSize: '0.75rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '1px', padding: '0.5rem 0.8rem' }}>
                Deportes
              </span>

              {activeSports.map(sport => (
                <Link
                  key={sport.name}
                  to={`/sport/${sport.name.toLowerCase()}`}
                  style={{
                    ...drawerLinkStyle,
                    display: 'flex', alignItems: 'center', gap: '12px',
                    fontSize: '0.9rem'
                  }}
                >
                  <span style={{ color: 'var(--primary)', display: 'flex' }}>{sport.icon}</span>
                  {sport.name}
                </Link>
              ))}

              {/* Bottom actions */}
              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                {isAdmin ? (
                  <button
                    className="btn-primary"
                    onClick={() => { logout(); navigate('/'); setIsDrawerOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => { navigate('/login'); setIsDrawerOpen(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <User size={16} /> Ingresar
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // === DESKTOP LAYOUT (original) ===
  return (
    <nav className="glass-card" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none',
      padding: '0.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Trophy color="#00f2fe" size={32} />
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h2 className="gradient-text" style={{ margin: 0, fontSize: '1.8rem' }}>MatchUp</h2>
        </Link>
      </div>
      <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>
          Inicio
        </Link>
        {isAdmin && (
          <Link to="/create" style={{ color: 'white', textDecoration: 'none', fontWeight: 600 }}>
            Crear Torneo
          </Link>
        )}

        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
            Deportes <Menu size={20} />
          </span>
          {isMenuOpen && (
            <div className="glass-card" style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '10px',
              width: '200px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
              backgroundColor: '#1a1d23', opacity: 1, border: '1px solid var(--glass-border)'
            }}>
              {activeSports.map(sport => (
                <Link
                  key={sport.name}
                  to={`/sport/${sport.name.toLowerCase()}`}
                  style={{
                    color: 'white', textDecoration: 'none', padding: '8px 10px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    borderRadius: '6px', transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ color: 'var(--primary)', display: 'flex' }}>{sport.icon}</span>
                  {sport.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {isAdmin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{user?.username}</span>
            <button className="btn-primary" onClick={() => { logout(); navigate('/'); }} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={() => navigate('/login')}>
            <User size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Ingresar
          </button>
        )}
      </div>
    </nav>
  );
};

const drawerLinkStyle: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  padding: '0.8rem',
  borderRadius: '10px',
  fontWeight: 500,
  transition: 'background 0.2s',
  fontSize: '1rem'
};

export default Navbar;
