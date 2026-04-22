import React from 'react';
import { Link } from 'react-router-dom';
import { sportsData } from '../data/sports';
import bgImage from '../assets/login-bg.png';
import { ChevronLeft } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';

const ExploreSports: React.FC = () => {
  const isMobile = useIsMobile(768);
  // Ordered list for the grid
  const sports = [
    'basquetball', 'front tenis', 'futbol', 'padel', 
    'pickleball', 'racquetball', 'squash', 'tenis'
  ];

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      backgroundImage: `linear-gradient(rgba(12, 14, 20, 0.8), rgba(12, 14, 20, 0.95)), url(${bgImage})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      backgroundAttachment: isMobile ? 'scroll' : 'fixed',
      padding: isMobile ? '80px 1rem 30px' : '120px 2rem 50px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '4rem' }}>
          <Link to="/" style={{ 
            color: 'rgba(255,255,255,0.6)', textDecoration: 'none', 
            display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '1.5rem' 
          }}>
            <ChevronLeft size={20} /> Volver al Inicio
          </Link>
          <h1 className="gradient-text" style={{
            fontSize: 'clamp(2rem, 8vw, 4rem)',
            margin: '0 0 1rem'
          }}>Explorar Deportes</h1>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: isMobile ? '1rem' : '1.2rem',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Descubre todas las disciplinas que MatchUp tiene para ofrecer. Elige un deporte para ver sus reglas y detalles técnicos.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: isMobile ? '1rem' : '2rem' 
        }}>
          {sports.map((id) => {
            const sport = sportsData[id];
            if (!sport) return null;
            const isDisabled = sport.disabled;

            const cardStyle: React.CSSProperties = {
              height: isMobile ? '280px' : '350px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: isMobile ? '1.5rem' : '2rem',
              transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)',
              cursor: isDisabled ? 'default' : 'pointer',
              border: `1px solid ${isDisabled ? 'rgba(255,255,255,0.1)' : (sport.color + '33')}`,
              backgroundColor: 'rgba(255,255,255,0.02)',
              filter: isDisabled ? 'grayscale(1) opacity(0.5)' : 'none'
            };

            const card = (
              <div 
                className={`glass-card ${!isDisabled ? 'fadeIn' : ''}`} 
                style={{
                  ...cardStyle,
                  backgroundImage: `linear-gradient(to top, rgba(12, 14, 20, 0.95) 20%, rgba(12, 14, 20, 0.4) 100%), url(${sport.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                onMouseEnter={(e) => {
                  if (isDisabled || isMobile) return;
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  e.currentTarget.style.boxShadow = `0 15px 30px ${sport.color}44`;
                  e.currentTarget.style.borderColor = sport.color;
                }}
                onMouseLeave={(e) => {
                  if (isDisabled || isMobile) return;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = `${sport.color}33`;
                }}
              >
                {/* Icon background decor */}
                <div style={{
                  position: 'absolute', top: '10%', right: '-10%',
                  opacity: 0.1, transform: 'rotate(-15deg) scale(2)',
                  color: sport.color, zIndex: 0
                }}>
                  {sport.icon}
                </div>

                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ 
                    color: isDisabled ? '#666' : sport.color, marginBottom: '1rem', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: isMobile ? '48px' : '60px',
                    height: isMobile ? '48px' : '60px',
                    backgroundColor: 'rgba(12, 14, 20, 0.6)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '12px',
                    border: `1px solid ${isDisabled ? 'rgba(255,255,255,0.1)' : (sport.color + '33')}`
                  }}>
                    {sport.icon}
                  </div>
                  <h2 style={{
                    color: 'white', margin: '0 0 0.5rem',
                    fontSize: isMobile ? '1.4rem' : '1.8rem',
                    fontWeight: 800,
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                  }}>
                    {sport.name} {isDisabled && <span style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 400 }}>(Próximamente)</span>}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginBottom: '1.5rem', lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {isDisabled ? 'Esta disciplina aún no está configurada para torneos. Vuelve pronto para ver las actualizaciones.' : sport.description}
                  </p>
                  {!isDisabled && (
                    <div style={{ color: sport.color, fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      Ver Detalles →
                    </div>
                  )}
                </div>
              </div>
            );

            return isDisabled ? (
              <div key={id}>{card}</div>
            ) : (
              <Link key={id} to={`/sport/${id}`} style={{ textDecoration: 'none' }}>
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExploreSports;
