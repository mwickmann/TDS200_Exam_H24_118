// SignInScreen.tsx

import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, ImageBackground, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { signIn, signUp } from "@/api/authApi";
import { auth } from "@/firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import SignInWithGoogle from "../providers/GoogleSignIn"; // Importer komponenten


const SignInScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState(""); // State for username
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    try {
      if (!email || !password || (isRegistering && (!username || !confirmPassword))) {
        Alert.alert("Input Error", "Please fill in all required fields.");
        return;
      }
  
      if (isRegistering && password !== confirmPassword) {
        Alert.alert("Password Mismatch", "Passwords do not match.");
        return;
      }
  
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: username });
        console.log("User profile updated:", JSON.stringify(auth.currentUser, null, 2));
        router.push(`/HomeScreen?username=${encodeURIComponent(username)}`);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("User signed in:", JSON.stringify(user, null, 2));
        const displayName = user.displayName || user.email || "Bruker";
        router.push(`/HomeScreen?username=${encodeURIComponent(displayName)}`);
      }
    } catch (error) {
      console.error("Error during authentication:", error);
      Alert.alert("Authentication Error" || "An error occurred during authentication.");
    }
  };
  
  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('@/assets/images/index.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <Text style={styles.title}>{isRegistering ? "Sign Up" : "Sign In"}</Text>
          {isRegistering && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
            />
          </View>

          {isRegistering && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
              />
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleAuth}>
            <Text style={styles.buttonText}>{isRegistering ? "REGISTER" : "LOG IN"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.buttonText}>
              {isRegistering ? "ALREADY HAVE AN ACCOUNT?" : "NEW USER? REGISTER"}
            </Text>
          </TouchableOpacity>

    
          <SignInWithGoogle />

        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: '80%', // Set width to 90% of the screen
    padding: 20,
    backgroundColor: "rgba(30, 30, 30, 0.8)", // Semi-transparent mørkegrå bakgrunn

    borderRadius: 20,
    elevation: 5, // Adds shadow for Android
    shadowColor: '#000', // Adds shadow for iOS
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignItems: 'center', // Center the content
    marginTop: 80,
  },
  title: {
    fontSize: 32, // Adjust font size as needed
    fontWeight: 'bold',
    marginBottom: 20, // Space between title and input fields
    textAlign: 'center', // Center the title
    color: '#FFFFFF',
    fontFamily: 'Quicksand-Regular',
  },
  input: {
    width: "98%",
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#FFF",
    borderRadius: 10,
    color: "#FFF",
    fontFamily: 'Quicksand-Regular',
  },
  errorText: {
    color: "red",
    marginVertical: 10,
  },
  forgotPassword: {
    color: "#000",
    marginVertical: 10,
    textAlign: "center", // Center the text
    fontFamily: 'Montsserat-Bold',
  },
  button: {
    backgroundColor: '#CBE8F4', // Softer blue color
    padding: 18,
    borderRadius: 10,
    width: '98%',
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: '#000000', // Button text color
    fontSize: 12,
    fontFamily: 'Montserrat-Bold',
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 5,
    fontFamily: 'Quicksand-Light'
  },

});


export default SignInScreen;

