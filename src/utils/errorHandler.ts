import { Alert } from 'react-native';

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message?.toLowerCase() || '';

  return (
    errorCode.includes('network') ||
    errorCode.includes('unavailable') ||
    errorCode.includes('timeout') ||
    errorMessage.includes('network') ||
    errorMessage.includes('offline') ||
    errorMessage.includes('internet') ||
    errorMessage.includes('connection')
  );
};

/**
 * Get a user-friendly error message from a Firebase error
 */
export const getFirebaseErrorMessage = (error: any): string => {
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';

  // Network errors
  if (errorCode.includes('network') || errorCode.includes('unavailable')) {
    return 'Network error. Check your internet connection.';
  }

  // Firestore errors
  if (errorCode.includes('permission-denied')) {
    return 'Access denied. Please check your permissions.';
  }

  if (errorCode.includes('not-found')) {
    return 'Data not found.';
  }

  if (errorCode.includes('already-exists')) {
    return 'This item already exists.';
  }

  if (errorCode.includes('resource-exhausted')) {
    return 'Too many requests. Please try again later.';
  }

  if (errorCode.includes('unauthenticated')) {
    return 'Please log in to continue.';
  }

  if (errorCode.includes('deadline-exceeded') || errorCode.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Auth errors
  if (errorCode.includes('user-not-found')) {
    return 'Account not found.';
  }

  if (errorCode.includes('wrong-password')) {
    return 'Incorrect password.';
  }

  if (errorCode.includes('email-already-in-use')) {
    return 'Email is already registered.';
  }

  if (errorCode.includes('weak-password')) {
    return 'Password is too weak.';
  }

  if (errorCode.includes('invalid-email')) {
    return 'Invalid email address.';
  }

  // Storage errors
  if (errorCode.includes('storage/unauthorized')) {
    return 'Not authorized to upload files.';
  }

  if (errorCode.includes('storage/canceled')) {
    return 'Upload was canceled.';
  }

  if (errorCode.includes('storage/quota-exceeded')) {
    return 'Storage quota exceeded.';
  }

  // If we have a message but no specific code match
  if (errorMessage && !errorMessage.includes('Firebase')) {
    return errorMessage;
  }

  // Default fallback
  return 'Something went wrong. Please try again.';
};

/**
 * Show an error alert with optional retry button
 */
export const showErrorAlert = (
  title: string,
  error: any,
  onRetry?: () => void | Promise<void>
) => {
  const networkError = isNetworkError(error);
  const errorMessage = getFirebaseErrorMessage(error);

  let message = errorMessage;

  if (networkError) {
    message = 'No internet connection. Your data is saved locally and will sync when you\'re back online.';
  }

  const buttons: any[] = [];

  if (onRetry) {
    buttons.push({
      text: 'Retry',
      onPress: onRetry,
    });
  }

  buttons.push({
    text: onRetry ? 'Cancel' : 'OK',
    style: 'cancel',
  });

  Alert.alert(title, message, buttons);
};

/**
 * Show a success alert
 */
export const showSuccessAlert = (title: string, message: string) => {
  Alert.alert(title, message, [{ text: 'OK' }]);
};

/**
 * Show an offline mode alert
 */
export const showOfflineAlert = () => {
  Alert.alert(
    'Offline Mode',
    'You\'re currently offline. Your data is saved locally and will sync when you reconnect.',
    [{ text: 'OK' }]
  );
};
