import React from 'react';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container" style={styles.container}>
        <div style={styles.brand}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
             <span style={{ height: '8px', width: '8px', backgroundColor: 'var(--color-accent)', borderRadius: '50%' }}></span>
             <h3 className="heading-sm" style={{ textTransform: 'uppercase', fontSize: '1rem', letterSpacing: '0.05em' }}>P2P HUB</h3>
          </div>
          <p className="text-body-sm" style={{ maxWidth: '300px' }}>
            Designing an immersive community experience. Anonymous by design. Interest-first matching.
          </p>
        </div>
        <div style={styles.links}>
          <div style={styles.column}>
            <h4 style={styles.columnTitle}>Platform</h4>
            <a href="#" style={styles.link}>Communities</a>
            <a href="#" style={styles.link}>How it works</a>
            <a href="#" style={styles.link}>Safety Protocol</a>
          </div>
          <div style={styles.column}>
            <h4 style={styles.columnTitle}>Legal</h4>
            <a href="#" style={styles.link}>Privacy Policy</a>
            <a href="#" style={styles.link}>Terms of Service</a>
          </div>
        </div>
      </div>
      <div className="container" style={styles.bottom}>
        <p className="text-body-sm">&copy; {new Date().getFullYear()} P2P HUB. All rights reserved.</p>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Built carefully</span>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: 'var(--color-bg-secondary)',
    padding: '120px 0 40px 0',
    marginTop: 'auto',
  },
  container: {
    display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '64px',
  },
  links: { display: 'flex', gap: '120px' },
  column: { display: 'flex', flexDirection: 'column', gap: '16px' },
  columnTitle: {
    fontFamily: 'var(--font-sans)', fontSize: '0.75rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '8px',
  },
  link: { fontSize: '0.875rem', color: 'var(--color-text-primary)' },
  bottom: {
    marginTop: '80px', paddingTop: '32px', borderTop: '1px solid rgba(0,0,0,0.1)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  }
};
