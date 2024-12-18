import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { db } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import MapComponent from "@/components/MapComponent";
import ExhibitionList from "@/components/ExhibitionList";
import { calculateDistance } from "@/utils/locationUtils";
import Constants from 'expo-constants';

type Exhibition = {
  id: string;
  artist: string;
  exhibitionName: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  city: string;
  date: string;
};

const DiscoverScreen = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [filteredExhibitions, setFilteredExhibitions] = useState<Exhibition[]>([]);
  const [nearbyExhibitions, setNearbyExhibitions] = useState<Exhibition[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const SEARCH_RADIUS_KM = 10;

 


  // Google API KEY for å få opp MAP på WEB.
const GOOGLE_API_KEY = Constants.expoConfig?.extra?.GOOGLE_API_KEY;
useEffect(() => {
  console.log("Google API Key from DiscoverScreen:", GOOGLE_API_KEY);
}, [GOOGLE_API_KEY]);



// henter ut alle utstillinger i nærheten
  useEffect(() => {
    const fetchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const userLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        });
      } else {
        console.error("Location permission not granted");
      }
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    const fetchExhibitions = async () => {
      try {
        const exhibitionsRef = collection(db, "posts");
        const snapshot = await getDocs(exhibitionsRef);
        const fetchedExhibitions: Exhibition[] = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            if (
              data.exhibitions &&
              data.exhibitionDetails &&
              data.exhibitionDetails.length > 0 &&
              data.postCoordinates
            ) {
              const exhibitionDetail = data.exhibitionDetails[0];
              return {
                id: doc.id,
                exhibitionName: exhibitionDetail.name || "Unknown Exhibition",
                description: data.description,
                artist: data.artist || "Unknown",
                date: exhibitionDetail.date || "Unknown",
                location: {
                  latitude: data.postCoordinates.latitude,
                  longitude: data.postCoordinates.longitude,
                },
                city: exhibitionDetail.location || "Unknown",
              };
            }
            return null;
          })
          .filter((exhibition) => exhibition !== null) as Exhibition[];

        setExhibitions(fetchedExhibitions);
      } catch (error) {
        console.error("Error fetching exhibitions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExhibitions();
  }, []);

  
// henter ut søk
  useEffect(() => {
    if (location && exhibitions.length > 0) {
      const nearby = exhibitions.filter((exhibition) => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          exhibition.location.latitude,
          exhibition.location.longitude
        );
        return distance <= SEARCH_RADIUS_KM;
      });
      setNearbyExhibitions(nearby);

      if (searchText.trim() === "") {
        setFilteredExhibitions(nearby);
      }
    }
  }, [location, exhibitions, searchText]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchText, nearbyExhibitions]);

  const handleSearch = () => {
    if (searchText.trim() === "") {
      setFilteredExhibitions(nearbyExhibitions);
    } else {
      const searchLower = searchText.toLowerCase();
      const filtered = nearbyExhibitions.filter(
        (exhibition) =>
          exhibition.city.toLowerCase().includes(searchLower) ||
          exhibition.exhibitionName.toLowerCase().includes(searchLower)
      );
      setFilteredExhibitions(filtered);
    }
  };

  const handleExhibitionPress = (exhibition: Exhibition) => {
    router.push(`/Exhibition/${exhibition.id}`);
  };

  if (isLoading || !location) {
    return <ActivityIndicator size="large" color="#007BFF" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#fff" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={(text) => setSearchText(text)}
          placeholder="Search for exhibitions nearby..."
          placeholderTextColor="#888"
        />
        {searchText.length > 0 && (
          <Pressable
            onPress={() => {
              setSearchText("");
              setFilteredExhibitions(nearbyExhibitions);
            }}
          >
            <Ionicons name="close-circle" size={20} color="#888" style={styles.clearIcon} />
          </Pressable>
        )}
      </View>

      <MapComponent location={location} filteredExhibitions={filteredExhibitions} googleApiKey={""} />

      <View style={styles.nearbyContainer}>
        <Text style={styles.nearbyTitle}>Exhibitions near you:</Text>
        <Text style={styles.info}>Click on an Exhibition to see more info!</Text>
        <ExhibitionList filteredExhibitions={filteredExhibitions} onExhibitionPress={handleExhibitionPress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 10,
    marginTop: 20,
    backgroundColor: '#000',
    alignSelf: 'center',
  },
  searchIcon: {
    color: '#aaa',
    marginRight: 9,
  },
  clearIcon: {
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#fff',
    fontSize: 16,
    fontFamily: 'QuicksandRegular'
  },
  nearbyContainer: {
    flex: 2,
    padding: 10,
    backgroundColor: "#1c1c1c",
  },
  nearbyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
  },
  info: {
    fontSize: 16,
    color: '#fff',
    paddingBottom: 10,
    fontFamily: 'QuicksandRegular'
  }
});

export default DiscoverScreen;
