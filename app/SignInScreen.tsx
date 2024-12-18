import React, { useState } from "react";
import { View, Alert, ImageBackground, KeyboardAvoidingView, Platform, Text } from "react-native";
import { useRouter } from "expo-router";
import { auth } from "@/firebaseConfig";
import CustomInput from "@/components/auth/CustomInput";
import AuthButton from "@/components/auth/AuthButton";
import Divider from "@/components/auth/Divider";
import RegisterToggle from "@/components/auth/RegisterToogle";
import styles from "@/components/styles/SignInStyles";

const SignInScreen: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const handleAuth = async () => {
    console.log("handleAuth trigget");
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
        const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: username });
        router.push(`/HomeScreen?username=${encodeURIComponent(username)}`);
      } else {
        const { signInWithEmailAndPassword } = await import("firebase/auth");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const displayName = user.displayName || user.email || "Bruker";
        router.push(`/HomeScreen?username=${encodeURIComponent(displayName)}`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Authentication Error", "An error occurred during authentication.");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={require('@/assets/images/index.png')}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.container}>
            <Text style={styles.title}>{isRegistering ? "Sign Up" : "Sign In"}</Text>
            {isRegistering && (
              <CustomInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                iconName="person"
              />
            )}
            <CustomInput
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              iconName="email"
            />
            <CustomInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={!showPassword}
              iconName="lock"
              showPasswordIcon={true}
              onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
            />
            {isRegistering && (
              <CustomInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                iconName="lock"
                showPasswordIcon={true}
                onTogglePasswordVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            )}
            <AuthButton
              onPress={handleAuth}
              title={isRegistering ? "REGISTER" : "LOG IN"}
            />
              <Divider />
            <RegisterToggle
              isRegistering={isRegistering}
              toggle={() => setIsRegistering(!isRegistering)}
            />
          
           
          </View>
        </ImageBackground>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SignInScreen;
