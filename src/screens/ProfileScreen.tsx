import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, Card, Input } from '../components';
import { typography, spacing, radius } from '../theme';
import { lightColors } from '../theme/colors';
import exerciseService from '../services/exercise';

interface ProfileData {
  heightFeet?: number;
  heightInches?: number;
  weight?: number; // lbs
  age?: number;
  proteinGoal?: number; // grams
  workoutGoal?: number; // workouts per week
}

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthContext();
  const { theme, colors, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const userEmail = user?.email || '';

  const [profile, setProfile] = useState<ProfileData>({});
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');
  const [workoutGoal, setWorkoutGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [customExercises, setCustomExercises] = useState<string[]>([]);

  useEffect(() => {
    loadProfile();
    loadCustomExercises();
  }, []);

  const loadCustomExercises = async () => {
    const exercises = await exerciseService.getCustomExercises();
    setCustomExercises(exercises);
  };

  const handleDeleteExercise = (exerciseName: string) => {
    Alert.alert(
      'Delete Custom Exercise',
      `Are you sure you want to delete "${exerciseName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await exerciseService.deleteCustomExercise(exerciseName);
            loadCustomExercises();
          },
        },
      ]
    );
  };

  const loadProfile = async () => {
    try {
      const storageKey = `@muscleup/profile_${userEmail}`;
      const storedProfile = await AsyncStorage.getItem(storageKey);
      if (storedProfile) {
        const data = JSON.parse(storedProfile);
        setProfile(data);
        setHeightFeet(data.heightFeet?.toString() || '');
        setHeightInches(data.heightInches?.toString() || '');
        setWeight(data.weight?.toString() || '');
        setAge(data.age?.toString() || '');
        setProteinGoal(data.proteinGoal?.toString() || '');
        setWorkoutGoal(data.workoutGoal?.toString() || '');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const saveProfile = async () => {
    // Prevent multiple simultaneous saves
    if (isSaving) return;

    try {
      setIsSaving(true);

      const profileData: ProfileData = {
        heightFeet: heightFeet ? parseInt(heightFeet) : undefined,
        heightInches: heightInches ? parseFloat(heightInches) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        age: age ? parseInt(age) : undefined,
        proteinGoal: proteinGoal ? parseFloat(proteinGoal) : undefined,
        workoutGoal: workoutGoal ? parseInt(workoutGoal) : undefined,
      };

      const storageKey = `@muscleup/profile_${userEmail}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(profileData));
      setProfile(profileData);
      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const calculateBMI = () => {
    if ((profile.heightFeet || profile.heightInches) && profile.weight) {
      const totalInches = (profile.heightFeet || 0) * 12 + (profile.heightInches || 0);
      const heightInMeters = totalInches * 0.0254;
      const weightInKg = profile.weight * 0.453592;
      const bmi = weightInKg / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getTotalHeight = () => {
    if (profile.heightFeet || profile.heightInches) {
      const feet = profile.heightFeet || 0;
      const inches = profile.heightInches || 0;
      return `${feet}'${inches}"`;
    }
    return null;
  };

  const bmi = calculateBMI();

  const dynamicStyles = {
    container: {
      ...styles.container,
      backgroundColor: colors.background,
    },
    backIcon: {
      ...styles.backIcon,
      color: colors.textPrimary,
    },
    headerTitle: {
      ...styles.headerTitle,
      color: colors.textPrimary,
    },
    userName: {
      ...styles.userName,
      color: colors.textPrimary,
    },
    userEmail: {
      ...styles.userEmail,
      color: colors.textSecondary,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={dynamicStyles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>Profile & Settings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* User Info Card */}
        <Card style={styles.card} shadow="medium">
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.name || user?.email)?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={dynamicStyles.userName}>{user?.name || user?.email}</Text>
            <Text style={dynamicStyles.userEmail}>{user?.email}</Text>
          </View>
        </Card>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance</Text>
          <Card style={styles.card}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
                <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
                  {theme === 'dark' ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>
          </Card>
        </View>

        {/* Custom Exercises Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Custom Exercises ({customExercises.length})
          </Text>
          <Card style={styles.card}>
            {customExercises.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No custom exercises yet. Create one when adding exercises to a workout.
              </Text>
            ) : (
              customExercises.map((exercise, index) => (
                <View
                  key={exercise}
                  style={[
                    styles.exerciseRow,
                    index < customExercises.length - 1 && styles.exerciseRowBorder,
                    { borderBottomColor: colors.border },
                  ]}>
                  <Text style={[styles.exerciseName, { color: colors.textPrimary }]}>{exercise}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteExercise(exercise)}
                    style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card>
        </View>

        {/* Measurements Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Measurements</Text>
          <Card style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Height</Text>
              <View style={styles.heightRow}>
                <View style={styles.heightInput}>
                  <Input
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                    placeholder="5"
                    keyboardType="number-pad"
                  />
                  <Text style={[styles.heightLabel, { color: colors.textSecondary }]}>ft</Text>
                </View>
                <View style={styles.heightInput}>
                  <Input
                    value={heightInches}
                    onChangeText={setHeightInches}
                    placeholder="10"
                    keyboardType="decimal-pad"
                  />
                  <Text style={[styles.heightLabel, { color: colors.textSecondary }]}>in</Text>
                </View>
              </View>
              {getTotalHeight() && (
                <Text style={[styles.heightTotal, { color: colors.textSecondary }]}>
                  Total: {getTotalHeight()}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Weight (lbs)</Text>
              <Input
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g., 180"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Age</Text>
              <Input
                value={age}
                onChangeText={setAge}
                placeholder="e.g., 25"
                keyboardType="number-pad"
              />
            </View>

            {bmi && (
              <View style={[styles.bmiContainer, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.bmiLabel, { color: colors.textSecondary }]}>BMI:</Text>
                <Text style={[styles.bmiValue, { color: colors.primary }]}>{bmi}</Text>
              </View>
            )}
          </Card>
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Goals</Text>
          <Card style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Daily Protein Goal (g)</Text>
              <Input
                value={proteinGoal}
                onChangeText={setProteinGoal}
                placeholder="e.g., 150"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Weekly Workout Goal</Text>
              <Input
                value={workoutGoal}
                onChangeText={setWorkoutGoal}
                placeholder="e.g., 4"
                keyboardType="number-pad"
              />
            </View>
          </Card>
        </View>

        {/* Save Button */}
        <Button
          title="Save Profile"
          onPress={saveProfile}
          style={styles.saveButton}
          loading={isSaving}
          disabled={isSaving}
        />

        {/* Logout Button */}
        <Button
          title="Logout"
          variant="secondary"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  backIcon: {
    fontSize: 28,
  },
  headerTitle: {
    ...typography.h2,
  },
  placeholder: {
    width: 44, // Same width as back button to center title
  },
  card: {
    padding: spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: lightColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.h1,
    color: lightColors.surface,
    fontWeight: '700',
  },
  userName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  inputHint: {
    ...typography.caption,
    fontSize: 12,
    marginTop: spacing.xs / 2,
  },
  heightRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heightInput: {
    flex: 1,
    position: 'relative',
  },
  heightLabel: {
    ...typography.body,
    fontWeight: '600',
    position: 'absolute',
    right: spacing.md,
    top: spacing.md + 2,
  },
  heightTotal: {
    ...typography.caption,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  bmiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  bmiLabel: {
    ...typography.body,
    marginRight: spacing.sm,
  },
  bmiValue: {
    ...typography.h3,
    fontWeight: '700',
  },
  saveButton: {
    marginBottom: spacing.md,
  },
  logoutButton: {
    marginBottom: spacing.xl,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  exerciseRowBorder: {
    borderBottomWidth: 1,
  },
  exerciseName: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '500',
  },
  deleteButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: lightColors.error + '15',
  },
  deleteButtonText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: lightColors.error,
  },
  emptyText: {
    ...typography.body,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ProfileScreen;
