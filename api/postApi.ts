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
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { uploadImageToFirebase } from "./imageApi"; // Importer funksjonen for bildeopplasting
import { getDownloadUrl } from "@/firebaseConfig"; // Importer getDownloadUrl-funksjonen
import { Exhibition } from "@/utils/artWorkData";
import { router } from "expo-router";


export const createArtWorkPost = async (post: ArtworkData) => {
  try {
    // Last opp bildet og få nedlastings-URLen
    const firebaseImage = await uploadImageToFirebase(post.imageURL);
    if (firebaseImage === "ERROR") return;
    const postImageDownloadUrl = await getDownloadUrl(firebaseImage);

    // Lagre postdata med nedlastings-URLen
    const postWithImageData: ArtworkData = {
      ...post,
      imageURL: postImageDownloadUrl,
    };

    // Legg til innlegget i Firestore
    const docRef = await addDoc(collection(db, "posts"), postWithImageData);
    console.log("Document written with ID:", docRef.id);

    // Naviger tilbake til forrige skjerm
    router.back();
  } catch (e) {
    console.log("Error adding document:", e);
  }
};

export const getAllPosts = async (): Promise<ArtworkData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "posts"));
    const posts: ArtworkData[] = [];

    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id, // Bruk alltid Firebase-genererte IDen
        ...doc.data(),
        commentsCount: Array.isArray(doc.data().comments) ? doc.data().comments.length : 0,
      } as ArtworkData);
    });

    return posts;
  } catch (e) {
    console.error("Error getting posts:", e);
    return [];
  }
};


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
      
      

   
      const logAllDocuments = async () => {
        const querySnapshot = await getDocs(collection(db, "posts"));
        querySnapshot.forEach((doc) => {
          console.log(`Document ID: "${doc.id}"`);
        });
      };
      
      logAllDocuments();
      

      
      
      const removePostFromSavedInDatabase = async (postId: string) => {
        const userId = auth.currentUser?.uid; // Hent bruker-ID fra Firebase Auth
        if (!userId) {
          console.error("User is not logged in, cannot remove saved post.");
          return;
        }
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            savedPosts: arrayRemove(postId) 
        });
      };
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
      
      export const toggleSavePost = async (postId: string) => {
        console.log("Toggling save for post ID:", postId); // postId skal være den Firebase-genererte ID-en (f.eks. "IhnoMQifPmtEdgQwqWyX")
    
        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.error("User is not logged in, cannot toggle save.");
            return;
        }
    
        try {
            // Finn dokumentet i "posts"-samlingen basert på postId
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);
    
            if (postSnap.exists()) {
                const postData = postSnap.data();
                const savedBy = postData.savedBy || [];
    
                // Oppdater dokumentet basert på om brukeren allerede har lagret posten
                if (savedBy.includes(userId)) {
                    await updateDoc(postRef, {
                        savedBy: arrayRemove(userId),
                    });
                    console.log(`Post ${postId} removed from saved posts for user ${userId}`);
    
                    // Oppdater `savedPosts`-staten
                    setSavedPosts((prevSavedPosts) => {
                        const updatedSavedPosts = new Set(prevSavedPosts);
                        updatedSavedPosts.delete(postId);
                        return updatedSavedPosts;
                    });
                } else {
                    await updateDoc(postRef, {
                        savedBy: arrayUnion(userId),
                    });
                    console.log(`Post ${postId} saved by user ${userId}`);
    
                    // Oppdater `savedPosts`-staten
                    setSavedPosts((prevSavedPosts) => {
                        const updatedSavedPosts = new Set(prevSavedPosts);
                        updatedSavedPosts.add(postId);
                        return updatedSavedPosts;
                    });
                }
            } else {
                console.error(`Post with ID ${postId} does not exist.`);
            }
        } catch (error) {
            console.error("Error toggling save for post:", error);
        }
    };
    
      export const toggleLikePost = async (postId: string) => {
        console.log("Toggling like for post ID:", postId); // postId skal være postnavnet, f.eks. "postName-Mene"
      
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.error("User is not logged in, cannot toggle like.");
          return;
        }
      
        try {
          // Finn dokumentet i "posts"-samlingen basert på feltet "id"
          const postsRef = collection(db, "posts");
          const q = query(postsRef, where("id", "==", postId));
          const querySnapshot = await getDocs(q);
      
          if (!querySnapshot.empty) {
            const postDoc = querySnapshot.docs[0]; // Ta første resultat som matcher (forutsatt at "id" er unik)
            const postRef = postDoc.ref;
      
            // Hent eksisterende data for å oppdatere "likes" feltet
            const postData = postDoc.data();
            const likes = postData.likes || [];
      
            // Oppdater dokumentet basert på om brukeren allerede har likt posten
            if (likes.includes(userId)) {
              await updateDoc(postRef, {
                likes: arrayRemove(userId),
                likesCount: increment(-1), // Reduser antall likes med 1
              });
              console.log(`Post ${postId} unliked by user ${userId}`);
            } else {
              await updateDoc(postRef, {
                likes: arrayUnion(userId),
                likesCount: increment(1), // Øk antall likes med 1
              });
              console.log(`Post ${postId} liked by user ${userId}`);
            }
          } else {
            console.error(`Post with ID ${postId} does not exist.`);
          }
        } catch (error) {
          console.error("Error toggling like for post:", error);
        }
      };
      
      
      


      
export function fetchPosts() {
  throw new Error('Function not implemented.');
}

function setSavedPosts(arg0: (prevSavedPosts: any) => Set<unknown>) {
  throw new Error("Function not implemented.");
}


