import React, { useState, useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Switch,
  Platform,
  Text,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as postApi from "@/api/postApi";
import { useRouter } from "expo-router";
import { auth } from "@/firebaseConfig";
import DatePicker from "@/components/upload/DatePicker";
import TextField from "@/components/upload/TextField";
import ImageSelector from "@/components/upload/ImageSelector";
import SwitchField from "@/components/upload/SwitchField";
import { ArtworkData } from "@/utils/artWorkData";

const ArtPostForm: React.FC = () => {
  const [titleText, setTitleText] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [hashtagText, setHashtagText] = useState("");
  const [imageURI, setImageURI] = useState("");
  const [exhibitions, setExhibitions] = useState(false);
  const [postCoordinates, setPostCoordinates] = useState<Location.LocationObjectCoords | null>(null);
  const [city, setCity] = useState<string>("");
  const [exhibitionName, setExhibitionName] = useState<string>("");
  const [exhibitionDate, setExhibitionDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(false);
  const [manualCity, setManualCity] = useState<string>("");



  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isLoading, setIsLoading] = useState(false); 
  const router = useRouter();


  const defaultProfileImageUri = Platform.OS === 'web'
    ? require('../../assets/images/default-profile.png')
    : Image.resolveAssetSource(require('../../assets/images/default-profile.png')).uri;

  useEffect(() => {
    const requestPermissions = async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraStatus !== "granted" || galleryStatus !== "granted") {
        Alert.alert("You need to give access.");
      }
      setIsLoadingPermissions(false);
    };
    requestPermissions();
  }, []);


  const handleFetchCoordinates = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("You need to give access.");
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    setPostCoordinates(location.coords);

    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        setCity(place.city || place.region || "Ukjent");
      }
    } catch (error) {
      console.error("Error fetching city name:", error);
      setCity("");
    }
  };

 const handleSubmit = async () => {
  const currentUser = auth.currentUser;

  if (!titleText || !descriptionText) {
    Alert.alert("You need to fill out all the fields.");
    return;
  }

  if (exhibitions && !exhibitionName) {
    Alert.alert("You need to fill out the exhibition.");
    return;
  }

  setIsLoading(true); 
  const artist = currentUser?.displayName ?? currentUser?.email ?? "Anonym";
  const finalCity = useCurrentLocation ? city : manualCity;

  const newPost: ArtworkData = {
    title: titleText,
    description: descriptionText,
    id: `postName-${titleText}`,
    hashtags: hashtagText,
    isLiked: false,
    isSaved: false,
    imageURL: imageURI || "",
    likes: [],
    likesCount: 0,
    saves: [],
    artist,
    comments: [],
    timestamp: Date.now(),
    createdAt: Date.now(),
    name: exhibitionName,
    userId: currentUser?.uid || "",
    commentsCount: 0,
    postCoordinates: useCurrentLocation ? postCoordinates : null,
    exhibitions,
    exhibitionDetails: exhibitions
      ? [
          {
            id: Date.now().toString(),
            name: exhibitionName,
            location: finalCity,
            date: exhibitionDate ? exhibitionDate.toDateString() : "",
            description: descriptionText, 
          },
        ]
      : null,
    savesCount: 0,
    location: undefined,
    exhibitionName: exhibitions ? exhibitionName : "",
    date: undefined,
    userProfileImage: currentUser?.photoURL || defaultProfileImageUri,
  };

    
  const resetForm = () => {
    setTitleText("");
    setDescriptionText("");
    setHashtagText("");
    setImageURI("");
    setPostCoordinates(null);
    setExhibitions(false);
    setExhibitionName("");
    setManualCity("");
    setExhibitionDate(null);
  };

  try {
    await postApi.createArtWorkPost(newPost);
    setIsLoading(false); 
    // Tømmer alle input felt etter posten er opprettet 
    resetForm(); 


    Alert.alert("Uploading successfull!"), [
      
      {
        text: "OK",
        onPress: () => {
          router.replace("/HomeScreen"); 
      
        },
      },
    ]

  } catch (error) {
    console.error("Error adding post:", error);
    setIsLoading(false);
    Alert.alert("Something went wrong, try again.");
  }
};


  if (isLoadingPermissions) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView keyboardDismissMode="interactive">
        <View style={styles.contentContainer}>
          <View style={styles.card}>
            {isLoading && (
              <ActivityIndicator size="large" color="#CBE8F4" style={styles.loadingIndicator} />
            )}
            <TextField label="Title" value={titleText} onChangeText={setTitleText} />
            <TextField label="Description" value={descriptionText} onChangeText={setDescriptionText} multiline />
            <TextField label="Hashtags" value={hashtagText} onChangeText={setHashtagText} />

            <SwitchField label="Do you have an exhibition?" value={exhibitions} onValueChange={setExhibitions} />

            {exhibitions && (
              <>
                <TextField label="Name of the exhibition" value={exhibitionName} onChangeText={setExhibitionName} />
                <SwitchField
                  label="Use current location?"
                  value={useCurrentLocation}
                  onValueChange={(value) => {
                    setUseCurrentLocation(value);
                    if (value) handleFetchCoordinates();
                  }}
                />
                {useCurrentLocation && <Text style={styles.label}>Location: {city || "Ukjent"}</Text>}
                <DatePicker
                  showDatePicker={showDatePicker}
                  setShowDatePicker={setShowDatePicker}
                  exhibitionDate={exhibitionDate}
                  setExhibitionDate={setExhibitionDate}
                />
              </>
            )}

            <ImageSelector onImageSelected={(uri) => setImageURI(uri)} />
            {imageURI ? <Image source={{ uri: imageURI }} style={styles.imagePreview} /> : null}

            <View style={styles.buttonContainer}>
              <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={isLoading}>
                <Text style={styles.buttonText}>PUBLISH</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => router.back()} disabled={isLoading}>
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
  card: {
    backgroundColor: "rgba(0.5, 0, 0, 0.5)",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 5,
    marginTop: 10,
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
    backgroundColor: "#CBE8F4",
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
    color: "black",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
  },
  cancelButtonText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingIndicator: {
    marginBottom: 20,
  },
});

export default ArtPostForm;