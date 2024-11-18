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
    return userCredential; // Returner hele userCredential

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
      // Update the profile with the display name
      await updateProfile(userCredential.user, {
        displayName: username,
      });

      // Log the user's email and display name to the console
      console.log("User signed up", userCredential.user.email);
      console.log("User display name (should be set):", userCredential.user.displayName);

      // Refresh the user to make sure the display name is updated in the auth object
      await userCredential.user.reload();

      // Log the updated display name
      console.log("Updated User display name:", userCredential.user.displayName);
    })
    .catch((error) => {
      console.log(`Oops! ${error.code} message: ${error.message}`);
    });
};
export { auth };

