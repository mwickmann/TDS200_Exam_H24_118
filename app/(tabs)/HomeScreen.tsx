import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Image, TextInput, Platform, RefreshControl } from 'react-native';
import usePosts from '@/hooks/usePosts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CommentSection from '@/components/ComentSection';
import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { fetchUsers } from '@/api/usersApi';

const defaultProfileImageUri = Platform.OS === 'web'
  ? require('../../assets/images/default-profile.png')
  : Image.resolveAssetSource(require('../../assets/images/default-profile.png')).uri;

const HomeScreen: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const auth = getAuth();

  // States for posts and users
  const { artworks, likedPosts, savedPosts, fetchPosts, toggleLike, toggleSave } = usePosts();
  const [filteredArtworks, setFilteredArtworks] = useState(artworks);
  const [users, setUsers] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const router = useRouter();

  // Fetch user data and current user info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserName(currentUser.displayName || 'Bruker');
      } else {
        setUserName(null);
      }
    });

    const fetchUserData = async () => {
      try {
        const userData = await fetchUsers('');
        setUsers(userData);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUserData();
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    setFilteredArtworks(artworks);
    setLoading(false);
  }, [artworks]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await fetchPosts();
      const userData = await fetchUsers('');
      setUsers(userData);
    } catch (err) {
      setError('Something went wrong.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.trim().toLowerCase();

    // Filtrerer artworks
    const filteredArtworks = artworks.filter(
      (artwork) =>
        artwork.title.toLowerCase().includes(lowerQuery) ||
        artwork.artist.toLowerCase().includes(lowerQuery) ||
        (Array.isArray(artwork.hashtags) &&
          artwork.hashtags.some((hashtag) => hashtag.toLowerCase().includes(lowerQuery)))
    );

    // Filtrerer users
    const filteredUsers = users.filter(
      (user) =>
        user.username.toLowerCase().includes(lowerQuery) ||
        (user.displayName && user.displayName.toLowerCase().includes(lowerQuery))
    );

    setSearchResults([...filteredArtworks, ...filteredUsers]);
  };

  const handleCommentToggle = (postId: string) => {
    setSelectedPostId((prevPostId) => (prevPostId === postId ? null : postId));
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.artist) {
      // Artwork item
      return (
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
          <View style={styles.userInfoContainer}>
            <Image
              source={{
                uri: item.userProfileImage && item.userProfileImage !== '' ? item.userProfileImage : defaultProfileImageUri,
              }}
              style={styles.profileImage}
            />
            <View style={styles.userInfoText}>
              <Text style={styles.userName}>{item.artist || "Anonym bruker"}</Text>
              <Text style={styles.postDate}>
                Published: {item.timestamp ? new Date(item.timestamp).toLocaleDateString("no-NO") : "Unknown date"}
              </Text>
            </View>
          </View>

          <Image source={{ uri: item.imageURL }} style={styles.artworkImage} />
          <Text style={styles.artworkTitle}>{item.title}</Text>
          <Text style={styles.artworkDescription}>{item.description}</Text>
          <Text style={styles.hashtagText}>{item.hashtags}</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={() => toggleSave(item.id)} style={styles.saveButton}>
              <Ionicons
                name={savedPosts.has(item.id) ? "bookmark" : "bookmark-outline"}
                size={24}
                color="#fff"
              />
              {item.savesCount > 0 && (
                <Text style={styles.actionSaveCount}>{item.savesCount}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.likeButton}>
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
    } else if (item.username) {
      // User item
      return (
        <TouchableOpacity
          style={styles.userContainer}
          onPress={() => {
            // navifgerer til søk etter user hvis det finnes i databasen
            console.log("Navigerer til brukerprofil:", item.id);
            router.push(`/UserProfile/${item.id}`);
          }}
        >
          <Image
            source={{
              uri: item.profileImage || defaultProfileImageUri,
            }}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{item.displayName || item.username}</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ArtVista, {userName || 'User'}!</Text>

      <View style={[styles.searchContainer, { alignSelf: 'center' }]}>
        <Ionicons name="search" size={20} color="#fff" style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchInput}
          placeholder="Search for artworks or users..."
          placeholderTextColor="#888"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
          >
            <Ionicons name="close-circle" size={20} color="#888" style={styles.clearIcon} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={searchResults.length > 0 ? searchResults : filteredArtworks}
        keyExtractor={(item) => item.id || item.username}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#CBE8F4" />
        }
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    alignSelf: 'center',
    fontFamily: 'QuicksandRegular',
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
    shadowColor: '#000',
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
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#fff',
    fontFamily: 'QuicksandRegular',

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
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userInfoText: {
    flexDirection: 'column',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  postDate: {
    fontSize: 12,
    color: '#aaa',
  },
  artworkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  artworkDescription: {
    fontSize: 14,
    marginBottom: 5,
    color: '#fff',
  },
  artworkImage: {
    width: '100%',
    height: 500,
    borderRadius: 5,
    marginBottom: 5,
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
  commentButton: {
    marginLeft: 10,
  },
  commentIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCount: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionSaveCount: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  commentBubble: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  commentCount: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    
  },
  hashtagText: {
    fontFamily: 'QuicksandRegular',
    fontSize: 14,
    color: '#fff'
  }
});
