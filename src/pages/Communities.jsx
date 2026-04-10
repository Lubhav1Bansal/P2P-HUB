import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, COMMUNITIES_MAP } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useDocumentData, useCollection, useCollectionData } from 'react-firebase-hooks/firestore';
import { collection, doc, setDoc, query, orderBy, addDoc, updateDoc, arrayUnion, arrayRemove, where, deleteDoc, increment } from 'firebase/firestore';
import { MessageSquare, Heart, Flag, ShieldAlert, Edit3, UserX, LogOut, ChevronDown, ChevronUp, Send, Image as ImageIcon, Monitor, BrainCircuit, Camera, Trophy, Headphones, Flame, Rocket, Gamepad2, Dumbbell, BookOpen, PenTool, Mic } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const INTERESTS = [
  'TECHNOLOGY', 'AI', 'MACHINE LEARNING', 'CODING', 'PHOTOGRAPHY', 'VIDEOGRAPHY',
  'SPORTS', 'FOOTBALL', 'CRICKET', 'GYM', 'FITNESS', 'DANCE', 'MUSIC', 'SINGING',
  'GUITAR', 'PIANO', 'ART', 'PAINTING', 'BUSINESS', 'STARTUPS', 'ENTREPRENEURSHIP',
  'FINANCE', 'BOOKS', 'MOVIES', 'GAMING', 'ROBOTICS', 'PUBLIC SPEAKING', 'DESIGN', 'UI UX'
];

const IMGBB_API_KEY = "e915ba834131647636974697700450f7";
const uploadToImgBB = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  const data = await response.json();
  if (data.success) {
    return data.data.url;
  } else {
    throw new Error(data.error?.message || "Failed to route image to ImgBB cluster.");
  }
};

export default function Communities() {
  const navigate = useNavigate();
  const [user, loadingAuth] = useAuthState(auth);
  
  const [activeTab, setActiveTab] = useState('feed'); 
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null); // UID of user we are chatting with
  const [activeCommunityChat, setActiveCommunityChat] = useState(null);
  
  // Modals
  const [reportModalData, setReportModalData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [postDraft, setPostDraft] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState('');

  useEffect(() => {
    if (!loadingAuth && !user) navigate('/auth');
  }, [user, loadingAuth, navigate]);

  const [myProfile, loadingProfile, profileError] = useDocumentData(user ? doc(db, 'users', user.uid) : null);
  const [allPostsSnap, loadingPosts, postsError] = useCollection(query(collection(db, 'posts'), orderBy('created_at', 'desc')));
  const [myReportsSnap, loadingReports, reportsError] = useCollection(user ? query(collection(db, 'reports'), where('reporter_user_id', '==', user.uid)) : null);
  const [viewingProfile] = useDocumentData(viewingProfileId ? doc(db, 'users', viewingProfileId) : null);
  
  const [myProfileLikesSnap] = useCollection(user ? query(collection(db, 'profile_likes'), where('target_user_id', '==', user.uid)) : null);
  const [otherProfileLikesSnap] = useCollection(viewingProfileId ? query(collection(db, 'profile_likes'), where('target_user_id', '==', viewingProfileId)) : null);

  if (profileError || postsError || reportsError) {
     return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'red', marginTop: '100px' }}>
           <h3>Firebase Database Connection Failed</h3>
           <p>{profileError?.message || postsError?.message || reportsError?.message}</p>
           <p style={{ marginTop: '16px', color: 'black' }}><strong>Fix:</strong> Please go to your Firebase Console, click "Firestore Database", click "Create Database", and ensure Rules are set to Test Mode.</p>
           <button onClick={() => { auth.signOut(); navigate('/auth'); }} style={{ marginTop: '24px', padding: '10px 20px', cursor:'pointer' }}>Clear Cache & Retry</button>
        </div>
     );
  }

  if (!loadingAuth && user && !loadingProfile && !myProfile) {
     return (
        <div style={{ padding: '80px', textAlign: 'center' }}>
           <h3>Account Profile Missing</h3>
           <p>Your authentication exists but your Firestore document was not created (likely due to a permission timeout).</p>
           <button onClick={async () => { await auth.signOut(); navigate('/auth'); }} className="btn btn-primary" style={{ marginTop: '24px' }}>Log Out & Re-Register</button>
        </div>
     );
  }

  if (loadingAuth || loadingProfile) return <div style={{ padding: '40px', textAlign: 'center', marginTop: '100px' }}>Synchronizing Secure Hub...</div>;

  const myJoinedNames = myProfile?.joined_communities || [];
  const blockedIds = myProfile?.blocked_users || [];
  
  const reportedPostIds = myReportsSnap ? myReportsSnap.docs.map(doc => doc.data().reported_item_id) : [];
  const allPosts = allPostsSnap ? allPostsSnap.docs.map(d => ({ docId: d.id, ...d.data() })) : [];
  const feedPosts = allPosts.filter(p => !blockedIds.includes(p.user_id));

  const handleEditProfile = () => {
    setEditForm({
      anonymous_username: myProfile.anonymous_username || '',
      objectives: myProfile.objectives || '',
      working_on: myProfile.working_on || '',
      skills: myProfile.skills || '',
      hobbies: myProfile.hobbies || '',
      areas_of_interest: myProfile.areas_of_interest || '',
      looking_to_learn: myProfile.looking_to_learn || '',
      bio: myProfile.bio || '',
      portfolio_links: myProfile.portfolio_links || '',
      interests: myProfile.interests || []
    });
    setNewAvatarFile(null);
    setIsEditing(true);
  };

  const saveProfile = async () => {
    setIsSavingProfile(true);
    let finalPhotoUrl = myProfile.photoURL || '';
    if (newAvatarFile) {
       try {
         finalPhotoUrl = await uploadToImgBB(newAvatarFile);
       } catch (e) {
         setIsSavingProfile(false);
         return alert("ImgBB Server Error: " + e.message);
       }
    }
    const finalForm = { ...editForm };
    await updateDoc(doc(db, 'users', user.uid), { ...finalForm, photoURL: finalPhotoUrl });
    setNewAvatarFile(null);
    setIsEditing(false);
    setIsSavingProfile(false);
  };

  const toggleSubcommunityJoin = async (subName) => {
    const userRef = doc(db, 'users', user.uid);
    if (myJoinedNames.includes(subName)) {
      await updateDoc(userRef, { joined_communities: arrayRemove(subName) });
    } else {
      await updateDoc(userRef, { joined_communities: arrayUnion(subName) });
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if ((!postDraft.trim() && !postImage) || !selectedCommunity) return;
    
    if (postImage && postImage.size > 5 * 1024 * 1024) return alert("Image size exceeds 5MB firewall limit.");
    
    setIsPosting(true);
    const newPostRef = doc(collection(db, 'posts'));
    
    let imageUrl = '';
    if (postImage) {
      try {
        imageUrl = await uploadToImgBB(postImage);
      } catch (err) {
        setIsPosting(false);
        return alert("ImgBB Server Error: " + err.message);
      }
    }

    await setDoc(newPostRef, {
      post_id: newPostRef.id,
      user_id: user.uid,
      community_id: selectedCommunity,
      text_content: postDraft,
      image_url: imageUrl,
      created_at: Date.now()
    });
    setPostDraft('');
    setPostImage(null);
    setIsPosting(false);
  };

  const submitReport = async (reasonId) => {
    if(!reportModalData) return;
    await addDoc(collection(db, 'reports'), {
      report_id: uuidv4(),
      reporter_user_id: user.uid,
      reported_item_id: reportModalData.id,
      reported_type: 'post',
      reason: reasonId,
      status: 'pending',
      created_at: Date.now()
    });
    setReportModalData(null);
  };

  const handleBlockUser = async (userToBlock) => {
    await updateDoc(doc(db, 'users', user.uid), { blocked_users: arrayUnion(userToBlock) });
    await addDoc(collection(db, 'blocks'), { blocker_id: user.uid, blocked_id: userToBlock, created_at: Date.now() });
    alert("Agent successfully blocked.");
    setActiveTab('feed');
  };

  const viewAuthor = (post_user_id) => {
    if (post_user_id === user.uid) return setActiveTab('profile');
    setViewingProfileId(post_user_id);
    setActiveTab('other-profile');
  };

  const startDirectMessage = async (targetUid) => {
     await updateDoc(doc(db, 'users', user.uid), { active_chats: arrayUnion(targetUid) });
     await updateDoc(doc(db, 'users', targetUid), { active_chats: arrayUnion(user.uid) });
     setActiveThreadId(targetUid);
     setActiveTab('messages');
  };

  const otherProfileLikesDocs = otherProfileLikesSnap ? otherProfileLikesSnap.docs.map(d => ({id: d.id, ...d.data()})) : [];
  const iLikedOtherProfile = otherProfileLikesDocs.find(l => l.source_user_id === user.uid);

  const toggleProfileLike = async () => {
    if (iLikedOtherProfile) {
      await deleteDoc(doc(db, 'profile_likes', iLikedOtherProfile.id));
    } else {
      await addDoc(collection(db, 'profile_likes'), { target_user_id: viewingProfileId, source_user_id: user.uid, created_at: Date.now() });
    }
  };

  const logout = async () => {
    await auth.signOut();
    localStorage.removeItem('p2p_active_user_id');
    navigate('/auth');
  };

  const unreadMsgDict = myProfile?.unread_counts || {};
  const totalUnread = Object.values(unreadMsgDict).reduce((acc, count) => acc + count, 0);

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', backgroundColor: 'var(--color-bg-primary)' }}>
      {/* GLOBAL SIDEBAR */}
      <div style={{ width: '250px', flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.1)', backgroundColor: 'rgba(0,0,0,0.02)', padding: '32px 0', display: 'flex', flexDirection: 'column' }}>
         <div style={{ padding: '0 24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <img src="/logo-dark.png" alt="P2P HUB Logo" style={{ height: '36px', objectFit: 'contain', display: 'block' }} />
             <h3 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em', lineHeight: '36px', margin: 0 }}>P2P HUB</h3>
         </div>
         <div style={{ padding: '0 16px' }}>
             <h4 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '16px', color: 'var(--color-text-secondary)', paddingLeft: '8px' }}>YOUR HUBS</h4>
             {myJoinedNames.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', paddingLeft: '8px' }}>Join hubs in Discover.</p>}
             {myJoinedNames.map(hub => (
                <button 
                  key={hub} 
                  onClick={() => { setActiveTab('community-chat'); setActiveCommunityChat(hub); }} 
                  style={{ display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'community-chat' && activeCommunityChat === hub ? 'rgba(0,0,0,0.05)' : 'transparent', fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <span style={{ color: 'var(--color-text-secondary)', marginRight: '12px', fontSize: '1.1rem' }}>#</span>
                  {hub}
                </button>
             ))}
         </div>
      </div>

      {/* DASHBOARD CONTAINER */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={styles.dashboardContainer} className="container">
          <nav style={styles.topNav}>
             <div></div>
             <div style={styles.navLinks}>
               {['feed', 'discover', 'messages', 'profile'].map(tab => (
             <button 
               key={tab} 
               style={{ ...styles.navTab, ...(activeTab === tab ? styles.navTabActive : {}) }} 
               onClick={() => setActiveTab(tab)}>
               <div style={{ position: 'relative', display: 'inline-block' }}>
                 {tab.toUpperCase()}
                 {tab === 'messages' && totalUnread > 0 && (
                    <span style={{ position: 'absolute', top: '-10px', right: '-18px', background: 'red', color: 'white', borderRadius: '12px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 800 }}>{totalUnread}</span>
                 )}
               </div>
               {activeTab === tab && <div style={{ height: '2px', backgroundColor: 'var(--color-accent)', position: 'absolute', bottom: -8, left: 0, right: 0 }} />}
             </button>
           ))}
         </div>
      </nav>

      <main style={styles.mainContent}>
        {activeTab === 'feed' && (
           <div style={styles.feedArea}>
             <form className="card" style={{ padding: '24px', marginBottom: '40px' }} onSubmit={handleCreatePost}>
               <textarea placeholder="Share something anonymously to your Hubs..." rows="3" style={styles.input} value={postDraft} onChange={e=>setPostDraft(e.target.value)} required={!postImage} />
               
               {postImage && (
                  <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                     <img src={URL.createObjectURL(postImage)} alt="preview" style={{ height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                     <button type="button" onClick={() => setPostImage(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'red', color: 'white', borderRadius: '50%', width:'20px', height:'20px', border:'none', cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>×</button>
                  </div>
               )}

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                 <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                   <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.875rem' }}>
                     <ImageIcon size={20} /> Attach
                     <input type="file" accept="image/*" onChange={e => setPostImage(e.target.files[0])} style={{ display: 'none' }} />
                   </label>
                   <select style={{ ...styles.input, width: 'auto', padding: '8px 16px', margin: 0 }} value={selectedCommunity} onChange={e=>setSelectedCommunity(e.target.value)} required>
                     <option value="" disabled>Select Sub-Community</option>
                     {myJoinedNames.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                 </div>
                 <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }} disabled={isPosting}>
                    {isPosting ? 'UPLOADING...' : 'POST'}
                 </button>
               </div>
             </form>
             <div style={styles.feedPosts}>
               {feedPosts.map((post) => {
                 const isReported = reportedPostIds.includes(post.post_id);
                 return (
                   <div key={post.post_id} className="card" style={{ padding: '32px', marginBottom: '24px', opacity: isReported ? 0.4 : 1 }}>
                     {isReported ? (
                       <div className="text-center" style={{ padding: '24px 0' }}><ShieldAlert size={32} color="var(--color-text-secondary)" style={{ margin: '0 auto 16px' }} /><h4 className="heading-sm">Post Under Review</h4></div>
                     ) : (
                       <PostCard post={post} onReport={() => setReportModalData({id: post.post_id, type: 'post'})} onViewAuthor={() => viewAuthor(post.user_id)} myUid={user.uid} />
                     )}
                   </div>
                 );
               })}
               {feedPosts.length === 0 && <div className="text-center" style={{ padding: '80px 20px', color: 'var(--color-text-secondary)' }}>You haven't joined any active Hubs yet. Explore to discover agents.</div>}
             </div>
           </div>
        )}

        {activeTab === 'discover' && (
          <div className="card" style={{ padding: '40px' }}>
            <h2 className="heading-md" style={{ marginBottom: '8px' }}>Discover Your Niche</h2>
            <p className="text-body-sm" style={{ marginBottom: '40px' }}>Click to expand parent sectors and join specific sub-communities.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {COMMUNITIES_MAP.map(parent => (
                <ExpandableHubSector 
                   key={parent.name} parent={parent} myJoinedNames={myJoinedNames} toggleSubcommunityJoin={toggleSubcommunityJoin} 
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
           <MessagesInbox myProfile={myProfile} myUid={user.uid} activeThreadId={activeThreadId} setActiveThreadId={setActiveThreadId} viewAuthor={viewAuthor} />
        )}

        {activeTab === 'community-chat' && activeCommunityChat && (
           <CommunityChatThread communityName={activeCommunityChat} myUid={user.uid} viewAuthor={viewAuthor} />
        )}

        {activeTab === 'profile' && (
          <div className="card" style={styles.profileArea}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
               <div style={{ display: 'flex', gap: '32px' }}>
                  {myProfile.photoURL ? (
                     <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
                        <img src={myProfile.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     </div>
                  ) : (
                     <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '2rem', flexShrink: 0 }}>
                        {myProfile.anonymous_username?.slice(-2) || 'XX'}
                     </div>
                  )}
                  <div>
                    <h2 className="heading-md" style={{ fontSize: '3rem', letterSpacing: '-0.02em', marginBottom: '8px' }}>{myProfile.anonymous_username}</h2>
                    <div style={{ display: 'flex', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 600, alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-accent)' }}>❤️ {myProfileLikesSnap ? myProfileLikesSnap.docs.length : 0} REP</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                      {myProfile.interests?.map(i => <span key={i} className="tag">{i}</span>)}
                    </div>
                  </div>
               </div>
               {!isEditing && <button className="btn btn-outline" style={{ padding: '8px 24px' }} onClick={handleEditProfile}><Edit3 size={16} style={{ marginRight: '8px' }}/> EDIT</button>}
            </div>

            {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                       {newAvatarFile ? <img src={URL.createObjectURL(newAvatarFile)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (myProfile.photoURL ? <img src={myProfile.photoURL} alt="existing" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={24} />)}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', cursor: 'pointer', color: 'var(--color-accent)', textDecoration: 'underline' }}>
                        Change Profile Avatar
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setNewAvatarFile(e.target.files[0])} />
                      </label>
                    </div>
                  </div>
                  <SectionEdit label="Username" valKey="anonymous_username" state={editForm} setState={setEditForm} />
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Interests & Tags</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {Array.from(new Set([...INTERESTS, ...(editForm.interests || [])])).map(interest => {
                        const isSelected = editForm.interests && editForm.interests.includes(interest);
                        return (
                          <button 
                            key={interest} 
                            type="button"
                            onClick={() => {
                              const newInterests = isSelected 
                                ? editForm.interests.filter(i => i !== interest)
                                : [...(editForm.interests || []), interest];
                              setEditForm({...editForm, interests: newInterests});
                            }}
                            style={{
                              padding: '6px 16px', 
                              borderRadius: 'var(--radius-pill, 999px)', 
                              border: '1px solid rgba(0,0,0,0.2)', 
                              fontSize: '0.8rem', 
                              fontWeight: 600, 
                              cursor: 'pointer',
                              backgroundColor: isSelected ? 'var(--color-accent)' : 'transparent',
                              color: isSelected ? 'white' : 'inherit'
                            }}
                          >
                            {interest}
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <input 
                        type="text" 
                        placeholder="+ Add custom interest (press Enter)"
                        style={{ ...styles.input, width: '100%', maxWidth: '300px', padding: '10px 16px' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.target.value.trim().toUpperCase();
                            if (val && !(editForm.interests || []).includes(val)) {
                               setEditForm({...editForm, interests: [...(editForm.interests || []), val]});
                               e.target.value = '';
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  <SectionEdit label="Platform Objectives" valKey="objectives" state={editForm} setState={setEditForm} />
                  <SectionEdit label="Currently working on a project?" valKey="working_on" state={editForm} setState={setEditForm} />
                  <SectionEdit label="Skills / Expertise" valKey="skills" state={editForm} setState={setEditForm} />
                  <SectionEdit label="Hobbies" valKey="hobbies" state={editForm} setState={setEditForm} />
                  <SectionEdit label="Areas of Interest" valKey="areas_of_interest" state={editForm} setState={setEditForm} />
                  <SectionEdit label="Looking to learn / work on" valKey="looking_to_learn" state={editForm} setState={setEditForm} />
                  <SectionEdit label="Projects & Portfolio Links" valKey="portfolio_links" state={editForm} setState={setEditForm} />
                  <SectionEdit label="Anonymous Bio & Pitch" valKey="bio" state={editForm} setState={setEditForm} textarea />

                  <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                    <button className="btn btn-primary" onClick={saveProfile} disabled={isSavingProfile}>{isSavingProfile ? 'Saving...' : 'Save Changes'}</button>
                    <button className="btn btn-outline" onClick={() => setIsEditing(false)}>Cancel</button>
                  </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '32px' }}>
                  <ProfileRow label="PLATFORM OBJECTIVES" value={myProfile.objectives} />
                  <ProfileRow label="CURRENTLY WORKING ON A PROJECT?" value={myProfile.working_on} />
                  <ProfileRow label="SKILLS / EXPERTISE" value={myProfile.skills} />
                  <div style={{ display: 'flex', gap: '48px' }}>
                     <div style={{ flex: 1 }}><ProfileRow label="HOBBIES" value={myProfile.hobbies} /></div>
                     <div style={{ flex: 1 }}><ProfileRow label="AREAS OF INTEREST" value={myProfile.areas_of_interest} /></div>
                  </div>
                  <ProfileRow label="LOOKING TO LEARN / WORK ON" value={myProfile.looking_to_learn} />
                  <ProfileRow label="PROJECTS & PORTFOLIO Links" value={myProfile.portfolio_links} />
                  <ProfileRow label="ANONYMOUS BIO & PITCH" value={myProfile.bio} isBio />
                  
                  <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px dashed rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'center' }}>
                    <button className="btn btn-outline" style={{ display: 'flex', gap: '8px', color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }} onClick={logout}>
                      <LogOut size={16} /> END SESSION
                    </button>
                  </div>
                </div>
            )}
          </div>
        )}

        {activeTab === 'other-profile' && viewingProfile && (
          <div className="card" style={styles.profileArea}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
               <div style={{ display: 'flex', gap: '32px' }}>
                  {viewingProfile.photoURL ? (
                     <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(0,0,0,0.1)', flexShrink: 0 }}>
                        <img src={viewingProfile.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     </div>
                  ) : (
                     <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '2rem', flexShrink: 0 }}>
                        {viewingProfile.anonymous_username?.slice(-2) || 'XX'}
                     </div>
                  )}
                  <div>
                    <h2 className="heading-md" style={{ fontSize: '3rem', letterSpacing: '-0.02em', marginBottom: '8px' }}>{viewingProfile.anonymous_username}</h2>
                    <div style={{ display: 'flex', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: 600, alignItems: 'center' }}>
                      <button onClick={toggleProfileLike} style={{ ...styles.interactionBtn, padding: 0, color: iLikedOtherProfile ? 'red' : 'var(--color-text-secondary)' }}>
                        <HeartIcon filled={!!iLikedOtherProfile} /> {otherProfileLikesDocs.length} REP
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                      {viewingProfile.interests?.map(i => <span key={i} className="tag">{i}</span>)}
                    </div>
                  </div>
               </div>
               <div style={{ display: 'flex', gap: '16px' }}>
                 <button onClick={() => startDirectMessage(viewingProfile.user_id)} className="btn btn-primary" style={{ display: 'flex', gap: '8px' }}><MessageSquare size={16}/> SEND MESSAGE</button>
                 <button onClick={() => handleBlockUser(viewingProfile.user_id)} className="btn btn-outline" style={{ display: 'flex', gap: '8px' }}><UserX size={16}/> BLOCK AGENT</button>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '32px' }}>
              <ProfileRow label="PLATFORM OBJECTIVES" value={viewingProfile.objectives} />
              <ProfileRow label="CURRENTLY WORKING ON A PROJECT?" value={viewingProfile.working_on} />
              <ProfileRow label="SKILLS / EXPERTISE" value={viewingProfile.skills} />
              <div style={{ display: 'flex', gap: '48px' }}>
                 <div style={{ flex: 1 }}><ProfileRow label="HOBBIES" value={viewingProfile.hobbies} /></div>
                 <div style={{ flex: 1 }}><ProfileRow label="AREAS OF INTEREST" value={viewingProfile.areas_of_interest} /></div>
              </div>
              <ProfileRow label="LOOKING TO LEARN / WORK ON" value={viewingProfile.looking_to_learn} />
              <ProfileRow label="PROJECTS & PORTFOLIO LINKS" value={viewingProfile.portfolio_links} />
              <ProfileRow label="ANONYMOUS BIO & PITCH" value={viewingProfile.bio} isBio />
            </div>
          </div>
        )}
      </main>
      
      {reportModalData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="heading-sm">Report Violation</h3>
              <button onClick={() => setReportModalData(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <p className="text-body-sm" style={{ marginBottom: '24px' }}>Please specify the reason for flagging this content. False reports carry a penalty.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               {['Spam or Misleading', 'Harassment or Bullying', 'Hate Speech', 'Explicit Content', 'Scam or Fraud', 'Impersonation'].map(reason => (
                  <button key={reason} onClick={() => submitReport(reason)} className="btn btn-outline" style={{ textAlign: 'left', padding: '12px', width: '100%', fontWeight: 600 }}>{reason}</button>
               ))}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// POST INTERACTION SYSTEM (Liking & Commenting mapped to Firestore)
// -------------------------------------------------------------
const PostCard = ({ post, onReport, onViewAuthor, myUid }) => {
  const [authorProfile] = useDocumentData(doc(db, 'users', post.user_id));
  const [likesSnap] = useCollection(query(collection(db, 'likes'), where('post_id', '==', post.post_id)));
  const [commentsSnap] = useCollection(query(collection(db, 'comments'), where('post_id', '==', post.post_id)));
  
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const authorName = authorProfile ? authorProfile.anonymous_username : 'Agent';
  const authorPic = authorProfile?.photoURL || null;

  const likesDocs = likesSnap ? likesSnap.docs.map(d => ({id: d.id, ...d.data()})) : [];
  const iLikedBlob = likesDocs.find(l => l.user_id === myUid);
  
  const commentsUnsorted = commentsSnap ? commentsSnap.docs.map(d => ({id: d.id, ...d.data()})) : [];
  const commentsDocs = commentsUnsorted.sort((a,b) => a.created_at - b.created_at);

  const handleLikeToggle = async () => {
     if (iLikedBlob) {
        await deleteDoc(doc(db, 'likes', iLikedBlob.id));
     } else {
        await addDoc(collection(db, 'likes'), { post_id: post.post_id, user_id: myUid, created_at: Date.now() });
     }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addDoc(collection(db, 'comments'), {
       post_id: post.post_id,
       user_id: myUid,
       text: commentText,
       created_at: Date.now()
    });
    setCommentText('');
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }} onClick={onViewAuthor}>
          {authorPic ? (
             <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden' }}><img src={authorPic} alt="" style={{ width:'100%', height:'100%', objectFit: 'cover' }} /></div>
          ) : (
             <div style={styles.avatarSm}>{authorName.slice(-2)}</div>
          )}
          <div>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{authorName}</span>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginLeft: '8px', textTransform: 'uppercase' }}>in {post.community_id}</span>
          </div>
        </div>
        <button onClick={onReport} style={{ background: 'none', border:'none', cursor:'pointer', color: 'var(--color-text-secondary)', display: 'flex', gap: '6px', fontSize: '0.75rem', textTransform: 'uppercase' }}><Flag size={14} /> Report</button>
      </div>
      {post.text_content && <p style={{ fontSize: '1.1rem', marginBottom: '16px', lineHeight: '1.6', fontFamily: 'var(--font-serif)', whiteSpace: 'pre-wrap' }}>{post.text_content}</p>}
      {post.image_url && (
         <div style={{ width: '100%', maxHeight: '500px', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px', backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={post.image_url} alt="Attached" style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }} />
         </div>
      )}
      
      <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '16px' }}>
        <button style={{ ...styles.interactionBtn, color: iLikedBlob ? 'var(--color-accent)' : 'inherit' }} onClick={handleLikeToggle}>
           <HeartIcon filled={!!iLikedBlob} /> {likesDocs.length} Likes
        </button>
        <button style={styles.interactionBtn} onClick={() => setShowComments(!showComments)}><MessageSquare size={16} /> {commentsDocs.length} Comments</button>
      </div>

      {showComments && (
        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
           {commentsDocs.map(c => <CommentRow key={c.id} comment={c} />)}
           <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
             <input type="text" placeholder="Write a comment..." value={commentText} onChange={e=>setCommentText(e.target.value)} style={{ ...styles.input, padding: '12px 16px' }} />
             <button type="submit" className="btn btn-outline" style={{ padding: '0 24px' }}><Send size={16} /></button>
           </form>
        </div>
      )}
    </>
  );
};

const CommentRow = ({ comment }) => {
  const [author] = useDocumentData(doc(db, 'users', comment.user_id));
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
       {author?.photoURL ? (
         <div style={{ width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}><img src={author.photoURL} alt="" style={{width:'100%', height:'100%', objectFit: 'cover'}} /></div>
       ) : (
         <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 600, flexShrink: 0 }}>
           {author?.anonymous_username?.slice(-2) || 'XX'}
         </div>
       )}
       <div>
         <span style={{ fontSize: '0.75rem', fontWeight: 700, marginRight: '8px' }}>{author ? author.anonymous_username : 'Agent'}</span>
         <span style={{ fontSize: '0.875rem' }}>{comment.text}</span>
       </div>
    </div>
  )
};

// -------------------------------------------------------------
// MESSAGES INBOX (1-to-1 Discord routing style)
// -------------------------------------------------------------
const CommunityChatThread = ({ communityName, myUid, viewAuthor }) => {
  const threadId = `hub_${communityName}`;
  const [messagesSnap] = useCollection(query(collection(db, 'messages'), where('thread_id', '==', threadId)));
  const [text, setText] = useState('');
  const [msgImage, setMsgImage] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  const endRef = useRef(null);
  const messagesUnsorted = messagesSnap ? messagesSnap.docs.map(d => ({id: d.id, ...d.data()})) : [];
  const messages = messagesUnsorted.sort((a,b) => a.created_at - b.created_at);

  useEffect(() => {
     endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !msgImage)) return;
    if (msgImage && msgImage.size > 5 * 1024 * 1024) return alert("Image size exceeds 5MB firewall limit.");
    
    setIsSending(true);
    let imageUrl = '';
    if (msgImage) {
       try { imageUrl = await uploadToImgBB(msgImage); } catch (err) { setIsSending(false); return alert("ImgBB Server Error: " + err.message); }
    }

    await addDoc(collection(db, 'messages'), {
       thread_id: threadId,
       sender_id: myUid,
       text: text,
       image_url: imageUrl,
       created_at: Date.now()
    });
    setText('');
    setMsgImage(null);
    setIsSending(false);
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '800px', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--color-bg-secondary)' }}>
         <h2 className="heading-sm" style={{ margin: 0, fontSize: '1.25rem' }}># {communityName}</h2>
         <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>PUBLIC HUB LINK</span>
      </div>
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--color-bg-primary)' }}>
         {messages.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: '40px' }}>Welcome to the {communityName} Hub. Be the first to establish a secure link.</p>}
         {messages.map((m, index) => {
            const isMe = m.sender_id === myUid;
            const appendTail = index === messages.length - 1 || messages[index+1].sender_id !== m.sender_id;
            return <MessageBubble key={m.id} msg={m} isMe={isMe} viewAuthor={viewAuthor} appendTail={appendTail} />;
         })}
         <div ref={endRef} />
      </div>
      <div style={{ padding: '24px', borderTop: '1px solid rgba(0,0,0,0.1)', backgroundColor: 'var(--color-bg-secondary)' }}>
         {msgImage && (
            <div style={{ marginBottom: '12px', position: 'relative', display: 'inline-block' }}>
               <img src={URL.createObjectURL(msgImage)} alt="preview" style={{ height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
               <button type="button" onClick={() => setMsgImage(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'red', color: 'white', borderRadius: '50%', width:'20px', height:'20px', border:'none', cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>×</button>
            </div>
         )}
         <form onSubmit={sendMsg} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
           <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px', color: 'var(--color-text-secondary)', transition: 'color 0.2s' }}>
             <ImageIcon size={24} />
             <input type="file" accept="image/*" onChange={e => setMsgImage(e.target.files[0])} style={{ display: 'none' }} />
           </label>
           <input type="text" placeholder={`Message #${communityName}...`} value={text} onChange={e=>setText(e.target.value)} style={{ ...styles.input, padding: '12px 16px', backgroundColor: 'var(--color-bg-primary)' }} />
           <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }} disabled={isSending}>
              {isSending ? '...' : <Send size={16} />}
           </button>
         </form>
      </div>
    </div>
  )
}

const MessageBubble = ({ msg, isMe, viewAuthor, appendTail }) => {
  const [author] = useDocumentData(doc(db, 'users', msg.sender_id));
  return (
     <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: appendTail ? '8px' : '2px' }}>
         {!isMe && appendTail && <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '4px', cursor: 'pointer', color: 'var(--color-text-secondary)' }} onClick={() => viewAuthor(msg.sender_id)}>{author ? author.anonymous_username : 'Agent'}</div>}
         <div style={{ maxWidth: '70%', padding: '10px 16px', borderRadius: '12px', backgroundColor: isMe ? 'var(--color-accent)' : 'rgba(0,0,0,0.05)', color: isMe ? 'white' : 'black', fontSize: '0.9rem', borderBottomRightRadius: isMe && appendTail ? '4px' : '12px', borderBottomLeftRadius: !isMe && appendTail ? '4px' : '12px' }}>
             {msg.image_url && <img src={msg.image_url} alt="attachment" style={{ width: '100%', borderRadius: '8px', marginBottom: msg.text ? '8px' : '0' }} />}
             {msg.text && <span>{msg.text}</span>}
         </div>
     </div>
  )
}

const MessagesInbox = ({ myProfile, myUid, activeThreadId, setActiveThreadId, viewAuthor }) => {
  const activeChats = myProfile?.active_chats || [];
  const unreadMsgDict = myProfile?.unread_counts || {};
  
  if (activeChats.length === 0) {
    return (
      <div className="card text-center" style={{ padding: '80px 20px', minHeight: '500px' }}>
         <h3 className="heading-sm">Your Inbox is Empty</h3>
         <p className="text-body-sm">Go to Discover or Feed, view an Agent's Profile, and click "SEND DIRECT MESSAGE" to establish a secure 1-to-1 link.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: 'flex', minHeight: '600px', padding: 0, overflow: 'hidden' }}>
       <div style={{ width: '250px', borderRight: '1px solid rgba(0,0,0,0.1)', backgroundColor: 'rgba(0,0,0,0.02)', padding: '24px 0' }}>
         <h4 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', padding: '0 24px', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>ACTIVE CHATS</h4>
         {activeChats.map(peerId => (
            <InboxRow key={peerId} peerId={peerId} active={activeThreadId === peerId} onClick={() => setActiveThreadId(peerId)} unreadCount={unreadMsgDict[peerId] || 0} />
         ))}
       </div>
       <div style={{ flex: 1, backgroundColor: 'var(--color-bg-primary)', display: 'flex', flexDirection: 'column' }}>
          {activeThreadId ? (
            <ChatThread myProfile={myProfile} myUid={myUid} peerId={activeThreadId} viewAuthor={viewAuthor} />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
               <p>Select a thread to initialize messaging port.</p>
            </div>
          )}
       </div>
    </div>
  )
};

const InboxRow = ({ peerId, active, onClick, unreadCount }) => {
  const [peer] = useDocumentData(doc(db, 'users', peerId));
  return (
    <button onClick={onClick} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', background: active ? 'rgba(0,0,0,0.05)' : 'none', border: 'none', borderLeft: active ? '3px solid var(--color-accent)' : '3px solid transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}>
      {peer?.photoURL ? (
         <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden' }}><img src={peer.photoURL} alt="" style={{width:'100%', height:'100%', objectFit: 'cover'}}/></div>
      ) : (
         <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
           {peer?.anonymous_username?.slice(-2) || 'XX'}
         </div>
      )}
      <span style={{ fontSize: '0.875rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{peer ? peer.anonymous_username : 'Loading...'}</span>
      {unreadCount > 0 && <span style={{ marginLeft: 'auto', background: 'red', color: 'white', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>{unreadCount}</span>}
    </button>
  )
}

const ChatThread = ({ myProfile, myUid, peerId, viewAuthor }) => {
  const threadId = myUid < peerId ? `${myUid}_${peerId}` : `${peerId}_${myUid}`;
  const [messagesSnap] = useCollection(query(collection(db, 'messages'), where('thread_id', '==', threadId)));
  const [peer] = useDocumentData(doc(db, 'users', peerId));
  const [text, setText] = useState('');
  const [msgImage, setMsgImage] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  const endRef = useRef(null);
  const messagesUnsorted = messagesSnap ? messagesSnap.docs.map(d => ({id: d.id, ...d.data()})) : [];
  const messages = messagesUnsorted.sort((a,b) => a.created_at - b.created_at);

  useEffect(() => {
     endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
     if (myProfile?.unread_counts?.[peerId]) {
         updateDoc(doc(db, 'users', myUid), { 
             [`unread_counts.${peerId}`]: 0 
         }).catch(e => console.error(e));
     }
  }, [messages, peerId, myProfile, myUid]);

  const sendMsg = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !msgImage)) return;
    if (msgImage && msgImage.size > 5 * 1024 * 1024) return alert("Image size exceeds 5MB firewall limit.");
    
    setIsSending(true);
    let imageUrl = '';
    if (msgImage) {
       try {
         imageUrl = await uploadToImgBB(msgImage);
       } catch (err) {
         setIsSending(false);
         return alert("ImgBB Server Error: " + err.message);
       }
    }

    await addDoc(collection(db, 'messages'), {
       thread_id: threadId,
       sender_id: myUid,
       text: text,
       image_url: imageUrl,
       created_at: Date.now()
    });

    await updateDoc(doc(db, 'users', peerId), {
       [`unread_counts.${myUid}`]: increment(1)
    }).catch(e => console.error("Error setting notification: ", e));

    setText('');
    setMsgImage(null);
    setIsSending(false);
  }

  return (
    <>
      <div 
         style={{ padding: '24px', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.2s' }}
         onClick={() => viewAuthor(peerId)}
         onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
         onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
         {peer?.photoURL ? (
            <img src={peer.photoURL} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
         ) : (
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700 }}>{peer?.anonymous_username?.slice(-2)}</div>
         )}
         <span style={{ fontWeight: 700 }}>{peer ? peer.anonymous_username : 'Agent'}</span>
         <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>E2E SECURE LINK</span>
      </div>
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
         {messages.map(m => {
           const isMe = m.sender_id === myUid;
           return (
             <div key={m.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%', padding: '12px 16px', borderRadius: '12px', backgroundColor: isMe ? 'var(--color-accent)' : 'rgba(0,0,0,0.05)', color: isMe ? 'white' : 'black', fontSize: '0.9rem' }}>
               {m.image_url && <img src={m.image_url} alt="attachment" style={{ width: '100%', borderRadius: '8px', marginBottom: m.text ? '8px' : '0' }} />}
               {m.text && <span>{m.text}</span>}
             </div>
           )
         })}
         <div ref={endRef} />
      </div>
      <div style={{ padding: '24px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
         {msgImage && (
            <div style={{ marginBottom: '12px', position: 'relative', display: 'inline-block' }}>
               <img src={URL.createObjectURL(msgImage)} alt="preview" style={{ height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
               <button type="button" onClick={() => setMsgImage(null)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'red', color: 'white', borderRadius: '50%', width:'20px', height:'20px', border:'none', cursor:'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>×</button>
            </div>
         )}
         <form onSubmit={sendMsg} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
           <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px', color: 'var(--color-text-secondary)', transition: 'color 0.2s' }}>
             <ImageIcon size={24} />
             <input type="file" accept="image/*" onChange={e => setMsgImage(e.target.files[0])} style={{ display: 'none' }} />
           </label>
           <input type="text" placeholder={`Message ${peer?.anonymous_username || 'Agent'}...`} value={text} onChange={e=>setText(e.target.value)} style={{ ...styles.input, padding: '12px 16px' }} />
           <button type="submit" className="btn btn-primary" style={{ padding: '0 24px' }} disabled={isSending}>
              {isSending ? '...' : <Send size={16} />}
           </button>
         </form>
      </div>
    </>
  )
}

const ExpandableHubSector = ({ parent, myJoinedNames, toggleSubcommunityJoin }) => {
  const [open, setOpen] = useState(false);
  
  const getIcon = (name) => {
    switch(name) {
       case 'TECHNOLOGY': return <Monitor size={32} />;
       case 'AI & DATA SCIENCE': return <BrainCircuit size={32} />;
       case 'PHOTOGRAPHY': return <Camera size={32} />;
       case 'SPORTS': return <Trophy size={32} />;
       case 'MUSIC': return <Headphones size={32} />;
       case 'DANCE': return <Flame size={32} />;
       case 'STARTUPS': return <Rocket size={32} />;
       case 'GAMING': return <Gamepad2 size={32} />;
       case 'FITNESS': return <Dumbbell size={32} />;
       case 'BOOKS & WRITING': return <BookOpen size={32} />;
       case 'DESIGN': return <PenTool size={32} />;
       case 'PUBLIC SPEAKING': return <Mic size={32} />;
       default: return <Monitor size={32} />;
    }
  };

  return (
    <div className="hub-card">
      <button 
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 24px', background: open ? 'var(--color-bg-secondary)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{ color: 'var(--color-accent)' }}>{getIcon(parent.name)}</div>
           <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>{parent.name}</span>
        </div>
        {open ? <ChevronUp size={24} color="var(--color-text-secondary)" /> : <ChevronDown size={24} color="var(--color-text-secondary)" />}
      </button>
      
      {open && (
        <div style={{ padding: '0 24px 32px 24px', display: 'flex', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '24px' }}>
          {parent.subcommunities.map(sub => {
             const isJoined = myJoinedNames.includes(sub);
             return (
               <button 
                 key={sub} 
                 onClick={() => toggleSubcommunityJoin(sub)} 
                 className={`pill-btn ${isJoined ? 'pill-joined' : 'pill-unjoined'}`}
               >
                 {sub} {isJoined && '✓'}
               </button>
             )
          })}
        </div>
      )}
    </div>
  );
};

const ProfileRow = ({ label, value, isBio }) => {
  if (!value) return null;
  return (
    <div>
      <span className="title-overline" style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '8px', marginBottom: '16px', letterSpacing: '0.1em' }}>{label}</span>
      {isBio ? (
         <div style={{ backgroundColor: 'rgba(0,0,0,0.03)', padding: '24px', borderLeft: '4px solid var(--color-accent)', fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontStyle: 'italic' }}>
            "{value}"
         </div>
      ) : (
        <p style={{ fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase' }}>{value}</p>
      )}
    </div>
  );
};

const SectionEdit = ({ label, valKey, state, setState, textarea }) => (
  <div>
    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
    {textarea ? (
      <textarea style={{ ...styles.input, resize: 'vertical', minHeight: '100px' }} value={state[valKey]} onChange={e=>setState({...state, [valKey]: e.target.value})}></textarea>
    ) : (
      <input type="text" style={styles.input} value={state[valKey]} onChange={e=>setState({...state, [valKey]: e.target.value})} />
    )}
  </div>
);

const HeartIcon = ({ filled }) => <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;

const styles = {
  dashboardContainer: { display: 'flex', flexDirection: 'column', paddingTop: '40px', paddingBottom: '64px', minHeight: '100vh', maxWidth: '900px', margin: '0 auto' },
  topNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '24px' },
  navLinks: { display: 'flex', gap: '32px', alignItems: 'center' },
  navTab: { background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', position: 'relative', paddingBottom: '8px', color: 'var(--color-text-secondary)' },
  navTabActive: { color: 'var(--color-text-primary)' },
  mainContent: { flex: 1, width: '100%' },
  input: { width: '100%', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,0,0,0.2)', fontSize: '0.9rem', background: 'transparent', fontFamily: 'var(--font-sans)', outline: 'none' },
  avatarSm: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem', fontFamily: 'var(--font-serif)' },
  interactionBtn: { display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '0.875rem', background: 'none', border:'none', cursor:'pointer' },
  profileArea: { padding: '40px' }
};
