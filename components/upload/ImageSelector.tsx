
// ImageSelector Component
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

interface ImageSelectorProps {
  onImageSelected: (uri: string) => void;
}

const ImageSelector: React.FC<ImageSelectorProps> = ({ onImageSelected }) => {
  const handleImageSelection = async () => {
    const response = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!response.canceled) {
      const compressedUri = await compressImage(response.assets[0].uri);
      onImageSelected(compressedUri);
    }
  };
  

  const handleCameraSelection = async () => {
    const response = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!response.canceled) {
      const compressedUri = await compressImage(response.assets[0].uri);
      onImageSelected(compressedUri);
    }
  };

  const compressImage = async (uri: string) => {
    try {
      const compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 700 } }],
        { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG }
      );
      return compressedImage.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  };

  return (
    <>
      <Pressable style={styles.imageButton} onPress={handleImageSelection}>
        <Text style={styles.imageButtonText}>CHOOSE FROM GALLERY</Text>
      </Pressable>
      <Pressable style={styles.imageButton} onPress={handleCameraSelection}>
        <Text style={styles.imageButtonText}>TAKE A PHOTO</Text>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  imageButton: {
    padding: 10,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  imageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ImageSelector;