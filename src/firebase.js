import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCO3LVkkYj2O1ay-46SFWJGaXfy6-0UUTg",
  authDomain: "p2p-hub.firebaseapp.com",
  projectId: "p2p-hub",
  storageBucket: "p2p-hub.firebasestorage.app",
  messagingSenderId: "84631845031",
  appId: "1:84631845031:web:e976ed91765f43a08a0382",
  measurementId: "G-KXDJL2CXBE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const COMMUNITIES_MAP = [
  { name: 'TECHNOLOGY', subcommunities: ['web development', 'app development', 'machine learning', 'cybersecurity'] },
  { name: 'AI & DATA SCIENCE', subcommunities: ['deep learning', 'nlp', 'computer vision', 'data analytics'] },
  { name: 'PHOTOGRAPHY', subcommunities: ['mobile photography', 'photo editing', 'street photography', 'cinematography'] },
  { name: 'SPORTS', subcommunities: ['football', 'cricket', 'basketball', 'fitness training'] },
  { name: 'MUSIC', subcommunities: ['singing', 'guitar', 'piano', 'music production'] },
  { name: 'DANCE', subcommunities: ['hip hop', 'classical', 'freestyle', 'contemporary'] },
  { name: 'STARTUPS', subcommunities: ['ideation', 'funding', 'pitching', 'product building'] },
  { name: 'GAMING', subcommunities: ['pc gaming', 'mobile gaming', 'esports', 'game development'] },
  { name: 'FITNESS', subcommunities: ['weight training', 'yoga', 'cardio', 'nutrition'] },
  { name: 'BOOKS & WRITING', subcommunities: ['fiction', 'non fiction', 'poetry', 'blogging'] },
  { name: 'DESIGN', subcommunities: ['ui design', 'ux research', 'graphic design', 'product design'] },
  { name: 'PUBLIC SPEAKING', subcommunities: ['debate', 'presentation skills', 'storytelling', 'communication'] }
];
