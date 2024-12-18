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
  Platform,
} from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { getDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { getPostsByArtist } from '@/api/postApi';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ArtworkData, CommentData } from '@/utils/artWorkData'; 
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// for at bilde skal være kombatibelt med både web og mobil
const defaultProfileImageUri = Platform.OS === 'web'
  ? require('../../assets/images/default-profile.png') 
  : Image.resolveAssetSource(require('../../assets/images/default-profile.png')).uri; 


interface UserData {
  username: string;
  bio: string;
  profileImage?: string;
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
            username: userData.username || currentUser.displayName || 'Unknown',
            email: userData.email || 'No e-mail available.',
            profileImage: userData.profileImage || defaultProfileImageUri,
            savedPosts: userData.savedPosts || [],
          });
        } else {
          const newUser: UserData = {
            username: currentUser.displayName || 'Unknown',
            bio: 'No bio updated',
            profileImage: defaultProfileImageUri, 
            email: currentUser.email || 'Unknown email',
            website: 'No website updated',
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
      Alert.alert('Profile updated!');
    } catch (error) {
      console.error('Something went wrong:', error);
      Alert.alert('Something went wrong.');
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

        Alert.alert('Profilepicture was updated!');
      } catch (error) {
        console.error('Something went wrong', error);
        Alert.alert('Something went wrong.Try again');
      }
    }
  };

  const uploadImageToFirebase = async (uri: string) => {
    const fetchResponse = await fetch(uri);
    if (!fetchResponse.ok) {
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
    } else {
      setLikedPosts((prev) => new Set(prev).add(postId));
      // Oppdater likesCount i userPosts
      setUserPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likesCount: post.likesCount + 1 } : post
        )
      );
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
    } else {
    
      setSavedPosts((prev) => new Set(prev).add(postId));
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
  <Image
  source={{ uri: user?.profileImage ? user.profileImage : defaultProfileImageUri }}
  style={styles.profileImage}
/>

  </Pressable>
  <TouchableOpacity style={styles.editProfileImageButton} onPress={handleImageSelection}>
    <Text style={styles.editProfileImageText}>Edit</Text>
    <MaterialIcons name="edit" size={16} color="#888" style={{marginLeft: 4}}/>

  </TouchableOpacity>
  <Text style={[styles.name]}>{user?.username}</Text>
  </View>


      
        {/* Info */}
        <View style={[styles.infoContainer, styles.darkContainer]}>
          <View style={styles.infoRow}>
            <Text style={styles.bio}>{user?.bio}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color="#fff" style={styles.icon} />
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="globe-outline" size={16} color="#fff" style={styles.icon} />
            <Text style={styles.website}>{user?.website}</Text>
          </View>
                {/* Edit Profile Button */}
        <Pressable style={styles.editProfileButton} onPress={() => setEditProfileVisible(true)}>
          <Text style={styles.buttonText}>EDIT PROFILE</Text>
        </Pressable>
        </View>


      

  {/* Brukers Kunstverk */}
<View style={[styles.savedPostsContainer, styles.darkContainer]}>
  <Text style={styles.savedPostsTitle}>Your artwork:</Text>
  {loadingPosts ? (
    <ActivityIndicator size="small" color="#007BFF" />
  ) : userPosts.length > 0 ? (
    <FlatList
      data={userPosts}
      keyExtractor={(item) => item.id}
      horizontal={true} 
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
      showsHorizontalScrollIndicator={false} 
    />
  ) : (
    <Text style={styles.noExhibitionsText}>You dont have any uploaded artwork yet.</Text>
  )}
</View>

{/* Dine Kommende Utstillinger */}
<View style={[styles.savedPostsContainer, styles.darkContainer]}>
  <Text style={styles.savedPostsTitle}>Your upcoming exhibitons:</Text>
  <FlatList
    data={upcomingExhibitionsData}
    keyExtractor={(item, index) => index.toString()}
    horizontal={true} 
    renderItem={({ item }) => (
  
      <View style={styles.listItem}>
        <Text style={styles.listItemTitle}>{item.name || "Ukjent utstilling"}</Text>

        <View style={styles.listItemRow}>
          <Ionicons name="location-outline" size={16} color="#888" style={styles.listItemIcon} />
          <Text style={styles.listItemText}>{item.location || "Ukjent by"}</Text>
        </View>

        <View style={styles.listItemRow}>
          <Ionicons name="calendar-outline" size={16} color="#888" style={styles.listItemIcon} />
          <Text style={styles.listItemText}>Date: {item.date || "Ukjent dato"}</Text>
        </View>
      </View>
  
    )}
    contentContainerStyle={styles.listContent}
    showsHorizontalScrollIndicator={false} 
  />
</View>



        {/* Logg Ut Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>LOG OUT</Text>
        </Pressable>

        {/* Rediger Profil Modal */}
        <Modal visible={editProfileVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit</Text>
              <ScrollView>
                <Text style={styles.modalLabel}>Bio</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newBio}
                  onChangeText={(text) => setNewBio(text)}
                  placeholder="Write in your bio.."
                  placeholderTextColor="#aaa"
                />
                <Text style={styles.modalLabel}>Webpage</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newWebsite}
                  onChangeText={(text) => setNewWebsite(text)}
                  placeholder="https://example.com"
                  placeholderTextColor="#aaa"
                />
                <Pressable style={styles.saveButton} onPress={handleEditProfile}>
                  <Text style={styles.saveButtonText}>SAVE</Text>
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={() => setEditProfileVisible(false)}>
                  <Text style={styles.cancelButtonText}>CANCEL</Text>
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
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10, 
  },
  editProfileImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    color: '#888',
    fontWeight: 'bold',
  },
  editProfileImageText: {
    marginLeft: 5,
    color: '#888',
    fontSize: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  editProfileButton: {
    fontFamily: 'Montserrat',
    backgroundColor: '#CBE8F4',
    paddingVertical: 12, 
    paddingHorizontal: 40, 
    borderRadius: 10, 
    alignSelf: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
},
 logoutButton: {
    marginTop: 10,
    backgroundColor: '#CBE8F4',
    paddingVertical: 12, 
    paddingHorizontal: 40, 
    borderRadius: 10, 
    alignSelf: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
 buttonText: {
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'Montserrat',
    fontSize: 12,

  },
  infoContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  bio: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
    fontFamily: 'QuicksandRegular'
  },
  email: {
    fontSize: 14,
    color: '#888',
    flex: 1,
    flexWrap: 'wrap', 
    fontFamily: 'QuicksandRegular'

  },
  website: {
    fontSize: 14,
    color: '#1e90ff',
    textDecorationLine: 'underline',
    flex: 1,
    flexWrap: 'wrap', 
    fontFamily: 'QuicksandRegular',


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
    padding: 5,
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
    fontFamily: 'QuicksandRegular',
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
    backgroundColor: '#CBE8F4',
    marginBottom: 10,
    
  },
  saveButtonText: {
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Montserrat',
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
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
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
    paddingBottom: 10,
  },
  listItemIcon: {
    marginRight: 5,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  listItemText: {
    color: '#ccc',
    fontSize: 14,
    fontFamily: 'Quicksand-Regular',
  },
  listItem: {
    padding: 15,
    backgroundColor: "#2c2c2c",
    marginBottom: 10,
    borderRadius: 10,
    marginRight: 15,
  },
  listItemTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#ffffff",
    fontFamily: 'Quicksand-Bold',
  },
});




