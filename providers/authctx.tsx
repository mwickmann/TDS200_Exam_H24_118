// Denne koden er hentet fra forelesning med Brage Hveding Ersdal
import React, { createContext, ReactNode, useContext, useEffect, useState, Dispatch, SetStateAction } from "react";
import { auth, db } from "@/firebaseConfig";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ActivityIndicator, View, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as authApi from "@/api/authApi"; 

interface UserWithProfileImage extends User {
  profileImage?: string;
}

type AuthContextType = {
  signOut: VoidFunction;
  userNameSession: string | null;
  isLoading: boolean;
  user: UserWithProfileImage | null;
  setUserAuthSession: Dispatch<SetStateAction<UserWithProfileImage | null>>;
  signIn: (email: string, password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthSession must be used within an AuthContext Provider");
  }
  return context;
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [userSession, setUserSession] = useState<string | null>(null);
  const [userAuthSession, setUserAuthSession] = useState<UserWithProfileImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserSession(user.displayName || user.email || "Anonymous");
            setUserAuthSession({ ...user, profileImage: userData.profileImage || null });
          } else {
            setUserSession(user.displayName || user.email || "Anonymous");
            setUserAuthSession(user);
          }
        } else {
          setUserSession(null);
          setUserAuthSession(null);
        }
      } catch (error) {
        console.error("Error in authentication:", error);
        Alert.alert("Authentication Error", "An error occurred while fetching user data.");
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userAuthSession) {
      router.push("/HomeScreen");
    }
  }, [userAuthSession]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CBE8F4" />
      </View>
    );
  }

  const signIn = async (email: string, password: string) => {
    try {
      await authApi.signIn(email, password);
      // Navigasjon håndteres i AuthSessionProvider via onAuthStateChanged
    } catch (error) {
      console.error("SignIn Error:", error);
      Alert.alert("Sign In Error");
    }
  };



  return (
    <AuthContext.Provider
      value={{
        signOut: async () => {
          try {
            await authApi.signOut();
            setUserSession(null);
            setUserAuthSession(null);
            router.push("/SignInScreen"); 
          } catch (error: any) {
            console.log("Sign Out Error:", error);
            Alert.alert("Sign Out Error", error.message);
          }
        },
        userNameSession: userSession,
        user: userAuthSession,
        isLoading,
        setUserAuthSession,
        signIn,
     
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
