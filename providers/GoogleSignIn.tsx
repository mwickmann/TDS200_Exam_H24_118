import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import { useAuthRequest } from "expo-auth-session";
import { auth } from "../providers/authctx"; // Firebase er allerede initialisert her

const SignInWithGoogle = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "802709983930-ikjdjagbl0bkun0vs78t3fhvdpe10ejq.apps.googleusercontent.com", 
});
const handleGoogleLogin = async () => {
    const result = await promptAsync();
  
    // Sjekk om `result` er vellykket og inneholder `authentication`
    if (result?.type === "success" && result.authentication) {
      const { idToken } = result.authentication; // TypeScript vet nå at `idToken` eksisterer
      const credential = GoogleAuthProvider.credential(idToken);
  
      try {
        const userCredential = await signInWithCredential(auth, credential);
        console.log("Google sign-in successful:", userCredential.user);
      } catch (error) {
        console.error("Error signing in with Google:", error);
        Alert.alert("Google Sign-In Error");
      }
    } else {
      console.error("Google Sign-In canceled or failed:", result);
      Alert.alert("Google Sign-In Failed", "Authentication was canceled or failed.");
    }
  };
  
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
        <Text style={styles.buttonText}>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  button: { padding: 10, backgroundColor: "#4285F4", borderRadius: 5 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});

export default SignInWithGoogle;
