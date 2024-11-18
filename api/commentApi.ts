// src/api/commentApi.ts

import { db } from "@/firebaseConfig";
import { CommentData } from "@/utils/artWorkData";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

/**
 * Legger til en kommentar i "comments"-samlingen og oppdaterer "posts"-dokumentet.
 * @param postId ID til posten som kommentaren skal knyttes til.
 * @param comment Kommentardata.
 * @returns ID til den nye kommentaren.
 */
export const addComment = async (postId: string, comment: CommentData): Promise<string> => {
  try {
    // Legg til kommentaren i "comments"-samlingen
    const commentRef = await addDoc(collection(db, "comments"), comment);
    console.log("Added comment with id:", commentRef.id);

    // Finn dokumentet i "posts"-samlingen basert på feltet "id"
    const q = query(collection(db, "posts"), where("id", "==", postId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const postDoc = querySnapshot.docs[0]; // Henter første dokument
      const postRef = postDoc.ref;

      // Oppdater dokumentet med den nye kommentar-ID-en
      await updateDoc(postRef, {
        comments: arrayUnion(commentRef.id),
        commentsCount: increment(1), // Øk kommentartelleren
      });

      console.log("Updated post with new comment ID:", commentRef.id);
    } else {
      console.error(`Post with ID ${postId} does not exist.`);
    }

    return commentRef.id;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

/**
 * Henter kommentar-ID-er for en spesifikk post.
 * @param postId ID til posten.
 * @returns Array med kommentar-ID-er.
 */
export const fetchCommentsForPost = async (postId: string): Promise<string[]> => {
  try {
    console.log("Searching for post with id:", postId);

    // Søk etter posten basert på feltet "id"
    const q = query(collection(db, "posts"), where("id", "==", postId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const postDoc = querySnapshot.docs[0]; // Ta første dokument som matcher
      const postData = postDoc.data();

      console.log("Post found:", postData);
      return postData.comments || []; // Returner kommentar-ID-er
    } else {
      console.error("No post found with the specified ID field.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching comments for post:", error);
    return [];
  }
};

/**
 * Henter kommentarer basert på en liste med ID-er.
 * @param ids Array med kommentar-ID-er.
 * @returns Array med `CommentData`.
 */
export const getCommentsByIds = async (ids: string[]): Promise<CommentData[]> => {
  try {
    const response = await Promise.all(
      ids.map((id) => {
        return getDoc(doc(db, "comments", id));
      })
    );

    return response.map((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          authorId: data.authorId,
          authorName: data.authorName,
          comment: data.comment,
          timestamp: data.timestamp,
          authorProfileImage: data.authorProfileImage, // Inkluderer `authorProfileImage`
        } as CommentData;
      }
      return null; // Return null hvis dokumentet ikke eksisterer
    }).filter(comment => comment !== null) as CommentData[]; // Filtrer ut nulls
  } catch (error) {
    console.log("Error getting comments", error);
    return []; // Returner tom array ved feil
  }
};

/**
 * Sletter en kommentar og oppdaterer posten den er knyttet til.
 * @param commentId ID til kommentaren som skal slettes.
 * @param postId ID til posten som kommentaren er knyttet til.
 */
export const deleteComment = async (commentId: string, postId: string) => {
  try {
    // Søk etter posten basert på feltet "id"
    const q = query(collection(db, "posts"), where("id", "==", postId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const postDoc = querySnapshot.docs[0]; // Henter første dokument
      const postRef = postDoc.ref;

      // Oppdater dokumentet ved å fjerne kommentar-ID-en
      await updateDoc(postRef, {
        comments: arrayRemove(commentId),
        commentsCount: increment(-1), // Reduser kommentartelleren
      });

      // Slett selve kommentaren fra "comments"-samlingen
      await deleteDoc(doc(db, "comments", commentId));
      console.log(`Deleted comment with id: ${commentId}`);
    } else {
      console.error(`Post with ID ${postId} does not exist.`);
    }
  } catch (error) {
    console.error("Error deleting comment: ", error);
  }
};
