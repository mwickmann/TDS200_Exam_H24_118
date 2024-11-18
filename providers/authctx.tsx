// src/providers/authctx.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebaseConfig";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { ActivityIndicator, View } from "react-native";
import * as authApi from "../api/authApi";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { ExtendedUser } from "@/providers/ExtendedUser"; // Importer ExtendedUser

type AuthContextType = {
  signIn: (username: string, password: string) => Promise<void>;
  signOut: VoidFunction;
  userNameSession: string | null;
  isLoading: boolean;
  user: ExtendedUser | null; // Oppdater til ExtendedUser
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthSession() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuthSession must be used within an AuthContext Provider");
  }
  return value;
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [userSession, setUserSession] = useState<string | null>(null);
  const [userAuthSession, setUserAuthSession] = useState<ExtendedUser | null>(null); // Oppdater til ExtendedUser
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      try {
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserSession(user.displayName || user.email || "Anonymous");
            setUserAuthSession({
              ...user,
              profileImage: userData.profileImage || undefined,
            });
          } else {
            setUserSession(user.displayName || user.email || "Anonymous");
            setUserAuthSession(user as ExtendedUser);
          }
        } else {
          setUserSession(null);
          setUserAuthSession(null);
        }
      } catch (error) {
        console.error("Error in authentication:", error);
        setUserSession(null);
        setUserAuthSession(null);
      } finally {
        setIsLoading(false); // Sørg for at den alltid settes til false
        console.log("Finished loading, isLoading set to false");
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        signIn: async (userName: string, password: string) => {
          await authApi.signIn(userName, password);
        },
        signOut: async () => {
          await authApi.signOut();
          setUserSession(null);
          setUserAuthSession(null);
          router.push("/"); // Naviger til index etter utlogging
        },
        userNameSession: userSession,
        user: userAuthSession,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
