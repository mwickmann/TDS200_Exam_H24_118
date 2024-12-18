import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export const fetchAllExhibitions = async (collectionName: string) => {
  try {
    const exhibitionsRef = collection(db, collectionName);
    const snapshot = await getDocs(exhibitionsRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching exhibitions:", error);
    throw error;
  }
};

export const fetchExhibitionById = async (collectionName: string, id: string) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Document not found");
    }
  } catch (error) {
    console.error("Error fetching exhibition by ID:", error);
    throw error;
  }
};
