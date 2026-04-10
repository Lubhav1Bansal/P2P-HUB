import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={styles.navbar}>
      <div className="container" style={styles.container}>
        <Link to="/" style={styles.logo}>
          <img src="/logo-dark.png" alt="P2P HUB" style={{ height: '44px', objectFit: 'contain', display: 'block' }} />
          <span style={{ fontSize: '1.25rem', lineHeight: '44px' }}>P2P HUB</span>
        </Link>
        <div style={styles.links}>
          <Link to="/communities" style={styles.link}>COMMUNITIES</Link>
          <Link to="/auth" className="btn btn-primary" style={{ padding: '8px 24px' }}>ACCESS PORTAL</Link>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    padding: '32px 0 16px 0',
    backgroundColor: 'transparent',
    position: 'absolute',
    width: '100%',
    top: 0,
    zIndex: 100,
  },
  container: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontFamily: 'var(--font-sans)', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--color-accent)', textTransform: 'uppercase'
  },
  links: { display: 'flex', alignItems: 'center', gap: '40px' },
  link: { fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--color-accent)' }
};
