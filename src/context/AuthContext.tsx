import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Platform } from "react-native";
import {
  onAuthStateChanged,
  signOut as fbSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithCredential,
  User,
} from "firebase/auth";
import { auth } from "../config/firebase";

interface AppUser {
  uid: string;
  email: string;
  username: string; // email sin @dominio
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogleWeb: () => Promise<void>;
  signInWithGoogleCredential: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithGoogleWeb: async () => {},
  signInWithGoogleCredential: async () => {},
  signOut: async () => {},
});

function toAppUser(u: User): AppUser {
  const email = u.email ?? "";
  return {
    uid: u.uid,
    email,
    username: email.split("@")[0],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ? toAppUser(u) : null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogleWeb = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const signInWithGoogleCredential = useCallback(async (idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(auth, credential);
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signInWithGoogleWeb, signInWithGoogleCredential, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
