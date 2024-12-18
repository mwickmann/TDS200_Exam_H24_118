import { auth, db } from "@/firebaseConfig";
import { ArtworkData } from "@/utils/artWorkData";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { uploadImageToFirebase } from "./imageApi"; 
import { getDownloadUrl } from "@/firebaseConfig"; 
import { Exhibition } from "@/utils/artWorkData";
import { router } from "expo-router";



// Laster opp nytt innlegg til firebase
export const createArtWorkPost = async (post: ArtworkData) => {
  try {
    const firebaseImage = await uploadImageToFirebase(post.imageURL);
    if (firebaseImage === "ERROR") return;
    const postImageDownloadUrl = await getDownloadUrl(firebaseImage);

    const postWithImageData: ArtworkData = {
      ...post,
      imageURL: postImageDownloadUrl,
      location: post.location ?? null,
      date: post.date ?? null,
      exhibitionDetails: post.exhibitionDetails ?? null,
      userProfileImage: post.userProfileImage ?? null
    };

    // Legger til innlegget i Firestore
    const docRef = await addDoc(collection(db, "posts"), postWithImageData);
    console.log("Document written with ID:", docRef.id);

  } catch (e) {
    console.log("Error adding document:", e);
  }
};


// Henter alle innlegg fra Firestore, sortert etter nyeste først
export const getAllPosts = async (): Promise<ArtworkData[]> => {
  try {
    // Bruker query med sortering basert på timestamp i synkende rekkefølge
    const postsQuery = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(postsQuery);

    const posts: ArtworkData[] = [];

    for (const docSnap of querySnapshot.docs) {
      const postData = docSnap.data();
      let userProfileImage = null;

      // Hent profilbilde for bruker 
      if (postData.userId) {
        try {
          const userDocRef = doc(db, "users", postData.userId);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            userProfileImage = userData.profileImage || null;
          }
        } catch (error) {
          console.error(`Error fetching profile image for userId: ${postData.userId}`, error);
        }
      }

      posts.push({
        id: docSnap.id,
        ...postData,
        commentsCount: Array.isArray(postData.comments) ? postData.comments.length : 0,
        userProfileImage,
      } as ArtworkData);
    }

    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
};


// Henter post utifra ID fra firebase
  export const getPostById = async (artworkId: string): Promise<ArtworkData | null> => {
        try {
          console.log("Searching for artwork with id:", artworkId);
          const q = query(collection(db, "posts"), where("id", "==", artworkId)); // Søk basert på feltet "id"
          const querySnapshot = await getDocs(q);
      
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0]; // Ta første resultat (dersom unik `id`)
            console.log("Artwork found:", doc.data());
            return { id: doc.id, ...doc.data() } as ArtworkData;
          } else {
            console.error("No document with the specified ID field found.");
            return null;
          }
        } catch (error) {
          console.error("Error searching for artwork by id:", error);
          return null;
        }
      };

      
      // Henter posts utifra Kunstner
      export const getPostsByArtist = async (artistName: string): Promise<ArtworkData[]> => {
        try {
          console.log("Fetching posts for artist:", artistName);
      
          const q = query(collection(db, "posts"), where("artist", "==", artistName));
          const querySnapshot = await getDocs(q);
      
          const posts: ArtworkData[] = [];
          querySnapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() } as ArtworkData);
          });
      
          console.log("Fetched posts:", posts);
          return posts;
        } catch (error) {
          console.error("Error fetching posts by artist:", error);
          return [];
        }
      };

   // Henter posts utifra utstillings-ID
      export const fetchExhibitionsByIds = async (ids: string[]): Promise<Exhibition[]> => {
        try {
          const exhibitions = await Promise.all(
            ids.map(async (id) => {
              const exhibitionDoc = await getDoc(doc(db, "exhibitions", id));
              if (exhibitionDoc.exists()) {
                return { id: exhibitionDoc.id, ...exhibitionDoc.data() } as Exhibition;
              }
              return null;
            })
          );
      
          return exhibitions.filter((exhibition) => exhibition !== null) as Exhibition[];
        } catch (error) {
          console.error("Error fetching exhibitions:", error);
          return [];
        }
      };


      // Bruker lagrer og fjerner lagret (en pos)t i firebase
      export const toggleSavePost = async (postId: string): Promise<boolean> => {
        console.log("Toggling save for post ID:", postId);
      
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.error("User is not logged in, cannot toggle save.");
          return false;
        }
      
        try {
          const postsRef = collection(db, "posts");
          const q = query(postsRef, where("id", "==", postId));
          const querySnapshot = await getDocs(q);
      
          if (!querySnapshot.empty) {
            const postDoc = querySnapshot.docs[0];
            const postRef = postDoc.ref;
      
            const postData = postDoc.data();
            const savedBy: string[] = postData.savedBy || [];
      
            const userRef = doc(db, "users", userId);
      
            if (savedBy.includes(userId)) {
              await updateDoc(postRef, {
                savedBy: arrayRemove(userId),
                savesCount: increment(-1), 
              });
            
      
              await updateDoc(userRef, {
                savedPosts: arrayRemove(postId),
              });
             
            } else {
              
              await updateDoc(postRef, {
                savedBy: arrayUnion(userId),
                savesCount: increment(1), 
              });
         
             
              await updateDoc(userRef, {
                savedPosts: arrayUnion(postId),
              });
      
            }
            return true; 
          } else {
          
            return false;
          }
        } catch (error) {
       
          return false;
        }
      };

      // Bruker liker og fjerner en like fra en post
      export const toggleLikePost = async (postId: string): Promise<boolean> => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.error("User is not logged in, cannot toggle like.");
          return false;
        }
      
        try {
          const postsRef = collection(db, "posts");
          const q = query(postsRef, where("id", "==", postId));
          const querySnapshot = await getDocs(q);
      
          if (!querySnapshot.empty) {
            const postDoc = querySnapshot.docs[0];
            const postRef = postDoc.ref;
      
            const postData = postDoc.data();
            const likes: string[] = postData.likes || [];
      
            const userRef = doc(db, "users", userId);
            
            if (likes.includes(userId)) {
              await updateDoc(postRef, {
                likes: arrayRemove(userId),
                likesCount: increment(-1),
              });      
             
              await updateDoc(userRef, {
                likedPosts: arrayRemove(postId),
              });
            } else {
              await updateDoc(postRef, {
                likes: arrayUnion(userId),
                likesCount: increment(1),
              });
              console.log(`Post ${postId} liked by user ${userId}`);
      
              await updateDoc(userRef, {
                likedPosts: arrayUnion(postId),
              });
            }
            return true; 
          } else {
            return false;
          }
        } catch (error) {
          return false;
        }
      };
      