import React, { ReactNode, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
  Pressable,
  ActivityIndicator,
  FlatList,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { db } from "@/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

type Exhibition = {
  date: ReactNode;
  id: string;
  artist: string;
  exhibitionName: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  city: string;
};

const DiscoverScreen = () => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [filteredExhibitions, setFilteredExhibitions] = useState<Exhibition[]>([]);
  const [nearbyExhibitions, setNearbyExhibitions] = useState<Exhibition[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const SEARCH_RADIUS_KM = 10; // Definer radius for "Utstillinger nær deg" i kilometer

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
              data.postCoordinates &&
              typeof data.postCoordinates.latitude === 'number' &&
              typeof data.postCoordinates.longitude === 'number'
            ) {
              const exhibitionDetail = data.exhibitionDetails[0];
              return {
                id: doc.id,
                exhibitionName: exhibitionDetail.name || "Ukjent utstilling",
                description: data.description,
                artist: data.artist || "Ukjent artist",
                date: exhibitionDetail.date || "Ukjent dato",
                location: {
                  latitude: data.postCoordinates.latitude,
                  longitude: data.postCoordinates.longitude,
                },
                city: exhibitionDetail.location || "Ukjent by",
              };
            }
            return null;
          })
          .filter((exhibition) => exhibition !== null) as Exhibition[];

        console.log("Fetched Exhibitions from Firebase: ", fetchedExhibitions);

        setExhibitions(fetchedExhibitions);
        // Vi setter ikke lenger filteredExhibitions her
      } catch (error) {
        console.error("Error fetching exhibitions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExhibitions();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Jordens radius i kilometer
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

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

      // Oppdater filteredExhibitions til å vise nearbyExhibitions
      if (searchText.trim() === "") {
        setFilteredExhibitions(nearby);
      }
    }
  }, [location, exhibitions, searchText]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch();
    }, 300); // 300ms debounce

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

      console.log("Filtered Exhibitions after Search: ", filtered);

      setFilteredExhibitions(filtered);
    }
  };

  const handleExhibitionPress = (exhibition: Exhibition) => {
    // Naviger til detaljside eller vis en modal
    console.log("Exhibition pressed:", exhibition);
  };

  if (isLoading || !location) {
    return <ActivityIndicator size="large" color="#007BFF" />;
  }

  const renderItem = ({ item }: { item: Exhibition }) => (
    <Pressable style={styles.listItem} onPress={() => handleExhibitionPress(item)}>
      <Text style={styles.listItemTitle}>{item.exhibitionName || "Ukjent utstilling"}</Text>
      <View style={styles.listItemRow}>
        <Ionicons name="location-outline" size={16} color="#888" style={styles.listItemIcon} />
        <Text style={styles.listItemText}>{item.city || "Ukjent by"}</Text>
      </View>
      <View style={styles.listItemRow}>
        <Ionicons name="person-outline" size={16} color="#888" style={styles.listItemIcon} />
        <Text style={styles.listItemText}>Artist: {item.artist}</Text>
      </View>
      <View style={styles.listItemRow}>
        <Ionicons name="calendar-outline" size={16} color="#888" style={styles.listItemIcon} />
        <Text style={styles.listItemText}>Dato: {item.date}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#fff" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
          }}
          placeholder="Søk etter by eller utstilling..."
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

      <View style={styles.contentContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          showsUserLocation={true}
        >
          {filteredExhibitions.map((exhibition) => (
            <Marker
              key={exhibition.id}
              coordinate={{
                latitude: exhibition.location.latitude,
                longitude: exhibition.location.longitude,
              }}
            >
              <Callout>
                <View>
                  <Text style={styles.calloutTitle}>
                    {exhibition.exhibitionName || "Ukjent utstilling"}
                  </Text>
                  <Text style={{ color: "#aaa" }}>Artist: {exhibition.artist}</Text>
                  <Text style={{ color: "#aaa" }}>Dato: {exhibition.date}</Text>
                  <Text>{exhibition.description || "Ingen beskrivelse tilgjengelig"}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        <View style={styles.nearbyContainer}>
          <Text style={styles.nearbyTitle}>Utstillinger nær deg</Text>
          <FlatList
            data={filteredExhibitions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (
              <Text style={styles.noExhibitionsText}>Ingen utstillinger funnet.</Text>
            )}
          />
        </View>
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
    width: '80%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 10,
    marginTop: 20,
    backgroundColor: '#1c1c1c',
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
  },
  contentContainer: {
    flex: 1,
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.4,
    padding: 10,
    borderRadius: 10,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: '#aaa',
  },
  nearbyContainer: {
    flex: 2,
    padding: 10,
    backgroundColor: "#1c1c1c",
    paddingBottom: 10,
  },
  nearbyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
    paddingHorizontal: 10,
    fontFamily: 'Quicksand-Bold',
  },
  listItem: {
    padding: 15,
    backgroundColor: "#2c2c2c",
    marginBottom: 10,
    borderRadius: 10,
  },
  listItemTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#ffffff",
    fontFamily: 'Quicksand-Bold',
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  listItemIcon: {
    marginRight: 5,
  },
  listItemText: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Quicksand-Regular',
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 5,
  },
  noExhibitionsText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Quicksand-Regular',
  },
});

export default DiscoverScreen;
