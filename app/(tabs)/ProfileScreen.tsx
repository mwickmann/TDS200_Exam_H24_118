// src/screens/ProfilePage.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { getDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { getPostsByArtist } from '@/api/postApi';
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ArtworkData, CommentData } from '@/utils/artWorkData'; // Sørg for at CommentData er definert
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Standard profilbilde
const defaultProfileImageUri = Image.resolveAssetSource(require('../../assets/images/default-profile.png')).uri;

// Definer UserData interface med nødvendige felter
interface UserData {
  username: string;
  bio: string;
  profileImage: string;
  email: string;
  website: string;
  savedPosts: string[];
}

const ProfilePage = () => {
  const auth = getAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || colorScheme === null;

  const [user, setUser] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<ArtworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newProfileImage, setNewProfileImage] = useState<string | null>(null);
  const [upcomingExhibitionsData, setUpcomingExhibitionsData] = useState<any[]>([]);

  // Tilstandsvariabler for likes og saves
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserData;
          setUser({
            ...userData,
            username: userData.username || currentUser.displayName || 'Brukernavn ikke tilgjengelig',
            email: userData.email || 'Ingen e-post tilgjengelig',
            profileImage: userData.profileImage || defaultProfileImageUri,
            savedPosts: userData.savedPosts || [],
          });

          // Initialize savedPosts set
          setSavedPosts(new Set(userData.savedPosts || []));
        } else {
          const newUser: UserData = {
            username: currentUser.displayName || 'Brukernavn ikke tilgjengelig',
            bio: 'Ingen bio tilgjengelig',
            profileImage: defaultProfileImageUri,
            email: currentUser.email || 'Ingen e-post tilgjengelig',
            website: 'Ingen nettside tilgjengelig',
            savedPosts: [],
          };
          await setDoc(userRef, newUser);
          setUser(newUser);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [auth]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (user?.username) {
        const posts = await getPostsByArtist(user.username);
        setUserPosts(posts);

        const exhibitions = posts
          .filter((post) => post.exhibitions && post.exhibitionDetails)
          .map((post) => post.exhibitionDetails)
          .flat();
        setUpcomingExhibitionsData(exhibitions);
      }
      setLoadingPosts(false);
    };

    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        router.push('/SignInScreen');
      })
      .catch((error) => {
        console.error('Feil ved utlogging:', error.message);
      });
  };

  const handleEditProfile = async () => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser!.uid);
      await updateDoc(userRef, {
        bio: newBio || user.bio,
        website: newWebsite || user.website,
        profileImage: newProfileImage || user.profileImage,
      });

      setUser((prev) =>
        prev
          ? {
              ...prev,
              bio: newBio || prev.bio,
              website: newWebsite || prev.website,
              profileImage: newProfileImage || prev.profileImage,
            }
          : prev
      );
      setEditProfileVisible(false);
      Alert.alert('Profil oppdatert!');
    } catch (error) {
      console.error('Feil ved oppdatering av profil:', error);
      Alert.alert('Noe gikk galt ved oppdatering av profil.');
    }
  };

  const handleImageSelection = async () => {
    const response = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!response.canceled) {
      const compressedUri = await compressImage(response.assets[0].uri);
      try {
        const downloadURL = await uploadImageToFirebase(compressedUri);
        setNewProfileImage(downloadURL);
        setUser((prev) => (prev ? { ...prev, profileImage: downloadURL } : prev));

        if (auth.currentUser) {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await updateDoc(userRef, {
            profileImage: downloadURL,
          });
        }

        Alert.alert('Profilbildet er oppdatert!');
      } catch (error) {
        console.error('Feil ved opplasting av bilde:', error);
        Alert.alert('Noe gikk galt ved opplasting av bildet.');
      }
    }
  };

  const uploadImageToFirebase = async (uri: string) => {
    const fetchResponse = await fetch(uri);
    if (!fetchResponse.ok) {
      console.error('Failed to fetch image:', fetchResponse);
      throw new Error('Image fetch failed');
    }
    const blob = await fetchResponse.blob();

    const imagePath = uri.split('/').pop()?.split('.')[0] ?? 'anonymtBilde';
    const uploadPath = `images/${imagePath}`;
    const storage = getStorage();
    const imageRef = ref(storage, uploadPath);

    const uploadTask = uploadBytesResumable(imageRef, blob);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL) => {
              console.log('File available at', downloadURL);
              resolve(downloadURL);
            })
            .catch((error) => {
              console.error('Error getting download URL:', error);
              reject(error);
            });
        }
      );
    });
  };

  const compressImage = async (uri: string) => {
    try {
      const compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 200 } }],
        { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG }
      );
      return compressedImage.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  };

  // Funksjon for å håndtere likes
  const handleToggleLikePost = async (postId: string) => {
    if (likedPosts.has(postId)) {
      // Fjern like
      setLikedPosts((prev) => {
        const updated = new Set(prev);
        updated.delete(postId);
        return updated;
      });
      // Oppdater likesCount i userPosts
      setUserPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likesCount: post.likesCount - 1 } : post
        )
      );
      // Her kan du legge til en API-kall for å fjerne like fra backend
    } else {
      // Legg til like
      setLikedPosts((prev) => new Set(prev).add(postId));
      // Oppdater likesCount i userPosts
      setUserPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likesCount: post.likesCount + 1 } : post
        )
      );
      // Her kan du legge til en API-kall for å legge til like i backend
    }
  };

  // Funksjon for å håndtere saves
  const handleToggleSavePost = async (postId: string) => {
    if (savedPosts.has(postId)) {
      // Fjern save
      setSavedPosts((prev) => {
        const updated = new Set(prev);
        updated.delete(postId);
        return updated;
      });
      // Oppdater savesCount i userPosts
      setUserPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, savesCount: post.savesCount - 1 } : post
        )
      );
      // Oppdater savedPosts i user data
      if (user) {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const updatedSavedPosts = user.savedPosts.filter((id) => id !== postId);
        await updateDoc(userRef, { savedPosts: updatedSavedPosts });
        setUser((prev) =>
          prev
            ? {
                ...prev,
                savedPosts: updatedSavedPosts,
              }
            : prev
        );
      }
      // Her kan du legge til en API-kall for å fjerne save fra backend
    } else {
      // Legg til save
      setSavedPosts((prev) => new Set(prev).add(postId));
      // Oppdater savesCount i userPosts
      setUserPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, savesCount: post.savesCount + 1 } : post
        )
      );
      // Oppdater savedPosts i user data
      if (user) {
        const userRef = doc(db, 'users', auth.currentUser!.uid);
        const updatedSavedPosts = [...user.savedPosts, postId];
        await updateDoc(userRef, { savedPosts: updatedSavedPosts });
        setUser((prev) =>
          prev
            ? {
                ...prev,
                savedPosts: updatedSavedPosts,
              }
            : prev
        );
      }
      // Her kan du legge til en API-kall for å legge til save i backend
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#007BFF" style={styles.loadingIndicator} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={[styles.container]}>
        {/* Header */}
        <View style={[styles.header, styles.darkContainer]}>
          <Pressable onPress={handleImageSelection}>
            <Image source={{ uri: user?.profileImage ? user.profileImage : defaultProfileImageUri }} style={styles.profileImage} />
          </Pressable>
          <Text style={[styles.name]}>{user?.username}</Text>
        </View>

        {/* Info */}
        <View style={[styles.infoContainer, styles.darkContainer]}>
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={24} color="#fff" style={styles.icon} />
            <Text style={styles.bio}>{user?.bio}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={24} color="#fff" style={styles.icon} />
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="globe-outline" size={24} color="#fff" style={styles.icon} />
            <Text style={styles.website}>{user?.website}</Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <Pressable style={styles.editProfileButton} onPress={() => setEditProfileVisible(true)}>
          <Text style={styles.buttonText}>Rediger Profil</Text>
        </Pressable>

        {/* Dine Kunstverk */}
        <View style={[styles.savedPostsContainer, styles.darkContainer]}>
          <Text style={styles.savedPostsTitle}>Dine kunstverk:</Text>
          {loadingPosts ? (
            <ActivityIndicator size="small" color="#007BFF" />
          ) : userPosts.length > 0 ? (
            <FlatList
              data={userPosts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => router.push(`/ArtWorkDetail/${item.id}`)}
                  style={[styles.postItem, styles.darkContainer]}
                >
                  <Image source={{ uri: item.imageURL }} style={styles.postImage} />
                  <View style={styles.postTextContainer}>
                    <Text style={styles.postTitle}>{item.title}</Text>
                    <Text numberOfLines={2} style={styles.postDescription}>
                      {item.description}
                    </Text>
                    {/* Statistikk Container */}
                    <View style={styles.postStatsContainer}>
                      {/* Likes */}
                      <TouchableOpacity style={styles.statItem} onPress={() => handleToggleLikePost(item.id)}>
                        <Ionicons name={likedPosts.has(item.id) ? "heart" : "heart-outline"} size={20} color="#fff" />
                        {item.likesCount > 0 && (
                          <Text style={styles.statText}>{item.likesCount}</Text>
                        )}
                      </TouchableOpacity>
                      {/* Saves */}
                      <TouchableOpacity style={styles.statItem} onPress={() => handleToggleSavePost(item.id)}>
                        <Ionicons name={savedPosts.has(item.id) ? "bookmark" : "bookmark-outline"} size={20} color="#fff" />
                        {item.savesCount > 0 && (
                          <Text style={styles.statText}>{item.savesCount}</Text>
                        )}
                      </TouchableOpacity>
                      {/* Comments */}
                      <TouchableOpacity style={styles.statItem} onPress={() => router.push(`/ArtWorkDetail/${item.id}`)}>
                        <View style={styles.commentIconContainer}>
                          <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                          {item.commentsCount > 0 && (
                            <Text style={styles.commentCount}>{item.commentsCount}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Pressable>
              )}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <Text style={styles.noExhibitionsText}>Du har ikke lastet opp noe enda.</Text>
          )}
        </View>

        {/* Dine Kommende Utstillinger */}
        <View style={[styles.savedPostsContainer, styles.darkContainer]}>
          <Text style={styles.savedPostsTitle}>Dine kommende utstillinger:</Text>
          {upcomingExhibitionsData && upcomingExhibitionsData.length > 0 ? (
            upcomingExhibitionsData.map((exhibition, index) => (
              <Text key={index} style={styles.upcomingExhibitionItem}>
                {exhibition.name} - {exhibition.date} - {exhibition.location}
              </Text>
            ))
          ) : (
            <Text style={styles.noExhibitionsText}>Du har ingen kommende utstillinger.</Text>
          )}
        </View>

        {/* Logg Ut Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logg Ut</Text>
        </Pressable>

        {/* Rediger Profil Modal */}
        <Modal visible={editProfileVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rediger Profil</Text>
              <ScrollView>
                <Text style={styles.modalLabel}>Bio</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newBio}
                  onChangeText={(text) => setNewBio(text)}
                  placeholder="Skriv din bio her"
                  placeholderTextColor="#aaa"
                />
                <Text style={styles.modalLabel}>Nettside</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newWebsite}
                  onChangeText={(text) => setNewWebsite(text)}
                  placeholder="https://example.com"
                  placeholderTextColor="#aaa"
                />
                <Pressable style={styles.saveButton} onPress={handleEditProfile}>
                  <Text style={styles.saveButtonText}>Lagre Endringer</Text>
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={() => setEditProfileVisible(false)}>
                  <Text style={styles.cancelButtonText}>Avbryt</Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

export default ProfilePage;

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#000', // Mørk bakgrunn
  },
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoutButton: {
    marginTop: 15,
    backgroundColor: '#e63946',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editProfileButton: {
    marginTop: 10,
    backgroundColor: '#007BFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  infoContainer: {
    marginBottom: 20,
  },
  bio: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  email: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
  website: {
    fontSize: 14,
    color: '#1e90ff',
    textDecorationLine: 'underline',
    flex: 1,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedPostsContainer: {
    marginTop: 20,
  },
  savedPostsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  postItem: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  postTextContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  postDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  upcomingExhibitionItem: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  noExhibitionsText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#1c1c1c',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#fff',
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#fff',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    color: '#fff',
    backgroundColor: '#333',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: '#0096C7',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    color: '#ccc',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
    color: '#aaa',
  },
  postStatsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    color: '#ffffff',
    marginLeft: 4,
    fontSize: 14,
  },
  commentIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    color: '#ffffff',
    marginLeft: 4,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
});
