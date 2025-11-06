import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Firebase configuration
// Note: Native configuration files (google-services.json / GoogleService-Info.plist)
// initialize the default app instance. We obtain the modular Auth and Firestore instances
// here so the rest of the codebase can consume them.

const app = getApp();
const auth = getAuth(app);

// Enable Firestore offline persistence
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
});

export { auth, firestore };

export default auth;
