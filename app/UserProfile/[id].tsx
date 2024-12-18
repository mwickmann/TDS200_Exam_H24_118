import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPostsByArtist } from '@/api/postApi';
import { getUserById } from '@/api/usersApi';

const defaultProfileImageUri = Platform.OS === 'web'
  ? require('../../assets/images/default-profile.png')
  : Image.resolveAssetSource(require('../../assets/images/default-profile.png')).uri;

interface UserData {
  id: string;
  username: string;
  bio: string;
  profileImage?: string;
  email: string;
  website: string;
}

const UserProfile = () => {
  const router = useRouter();
  const { id: userId } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [upcomingExhibitions, setUpcomingExhibitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        console.error("Ingen userId mottatt.");
        return;
      }

      try {
        const userData = await getUserById(userId);
        setUser(userData);

        // Henter brukerens kunstverk
        const posts = await getPostsByArtist(userData.username);
        setUserPosts(posts);

        // Filtrer utstillinger fra kunstverk
        const exhibitions = posts
          .filter((post) => post.exhibitions && post.exhibitionDetails)
          .map((post) => post.exhibitionDetails)
          .flat();
        setUpcomingExhibitions(exhibitions);
      } catch (error) {
        console.error("Feil ved henting av brukerdata eller utstillinger:", error);
      } finally {
        setLoading(false);
        setLoadingPosts(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return <ActivityIndicator size="large" color="#007BFF" style={styles.loadingIndicator} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: user?.profileImage || defaultProfileImageUri }}
            style={styles.profileImage}
          />
          <Text style={styles.name}>{user?.username || 'Brukernavn ikke tilgjengelig'}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.bio}>{user?.bio || 'Ingen bio tilgjengelig'}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color="#fff" />
            <Text style={styles.email}>{user?.email || 'Ingen e-post tilgjengelig'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="globe-outline" size={16} color="#fff" />
            <Text style={styles.website}>{user?.website || 'Ingen nettside tilgjengelig'}</Text>
          </View>
        </View>

        {/* Brukerens Kunstverk */}
        <View style={styles.savedPostsContainer}>
          <Text style={styles.savedPostsTitle}>Artwork by {user?.username}:</Text>
          {loadingPosts ? (
            <ActivityIndicator size="small" color="#007BFF" />
          ) : userPosts.length > 0 ? (
            <FlatList
              data={userPosts}
              keyExtractor={(item) => item.id}
              horizontal={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/ArtWorkDetail/${item.id}`)}
                  style={styles.postItem}
                >
                  <Image source={{ uri: item.imageURL }} style={styles.postImage} />
                  <Text style={styles.postTitle}>{item.title}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noUserText}>No artworks found.</Text>
          )}
        </View>

        {/* Kommende Utstillinger */}
        <View style={styles.savedPostsContainer}>
          <Text style={styles.savedPostsTitle}>Upcoming Exhibitions:</Text>
          {upcomingExhibitions.length > 0 ? (
            <FlatList
              data={upcomingExhibitions}
              keyExtractor={(item, index) => index.toString()}
              horizontal={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/Exhibition/${item.id}`)}
                  style={styles.exhibitionItem}
                >
                  <View>
                    <Text style={styles.exhibitionTitle}>{item.name || "Unknown Exhibition"}</Text>
                    <View style={styles.exhibitionRow}>
                      <Ionicons name="location-outline" size={16} color="#888" />
                      <Text style={styles.exhibitionText}>
                        {item.location || "Unknown Location"}
                      </Text>
                    </View>
                    <View style={styles.exhibitionRow}>
                      <Ionicons name="calendar-outline" size={16} color="#888" />
                      <Text style={styles.exhibitionText}>
                        {item.date || "Unknown Date"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noUserText}>No upcoming exhibitions found.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default UserProfile;

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoContainer: {
    marginBottom: 20,
  },
  bio: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  email: {
    fontSize: 14,
    color: '#888',
    marginLeft: 5,
  },
  website: {
    fontSize: 14,
    color: '#1e90ff',
    textDecorationLine: 'underline',
    marginLeft: 5,
  },
  savedPostsContainer: {
    marginTop: 20,
  },
  savedPostsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  postItem: {
    marginRight: 10,
    alignItems: 'center',
  },
  postImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  postTitle: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
  exhibitionItem: {
    padding: 15,
    backgroundColor: "#2c2c2c",
    marginBottom: 10,
    borderRadius: 10,
    marginRight: 15,
  },
  exhibitionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#ffffff",
  },
  exhibitionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  exhibitionText: {
    color: "#ccc",
    fontSize: 14,
    marginLeft: 5,
  },
  listContent: {
    paddingBottom: 10,
  },
  noUserText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingIndicator: {
    
  }
});
