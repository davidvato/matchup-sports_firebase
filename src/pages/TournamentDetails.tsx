import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, Users, Trophy, Activity, 
  ArrowRight, Settings, MapPin, Calendar, 
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Group {
  id: string;
  name: string;
  _count: { pairs: number, matches: number };
}

interface Bracket {
  id: string;
  name: string;
  _count: { matches: number };
}

interface Pair {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  groups: Group[];
  brackets: Bracket[];
  pairs: Pair[];
}

interface Tournament {
  id: string;
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  sport: string;
  categories: Category[];
}

const TournamentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/tournaments/${id}`);
      const data = await res.json();
      setTournament(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Cargando torneo...</div>;

  const currentCategory = tournament?.categories[activeTab];

  return (
    <div style={{
      minHeight: '100vh', padding: '120px 2rem 50px',
      backgroundImage: 'linear-gradient(135deg, #0c0e14 0%, #1a1d23 100%)', color: 'white'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '2rem' }}>
          <ChevronLeft size={20} /> Volver a Inicio
        </Link>

        <header style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <span className="badge" style={{ backgroundColor: 'rgba(0, 242, 254, 0.1)', color: 'var(--primary)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem', display: 'inline-block' }}>
                {tournament?.sport}
              </span>
              <h1 className="gradient-text" style={{ fontSize: '4rem', margin: '0 0 1rem', lineHeight: 1 }}>{tournament?.name}</h1>
              <div style={{ display: 'flex', gap: '2rem', opacity: 0.7 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18} /> {tournament?.location || 'Sin ubicación'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} /> {formatDate(tournament?.startDate!)} - {formatDate(tournament?.endDate!)}</span>
              </div>
            </div>
            {isAdmin && (
              <button className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} /> Configurar
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1px' }}>
            {tournament?.categories.map((cat, idx) => (
              <button 
                key={cat.id} 
                onClick={() => setActiveTab(idx)}
                style={{
                  padding: '1rem 2rem', background: 'none', border: 'none', color: activeTab === idx ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', borderBottom: activeTab === idx ? '3px solid var(--primary)' : '3px solid transparent',
                  fontWeight: activeTab === idx ? 'bold' : 'normal', transition: 'all 0.3s'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* Groups Section */}
            {currentCategory?.groups && currentCategory.groups.length > 0 && (
              <section className="fadeIn">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <Users color="var(--primary)" /> Fase de Grupos
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {currentCategory.groups.map(group => (
                    <div key={group.id} className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h3 style={{ margin: '0 0 1rem' }}>{group.name}</h3>
                      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', opacity: 0.6, marginBottom: '1.5rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Users size={14} /> {group._count.pairs} Parejas</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Activity size={14} /> {group._count.matches} Partidos</span>
                      </div>
                      <Link to={`/group/${group.id}`} className="btn-primary" style={{ textDecoration: 'none', padding: '0.7rem 1rem', fontSize: '0.9rem', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
                        Gestionar <ArrowRight size={16} />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Brackets Section */}
            {currentCategory?.brackets && currentCategory.brackets.length > 0 && (
              <section className="fadeIn">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                  <Trophy color="var(--primary)" /> Eliminatorias
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                  {currentCategory.brackets.map(bracket => (
                    <div key={bracket.id} className="glass-card" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.5rem' }}>{bracket.name}</h3>
                        <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>{bracket._count.matches} Partidos programados</span>
                      </div>
                      <Link to={`/bracket/${bracket.id}`} className="btn-primary" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         Ver Bracket <ArrowRight size={18} />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(!currentCategory?.groups?.length && !currentCategory?.brackets?.length) && (
                <div className="glass-card fadeIn" style={{ padding: '4rem', textAlign: 'center', opacity: 0.3 }}>
                    No hay estructura definida para esta categoría.
                </div>
            )}
          </div>

          {/* Sidebar: Participants */}
          <aside className="fadeIn">
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={20} color="var(--primary)" /> Participantes ({currentCategory?.pairs.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {currentCategory?.pairs.map(pair => (
                  <div key={pair.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {pair.name}
                  </div>
                ))}
                {currentCategory?.pairs.length === 0 && (
                  <p style={{ opacity: 0.4, fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>Sin participantes registrados</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetails;
