import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export const uploadImageToFirebase = async (uri: string) => {
  const fetchResponse = await fetch(uri);
  if (!fetchResponse.ok) {
    console.error("Failed to fetch image:", fetchResponse);
    throw new Error("Image fetch failed");
  }
  const blob = await fetchResponse.blob();

  const imagePath = uri.split("/").pop()?.split(".")[0] ?? "anonymtBilde";
  console.log("imagepath", imagePath);

  const uploadPath = `images/${imagePath}`;
  const storage = getStorage(); // Ensure you're getting the storage instance
  const imageRef = ref(storage, uploadPath); // Create a reference to the path

  const uploadTask = uploadBytesResumable(imageRef, blob);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        console.error("Upload error:", error);
        reject(error);
      },
      () => {
        // Get the download URL after the upload completes
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log("File available at", downloadURL);
          resolve(downloadURL); // Return the download URL
        }).catch((error) => {
          console.error("Error getting download URL:", error);
          reject(error);
        });
      }
    );
  });
};
