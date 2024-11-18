// src/components/CommentSection.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  Alert,
  StyleSheet,
  Pressable,
  Image,
} from "react-native";
import { useAuthSession } from "@/providers/authctx";
import * as commentApi from "@/api/commentApi";
import { fetchCommentsForPost } from "@/api/commentApi";
import { CommentData } from "@/utils/artWorkData";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

const defaultProfileImageUri = Image.resolveAssetSource(require('../assets/images/default-profile.png')).uri;

const CommentSection = ({ postId }: { postId: string }) => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<CommentData[]>([]);
  const { user } = useAuthSession();

  // Funksjon for å hente brukerens profilbilde fra Firestore
  const fetchUserProfile = async (userId: string): Promise<string> => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.profileImage || defaultProfileImageUri;
      } else {
        return defaultProfileImageUri;
      }
    } catch (error) {
      console.error(`Error fetching profile image for user ${userId}:`, error);
      return defaultProfileImageUri;
    }
  };

  // Funksjon for å hente kommentarer og profilbilder
  const fetchComments = async () => {
    try {
      const commentIds = await fetchCommentsForPost(postId);
      console.log("Fetched Comment IDs:", commentIds);

      if (commentIds && commentIds.length > 0) {
        const fetchedComments = await commentApi.getCommentsByIds(commentIds);
        console.log("Fetched Comments Data:", fetchedComments);

        // Hent profilbilder for alle kommentarer
        const commentsWithProfiles = await Promise.all(fetchedComments.map(async (comment) => {
          const profileImage = await fetchUserProfile(comment.authorId);
          return { ...comment, authorProfileImage: profileImage };
        }));

        setComments(commentsWithProfiles || []);
      } else {
        console.log("No comments found for this post.");
        setComments([]); 
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    }
  };

  // Funksjon for å håndtere innsending av kommentarer
  const handleCommentSubmit = async () => {
    if (!user) {
      Alert.alert("Feil", "Du må være innlogget for å kommentere.");
      return;
    }

    if (!comment.trim()) {
      Alert.alert("Feil", "Kommentarfeltet kan ikke være tomt.");
      return;
    }

    try {
      // Hent profilbildet hvis ikke tilgjengelig i user-objektet
      const profileImage = user.profileImage 
        ? user.profileImage 
        : await fetchUserProfile(user.uid);

      const newComment: CommentData = {
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        comment,
        id: "", // ID kan genereres av backend eller Firebase
        timestamp: Date.now(), // Lagre som Unix-tid
        authorProfileImage: profileImage, // Sett profilbilde
      };

      await commentApi.addComment(postId, newComment);
      setComment(""); // Tøm input-feltet
      fetchComments(); // Oppdater kommentarlisten
      Alert.alert("Suksess", "Kommentaren ble lagt til!");
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Feil", "Kunne ikke legge til kommentaren.");
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  return (
    <View style={styles.container}>
      <View style={styles.commentSection}>
        <Text style={styles.title}>Kommentarer</Text>
        
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Image
                source={{ uri: item.authorProfileImage || defaultProfileImageUri }}
                style={styles.commentProfileImage}
              />
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{item.authorName}</Text>
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
                <Text style={styles.commentText}>{item.comment}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.noCommentsText}>Ingen kommentarer ennå.</Text>}
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Skriv en kommentar..."
            placeholderTextColor="#aaa"
            value={comment}
            onChangeText={setComment}
          />
          <Pressable style={styles.commentButton} onPress={handleCommentSubmit}>
            <Text style={styles.commentButtonText}>Legg til</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  commentSection: {
    padding: 10,
    backgroundColor: "#1c1c1c", // Mørk grå/svart bakgrunnsfarge
    borderRadius: 8,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#444", // Grå kantlinje for å passe til mørk tema
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    color: "#fff", // Hvit tekst for input
    backgroundColor: '#333',
  },
  commentButton: {
    backgroundColor: "#007BFF",
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
  },
  commentButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  noCommentsText: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#888",
    marginBottom: 16, // Øker avstanden nedenfor teksten
    marginTop: 16, // Øker avstanden ovenfor teksten
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#333", // Mørkere grå for kontrast mot bakgrunnen
    borderRadius: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  commentProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  commentAuthor: {
    fontWeight: "bold",
    color: "#fff", // Gjør navnet mer synlig på mørk bakgrunn
  },
  commentTimestamp: {
    fontSize: 12,
    color: "#aaa", // Gjør tidsstempelet subtilt, men synlig
  },
  commentText: {
    fontSize: 14,
    color: "#fff", // Gjør kommentarteksten lesbar på mørk bakgrunn
  },
  container: {
    backgroundColor: "#000000", // Sort bakgrunn for hele kommentarboksen
  },
});

export default CommentSection;
