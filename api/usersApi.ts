import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export type User = {
  id: string;
  username: string;
  profileImage?: string;
  displayName?: string;
  bio: string;
  email: string;
  website: string;
  savedPosts: [];

};

// henter ut brukere via SØK 
export const fetchUsers = async (searchText: string): Promise<User[]> => {
  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("username", ">=", searchText),
      where("username", "<=", searchText + "\uf8ff")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};
export const getUserById = async (userId: string): Promise<User> => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const userRef = doc(db, "users", userId); 
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User not found");
    }

    const userData = userSnap.data();

    // Returnere felter for UserData
    return {
      id: userSnap.id, 
      username: userData.username || "Brukernavn ikke tilgjengelig",
      bio: userData.bio || "Ingen bio tilgjengelig",
      profileImage: userData.profileImage || "",
      email: userData.email || "Ingen e-post tilgjengelig",
      website: userData.website || "Ingen nettside tilgjengelig",
      savedPosts: [],
    };
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error; 
  }
};
