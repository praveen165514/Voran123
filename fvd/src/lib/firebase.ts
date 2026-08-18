/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { initializeAuth, browserSessionPersistence, browserPopupRedirectResolver, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import localConfig from '../../firebase-applet-config.json';

// Use Environment Variables if provided (for Netlify/Production), otherwise fallback to the AI Studio managed config
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId,
};

const app = initializeApp(config);

export const auth = initializeAuth(app, {
  persistence: browserSessionPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});

// Determine Database ID
const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId;
export const db = getFirestore(app, databaseId);

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    
    if (error.code === 'auth/unauthorized-domain') {
      alert(`NETLIFY LOGIN BLOCKED: This domain (${window.location.hostname}) is not authorized in Firebase.\n\nTo fix this: Go to your Firebase Console -> Authentication -> Settings -> Authorized Domains, and add "${window.location.hostname}".`);
    } else if (error.message && (error.message.includes("Database is closing") || error.message.includes("indexedDB"))) {
      alert("Browser privacy settings blocked login. Please click 'Open in new tab' (the arrow icon in the top right) to log in, or allow 3rd-party cookies.");
    } else {
      alert(`Login failed: ${error.message || error.code}`);
    }
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
