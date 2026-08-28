import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

export type StressLevel = 'low' | 'normal' | 'high' | 'crisis';

interface AppContextType {
  user: User | any | null;
  loading: boolean;
  stressLevel: StressLevel;
  setStressLevel: (level: StressLevel) => void;
  userName: string;
  calmScore: number;
  streak: number;
  mood: string;
  lastEntry: string;
  updateProfile: (data: any) => Promise<void>;
  addDiaryEntry: (title: string, content: string, mood?: string) => Promise<void>;
  deleteDiaryEntry: (entryId: string) => Promise<void>;
  toggleExposureStep: (stepId: string, completed: boolean) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | any | null>(null);
  const [loading, setLoading] = useState(true);
  const [stressLevel, setStressLevelState] = useState<StressLevel>('normal');
  const [userName, setUserName] = useState('');
  const [calmScore, setCalmScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mood, setMood] = useState('Neutral');
  const [lastEntry, setLastEntry] = useState('No entries yet');

  // Example users data
  const exampleUsers: Record<string, any> = {
    'jainy5855@gmail.com': {
      userName: 'Sarah Jenkins',
      calmScore: 84,
      streak: 12,
      mood: '😊',
      lastEntry: 'Yesterday, 8:45 PM',
      stressLevel: 'normal'
    },
    'mike@zenflow.io': {
      userName: 'Mike Ross',
      calmScore: 65,
      streak: 5,
      mood: '😐',
      lastEntry: '2 days ago',
      stressLevel: 'low'
    },
    'elena@zenflow.io': {
      userName: 'Elena Gilbert',
      calmScore: 92,
      streak: 21,
      mood: '😇',
      lastEntry: 'Today, 10:00 AM',
      stressLevel: 'normal'
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const demoEmail = localStorage.getItem('zenflow_demo_email') || '';
        const effectiveEmail = (firebaseUser.email || demoEmail || '').toLowerCase();
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        try {
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            const initialData = exampleUsers[effectiveEmail] || {
              userName: firebaseUser.displayName || effectiveEmail.split('@')[0] || 'User',
              calmScore: 75,
              streak: 3,
              mood: '😊',
              lastEntry: 'Welcome to ZenFlow',
              stressLevel: 'normal'
            };

            await setDoc(userDocRef, {
              ...initialData,
              uid: firebaseUser.uid,
              email: effectiveEmail || firebaseUser.email || '',
              createdAt: serverTimestamp()
            });

            if (exampleUsers[effectiveEmail]) {
              const diaryRef = doc(db, 'users', firebaseUser.uid, 'diary', 'initial');
              await setDoc(diaryRef, {
                uid: firebaseUser.uid,
                title: "Initial Reflection",
                content: "Today I felt a slight wave of anxiety while at the grocery store, but I practiced my breathing and it passed quickly...",
                mood: initialData.mood || "😊",
                timestamp: serverTimestamp()
              });

              const steps = [
                { id: '1', title: 'Visit a quiet cafe', completed: true, order: 1 },
                { id: '2', title: 'Drive for 15 minutes', completed: true, order: 2 },
                { id: '3', title: 'Sit in a crowded mall', completed: true, order: 3 },
                { id: '4', title: 'Order food in person', completed: false, order: 4 },
                { id: '5', title: 'Attend a small social gathering', completed: false, order: 5 },
              ];

              for (const step of steps) {
                const stepRef = doc(db, 'users', firebaseUser.uid, 'exposureSteps', step.id);
                await setDoc(stepRef, { ...step, uid: firebaseUser.uid });
              }
            }
          }

          const unsubDoc = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              setStressLevelState(data.stressLevel || 'normal');
              setUserName(data.userName || effectiveEmail.split('@')[0] || 'User');
              setCalmScore(data.calmScore ?? 75);
              setStreak(data.streak ?? 3);
              setMood(data.mood || '😊');
              setLastEntry(data.lastEntry || 'Welcome to ZenFlow');
            }
          });

          setLoading(false);
          return () => unsubDoc();
        } catch (err) {
          console.warn("Firestore access fallback:", err);
          const initialData = exampleUsers[effectiveEmail] || {
            userName: effectiveEmail.split('@')[0] || 'User',
            calmScore: 75,
            streak: 3,
            mood: '😊',
            lastEntry: 'Welcome to ZenFlow',
            stressLevel: 'normal'
          };
          setUserName(initialData.userName);
          setCalmScore(initialData.calmScore);
          setStreak(initialData.streak);
          setMood(initialData.mood);
          setLastEntry(initialData.lastEntry);
          setStressLevelState(initialData.stressLevel || 'normal');
          setLoading(false);
        }
      } else {
        const demoUserStr = localStorage.getItem('zenflow_demo_user');
        if (demoUserStr) {
          try {
            const demoUser = JSON.parse(demoUserStr);
            setUser(demoUser);
            const profile = exampleUsers[demoUser.email] || {
              userName: demoUser.displayName || demoUser.email.split('@')[0],
              calmScore: 75,
              streak: 3,
              mood: '😊',
              lastEntry: 'Welcome to ZenFlow',
              stressLevel: 'normal'
            };
            setUserName(profile.userName);
            setCalmScore(profile.calmScore);
            setStreak(profile.streak);
            setMood(profile.mood);
            setLastEntry(profile.lastEntry);
            setStressLevelState(profile.stressLevel || 'normal');
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    localStorage.setItem('zenflow_demo_email', cleanEmail);

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          return;
        } catch (createErr: any) {
          if (createErr.code !== 'auth/operation-not-allowed') {
            throw createErr;
          }
        }
      }

      if (error.code === 'auth/operation-not-allowed' || error.message?.includes('operation-not-allowed')) {
        try {
          await signInAnonymously(auth);
          return;
        } catch (anonErr) {
          const demoUser = {
            uid: `demo_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
            email: cleanEmail,
            displayName: exampleUsers[cleanEmail]?.userName || cleanEmail.split('@')[0],
          };
          localStorage.setItem('zenflow_demo_user', JSON.stringify(demoUser));
          setUser(demoUser);
          
          const profile = exampleUsers[cleanEmail] || {
            userName: cleanEmail.split('@')[0],
            calmScore: 75,
            streak: 3,
            mood: '😊',
            lastEntry: 'Welcome to ZenFlow',
            stressLevel: 'normal'
          };
          setUserName(profile.userName);
          setCalmScore(profile.calmScore);
          setStreak(profile.streak);
          setMood(profile.mood);
          setLastEntry(profile.lastEntry);
          setStressLevelState(profile.stressLevel || 'normal');
          setLoading(false);
          return;
        }
      }

      throw error;
    }
  };


  const setStressLevel = async (level: StressLevel) => {
    setStressLevelState(level);
    if (user) {
      await setDoc(doc(db, 'users', user.uid), { stressLevel: level }, { merge: true });
    }
  };

  const updateProfile = async (data: any) => {
    if (user) {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
    }
  };

  const addDiaryEntry = async (title: string, content: string, mood?: string) => {
    if (user) {
      const entryId = Date.now().toString();
      const entryRef = doc(db, 'users', user.uid, 'diary', entryId);
      await setDoc(entryRef, {
        uid: user.uid,
        title,
        content,
        mood: mood || 'Neutral',
        timestamp: serverTimestamp()
      });

      // Update last entry in profile
      await setDoc(doc(db, 'users', user.uid), { 
        lastEntry: 'Just now',
        mood: mood || 'Neutral'
      }, { merge: true });
    }
  };

  const deleteDiaryEntry = async (entryId: string) => {
    if (user) {
      await deleteDoc(doc(db, 'users', user.uid, 'diary', entryId));
    }
  };

  const toggleExposureStep = async (stepId: string, completed: boolean) => {
    if (user) {
      const stepRef = doc(db, 'users', user.uid, 'exposureSteps', stepId);
      await setDoc(stepRef, { completed }, { merge: true });
    }
  };

  const logoutUser = async () => {
    localStorage.removeItem('zenflow_demo_email');
    localStorage.removeItem('zenflow_demo_user');
    setUser(null);
    setUserName('');
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("SignOut error:", err);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      loading, 
      stressLevel, 
      setStressLevel, 
      userName, 
      calmScore, 
      streak, 
      mood, 
      lastEntry,
      updateProfile,
      addDiaryEntry,
      deleteDiaryEntry,
      toggleExposureStep,
      loginWithEmail,
      logoutUser
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
