/**
 * MuscleUp - React Native App
 * Fitness tracking app with AI-powered features
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuthContext } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import MainTabNavigator from './src/screens/MainTabNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { colors, typography, spacing } from './src/theme';

const ONBOARDING_KEY = '@muscleup/onboarding_completed';

function MainApp() {
  const { user, loading } = useAuthContext();
  const [showSignup, setShowSignup] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  // Check onboarding status when user logs in
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user) {
        try {
          const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
          setOnboardingCompleted(completed === 'true');
        } catch (error) {
          console.error('Failed to check onboarding status:', error);
          // Default to showing onboarding if check fails
          setOnboardingCompleted(false);
        }
      } else {
        // Reset onboarding status when logged out
        setOnboardingCompleted(null);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  // Show loading spinner while checking auth or onboarding status
  if (loading || (user && onboardingCompleted === null)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Not logged in - show auth screens
  if (!user) {
    if (showSignup) {
      return <SignupScreen onNavigateToLogin={() => setShowSignup(false)} />;
    }
    return <LoginScreen onNavigateToSignup={() => setShowSignup(true)} />;
  }

  // Logged in but onboarding not completed
  if (!onboardingCompleted) {
    return <OnboardingScreen onComplete={() => setOnboardingCompleted(true)} />;
  }

  // Logged in and onboarding completed - show main app
  return (
    <NavigationContainer>
      <MainTabNavigator />
    </NavigationContainer>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <MainApp />
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});

export default App;
