import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing-page">
      <section style={styles.heroSection}>
        <div className="container" style={styles.heroContainer}>
          <div style={styles.heroContent}>
            <span className="title-overline">Hey. Welcome to,</span>
            <h1 className="heading-xl" style={styles.heroHeadline}>
              A GENUINE <br/><span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>& Anonymous</span><br/> NETWORK
            </h1>
            <p className="text-body-lg" style={styles.heroSubheadline}>
              Transforming campus crowds into stunning communities — an interest-first matching platform that captivates, engages, and protects.
            </p>
            <div style={{ marginTop: '48px' }}>
              <Link to="/auth" className="btn btn-primary">
                JOIN THE HUB &rarr;
              </Link>
            </div>
          </div>
          <div style={styles.heroVisual}>
             {/* Large U-shaped crop for image */}
            <div style={styles.uShapeMask}>
               <img src="/hero.png" alt="University peers" style={styles.heroImg} />
            </div>
          </div>
        </div>
      </section>

      <section style={styles.statsSection}>
         <div className="container" style={styles.statsContainer}>
           <div style={styles.statBox}>
             <span className="title-overline">USER-CENTERED</span>
             <p className="text-body-sm">Intuitive and engaging experiences tailored for your audience.</p>
           </div>
           <div style={styles.statBox}>
             <span className="title-overline">IDENTITY FIRST</span>
             <p className="text-body-sm">Strong visual matching that makes connections unforgettable.</p>
           </div>
           <div style={styles.statBox}>
             <span className="title-overline">PROTECTED HUB</span>
             <p className="text-body-sm">Pixel-perfect policies optimized for all campus domains.</p>
           </div>
           <div style={styles.statBox}>
             <span className="title-overline">SEAMLESS ONBOARDING</span>
             <p className="text-body-sm">Interactive workflows to bring your profile to life securely.</p>
           </div>
         </div>
      </section>

      <section className="section-padding" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '64px', alignItems: 'flex-start' }}>
             <div style={{ flex: 1 }}>
               <h2 className="heading-md" style={{ textTransform: 'uppercase', fontFamily: 'var(--font-sans)', fontWeight: 700, letterSpacing: '-0.02em', fontSize: '2.5rem' }}>CRAFTING MEANINGFUL<br/>BONDS & INTUITIVE<br/>EXPERIENCES</h2>
             </div>
             <div style={{ flex: 1 }}>
                <p className="text-body-lg" style={{ marginBottom: '24px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  Hey, I'm Agent #1042, a developer passionate about creating visually compelling and user-friendly digital spaces.
                </p>
                <p className="text-body" style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                  With a keen eye for safety and a deep understanding of student behavior, we design channels and interfaces that not only look great but also resonate with audiences. 
                  Whether it's building an identity from the ground up or refining a digital showcase for seamless usability, we blend strategy, creativity, and anonymous authenticity.
                </p>
             </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
            <h2 className="heading-md" style={{ textTransform: 'uppercase', fontFamily: 'var(--font-sans)', fontWeight: 700, letterSpacing: '-0.02em', fontSize: '2.5rem' }}>COMMUNITIES</h2>
            <p className="text-body-sm" style={{ maxWidth: '300px' }}>Explore featured groups and discover how we can transform your college experience.</p>
          </div>
          
          <div className="grid-3">
             <div style={styles.portfolioCard}>
               <div style={{ height: '300px', backgroundColor: '#222', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h4 style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.875rem' }}>TECHNOLOGY</h4>
                 <span className="tag">Software</span>
               </div>
             </div>
             <div style={styles.portfolioCard}>
               <div style={{ height: '300px', backgroundColor: '#444', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h4 style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.875rem' }}>PHOTOGRAPHY</h4>
                 <span className="tag">Visuals</span>
               </div>
             </div>
             <div style={styles.portfolioCard}>
               <div style={{ height: '300px', backgroundColor: '#666', borderRadius: 'var(--radius-lg)', marginBottom: '24px' }}></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h4 style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.875rem' }}>LITERATURE</h4>
                 <span className="tag">Reading</span>
               </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  heroSection: {
    paddingTop: '160px',
    paddingBottom: '80px',
  },
  heroContainer: {
    display: 'flex', alignItems: 'flex-start', gap: '64px',
  },
  heroContent: { flex: 1, paddingRight: '40px', paddingTop: '40px' },
  heroHeadline: { marginBottom: '24px', letterSpacing: '-0.04em' },
  heroSubheadline: { color: 'var(--color-text-secondary)', maxWidth: '480px' },
  heroVisual: { flex: 1, display: 'flex', justifyContent: 'center' },
  uShapeMask: {
    width: '400px', height: '540px',
    borderBottomLeftRadius: '200px', borderBottomRightRadius: '200px',
    overflow: 'hidden', backgroundColor: 'var(--color-bg-secondary)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
  },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover' },
  statsSection: { padding: '40px 0 80px 0', borderBottom: '1px solid rgba(0,0,0,0.1)' },
  statsContainer: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '48px' },
  statBox: { paddingRight: '24px', borderRight: '1px solid rgba(0,0,0,0.1)' },
  portfolioCard: { display: 'flex', flexDirection: 'column' }
};
