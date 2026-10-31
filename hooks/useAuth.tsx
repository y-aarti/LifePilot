import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, firebaseConfigured } from '../firebase';
type AuthValue = { user: User | null; loading: boolean; configured: boolean; signIn: (email: string, password: string) => Promise<void>; signUp: (email: string, password: string) => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    return onAuthStateChanged(auth, nextUser => { setUser(nextUser); setLoading(false); });
  }, []);
  const value = useMemo<AuthValue>(() => ({
    user, loading, configured: firebaseConfigured,
    signIn: async (email, password) => { if (!auth) throw new Error('Firebase is not configured yet. Add your Firebase values to .env.local.'); await signInWithEmailAndPassword(auth, email, password); },
    signUp: async (email, password) => { if (!auth) throw new Error('Firebase is not configured yet. Add your Firebase values to .env.local.'); await createUserWithEmailAndPassword(auth, email, password); },
    signOut: async () => { if (auth) await signOut(auth); },
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be inside AuthProvider'); return value; }
