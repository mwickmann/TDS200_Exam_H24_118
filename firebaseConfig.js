// firebaseConfig.js

import { initializeApp } from "firebase/app";
import firebaseConfig from './firebaseEnv'; // Sørg for at stien er korrekt
import { getFirestore } from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with persistence
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
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
        throw error; // Kaster feilen videre for håndtering der det kalles
    }
};
