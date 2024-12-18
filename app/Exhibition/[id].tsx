import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import MapView, { Callout, Marker } from "react-native-maps";
import MapComponent from "@/components/MapComponent";

type ExhibitionDetail = {
  id: string;
  exhibitionName: string;
  date: string;
  artist: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  city: string;
  imageURL?: string;
};

// id siden npr bruker trykker på en id til en utstilling

const ExhibitionDetailScreen = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const { id } = params;

  const [exhibition, setExhibition] = useState<ExhibitionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExhibition = async () => {
      if (!id) {
        Alert.alert("Feil", "Ingen utstillings-ID ble funnet.");
        setIsLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "posts", id); 
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.exhibitionDetails && data.exhibitionDetails.length > 0) {
            const details = data.exhibitionDetails[0];
            setExhibition({
              id: docSnap.id,
              exhibitionName: details.name || "Unknown",
              date: details.date || "Unknown",
              artist: data.artist || "Unknown",
              description: data.description || "Unknown",
              location: {
                latitude: data.postCoordinates?.latitude || 0,
                longitude: data.postCoordinates?.longitude || 0,
              },
              city: details.location || "Unknown",
              imageURL: data.imageURL || "",
            });
          } else {
            Alert.alert("Something went wrong..");
          }
        } else {
          console.error("No such document!");
          Alert.alert("No exhibitions was found..");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        Alert.alert("Wrong fetching exhibitions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExhibition();
  }, [id]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (!exhibition) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Exhibiton not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {exhibition.imageURL && (
        <Image source={{ uri: exhibition.imageURL }} style={styles.image} />
      )}
      <Text style={styles.title}>{exhibition.exhibitionName}</Text>
      <Text style={styles.detail}>Artist: {exhibition.artist}</Text>
      <Text style={styles.detail}>Date: {exhibition.date}</Text>
      <Text style={styles.detail}>Where: {exhibition.city}</Text>
      <Text style={styles.description}>{exhibition.description}</Text>

      <View style={styles.mapContainer}>
      <MapView
  style={styles.map}
  initialRegion={{
    latitude: exhibition.location.latitude,
    longitude: exhibition.location.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  }}
>
  <Marker
    coordinate={{
      latitude: exhibition.location.latitude,
      longitude: exhibition.location.longitude,
    }}
  >
    <MapComponent location={{
              latitude: 0,
              longitude: 0
            }} filteredExhibitions={[]} googleApiKey={""}></MapComponent>
    <Callout>
      <View style={styles.additionalInfoContainer}>
        <Text style={styles.additionalTitle}>{exhibition.exhibitionName}</Text>
        <Text style={styles.additionalContent}>{exhibition.city}</Text>
      </View>
    </Callout>
  </Marker>
</MapView>

      </View>

  
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20, 
    paddingBottom: 30, 
  },
  container: {
    flex: 1,
    paddingHorizontal: 20, 
    paddingVertical: 30, 
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
    fontSize: 18,
  },
  image: {
    width: "100%",
    height: 400,
    borderRadius: 15, 
    marginBottom: 30, 
  },
  title: {
    fontSize: 26, 
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15, 
    paddingHorizontal: 5,
  },
  detail: {
    fontSize: 18,
    color: "#ccc",
    marginBottom: 10, 
    lineHeight: 24, 
    paddingHorizontal: 5, 
    fontFamily: 'QuicksandRegular',
  },
  description: {
    fontSize: 16,
    color: "#fff",
    marginTop: 20, 
    lineHeight: 22, 
    paddingHorizontal: 5, 
 
  },
  mapContainer: {
    marginTop: 30,
    height: Dimensions.get("window").height * 0.4,
    borderRadius: 15, 
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  additionalInfoContainer: {
    marginTop: 30, 
    padding: 20, 
    backgroundColor: "#1c1c1c",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2,
    shadowRadius: 4,
   
  },
  additionalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  additionalContent: {
    fontSize: 16,
    color: "#ccc",
    lineHeight: 22, 
    fontFamily: 'QuicksandRegular',
  },
});

export default ExhibitionDetailScreen;