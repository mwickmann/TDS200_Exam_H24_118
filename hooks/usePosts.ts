import { useState, useEffect } from 'react';
import { db } from '@/firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import * as postApi from '@/api/postApi';
import { ArtworkData } from '@/utils/artWorkData';

const usePosts = () => {
  const [artworks, setArtworks] = useState<ArtworkData[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  const auth = getAuth();

  // Håndter brukerens autentiseringsstatus
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        fetchUserLikedAndSavedPosts(currentUser.uid);
      } else {
        setUserId(null);
        setLikedPosts(new Set());
        setSavedPosts(new Set());
      }
    });
    return () => unsubscribe();
  }, [auth]);

  // Hent brukerens likte og lagrede innlegg
  const fetchUserLikedAndSavedPosts = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userLikedPosts = userData.likedPosts || [];
        const userSavedPosts = userData.savedPosts || [];

        setLikedPosts(new Set(userLikedPosts));
        setSavedPosts(new Set(userSavedPosts));
      } else {
        console.error("No user document found for the given userId.");
      }
    } catch (error) {
      console.error("Error fetching user liked/saved posts:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const posts = await postApi.getAllPosts(); 
      setArtworks(posts); // Oppdater state med innleggene
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };
  

  // Toggle like på et innlegg
  const toggleLike = async (postId: string) => {
    try {
      const updatedSuccessfully = await postApi.toggleLikePost(postId);
      if (updatedSuccessfully) {
        setLikedPosts((prev) => {
          const updated = new Set(prev);
          if (updated.has(postId)) {
            updated.delete(postId);
          } else {
            updated.add(postId);
          }
          return updated;
        });

        // Oppdater artworks for å reflektere like-status
        setArtworks((prevArtworks) =>
          prevArtworks.map((artwork) =>
            artwork.id === postId
              ? { ...artwork, isLiked: !artwork.isLiked, likesCount: artwork.isLiked ? artwork.likesCount - 1 : artwork.likesCount + 1 }
              : artwork
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like for post:", error);
    }
  };

  // Toggle save på et innlegg
  const toggleSave = async (postId: string) => {
    try {
      const updatedSuccessfully = await postApi.toggleSavePost(postId);
      if (updatedSuccessfully) {
        setSavedPosts((prev) => {
          const updated = new Set(prev);
          if (updated.has(postId)) {
            updated.delete(postId);
          } else {
            updated.add(postId);
          }
          return updated;
        });

        // Oppdater artworks for å reflektere save-status
        setArtworks((prevArtworks) =>
          prevArtworks.map((artwork) =>
            artwork.id === postId
              ? { ...artwork, isSaved: !artwork.isSaved, savesCount: artwork.isSaved ? artwork.savesCount - 1 : artwork.savesCount + 1 }
              : artwork
          )
        );
      }
    } catch (error) {
      console.error("Error toggling save for post:", error);
    }
  };

  return {
    artworks,
    likedPosts,
    savedPosts,
    fetchPosts,
    toggleLike,
    toggleSave,
  };
};

export default usePosts;