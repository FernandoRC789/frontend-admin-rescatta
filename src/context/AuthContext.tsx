import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "../firebase";
import { fetchMe } from "../api/authApi";
import type { AppUserResponse } from "../types";

interface AuthContextValue {
  firebaseUser: User | null;
  profile: AppUserResponse | null;
  profileError: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUserResponse | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setProfile(null);
      setProfileError(null);
      return;
    }

    const uid = user.uid;
    try {
      const me = await fetchMe();
      if (auth.currentUser?.uid !== uid) return;
      setProfile(me);
      setProfileError(null);
    } catch (error) {
      if (auth.currentUser?.uid !== uid) return;
      setProfile(null);
      setProfileError(
        error instanceof Error ? error.message : "No se pudo cargar tu perfil."
      );
    }
  }, []);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setProfileError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      await loadProfile();
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    setProfileError(null);
    // El perfil lo carga onAuthStateChanged. Mantener loading=true evita que
    // ProtectedRoute redirija a /login mientras Firebase propaga la sesión.
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setProfile(null);
    setProfileError(null);
    setLoading(false);
  };

  const refreshProfile = async () => {
    setLoading(true);
    try {
      await loadProfile();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCtx.Provider
      value={{
        firebaseUser,
        profile,
        profileError,
        loading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
