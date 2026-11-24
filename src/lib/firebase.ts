import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  typeof rawApiKey === 'string' &&
  rawApiKey.trim() !== '' &&
  rawApiKey !== 'Secret value' &&
  !rawApiKey.includes('your-') &&
  rawProjectId &&
  typeof rawProjectId === 'string' &&
  rawProjectId.trim() !== '' &&
  rawProjectId !== 'Secret value'
);

const firebaseConfig = {
  apiKey: isFirebaseConfigured ? rawApiKey : 'AIzaSyDemoFallbackKeyForZenFlowMock0000',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-zenflow.firebaseapp.com',
  projectId: isFirebaseConfigured ? rawProjectId : 'demo-zenflow',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-zenflow.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:demozenflow',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
  db = databaseId && databaseId !== '(default)' ? getFirestore(app, databaseId) : getFirestore(app);
} catch (error) {
  console.warn("Firebase client initialized with safe offline fallback:", error);
  app = getApps().length > 0 ? getApp() : initializeApp({
    apiKey: 'AIzaSyDemoFallbackKeyForZenFlowMock0000',
    projectId: 'demo-zenflow',
    appId: '1:123456789012:web:demozenflow'
  }, 'zenflow-fallback');
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  if (!isFirebaseConfigured) {
    const demoUser = {
      uid: 'demo_google_user',
      email: 'jainy5855@gmail.com',
      displayName: 'Sarah Jenkins',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    };
    localStorage.setItem('zenflow_demo_email', demoUser.email);
    localStorage.setItem('zenflow_demo_user', JSON.stringify(demoUser));
    window.dispatchEvent(new Event('storage'));
    return demoUser;
  }

  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err: any) {
    if (
      err.code === 'auth/invalid-api-key' ||
      err.code === 'auth/api-key-not-valid' ||
      err.code === 'auth/operation-not-allowed' ||
      err.message?.includes('invalid-api-key') ||
      err.message?.includes('API key')
    ) {
      console.warn("Firebase API key not configured in console, using demo account fallback.");
      const demoUser = {
        uid: 'demo_google_user',
        email: 'jainy5855@gmail.com',
        displayName: 'Sarah Jenkins',
        photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      };
      localStorage.setItem('zenflow_demo_email', demoUser.email);
      localStorage.setItem('zenflow_demo_user', JSON.stringify(demoUser));
      window.dispatchEvent(new Event('storage'));
      return demoUser;
    }
    throw err;
  }
};

export const logout = () => {
  localStorage.removeItem('zenflow_demo_email');
  localStorage.removeItem('zenflow_demo_user');
  window.dispatchEvent(new Event('storage'));
  try {
    return signOut(auth);
  } catch (e) {
    return Promise.resolve();
  }
};


