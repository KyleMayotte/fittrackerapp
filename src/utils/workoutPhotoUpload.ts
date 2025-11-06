import storage from '@react-native-firebase/storage';
import { launchImageLibrary, launchCamera, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { Alert, Platform, PermissionsAndroid } from 'react-native';

/**
 * Upload a workout photo to Firebase Storage
 * @param userId - The user's ID
 * @param workoutId - The workout's ID
 * @param photoUri - Local URI of the photo
 * @returns The download URL of the uploaded photo
 */
export async function uploadWorkoutPhoto(
  userId: string,
  workoutId: string,
  photoUri: string
): Promise<string> {
  try {
    const filename = `workout_${workoutId}_${Date.now()}.jpg`;
    const reference = storage().ref(`workoutPhotos/${userId}/${filename}`);

    // Upload the file
    await reference.putFile(photoUri);

    // Get the download URL
    const downloadUrl = await reference.getDownloadURL();
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading workout photo:', error);
    throw new Error('Failed to upload photo');
  }
}

/**
 * Launch image picker with option to take photo or select from gallery
 * @returns Selected photo asset or null
 */
export async function pickWorkoutPhoto(): Promise<Asset | null> {
  return new Promise((resolve) => {
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const photo = await takePhoto();
            resolve(photo);
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const photo = await selectFromGallery();
            resolve(photo);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true }
    );
  });
}

/**
 * Request camera permission on Android
 */
async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'MuscleUp needs access to your camera to take workout photos.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('Permission request error:', err);
    return false;
  }
}

/**
 * Take a photo with the camera
 */
async function takePhoto(): Promise<Asset | null> {
  // Request permission first
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
    return null;
  }

  try {
    const result: ImagePickerResponse = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      saveToPhotos: true,
    });

    if (result.didCancel) {
      return null;
    }

    if (result.errorCode) {
      console.error('Camera error:', result.errorMessage);
      return null;
    }

    if (result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
}

/**
 * Select a photo from the gallery
 */
async function selectFromGallery(): Promise<Asset | null> {
  try {
    const result: ImagePickerResponse = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      return null;
    }

    if (result.errorCode) {
      console.error('Image picker error:', result.errorMessage);
      return null;
    }

    if (result.assets && result.assets.length > 0) {
      return result.assets[0];
    }

    return null;
  } catch (error) {
    console.error('Error picking photo:', error);
    return null;
  }
}
