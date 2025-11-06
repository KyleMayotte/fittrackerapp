import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { typography, spacing, radius } from '../theme';
import { colors } from '../theme/colors';
import type { PRCelebration } from '../types/pr';
import { pickWorkoutPhoto } from '../utils/workoutPhotoUpload';

interface WorkoutCompletionModalProps {
  visible: boolean;
  workoutName: string;
  emoji: string;
  duration: number; // in minutes
  totalSets: number;
  totalVolume: number; // in lbs
  prs: PRCelebration[]; // Array of PRs achieved in this workout
  atlasMessage?: string; // Optional Atlas analysis
  isLoadingAtlas?: boolean; // Loading state for Atlas analysis
  isUploadingPhoto?: boolean; // Loading state for photo upload
  onClose: () => void;
  onPhotoSelected?: (photoUri: string) => void; // Callback when photo is selected
  onShare?: () => void; // Callback for share button
}

const { width } = Dimensions.get('window');

export const WorkoutCompletionModal: React.FC<WorkoutCompletionModalProps> = ({
  visible,
  workoutName,
  emoji,
  duration,
  totalSets,
  totalVolume,
  prs,
  atlasMessage,
  isLoadingAtlas,
  isUploadingPhoto,
  onClose,
  onPhotoSelected,
  onShare,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);

  const hasPRs = prs.length > 0;

  useEffect(() => {
    if (visible) {
      // Scale and fade in animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for trophy
      if (hasPRs) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [visible, hasPRs]);

  const handleClose = () => {
    // Pass selected photo to parent before closing
    if (selectedPhotoUri && onPhotoSelected) {
      onPhotoSelected(selectedPhotoUri);
    }

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Reset photo selection for next time
      setSelectedPhotoUri(null);
    });
  };

  const handleAddPhoto = async () => {
    try {
      const photo = await pickWorkoutPhoto();
      if (photo && photo.uri) {
        setSelectedPhotoUri(photo.uri);
      }
    } catch (error: any) {
      console.error('Error picking photo:', error);
      // Alert user about permission or error
      if (error.message && error.message.includes('permission')) {
        Alert.alert(
          'Permission Required',
          'Please grant camera and photo library permissions to add workout photos.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Photo Selection Failed',
          'Could not select photo. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />
      <Animated.View
        style={[
          styles.container,
          hasPRs && styles.containerWithPR,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Header */}
        {hasPRs ? (
          <Animated.Text
            style={[
              styles.mainEmoji,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            🏆
          </Animated.Text>
        ) : (
          <Text style={styles.mainEmoji}>✅</Text>
        )}

        <Text style={[styles.mainTitle, hasPRs && styles.prMainTitle]}>
          {hasPRs ? `NEW PR${prs.length > 1 ? 'S' : ''}!` : 'Workout Complete!'}
        </Text>

        {/* PR Summary - compact */}
        {hasPRs && (
          <View style={styles.prSummary}>
            {prs.map((pr, index) => (
              <Text key={index} style={styles.prText}>
                💪 {pr.exerciseName} - {pr.newWeight}lbs × {pr.newReps} <Text style={styles.improvement}>({pr.improvement})</Text>
              </Text>
            ))}
          </View>
        )}

        {/* Workout Name */}
        <Text style={styles.workoutName}>
          {emoji} {workoutName}
        </Text>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>sets</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{duration}</Text>
            <Text style={styles.statLabel}>min</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{(totalVolume / 1000).toFixed(1)}k</Text>
            <Text style={styles.statLabel}>lbs</Text>
          </View>
        </View>

        {/* Atlas Message - condensed */}
        {(isLoadingAtlas || atlasMessage) && (
          <View style={styles.atlasBox}>
            {isLoadingAtlas ? (
              <View style={styles.atlasLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.atlasLoadingText}>Atlas is analyzing your workout...</Text>
              </View>
            ) : (
              <Text style={styles.atlasText}>
                <Text style={styles.atlasIcon}>🤖 </Text>
                {atlasMessage}
              </Text>
            )}
          </View>
        )}

        {/* Photo Preview */}
        {selectedPhotoUri && (
          <View style={styles.photoPreview}>
            <Image
              source={{ uri: selectedPhotoUri }}
              style={styles.photoImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => setSelectedPhotoUri(null)}>
              <Text style={styles.removePhotoText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Photo and Share Buttons Row */}
        {!selectedPhotoUri && (
          <View style={styles.photoShareRow}>
            <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
              <Text style={styles.addPhotoText}>📷 Add Photo</Text>
            </TouchableOpacity>

            {onShare && (
              <TouchableOpacity style={styles.shareButton} onPress={onShare}>
                <Text style={styles.shareButtonText}>Share 📤</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeButton, isUploadingPhoto && styles.closeButtonDisabled]}
          onPress={handleClose}
          disabled={isUploadingPhoto}
        >
          {isUploadingPhoto ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={colors.textInverse} />
              <Text style={styles.closeButtonText}>Uploading Photo...</Text>
            </View>
          ) : (
            <Text style={styles.closeButtonText}>
              {hasPRs ? 'HELL YEAH! 🔥' : 'NICE WORK!'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    width: width * 0.9,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  containerWithPR: {
    borderWidth: 3,
    borderColor: '#FFD700', // Gold border for PRs
  },

  // Main Header
  mainEmoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  mainTitle: {
    ...typography.h1,
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  prMainTitle: {
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // PR Summary - compact
  prSummary: {
    width: '100%',
    backgroundColor: colors.primary + '15',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  prText: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  improvement: {
    color: '#4CAF50',
    fontWeight: '700',
  },

  // Workout Name
  workoutName: {
    ...typography.h3,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },

  // Atlas Box - condensed
  atlasBox: {
    width: '100%',
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  atlasText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  atlasIcon: {
    fontSize: 16,
  },
  atlasLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  atlasLoadingText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // Photo and Share Row
  photoShareRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginBottom: spacing.md,
  },
  addPhotoButton: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    ...typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },

  // Close Button
  closeButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  closeButtonDisabled: {
    opacity: 0.6,
  },
  closeButtonText: {
    ...typography.button,
    fontSize: 17,
    fontWeight: '900',
    color: colors.textInverse,
    letterSpacing: 1.2,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  // Photo Components
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
