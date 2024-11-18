import React, { useState, useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  Text,
  View,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Switch,
  ImageBackground,
} from "react-native";
import * as Location from "expo-location"; 
import { ArtworkData } from "@/utils/artWorkData";
import { useAuthSession } from "@/providers/authctx";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as postApi from "@/api/postApi";
import { useRouter } from "expo-router";
import { auth } from "@/firebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";

const ArtPostForm: React.FC = () => {
  const [titleText, setTitleText] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [hashtagText, setHashtagText] = useState("");
  const [imageURI, setImageURI] = useState("");
  const [exhibitions, setExhibitions] = useState(false); // Boolean for "Har du en utstilling?"
  const [postCoordinates, setPostCoordinates] = useState<Location.LocationObjectCoords | null>(
    null
  ); // For lagring av nøyaktige koordinater
  const [city, setCity] = useState<string>(""); // Byen til plasseringen
  const [exhibitionCity, setExhibitionCity] = useState("");
  const [exhibitionDate, setExhibitionDate] = useState<Date | null>(null); // Bruker Date-objekt
  const [showDatePicker, setShowDatePicker] = useState(false); // Boolean for å vise DateTimePicker
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(false);
  const [manualCity, setManualCity] = useState<string>("");
  const [exhibitionName, setExhibitionName] = useState<string>(""); // Navnet på utstillingen

  const { userNameSession, user } = useAuthSession();
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== "granted" || galleryStatus !== "granted") {
        Alert.alert("Feil", "Tillatelse til å bruke kamera og galleri må være aktivert.");
      }
      setIsLoadingPermissions(false);
    };
    requestPermissions();
  }, []);

  const handleFetchCoordinates = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Feil", "Tillatelse til plassering er nødvendig.");
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    setPostCoordinates(location.coords); // Lagre nøyaktige koordinater for utstilling

    // Hent byens navn ved hjelp av geokoding
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        setCity(place.city || place.region || ""); // Lagre byens navn, region hvis byen ikke finnes
      }
    } catch (error) {
      console.error("Error fetching city name:", error);
      setCity(""); // Hvis geokoding feiler
    }
  };

  const compressImage = async (uri: string) => {
    try {
      const compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 700 } }],
        { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG }
      );
      return compressedImage.uri;
    } catch (error) {
      console.error("Error compressing image:", error);
      return uri;
    }
  };

  const handleImageSelection = async () => {
    const response = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!response.canceled) {
      const compressedUri = await compressImage(response.assets[0].uri);
      setImageURI(compressedUri);
    }
  };

  const handleCameraSelection = async () => {
    const response = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!response.canceled) {
      const compressedUri = await compressImage(response.assets[0].uri);
      setImageURI(compressedUri);
    }
  };

  const handleSubmit = async () => {
    const currentUser = auth.currentUser;
  
    if (!titleText || !descriptionText) {
      Alert.alert("Feil", "Tittel og beskrivelse må fylles ut.");
      return;
    }
  
    if (exhibitions && !exhibitionName) {
      Alert.alert("Feil", "Navn på utstillingen må fylles ut.");
      return;
    }
  
    const artist = userNameSession ?? currentUser?.displayName ?? currentUser?.email ?? "Anonym";
  
    // Velg by basert på om brukeren har valgt nåværende plassering eller manuell inntasting
    const finalCity = useCurrentLocation ? city : manualCity;
  
    const newPost: ArtworkData = {
      title: titleText, // Navnet på kunstverket/maleriet
      description: descriptionText,
      id: `postName-${titleText}`,
      hashtags: hashtagText,
      isLiked: false,
      isSaved: false, // Legg til dette feltet
      imageURL: imageURI || "",
      likes: [],
      likesCount: 0, // Legg til dette feltet
      saves: [], // Legg til dette feltet
      artist,
      comments: [],
      timestamp: Date.now(),
      createdAt: Date.now(), // Sett opprettelsestidspunkt
      name: exhibitionName, // Overordnet navn for posten
      userId: currentUser?.uid || "",
      commentsCount: 0,
      postCoordinates: useCurrentLocation ? postCoordinates : null,
      exhibitions,
      exhibitionDetails: exhibitions
        ? [
          {
            id: Date.now().toString(),
            name: exhibitionName, // Bruk utstillingsnavnet her
            location: finalCity,
            date: exhibitionDate ? exhibitionDate.toDateString() : "", // Konverterer dato til streng
          },
        ]
        : null,
      savesCount: 0
    };
    
  
    try {
      await postApi.createArtWorkPost(newPost);
      Alert.alert("Success", "Posten ble lagt til!", [
        {
          text: "OK",
          onPress: () => {
            router.push("/HomeScreen");
          },
        },
      ]);
  
      // Tilbakestill input-feltene
      setTitleText("");
      setDescriptionText("");
      setHashtagText("");
      setImageURI("");
      setPostCoordinates(null);
      setExhibitions(false);
      setExhibitionCity("");
      setExhibitionDate(null);
      setManualCity("");
      setExhibitionName("");
      console.log("New post created: ", newPost);

    } catch (error) {
      console.error("Error adding post:", error);
      Alert.alert("Feil", "Noe gikk galt med opplastingen.");
    }
  };
  
  const handleDateSelection = (event: any, selectedDate?: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setExhibitionDate(selectedDate);
    }
  };

  if (isLoadingPermissions) {
    return <ActivityIndicator />;
  }

  return (
    <ImageBackground
    source={require('@/assets/images/backgroundupload.png')}
    style={styles.background}
    resizeMode="cover"
  >
    <View style={styles.mainContainer}>
      <ScrollView keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
        <View style={styles.contentContainer}>
          <View style={styles.card}>
            <View style={styles.textFieldContainer}>
              <Text style={styles.label}>Tittel</Text>
              <TextInput
                onChangeText={setTitleText}
                value={titleText}
                style={styles.textfield}
                placeholder="Skriv inn tittel"
                placeholderTextColor="#888"
              />
            </View>
            <View style={styles.textFieldContainer}>
              <Text style={styles.label}>Beskrivelse</Text>
              <TextInput
                multiline
                numberOfLines={3}
                onChangeText={setDescriptionText}
                value={descriptionText}
                style={[styles.textfield, { height: 84 }]}
                placeholder="Skriv inn beskrivelse"
                placeholderTextColor="#888"
              />
            </View>
            <View style={styles.textFieldContainer}>
              <Text style={styles.label}>Hashtags</Text>
              <TextInput
                onChangeText={setHashtagText}
                value={hashtagText}
                style={styles.textfield}
                placeholder="#art #painting"
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>Har du en utstilling?</Text>
              <Switch value={exhibitions} onValueChange={setExhibitions} />
            </View>

            {exhibitions && (
              <View style={styles.textFieldContainer}>
                <View style={styles.textFieldContainer}>
                  <Text style={styles.label}>Navn på utstillingen</Text>
                  <TextInput
                    onChangeText={setExhibitionName}
                    value={exhibitionName}
                    style={styles.textfield}
                    placeholder="F.eks. Kunst for fred"
                    placeholderTextColor="#888"
                  />
                </View>
                <Text style={styles.label}>Vil du bruke din nåværende plassering?</Text>
                <Switch value={useCurrentLocation} onValueChange={setUseCurrentLocation} />

                {useCurrentLocation ? (
                  <Pressable style={styles.imageButton} onPress={handleFetchCoordinates}>
                    <Text style={styles.imageButtonText}>
                      {postCoordinates
                        ? `Plassering lagt til: ${city || "Ukjent"}`
                        : "Legg til nåværende plassering"}
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.textFieldContainer}>
                    <Text style={styles.label}>Legg inn by for utstillingen</Text>
                    <TextInput
                      onChangeText={setManualCity}
                      value={manualCity}
                      style={styles.textfield}
                      placeholder="F.eks. Oslo"
                      placeholderTextColor="#888"
                    />
                  </View>
                )}

                {/* Utstillingsdato */}
                <View style={styles.textFieldContainer}>
                  <Text style={styles.label}>Utstillingsdato</Text>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    style={[styles.textfield, { justifyContent: "center" }]}
                  >
                    <Text>
                      {exhibitionDate ? exhibitionDate.toDateString() : "Velg dato"}
                    </Text>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={exhibitionDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={handleDateSelection}
                    />
                  )}
                </View>
              </View>
            )}

            <Pressable style={styles.imageButton} onPress={handleImageSelection}>
              <Text style={styles.imageButtonText}>Velg bilde fra galleri</Text>
            </Pressable>
            <Pressable style={styles.imageButton} onPress={handleCameraSelection}>
              <Text style={styles.imageButtonText}>Ta bilde med kamera</Text>
            </Pressable>
            {imageURI ? <Image source={{ uri: imageURI }} style={styles.imagePreview} /> : null}
            <View style={styles.buttonContainer}>
              <Pressable style={styles.primaryButton} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Legg til post</Text>
              </Pressable>
              <Pressable
  style={styles.secondaryButton}
  onPress={() => router.back()}
>
  <Text style={styles.cancelButtonText}>Avbryt</Text>
</Pressable>

            </View>
          </View>
        </View>
      </ScrollView>
    </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    height: "100%",
    paddingTop: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    width: "100%",
    flexDirection: "column",
    paddingHorizontal: 20,
  },
  container: {
    margin: 1,
  },
  card: {
    backgroundColor: "rgba(0.5, 0, 0, 0.5)", // Halvtransparent bakgrunn for tekstlesbarhet
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 5,
    elevation: 3,
  },
  textFieldContainer: {
    paddingTop: 8,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Quicksand-Regular',
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
  },
  textfield: {
    borderWidth: 1,
    padding: 10,
    marginTop: 2,
    borderRadius: 5,
    borderColor: "#444",
    backgroundColor: "#333",
    color: "#ffffff",
  },
  imageButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 10,
    marginTop: 16,
    alignItems: "center",
  },
  imageButtonText: {
    color: "white",
    fontFamily: 'Montserrat-Bold',
  },
  imagePreview: {
    width: "100%",
    height: 200,
    marginTop: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    paddingTop: 32,
  },
  primaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: "#007BFF",
    flex: 1,
    marginRight: 5,
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#888",
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontFamily: 'Montserrat-Bold',
  },
  cancelButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontFamily: 'Montserrat-Bold',
  },
  background: {

  }
});

export default ArtPostForm;
