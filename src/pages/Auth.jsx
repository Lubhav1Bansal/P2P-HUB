import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, Shuffle, CheckCircle, ArrowRight, Lock, ShieldCheck, Upload } from 'lucide-react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const INTERESTS = [
  'technology', 'ai', 'machine learning', 'coding', 'photography', 'videography',
  'sports', 'football', 'cricket', 'gym', 'fitness', 'dance', 'music', 'singing',
  'guitar', 'piano', 'art', 'painting', 'business', 'startups', 'entrepreneurship',
  'finance', 'books', 'movies', 'gaming', 'robotics', 'public speaking', 'design', 'ui ux'
];

export default function Auth() {
  const [step, setStep] = useState(0); 
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [anonId, setAnonId] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [showcaseUrl, setShowcaseUrl] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [pactAgreed, setPactAgreed] = useState(false);
  
  const navigate = useNavigate();

  const handleGoogleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user already exists in our database
      const docRef = doc(db, "users", result.user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Automatically enter hub for returning users
        navigate('/communities');
      } else {
        // Missing profile => Route to Identity Generator
        setStep(1);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    }
    setLoading(false);
  };

  const ADJECTIVES = ['Phantom', 'Neon', 'Cyber', 'Stealth', 'Cosmic', 'Quantum', 'Pixel', 'Nova', 'Echo', 'Velocity', 'Arctic', 'Crimson'];
  const NOUNS = ['Panda', 'Wolf', 'Tiger', 'Falcon', 'Raven', 'Ghost', 'Ninja', 'Phoenix', 'Dragon', 'Mantis', 'Fox', 'Hawk'];

  const handleGenerate = () => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    setAnonId(`${adj} ${noun} ${randomNum}`);
    setTimeout(() => setStep(2), 800);
  };

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    if (!pactAgreed) return;
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Google Authentication lost. Please retry.");
      
      const uid = currentUser.uid;

      let uploadedPhotoUrl = '';
      if (profilePic) {
         const formData = new FormData();
         formData.append('image', profilePic);
         const res = await fetch(`https://api.imgbb.com/1/upload?key=e915ba834131647636974697700450f7`, { method: 'POST', body: formData });
         const data = await res.json();
         if (data.success) {
            uploadedPhotoUrl = data.data.url;
         }
      }

      let generatedBio = '';
      if (q1) generatedBio += `Exploring: ${q1}\n`;
      if (q2) generatedBio += `Vibe: ${q2}\n`;

      const newUser = {
        user_id: uid,
        anonymous_username: anonId,
        email: currentUser.email || '',
        bio: generatedBio.trim(),
        interests: selectedInterests,
        joined_communities: [], 
        blocked_users: [],
        created_at: Date.now(),
        photoURL: uploadedPhotoUrl,
        
        course: '',
        university: '',
        objectives: '',
        working_on: '',
        skills: '',
        hobbies: '',
        areas_of_interest: '',
        looking_to_learn: '',
        portfolio_links: showcaseUrl || ''
      };

      await setDoc(doc(db, "users", uid), newUser);
      navigate('/communities');
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to create secure identity: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.authContainer}>
      <div className="card" style={{ ...styles.authCard, maxWidth: step === 3 ? '600px' : '520px' }}>
        
        {step === 0 && (
          <form style={styles.stepBlock} className="text-center" onSubmit={handleGoogleAuth}>
            <div style={styles.iconCircle}><Lock size={40} color="var(--color-accent)" /></div>
            <h2 className="heading-md" style={{ marginBottom: '8px' }}>Secure Entry</h2>
            <p className="text-body-sm" style={{ marginBottom: '32px' }}>
              Authenticate via Google. New members will be routed to setup. Returning agents bypass setup entirely.
            </p>
            {errorMsg && <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{errorMsg}</div>}
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px' }} disabled={loading}>
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
              {loading ? "Authenticating..." : "Continue with Google"}
            </button>
          </form>
        )}

        {step === 1 && (
          <div style={styles.stepBlock} className="text-center">
            {anonId ? (
              <>
                 <div style={styles.iconCircle}><CheckCircle size={40} /></div>
                 <h2 className="heading-md" style={{ marginBottom: '16px' }}>Identity Minted</h2>
                 <div style={styles.idBadge}>
                   <span style={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: 'monospace' }}>{anonId}</span>
                 </div>
                 <p className="text-body-sm" style={{ marginBottom: '32px' }}>This is how others will see you.</p>
              </>
            ) : (
              <>
                <div style={styles.iconCircle}><Fingerprint size={40} /></div>
                <h2 className="heading-md" style={{ marginBottom: '16px' }}>Enter the HUB</h2>
                <p className="text-body-sm" style={{ marginBottom: '32px' }}>Google Auth verified. We will now mint you a new anonymous identity.</p>
                <button className="btn btn-outline" onClick={handleGenerate} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <Shuffle size={20} /> Generate Anonymous ID
                </button>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={styles.stepBlock}>
             <h2 className="heading-sm" style={{ marginBottom: '8px', textAlign: 'center' }}>Design Your Algorithm</h2>
             <p className="text-body-sm" style={{ textAlign: 'center', marginBottom: '24px' }}>Pick at least 3 interests to discover hubs.</p>
             <div style={styles.interestGrid}>
               {INTERESTS.map(interest => (
                 <button key={interest} style={{
                    ...styles.interestPill,
                    backgroundColor: selectedInterests.includes(interest) ? 'var(--color-accent)' : 'transparent',
                    color: selectedInterests.includes(interest) ? 'var(--color-white)' : 'var(--color-text-primary)'
                  }} onClick={() => toggleInterest(interest)}>
                   {interest}
                 </button>
               ))}
             </div>
             <button className="btn btn-primary" onClick={() => setStep(3)} style={{ width: '100%', marginTop: '32px' }} disabled={selectedInterests.length < 3}>
               Continue <ArrowRight size={16} style={{ marginLeft: '8px' }}/>
             </button>
          </div>
        )}

        {step === 3 && (
          <form style={styles.stepBlock} onSubmit={handleComplete}>
             <h2 className="heading-md" style={{ marginBottom: '8px', fontFamily: 'var(--font-serif)', letterSpacing: '-0.02em' }}>Build Your Persona</h2>
             <p className="text-body-sm" style={{ marginBottom: '40px' }}>Answer quick thoughts to mint your profile.</p>
             {errorMsg && <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px' }}>{errorMsg}</div>}

             <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                     {profilePic ? <img src={URL.createObjectURL(profilePic)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Upload size={24} />}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', cursor: 'pointer', color: 'var(--color-accent)', textDecoration: 'underline' }}>
                      Upload Profile Avatar
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setProfilePic(e.target.files[0])} />
                    </label>
                    <span className="text-body-sm">Optional Firebase Storage</span>
                  </div>
                </div>

                <div style={styles.chatBubbleContainer}>
                   <label style={styles.chatLabel}>What are you actively exploring or building right now?</label>
                   <input type="text" placeholder="e.g. Trying to learn Rust..." value={q1} onChange={e=>setQ1(e.target.value)} style={styles.elegantInput} />
                </div>
                
                <div style={styles.chatBubbleContainer}>
                   <label style={styles.chatLabel}>What's the vibe? Describe your working style.</label>
                   <input type="text" placeholder="e.g. Night owl coder." value={q2} onChange={e=>setQ2(e.target.value)} style={styles.elegantInput} />
                </div>

                <div style={styles.chatBubbleContainer}>
                   <label style={styles.chatLabel}>Link a showcase. (GitHub, Portfolio, Socials)</label>
                   <input type="url" placeholder="https://..." value={showcaseUrl} onChange={e=>setShowcaseUrl(e.target.value)} style={styles.elegantInput} />
                </div>
             </div>

             <div style={{ marginTop: '48px', padding: '24px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,0,0,0.08)' }}>
               <label style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', cursor: 'pointer' }}>
                 <input type="checkbox" checked={pactAgreed} onChange={(e) => setPactAgreed(e.target.checked)} style={{ width: '24px', height: '24px', marginTop: '2px', accentColor: 'var(--color-accent)' }} />
                 <div>
                   <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
                     <ShieldCheck size={18} /> P2P HUB PACT
                   </h4>
                   <p className="text-body-sm" style={{ lineHeight: '1.4' }}>
                     I pledge to engage authentically, avoid spamming or harassment, and fiercely protect the anonymous integrity of this space.
                   </p>
                 </div>
               </label>
             </div>

             <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '32px', opacity: pactAgreed ? 1 : 0.5 }} disabled={!pactAgreed || loading}>
               {loading ? "Registering Agent..." : "Confirm Identity & Enter Hub"}
             </button>
          </form>
        )}

      </div>
    </div>
  );
}

const styles = {
  authContainer: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-secondary)', padding: '40px 24px' },
  authCard: { width: '100%', padding: '64px 48px', transition: 'max-width 0.3s ease' },
  stepBlock: { animation: 'fadeIn 0.5s ease' },
  iconCircle: { width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid rgba(0,0,0,0.1)' },
  idBadge: { padding: '16px 32px', borderRadius: 'var(--radius-pill)', marginBottom: '16px', border: '1px solid var(--color-accent)', display: 'inline-block' },
  input: { width: '100%', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,0,0,0.2)', fontSize: '1rem', background: 'transparent' },
  interestGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' },
  interestPill: { padding: '6px 16px', borderRadius: 'var(--radius-pill)', border: '1px solid rgba(0,0,0,0.2)', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s', cursor: 'pointer' },
  chatBubbleContainer: { display: 'flex', flexDirection: 'column', gap: '8px' },
  chatLabel: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' },
  elegantInput: { width: '100%', padding: '12px 0px', border: 'none', borderBottom: '2px solid rgba(0,0,0,0.1)', fontSize: '1.25rem', background: 'transparent', outline: 'none', fontFamily: 'var(--font-serif)', transition: 'border-color 0.2s' }
};
