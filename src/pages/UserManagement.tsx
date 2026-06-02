import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Trash2, Plus, Lock, UserPlus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import useIsMobile from '../hooks/useIsMobile';
import { sanitizeText, LIMITS } from '../utils/validation';

interface UserItem {
  id: number;
  username: string;
  role: string;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);

  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ORGANIZER');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    userId: number | null;
    username: string;
  }>({
    show: false,
    userId: null,
    username: ''
  });

  // Redirect if not system admin
  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Error al obtener usuarios.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(`Usuario "${username}" creado correctamente.`);
        setUsername('');
        setPassword('');
        setRole('ORGANIZER');
        fetchUsers();
      } else {
        setError(data.message || 'Error al crear el usuario.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
    }
  };

  const handleDeleteUser = async () => {
    const userId = confirmModal.userId;
    if (!userId) return;

    setError('');
    setSuccessMsg('');
    
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccessMsg(`Usuario "${confirmModal.username}" eliminado correctamente.`);
        setConfirmModal({ show: false, userId: null, username: '' });
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.message || 'Error al eliminar el usuario.');
        setConfirmModal({ show: false, userId: null, username: '' });
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
      setConfirmModal({ show: false, userId: null, username: '' });
    }
  };

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Cargando panel de administración...</div>;
  }

  // Double check client authorization
  if (!isAdmin) return null;

  return (
    <div style={{
      minHeight: '100vh', padding: isMobile ? '80px 0.8rem 30px' : '120px 2rem 50px',
      backgroundImage: 'linear-gradient(135deg, #0c0e14 0%, #1a1d23 100%)', color: 'white'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 className="gradient-text" style={{ fontSize: isMobile ? '2rem' : '3rem', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Users size={36} color="#00f2fe" /> Gestión de Usuarios
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Administra los organizadores autorizados para crear y gestionar torneos deportivos.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Create User Form */}
          <section className="glass-card fadeIn" style={{ padding: isMobile ? '1.5rem' : '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
              <UserPlus size={22} color="#00f2fe" /> Registrar Organizador
            </h2>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Usuario</label>
                <input
                  type="text"
                  className="input-field"
                  value={username}
                  maxLength={LIMITS.USERNAME}
                  onChange={(e) => setUsername(sanitizeText(e.target.value))}
                  placeholder="Nombre de usuario"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Contraseña</label>
                <input
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    height: '46px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '0 10px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ORGANIZER" style={{ backgroundColor: '#1a1d23', color: 'white' }}>Organizador de Torneos</option>
                  <option value="ADMIN" style={{ backgroundColor: '#1a1d23', color: 'white' }}>Administrador Global</option>
                </select>
              </div>

              {error && (
                <div style={{ backgroundColor: 'rgba(255,75,43,0.1)', border: '1px solid rgba(255,75,43,0.2)', color: '#ff4b2b', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              {successMsg && (
                <div style={{ backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center' }}>
                  {successMsg}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '0.5rem' }}>
                <Plus size={18} /> Registrar
              </button>
            </form>
          </section>

          {/* Users List */}
          <section className="glass-card fadeIn" style={{ padding: isMobile ? '1.5rem' : '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.8rem', marginTop: 0 }}>
              Cuentas Registradas ({usersList.length})
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', opacity: 0.5, fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '10px' }}>Usuario</th>
                    <th style={{ padding: '10px' }}>Rol</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((usr) => (
                    <tr key={usr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{usr.username}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          backgroundColor: usr.role === 'ADMIN' ? 'rgba(0,242,254,0.1)' : 'rgba(255,255,255,0.05)',
                          color: usr.role === 'ADMIN' ? '#00f2fe' : 'rgba(255,255,255,0.8)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          border: usr.role === 'ADMIN' ? '1px solid rgba(0,242,254,0.2)' : '1px solid transparent'
                        }}>
                          {usr.role === 'ADMIN' ? 'Administrador' : 'Organizador'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                        {usr.username !== 'admin' && user?.id !== usr.id ? (
                          <button
                            onClick={() => setConfirmModal({ show: true, userId: usr.id, username: usr.username })}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ff4b2b',
                              cursor: 'pointer',
                              padding: '5px',
                              borderRadius: '4px'
                            }}
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', opacity: 0.3, fontStyle: 'italic' }}>Protegido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 4000, padding: '2rem', backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-card fadeIn" style={{
            padding: '2.5rem', maxWidth: '420px', width: '100%',
            backgroundColor: '#1a1d23', textAlign: 'center',
            border: '1px solid rgba(255, 75, 43, 0.2)'
          }}>
            <div style={{
              background: 'rgba(255, 75, 43, 0.1)', borderRadius: '50%',
              width: '60px', height: '60px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 1.5rem'
            }}>
              <AlertTriangle color="#ff4b2b" size={32} />
            </div>
            <h2 style={{ marginBottom: '0.8rem', color: 'white', fontSize: '1.4rem' }}>Eliminar Usuario</h2>
            <p style={{ opacity: 0.7, marginBottom: '2rem', fontSize: '0.9rem' }}>
              ¿Estás seguro de eliminar de forma permanente la cuenta de <strong>{confirmModal.username}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn-primary"
                onClick={() => setConfirmModal({ show: false, userId: null, username: '' })}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleDeleteUser}
                style={{ flex: 1, background: '#ff4b2b', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(255, 75, 43, 0.2)' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
