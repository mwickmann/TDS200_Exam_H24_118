import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { useAuthSession } from "@/providers/authctx";
import { getPostById } from "@/api/postApi";
import { useLocalSearchParams } from "expo-router";
import { ArtworkData } from "@/utils/artWorkData";
import CommentSection from "@/components/ComentSection";
import Ionicons from "react-native-vector-icons/Ionicons";


const ArtworkDetailScreen = () => {
  const searchParams = useLocalSearchParams();
  const artworkId = Array.isArray(searchParams.artworkId)
    ? searchParams.artworkId[0]
    : searchParams.artworkId;

  const [artwork, setArtwork] = useState<ArtworkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthSession();

  useEffect(() => {
    if (artworkId) {
      const fetchArtwork = async () => {
        try {
          const data = await getPostById(artworkId);
          setArtwork(data || null);
        } catch (error) {
          console.error("Error fetching artwork:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchArtwork();
    }
  }, [artworkId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!artwork) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Couldnt fetch the artwork.</Text>
      </View>
    );
  }

  const content = [
    {
      key: "artworkDetails",
      render: () => (
        <View style={styles.artworkContainer}>
          <Image source={{ uri: artwork.imageURL }} style={styles.image} />
          <Text style={styles.title}>{artwork.title}</Text>
          <Text style={styles.description}>{artwork.description}</Text>
          <Text style={styles.artist}>Artist: {artwork.artist}</Text>
          {artwork.exhibitionDetails && artwork.exhibitionDetails.length > 0 ? (
  <View style={styles.exhibitionContainer}>
    <Text style={styles.info}>{artwork.artist} have an upcoming Exhibition:</Text>
    <View style={styles.exhibitionRow}>
      <Ionicons name="location-outline" size={16} color="#888" style={styles.icon} />
      <Text style={styles.exhibitionText}>
        {artwork.exhibitionDetails?.[0]?.location || "Unknown"}
      </Text>
    </View>
    <View style={styles.exhibitionRow}>
      <Ionicons name="person-outline" size={16} color="#888" style={styles.icon} />
      <Text style={styles.exhibitionText}>
        Artist: {artwork.artist || "Unknown"}
      </Text>
    </View>
    <View style={styles.exhibitionRow}>
      <Ionicons name="calendar-outline" size={16} color="#888" style={styles.icon} />
      <Text style={styles.exhibitionText}>
        Date: {artwork.exhibitionDetails?.[0]?.date || "Unknown"}
      </Text>
    </View>
  </View>
) : (
  <Text style={styles.noExhibitionText}>No exhibition details found.</Text>
)}

        </View>
      ),
    },
    {
      key: "comments",
      render: () => <CommentSection postId={artworkId || ""} />,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#121212" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 80}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <FlatList
          data={content}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => item.render()}
          contentContainerStyle={styles.contentContainer}
        />
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default ArtworkDetailScreen;

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    backgroundColor: "#121212",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  errorText: {
    fontSize: 18,
    color: "red",
  },
  artworkContainer: {
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: 400,
    marginBottom: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#ffffff",
  },
  description: {
    fontSize: 16,
    marginBottom: 8,
    color: "#dddddd",
  },
  artist: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 16,
    color: "#bbbbbb",
  },
  exhibitionContainer: {
    marginVertical: 16,
    padding: 20,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
      shadowColor: "#000", 
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
  },
  exhibitionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff", 
    marginBottom: 10, 
  },
  exhibitionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8, 
  },
  icon: {
    marginRight: 8, 
  },
  exhibitionText: {
    fontSize: 14,
    color: "#cccccc", 
    fontFamily: 'QuicksandRegular',
  },
  noExhibitionText: {
    fontSize: 14,
    color: "#888888",
    fontStyle: "italic",
  },
  info: {
    fontSize: 14,
    color: '#fff',
    paddingBottom: 10,
    fontStyle: 'italic',

  }
});
