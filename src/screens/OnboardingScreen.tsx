import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components';
import { typography, spacing, radius } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_KEY = '@muscleup/onboarding_completed';

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface SlideData {
  emoji: string;
  title: string;
  subtitle: string;
  gradient: string[];
}

const slides: SlideData[] = [
  {
    emoji: '💪📱',
    title: 'Track workouts offline,\nsync everywhere',
    subtitle: 'No internet? No problem. Log your sets offline and sync when you\'re ready.',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    emoji: '📈🏆',
    title: 'Hit PRs, see your\nstrength grow',
    subtitle: 'Automatic PR detection and progress graphs. Watch those numbers climb.',
    gradient: ['#f093fb', '#f5576c'],
  },
  {
    emoji: '🤖✨',
    title: 'Your AI workout\ncoach, Atlas',
    subtitle: 'Get personalized training advice, form tips, and answers to your fitness questions 24/7.',
    gradient: ['#4facfe', '#00f2fe'],
  },
  {
    emoji: '🍗💯',
    title: 'Fuel your gains with\nprotein tracking',
    subtitle: 'Quick food logging focused on what matters most - hitting your protein goal.',
    gradient: ['#43e97b', '#38f9d7'],
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { theme, colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < slides.length) {
      setCurrentIndex(newIndex);
    }
  };

  const scrollToNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete();
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      // Still complete onboarding even if storage fails
      onComplete();
    }
  };

  const handleSkip = async () => {
    await handleComplete();
  };

  const isLastSlide = currentIndex === slides.length - 1;

  const dynamicStyles = {
    container: {
      ...styles.container,
      backgroundColor: colors.background,
    },
    skipButton: {
      ...styles.skipButton,
    },
    skipText: {
      ...styles.skipText,
      color: colors.textSecondary,
    },
    slideTitle: {
      ...styles.slideTitle,
      color: colors.textPrimary,
    },
    slideSubtitle: {
      ...styles.slideSubtitle,
      color: colors.textSecondary,
    },
    dotInactive: {
      ...styles.dot,
      backgroundColor: colors.border,
    },
    dotActive: {
      ...styles.dot,
      ...styles.dotActive,
      backgroundColor: colors.primary,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Skip Button */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={dynamicStyles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}>
          <Text style={dynamicStyles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Dot Indicators */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={
              index === currentIndex
                ? dynamicStyles.dotActive
                : dynamicStyles.dotInactive
            }
          />
        ))}
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={styles.scrollView}>
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.slideContent}>
              {/* Emoji Hero */}
              <View style={styles.emojiContainer}>
                <Text style={styles.emoji}>{slide.emoji}</Text>
              </View>

              {/* Text Content */}
              <View style={styles.textContent}>
                <Text style={dynamicStyles.slideTitle}>{slide.title}</Text>
                <Text style={dynamicStyles.slideSubtitle}>{slide.subtitle}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <Button
          title={isLastSlide ? 'Get Started' : 'Next'}
          onPress={isLastSlide ? handleComplete : scrollToNext}
          fullWidth
          size="large"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerSpacer: {
    width: 60,
  },
  skipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipText: {
    ...typography.body,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  slideContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiContainer: {
    marginBottom: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 120,
    lineHeight: 140,
    textAlign: 'center',
  },
  textContent: {
    width: '100%',
    alignItems: 'center',
  },
  slideTitle: {
    ...typography.displayLarge,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 40,
  },
  slideSubtitle: {
    ...typography.body,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  bottomContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
  },
});

export default OnboardingScreen;
