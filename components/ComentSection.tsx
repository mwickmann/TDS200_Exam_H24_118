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
  Platform,
  TouchableOpacity, 
} from "react-native";
import { useAuthSession } from "@/providers/authctx";
import * as commentApi from "@/api/commentApi";
import { fetchCommentsForPost } from "@/api/commentApi";
import { CommentData } from "@/utils/artWorkData";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

const defaultProfileImageUri = Platform.OS === 'web'
  ? require('../assets/images/default-profile.png').default
  : Image.resolveAssetSource(require('../assets/images/default-profile.png')).uri;
  
interface CommentSectionProps {
  postId: string;
  onDeleteComment?: (commentId: string) => void;
}

const CommentSection = ({ postId, onDeleteComment }: CommentSectionProps) => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<CommentData[]>([]);
  const [showAllComments, setShowAllComments] = useState(false); 
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
      const profileImage = user.profileImage 
        ? user.profileImage 
        : await fetchUserProfile(user.uid);

      const newComment: CommentData = {
        authorId: user.uid,
        authorName: user.displayName || "Anonymous",
        comment,
        id: "", 
        timestamp: Date.now(), 
        authorProfileImage: profileImage, 
      };

      const newCommentId = await commentApi.addComment(postId, newComment);
      const updatedComment = { ...newComment, id: newCommentId };
      setComments((prev) => [...prev, updatedComment]);
      setComment(""); 
      Alert.alert("Success", "Comment added!");
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Couldn't add the comment.");
    }
  };

  // Funksjon for å håndtere sletting av kommentarer
  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to delete the comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await commentApi.deleteComment(commentId, postId);
              setComments((prev) => prev.filter((comment) => comment.id !== commentId));
              Alert.alert("Suksess", "The comment was deleted.");
              if (onDeleteComment) {
                onDeleteComment(commentId);
              }
            } catch (error) {
              console.error("Error deleting comment:", error);
              Alert.alert("Something went wrong.");
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Bestem hvilke kommentarer som skal vises basert på showAllComments
  const displayedComments = showAllComments ? comments : comments.slice(0, 2);

  return (
    <View style={styles.container}>
      <View style={styles.commentSection}>
        <Text style={styles.title}>Comments:</Text>
        
        <FlatList
          data={displayedComments}
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
              {item.authorId === user?.uid && (
                <Pressable onPress={() => handleDeleteComment(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="white" style={{ marginTop: 12 }} />
                </Pressable>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.noCommentsText}>No comments yet..</Text>}
        />
        
        {/* Knapp for å vise alle kommentarer */}
        {!showAllComments && comments.length > 2 && (
          <TouchableOpacity style={styles.showAllButton} onPress={() => setShowAllComments(true)}>
            <Text style={styles.showAllText}>Show comments...</Text>
          </TouchableOpacity>
        )}

        {/* Knapp for å skjule kommentarer */}
        {showAllComments && comments.length > 2 && (
          <TouchableOpacity style={styles.showAllButton} onPress={() => setShowAllComments(false)}>
            <Text style={styles.showAllText}>Hide comments...</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Write a comment..."
            placeholderTextColor="#aaa"
            value={comment}
            onChangeText={setComment}
          />
          <Pressable style={styles.commentButton} onPress={handleCommentSubmit}>
            <Text style={styles.commentButtonText}>ADD</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#000000", 
  },
  commentSection: {
    padding: 10,
    backgroundColor: "#1c1c1c", 
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
    borderColor: "#444", 
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    color: "#fff", 
    backgroundColor: '#333',
  },
  commentButton: {
    backgroundColor: "#CBE8F4",
    borderRadius: 5,
    paddingVertical: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
  },
  commentButtonText: {
    color: "black",
    fontWeight: "bold",
    fontFamily: 'Montserrat',
    fontSize: 13,
  },
  noCommentsText: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#888",
    marginBottom: 16, 
    marginTop: 16, 
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#333", 
    borderRadius: 5,
    shadowOpacity: 0.1,
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
  showAllButton: {
    alignItems: "center",
    marginVertical: 10,
  },
  showAllText: {
    color: "#fff", // En kontrastfarge for å indikere interaktivitet
    fontStyle: 'italic',
    textAlign: "center",
    fontSize: 14,
  },
});

export default CommentSection;
