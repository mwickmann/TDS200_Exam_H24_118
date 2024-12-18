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



// Legger til kommentar i firebase
export const addComment = async (postId: string, comment: CommentData): Promise<string> => {
  try {
 
    const commentRef = await addDoc(collection(db, "comments"), comment);
    console.log("Added comment with id:", commentRef.id);

  
    const q = query(collection(db, "posts"), where("id", "==", postId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const postDoc = querySnapshot.docs[0]; 
      const postRef = postDoc.ref;

    
      await updateDoc(postRef, {
        comments: arrayUnion(commentRef.id),
        commentsCount: increment(1), 
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

// Henter ut kommentarer
export const fetchCommentsForPost = async (postId: string): Promise<string[]> => {
  try {
    console.log("Searching for post with id:", postId);

    const q = query(collection(db, "posts"), where("id", "==", postId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const postDoc = querySnapshot.docs[0]; 
      const postData = postDoc.data();

      console.log("Post found:", postData);
      return postData.comments || []; 
    } else {
      console.error("No post found with the specified ID field.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching comments for post:", error);
    return [];
  }
};


// Henter ut kommentarer by ID
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
          authorProfileImage: data.authorProfileImage, 
        } as CommentData;
      }
      return null; 
    }).filter(comment => comment !== null) as CommentData[]; 
  } catch (error) {
    console.log("Error getting comments", error);
    return []; 
  }
};


// Sleter enkelte kommentarer om bruker ønsker, blir oppdatert i firebase
export const deleteComment = async (commentId: string, postId: string) => {
  try {
    const q = query(collection(db, "posts"), where("id", "==", postId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const postDoc = querySnapshot.docs[0]; 
      const postRef = postDoc.ref;

   
      await updateDoc(postRef, {
        comments: arrayRemove(commentId),
        commentsCount: increment(-1), 
      });

      await deleteDoc(doc(db, "comments", commentId));
      console.log(`Deleted comment with id: ${commentId}`);
    } else {
      console.error(`Post with ID ${postId} does not exist.`);
    }
  } catch (error) {
    console.error("Error deleting comment: ", error);
  }
};
