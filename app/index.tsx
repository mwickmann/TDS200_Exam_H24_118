import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from '../providers/ThemeSessionProvider'; // Importer useTheme fra ThemeProvider

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
    backgroundColor: "rgba(0.5, 0, 0, 0.5)", // Halvtransparent bakgrunn for tekstlesbarhet
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontFamily: 'Quicksand-Regular',
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Quicksand-Regular',
    color: "#ddd",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#CBE8F4", // Endret farge til en finere grønn
    paddingVertical: 18,        // Økt vertikal padding for å gjøre knappen større
    paddingHorizontal: 80,      // Økt horisontal padding for å gjøre knappen større
    borderRadius: 10,            // Redusert borderRadius for å gjøre knappen mer firkantet
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
    fontFamily: 'Montserrat-Bold',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: -120,    // Juster denne verdien for å flytte tittel og undertittel opp eller ned
    marginBottom: 250, // Juster for å kontrollere avstand til knappen
  },
});
