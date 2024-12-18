import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from '../providers/ThemeSessionProvider'; 

const GetStarted = () => {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
   <ImageBackground
    source={require('@/assets/images/index.png')}
    style={styles.background}
    resizeMode="cover"
  >
    <View style={styles.overlay}>
     
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Welcome to ArtVista</Text>
        <Text style={styles.subtitle}>
        Explore art in a whole new way. Discover exhibitions, favorite artworks, and much more!
        </Text>
      </View>

     
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/SignInScreen")}
      >
        <Text style={styles.buttonText}>GET STARTED</Text>
      </TouchableOpacity>
    </View>
  </ImageBackground>
);
};


export default GetStarted;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0.5, 0, 0, 0.5)", 
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'QuicksandRegular',
    color: "#ddd",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#CBE8F4",
    paddingVertical: 18,        
    paddingHorizontal: 80,      
    borderRadius: 10,   
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
    borderColor: "#000000",
    borderWidth: 1,
    
  },
  buttonText: {
    fontSize: 12,
    color: "#000000",
    fontWeight: "bold",
    fontFamily: 'Montserrat',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: -120,    
    marginBottom: 250, 
  },
});
