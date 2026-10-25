import React from 'react';
import { MapPin, Calendar, Trophy, Users } from 'lucide-react';
import { sportsData } from '../data/sports';

export interface TournamentBannerData {
  id?: string;
  name: string;
  sport?: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  creator?: { id?: number; username: string } | null;
}

interface TournamentBannerProps {
  tournament: TournamentBannerData;
  isMobile?: boolean;
}

export const TournamentBanner: React.FC<TournamentBannerProps> = ({
  tournament,
  isMobile = false
}) => {
  const sportKey = tournament?.sport?.toLowerCase().replace(/\s+/g, '-');
  const sportInfo = sportKey ? sportsData[sportKey] : null;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <header
      style={{
        position: 'relative',
        marginBottom: isMobile ? '1.5rem' : '2.5rem',
        borderRadius: isMobile ? '16px' : '24px',
        overflow: 'hidden',
        minHeight: isMobile ? '200px' : '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: isMobile ? '1.5rem' : '2.5rem',
        backgroundImage: `linear-gradient(to top, rgba(12, 14, 20, 1) 0%, rgba(12, 14, 20, 0.4) 100%), url(${sportInfo?.image || ''})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          width: '100%',
          gap: isMobile ? '1rem' : '0'
        }}
      >
        <div>
          <span
            style={{
              backgroundColor: 'rgba(0, 242, 254, 0.2)',
              color: '#00f2fe',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              display: 'inline-block',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 242, 254, 0.3)'
            }}
          >
            {tournament?.sport}
          </span>
          <h1
            className="gradient-text"
            style={{
              fontSize: isMobile ? 'clamp(1.8rem, 7vw, 2.5rem)' : '3.8rem',
              margin: '0 0 0.5rem',
              lineHeight: 1,
              textShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            {tournament?.name}
          </h1>
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '0.5rem' : '2rem',
              opacity: 0.9,
              fontSize: isMobile ? '0.9rem' : '1.05rem',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} /> {tournament?.location || 'Sin ubicación'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} /> {formatDate(tournament?.startDate)} - {formatDate(tournament?.endDate)}
            </span>
            {tournament?.description && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                <Trophy size={18} /> {tournament.description}
              </span>
            )}
            {tournament?.creator && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe' }}>
                <Users size={18} /> Organizador: {tournament.creator.username}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TournamentBanner;
