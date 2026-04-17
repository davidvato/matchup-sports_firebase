import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Users, Trophy, Activity, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Pair {
  id: string;
  name: string;
  totalScore: number;
}

interface Match {
  id: string;
  pairA: Pair;
  pairB: Pair;
  winnerId: string | null;
  pointsA: number;
  pointsB: number;
}

interface Group {
  id: string;
  name: string;
  categoryId: string;
  pairs: Pair[];
  matches: Match[];
}

const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/groups/${id}`);
      const data = await res.json();
      setGroup(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResult = async (matchId: string, pairAId: string, pairBId: string, pointsA: number, pointsB: number) => {
    const winnerId = pointsA > pointsB ? pairAId : (pointsB > pointsA ? pairBId : null);
    try {
      const res = await fetch(`http://localhost:3001/api/matches/${matchId}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, pointsA, pointsB, pairAId, pairBId })
      });
      if (res.ok) fetchGroup();
    } catch (err) {
      console.error(err);
    }
  };

  const resetGroup = async () => {
    if (!window.confirm('¿Estás seguro de reiniciar todos los resultados de este grupo?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/groups/${id}/reset`, { method: 'POST' });
      if (res.ok) fetchGroup();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Cargando grupo...</div>;

  const standings = [...(group?.pairs || [])].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div style={{
      minHeight: '100vh', padding: '120px 2rem 50px',
      backgroundImage: 'linear-gradient(135deg, #0c0e14 0%, #1a1d23 100%)', color: 'white'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link to={group ? `/tournament/${group.categoryId}` : '/'} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '1rem' }}>
              <ChevronLeft size={18} /> Volver al Torneo
            </Link>
            <h1 className="gradient-text" style={{ fontSize: '3rem', margin: 0 }}>{group?.name}</h1>
          </div>
          {isAdmin && (
            <button onClick={resetGroup} className="btn-primary" style={{ background: 'rgba(255,75,43,0.1)', color: '#ff4b2b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={18} /> Reiniciar Grupo
            </button>
          )}
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2.5rem' }}>
          
          {/* Matches Section */}
          <section>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <Activity color="var(--primary)" /> Partidos
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {group?.matches.map(match => (
                <div key={match.id} className="glass-card fadeIn" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, textAlign: 'right', fontWeight: match.winnerId === match.pairA.id ? 'bold' : 'normal' }}>
                      {match.pairA.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 20px' }}>
                      <input 
                        type="number" 
                        className="input-field" 
                        style={{ width: '60px', textAlign: 'center', padding: '0.5rem' }} 
                        defaultValue={match.pointsA}
                        onBlur={(e) => handleUpdateResult(match.id, match.pairA.id, match.pairB.id, parseInt(e.target.value), match.pointsB)}
                        disabled={!isAdmin}
                      />
                      <span>vs</span>
                      <input 
                        type="number" 
                        className="input-field" 
                        style={{ width: '60px', textAlign: 'center', padding: '0.5rem' }} 
                        defaultValue={match.pointsB}
                        onBlur={(e) => handleUpdateResult(match.id, match.pairA.id, match.pairB.id, match.pointsA, parseInt(e.target.value))}
                        disabled={!isAdmin}
                      />
                    </div>
                    <div style={{ flex: 1, textAlign: 'left', fontWeight: match.winnerId === match.pairB.id ? 'bold' : 'normal' }}>
                      {match.pairB.name}
                    </div>
                  </div>
                  {match.winnerId && (
                    <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <CheckCircle2 size={14} /> Finalizado
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Standings Sidebar */}
          <aside>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h2 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trophy size={22} color="var(--primary)" /> Tabla de Posiciones
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', opacity: 0.5, fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '10px' }}>#</th>
                    <th style={{ padding: '10px' }}>Pareja</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((pair, idx) => (
                    <tr key={pair.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx === 0 ? 'rgba(0, 242, 254, 0.05)' : 'transparent' }}>
                      <td style={{ padding: '15px 10px', opacity: 0.5 }}>{idx + 1}</td>
                      <td style={{ padding: '15px 10px', fontWeight: idx === 0 ? 'bold' : 'normal' }}>{pair.name}</td>
                      <td style={{ padding: '15px 10px', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold' }}>{pair.totalScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
