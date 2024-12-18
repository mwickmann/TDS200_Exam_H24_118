// Denne koden er hentet fra forelesning med Brage Hveding Ersdal
import { initializeApp } from "firebase/app";
import firebaseConfig from './firebaseEnv'; 
import { getFirestore, doc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { Platform } from "react-native";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Initialize Firebase
const app = initializeApp(firebaseConfig);



// Initialize Firebase Authentication with persistence
export const auth = initializeAuth(app, {
    persistence: Platform.OS === "web"
    ? browserLocalPersistence
    : getReactNativePersistence(ReactNativeAsyncStorage),
  });
// Initialize Firestore
export const db = getFirestore(app);


// Initialize Storage
const storage = getStorage(app);

// Helper function to get a storage reference
export const getStorageRef = (path) => ref(storage, path);

  

// Helper function to get the download URL
export const getDownloadUrl = async (path) => {
    try {
        const url = await getDownloadURL(ref(storage, path));
        return url;
    } catch (error) {
        console.error("Error getting download URL:", error);
        throw error; 
    }
};
