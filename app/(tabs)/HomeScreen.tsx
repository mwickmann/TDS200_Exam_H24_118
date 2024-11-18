import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, TextInput } from 'react-native';
import * as postApi from "@/api/postApi";
import { ArtworkData } from '@/utils/artWorkData';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '@/firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, collection, where, query, getDocs, increment } from 'firebase/firestore';
import CommentSection from '@/components/ComentSection';

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string, params?: object) => void;
  };
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [artworks, setArtworks] = useState<ArtworkData[]>([]);
  const [filteredArtworks, setFilteredArtworks] = useState<ArtworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const router = useRouter();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.displayName) {
      setUserName(currentUser.displayName);
    } else {
      setUserName("Bruker");
    }
    console.log('Current User:', currentUser);
  }, [auth]);

  useEffect(() => {
    console.log("Username:", userName);
  }, [userName]);

  useEffect(() => {
    if (!userId) {
      // Vent til `userId` er tilgjengelig
      return;
    }
  
    const fetchUserLikedAndSavedPosts = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const userLikedPosts = userData.likedPosts || [];
          const userSavedPosts = userData.savedPosts || [];

          // Oppdater `likedPosts` og `savedPosts` med data fra Firebase
          setLikedPosts(new Set(userLikedPosts));
          setSavedPosts(new Set(userSavedPosts));
        } else {
          console.error("No user document found for the given userId.");
        }
      } catch (error) {
        console.error("Error fetching user liked/saved posts:", error);
      }
    };

    fetchUserLikedAndSavedPosts();
    getPostsFromBackend(); // Hent postene fra backend etter at `userId` er tilgjengelig
  }, [userId]);
  

  const getPostsFromBackend = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const posts = await postApi.getAllPosts();
      console.log('Fetched posts:', posts);

      const updatedPosts = posts.map(post => ({
        ...post,
        likesCount: post.likesCount || 0,
        savesCount: post.savesCount || 0,
      }));

      const sortedPosts = updatedPosts.sort((a, b) => {
        const timestampA = a.timestamp ? Number(a.timestamp) : 0;
        const timestampB = b.timestamp ? Number(b.timestamp) : 0;
        return timestampB - timestampA;
      });

      setArtworks(sortedPosts);
      setFilteredArtworks(sortedPosts);
      setError(null);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Could not load posts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCommentToggle = (postId: string) => {
    console.log('Toggling comments for post ID:', postId); // Feilsøking
    if (selectedPostId === postId) {
      setSelectedPostId(null);
    } else {
      setSelectedPostId(postId);
    }
  };

  const handleToggleSavePost = async (postId: string) => {
    console.log('Toggling save for post ID:', postId);
  
    try {
      // Utfør den asynkrone lagringsoperasjonen i Firebase
      const updatedSuccessfully = await toggleSavePost(postId);
  
      if (updatedSuccessfully) {
        // Oppdater `savedPosts`-staten umiddelbart etter suksessfull oppdatering
        setSavedPosts((prevSavedPosts) => {
          const updatedSavedPosts = new Set(prevSavedPosts);
          if (updatedSavedPosts.has(postId)) {
            updatedSavedPosts.delete(postId);
          } else {
            updatedSavedPosts.add(postId);
          }
          return updatedSavedPosts;
        });
      }
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };
  
  const handleToggleLikePost = async (postId: string) => {
    console.log('Toggling like for post ID:', postId);
  
    try {
      // Utfør den asynkrone like-operasjonen i Firebase
      const updatedSuccessfully = await toggleLikePost(postId);
  
      if (updatedSuccessfully) {
        // Oppdater `likedPosts`-staten umiddelbart etter suksessfull oppdatering
        setLikedPosts((prevLikedPosts) => {
          const updatedLikedPosts = new Set(prevLikedPosts);
          if (updatedLikedPosts.has(postId)) {
            updatedLikedPosts.delete(postId);
          } else {
            updatedLikedPosts.add(postId);
          }
          return updatedLikedPosts;
        });
  
        // Oppdater `artworks` med riktig `likesCount`
        setArtworks((prevArtworks) => {
          return prevArtworks.map((artwork) => {
            if (artwork.id === postId) {
              return {
                ...artwork,
                isLiked: !artwork.isLiked,
                likesCount: artwork.isLiked ? artwork.likesCount - 1 : artwork.likesCount + 1,
              };
            }
            return artwork;
          });
        });
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };
  
  const toggleSavePost = async (postId: string): Promise<boolean> => {
    console.log("Toggling save for post ID:", postId); // postId skal være postnavnet, f.eks. "postName-Mene"
  
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
        const savedBy = postData.savedBy || [];
  
        if (savedBy.includes(userId)) {
          await updateDoc(postRef, {
            savedBy: arrayRemove(userId),
            savesCount: increment(-1), // Reduser antallet saves med 1
          });
          console.log(`Post ${postId} removed from saved posts for user ${userId}`);
        } else {
          await updateDoc(postRef, {
            savedBy: arrayUnion(userId),
            savesCount: increment(1), // Øk antallet saves med 1
          });
          console.log(`Post ${postId} saved by user ${userId}`);
        }
        return true; // Returnerer true hvis oppdateringen var vellykket
      } else {
        console.error(`Post with ID ${postId} does not exist.`);
        return false;
      }
    } catch (error) {
      console.error("Error toggling save for post:", error);
      return false;
    }
  };
  
  const toggleLikePost = async (postId: string): Promise<boolean> => {
    console.log("Toggling like for post ID:", postId);
  
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
        const likes = postData.likes || [];
  
        if (likes.includes(userId)) {
          // Fjern brukerens ID fra likes
          await updateDoc(postRef, {
            likes: arrayRemove(userId),
            likesCount: increment(-1),
          });
          console.log(`Post ${postId} unliked by user ${userId}`);
        } else {
          // Legg til brukerens ID i likes
          await updateDoc(postRef, {
            likes: arrayUnion(userId),
            likesCount: increment(1),
          });
          console.log(`Post ${postId} liked by user ${userId}`);
        }
        return true; // Returner true hvis oppdateringen var vellykket
      } else {
        console.error(`Post with ID ${postId} does not exist.`);
        return false;
      }
    } catch (error) {
      console.error("Error toggling like for post:", error);
      return false;
    }
  };
  

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    const lowerCaseQuery = query.toLowerCase();
    const filtered = artworks.filter((artwork) => {
      return ['artist', 'title'].some((field) => {
        const value = artwork[field as keyof ArtworkData];
        return value && typeof value === 'string' && value.toLowerCase().includes(lowerCaseQuery);
      }) ||
        (Array.isArray(artwork.hashtags) &&
          artwork.hashtags.some((hashtag: string) =>
            hashtag.toLowerCase().includes(lowerCaseQuery)
          ));
    });

    console.log("Filtered Artworks:", filtered);
    setFilteredArtworks(filtered);
  };

  const renderArtworkItem = ({ item }: { item: ArtworkData }) => (
    <TouchableOpacity
      style={styles.artworkContainer}
      onPress={() => {
        if (item.id) {
          router.push(`/ArtWorkDetail/${item.id}`);
        } else {
          console.error("Post ID mangler, kan ikke navigere til detaljer");
        }
        
      }}
    >
      <Image source={{ uri: item.imageURL }} style={styles.artworkImage} />
      <Text style={styles.artworkTitle}>{item.title}</Text>
      <Text style={styles.artworkDescription}>{item.description}</Text>
      <Text style={styles.artworkArtist}>By: {item.artist}</Text>

      {item.exhibitionDetails && item.exhibitionDetails.length > 0 && (
        <View style={styles.exhibitionInfo}>
          <Text style={styles.exhibitionText}>
            {item.artist} har utstilling i: {item.exhibitionDetails[0].location || "Ukjent"} 📍
          </Text>
          {item.exhibitionDetails[0].date && (
            <Text style={styles.exhibitionText}>
              Dato: {item.exhibitionDetails[0].date}
            </Text>
          )}
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={() => handleToggleSavePost(item.id)} style={styles.saveButton}>
          <Ionicons
            name={savedPosts.has(item.id) ? "bookmark" : "bookmark-outline"}
            size={24}
            color="#fff"
          />
          {item.savesCount > 0 && (
            <Text style={styles.actionSaveCount}>{item.savesCount}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleToggleLikePost(item.id)} style={styles.likeButton}>
          <Ionicons
            name={likedPosts.has(item.id) ? "heart" : "heart-outline"}
            size={24}
            color="#fff"
          />
          {item.likesCount > 0 && (
            <Text style={styles.actionCount}>{item.likesCount}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleCommentToggle(item.id)} style={styles.commentButton}>
          <View style={styles.commentIconContainer}>
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
            {item.commentsCount > 0 && (
              <Text style={styles.commentCount}>{item.commentsCount}</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {selectedPostId === item.id && (
        <View style={styles.commentBubble}>
          <CommentSection postId={item.id} />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { zIndex: 1 }]}>
      <Text style={styles.title}>Welcome to ArtVista, {userName}!</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#fff" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            handleSearch(text);
          }}
          style={styles.searchInput}
          placeholder="Search after artworks, artists or hashtags..."
          placeholderTextColor="#888"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setFilteredArtworks(artworks);
            }}
          >
            <Ionicons name="close-circle" size={20} color="#888" style={styles.clearIcon} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredArtworks}
        renderItem={renderArtworkItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.artworksList}
        refreshing={refreshing}
        onRefresh={getPostsFromBackend}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  actionCount: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  actionSaveCount: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#fff',
    fontFamily: 'Quicksand-Regular',
    fontSize: 14,
  },
  artworksList: {
    width: '100%',
    marginTop: 20,
  },
  artworkContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#000',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    flexDirection: 'column',
  },
  artworkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Quicksand-Regular'
  },
  artworkDescription: {
    fontSize: 14,
    marginBottom: 5,
    color: '#fff'
  },
  artworkArtist: {
    fontSize: 12,
    color: '#777',
  },
  artworkImage: {
    width: '100%',
    height: 500,
    borderRadius: 5,
    marginBottom: 5,
  },
  errorText: {
    color: 'red',
    alignItems: 'center',
    margin: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentBubble: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  commentButton: {
    marginLeft: 10,
  },
  commentCount: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
  },
  commentIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  exhibitionInfo: {
    marginTop: 8,
    padding: 1,
    borderRadius: 5,
  },
  exhibitionText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#fff",
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 10,
    marginTop: 20,
    backgroundColor: '#000',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    zIndex: 1,
    color: '#aaa',
    marginRight: 9,
  },
  clearIcon: {
    marginLeft: 10,
  },
  title: {
    color: '#fff',
  }
});

export default HomeScreen;
