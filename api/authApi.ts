import { auth } from "../firebaseConfig"
import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";


export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      router.push(`/HomeScreen?username=${encodeURIComponent(userCredential.user.displayName || "User")}`);
    }
    return userCredential; 
  } catch (error) {
    console.error("Error during signIn:", error);
    throw error;
  }
};

export const signOut = async () => {
  await auth.signOut().then(() => {
    console.log("Signed out");
  });
};

export const signUp = (email: string, password: string, username: string) => {
  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      // displayname = username, blir satt i signin/signup
      await updateProfile(userCredential.user, {
        displayName: username,
      });

      // Logger usere
      console.log("User signed up", userCredential.user.email);
      console.log("User display name (should be set):", userCredential.user.displayName);

      await userCredential.user.reload();

  
    })
    .catch((error) => {
      console.log(`Oops! ${error.code} message: ${error.message}`);
    });
};


