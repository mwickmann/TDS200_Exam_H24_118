import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';


// laster opp bilde til firebase
export const uploadImageToFirebase = async (
  uri: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const fetchResponse = await fetch(uri);
    if (!fetchResponse.ok) {
      console.error("Failed to fetch image:", fetchResponse.statusText);
      throw new Error(`Image fetch failed with status: ${fetchResponse.status}`);
    }
    const blob = await fetchResponse.blob();

    // Generer unikt bildepath ved bruk av UUID for å unngå overskriving
    const uniqueId = uuidv4();
    const uploadPath = `images/${uniqueId}`;
    console.log("uploadPath", uploadPath);

    const storage = getStorage(); 
    const imageRef = ref(storage, uploadPath); 
    const uploadTask = uploadBytesResumable(imageRef, blob);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL) => {
              console.log("File available at", downloadURL);
              resolve(downloadURL); 
            })
            .catch((error) => {
              console.error("Error getting download URL:", error);
              reject(error);
            });
        }
      );
    });
  } catch (error) {
    console.error("Error in uploadImageToFirebase:", error);
    throw error;
  }
};
