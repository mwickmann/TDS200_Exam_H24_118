// src/screens/ArtworkDetailScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  TouchableOpacity, // Import for clickable text
} from "react-native";
import * as commentApi from "@/api/commentApi";
import { CommentData, ArtworkData } from "@/utils/artWorkData";
import { useAuthSession } from "@/providers/authctx";
import { Ionicons } from "@expo/vector-icons";
import { getPostById } from "@/api/postApi";
import { useLocalSearchParams } from "expo-router";

const { height } = Dimensions.get("window");

const ArtworkDetailScreen = () => {
  const searchParams = useLocalSearchParams();
  const artworkId = Array.isArray(searchParams.artworkId)
    ? searchParams.artworkId[0]
    : searchParams.artworkId;

  const [artwork, setArtwork] = useState<ArtworkData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // Korrekt definert
  const [showAllComments, setShowAllComments] = useState(false); // Ny state for å vise alle kommentarer
  const { user } = useAuthSession();

  // Standard profilbilde
  const defaultProfileImageUri = Image.resolveAssetSource(require('../../assets/images/default-profile.png')).uri;

  useEffect(() => {
    if (artworkId) {
      const fetchArtwork = async () => {
        try {
          const data = await getPostById(artworkId);
          console.log('Fetched Artwork:', data); // Logg for å verifisere dataene
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

  useEffect(() => {
    if (artworkId) {
      const fetchComments = async () => {
        try {
          const commentIds = await commentApi.fetchCommentsForPost(artworkId);
          const fetchedComments = await commentApi.getCommentsByIds(commentIds);
  
          // Hent profilbilder for alle kommentarer på nytt
          const commentsWithProfiles = await Promise.all(
            fetchedComments.map(async (comment) => {
              const profileImage = comment.authorProfileImage || defaultProfileImageUri;
              return { ...comment, authorProfileImage: profileImage };
            })
          );
  
          setComments(commentsWithProfiles || []);
        } catch (error) {
          console.error("Error fetching comments:", error);
        }
      };
      fetchComments();
    }
  }, [artworkId, user?.profileImage]);
  

  useEffect(() => {
    const keyboardDidShow = () => setIsKeyboardVisible(true);
    const keyboardDidHide = () => setIsKeyboardVisible(false);

    const showListener = Keyboard.addListener("keyboardDidShow", keyboardDidShow);
    const hideListener = Keyboard.addListener("keyboardDidHide", keyboardDidHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert("Feil", "Kommentarfeltet kan ikke være tomt.");
      return;
    }

    if (!user) {
      Alert.alert("Feil", "Du må være innlogget for å legge til en kommentar.");
      return;
    }

    const commentData: CommentData = {
      id: "", // ID kan genereres av backend eller Firestore
      authorId: user.uid,
      authorName: user.displayName || "Anonymous",
      comment: newComment,
      timestamp: Date.now(), // Lagre som Unix-tid
      authorProfileImage: user.profileImage || defaultProfileImageUri, // Sett profilbilde hvis tilgjengelig
    };

    try {
      const newCommentId = await commentApi.addComment(artworkId as string, commentData);

      // Oppdater kommentarens ID
      const updatedComment = { ...commentData, id: newCommentId };
      setComments((prev) => [...prev, updatedComment]);

      setNewComment("");
      Keyboard.dismiss();
      Alert.alert("Suksess", "Kommentaren ble lagt til.");
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Feil", "Kunne ikke legge til kommentaren.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      "Bekreft sletting",
      "Er du sikker på at du vil slette denne kommentaren?",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Slett",
          style: "destructive",
          onPress: async () => {
            try {
              await commentApi.deleteComment(commentId, artworkId as string);
              setComments((prev) => prev.filter((comment) => comment.id !== commentId));
              Alert.alert("Suksess", "Kommentaren ble slettet.");
            } catch (error) {
              console.error("Error deleting comment:", error);
              Alert.alert("Feil", "Kunne ikke slette kommentaren.");
            }
          },
        },
      ]
    );
  };

  const renderComment = ({ item }: { item: CommentData }) => (
    <View style={styles.commentItem}>
      <Image
        source={{ uri: item.authorProfileImage || defaultProfileImageUri }}
        style={styles.commentProfileImage}
      />
      <View style={styles.commentTextContainer}>
        <Text style={styles.commentAuthor}>{item.authorName}</Text>
        <Text style={styles.commentText}>{item.comment}</Text>
        {item.timestamp ? (
          <Text style={styles.commentTimestamp}>
            {new Date(item.timestamp).toLocaleDateString("no-NO", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </Text>
        ) : (
          <Text style={styles.commentTimestamp}>Ukjent dato</Text>
        )}
      </View>
      {item.authorId === user?.uid && (
        <Pressable onPress={() => handleDeleteComment(item.id)}>
          <Ionicons name="trash-outline" size={20} color="white"style={{ marginTop: 12 }} />
        </Pressable>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // Bestem hvilke kommentarer som skal vises basert på showAllComments
  const displayedComments = showAllComments ? comments : comments.slice(0, 2);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#121212" }} // Mørk bakgrunn
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 80}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            {artwork ? (
              <>
                <Image source={{ uri: artwork.imageURL }} style={styles.image} />
                <Text style={styles.title}>{artwork.title}</Text>
                <Text style={styles.description}>{artwork.description}</Text>
                <Text style={styles.artist}>Artist: {artwork.artist}</Text>

                <View style={styles.commentSection}>
                  <Text style={styles.commentTitle}>Kommentarer</Text>

                  <FlatList
                    style={styles.commentList}
                    data={displayedComments}
                    renderItem={renderComment}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={<Text style={styles.noCommentsText}>Ingen kommentarer ennå.</Text>}
                    scrollEnabled={showAllComments} // Aktiver scrolling kun når alle kommentarer vises
                  />

                  {/* Italic Text for "Vis alle kommentarer..." */}
                  {!showAllComments && comments.length > 2 && (
                    <TouchableOpacity onPress={() => setShowAllComments(true)}>
                      <Text style={styles.showAllText}>Vis alle kommentarer...</Text>
                    </TouchableOpacity>
                  )}

                  {/* Optional: Allow hiding comments again */}
                  {showAllComments && comments.length > 2 && (
                    <TouchableOpacity onPress={() => setShowAllComments(false)}>
                      <Text style={styles.showAllText}>Skjul kommentarer</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Skriv en kommentar..."
                      placeholderTextColor="#aaa"
                      value={newComment}
                      onChangeText={setNewComment}
                    />
                    <Pressable style={styles.addButton} onPress={handleAddComment}>
                      <Text style={styles.addButtonText}>Legg til</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.errorText}>Kunne ikke hente kunstverket.</Text>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default ArtworkDetailScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#121212", // Mørk bakgrunn for hele skjermen
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212", // Mørk bakgrunn under lasting
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
    color: "#ffffff", // Hvit tekst
  },
  description: {
    fontSize: 16,
    marginBottom: 8,
    color: "#dddddd", // Lysere grå tekst
  },
  artist: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 16,
    color: "#bbbbbb", // Lysere grå tekst
  },
  commentSection: {
    flex: 1,
    backgroundColor: "#1e1e1e", // Litt lysere mørk bakgrunn for kommentarseksjonen
    padding: 10,
    borderRadius: 8,
  },
  commentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#ffffff", // Hvit tekst
  },
  commentList: {
    // Fjernet fast høyde for å la FlatList tilpasse seg
    marginBottom: 10,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333333", // Mørkere grå linje
  },
  commentProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    marginTop: 5,
  },
  commentTextContainer: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: "bold",
    color: "#ffffff", // Hvit tekst
  },
  commentTimestamp: {
    fontSize: 12,
    color: "#aaaaaa", // Lys grå tekst
    marginTop: 4,
  },
  commentText: {
    fontSize: 14,
    color: "#dddddd", // Lys grå tekst
  },
  noCommentsText: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#888888", // Lys grå tekst
    marginTop: 20,
  },
  addButton: {
    backgroundColor: "#1f80e0", // Mørkere blå farge
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  addButtonText: {
    color: "#ffffff", // Hvit tekst
    fontWeight: "bold",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#444444", // Mørkere grå kant
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    color: "#ffffff", // Hvit tekst
    backgroundColor: "#2a2a2a", // Mørkere bakgrunn
  },
  showAllText: {
    color: "#fff", // Samme farge som knappen for konsistens
    fontStyle: "italic",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});
