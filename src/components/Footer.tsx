import logo from '../assets/skulldevs-logo.png';
import sponsorDeporte from '../assets/sponsor-deporte.png';
import sponsorRP from '../assets/sponsor-rp.png';
import useIsMobile from '../hooks/useIsMobile';

const Footer: React.FC = () => {
  const isMobile = useIsMobile(768);

  return (
    <footer style={{
      width: '100%',
      background: 'rgba(12, 14, 20, 0.9)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'center' : 'flex-start',
        gap: isMobile ? '2rem' : '2rem'
      }}>
        <div style={{ textAlign: isMobile ? 'center' : 'left', maxWidth: '300px' }}>
          <img
            src={logo}
            alt="SkullDevs Logo"
            className="footer-logo"
            style={{
              height: '55px',
              marginBottom: '1rem',
              filter: 'brightness(0) invert(1)'
            }}
          />
          <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>
            Soluciones de software de alto nivel para deportistas y organizaciones.
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMobile ? 'center' : 'flex-end',
          gap: '1.5rem'
        }}>
          <h4 style={{
            margin: 0,
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>Nuestros Patrocinadores</h4>

          <div style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
            opacity: 0.8
          }}>
            <a
              href="https://www.instagram.com/gearbox_gdl?igsh=b3B3azd4Nzc2cjE0"
              target="_blank"
              rel="noopener noreferrer"
              style={{ transition: 'opacity 0.3s ease' }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              <img
                src={sponsorDeporte}
                alt="Deporte con Sentido"
                style={{ height: '140px', objectFit: 'contain', cursor: 'pointer' }}
              />
            </a>
            <a
              href="https://www.instagram.com/gearbox_gdl?igsh=b3B3azd4Nzc2cjE0"
              target="_blank"
              rel="noopener noreferrer"
              style={{ transition: 'opacity 0.3s ease' }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              <img
                src={sponsorRP}
                alt="Racquet & Pickleball"
                style={{ height: '140px', objectFit: 'contain', cursor: 'pointer' }}
              />
            </a>
          </div>

          <div style={{ textAlign: isMobile ? 'center' : 'right', marginTop: '0.5rem' }}>
            <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Contacto</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.6 }}>skulldevs2020@gmail.com</p>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '2rem auto 0',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        textAlign: 'center',
        fontSize: '0.8rem',
        opacity: 0.4
      }}>
        © {new Date().getFullYear()} MatchUp Sports. Desarrollado por <span style={{ color: 'white', opacity: 1, fontWeight: 'bold' }}>SKULLDEVS</span>.
      </div>
    </footer>
  );
};

export default Footer;
