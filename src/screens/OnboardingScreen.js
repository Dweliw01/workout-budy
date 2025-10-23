import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { saveUserProfile, saveWorkoutTemplates } from '../services/storage';
import { generateWorkoutPlan } from '../utils/workoutGenerator';
import { CommonActions } from '@react-navigation/native';

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 1: Fitness Goals
  const [fitnessGoals, setFitnessGoals] = useState([]);

  // Step 2: Experience Level
  const [experienceLevel, setExperienceLevel] = useState('');

  // Step 3: Available Equipment
  const [availableEquipment, setAvailableEquipment] = useState([]);

  // Step 4: Workout Split
  const [workoutSplit, setWorkoutSplit] = useState('');

  const FITNESS_GOALS = ['Strength', 'Hypertrophy', 'Endurance', 'Weight Loss'];

  const EXPERIENCE_LEVELS = [
    { value: 'Beginner', label: 'Beginner', description: '0-1 year of training' },
    { value: 'Intermediate', label: 'Intermediate', description: '1-3 years of training' },
    { value: 'Advanced', label: 'Advanced', description: '3+ years of training' }
  ];

  const EQUIPMENT_OPTIONS = [
    'Barbell',
    'Dumbbells',
    'Cable Machine',
    'Resistance Bands',
    'Bodyweight',
    'Smith Machine',
    'Kettlebell'
  ];

  const WORKOUT_SPLITS = [
    {
      value: 'PPL',
      label: 'Push Pull Legs',
      description: '6 days/week',
      frequency: 6
    },
    {
      value: 'UpperLower',
      label: 'Upper/Lower',
      description: '4 days/week',
      frequency: 4
    },
    {
      value: 'FullBody',
      label: 'Full Body',
      description: '3 days/week',
      frequency: 3
    }
  ];

  // Toggle selection for multi-select
  const toggleSelection = (item, currentArray, setFunction) => {
    if (currentArray.includes(item)) {
      setFunction(currentArray.filter(i => i !== item));
    } else {
      setFunction([...currentArray, item]);
    }
  };

  // Validation
  const canProceed = () => {
    if (step === 1) return fitnessGoals.length > 0;
    if (step === 2) return experienceLevel !== '';
    if (step === 3) return availableEquipment.length > 0;
    if (step === 4) return workoutSplit !== '';
    return false;
  };

  // Handle next/back buttons
  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Handle onboarding completion
  const handleFinish = async () => {
    setIsProcessing(true);

    try {
      console.log('🏁 Completing onboarding...');

      // Get workout frequency from selected split
      const selectedSplit = WORKOUT_SPLITS.find(s => s.value === workoutSplit);

      // Create user profile
      const userProfile = {
        userId: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        fitnessGoals: fitnessGoals,
        experienceLevel: experienceLevel,
        availableEquipment: availableEquipment,
        workoutFrequency: selectedSplit.frequency,
        preferredSplit: workoutSplit,
        restTimerDefault: 90,
        weightUnit: 'lbs'
      };

      // Save user profile to SQLite
      await saveUserProfile(userProfile);
      console.log('✅ User profile saved');

      // Generate workout templates
      const templates = await generateWorkoutPlan(userProfile);

      if (templates.length > 0) {
        // Save templates to SQLite
        await saveWorkoutTemplates(templates);
        console.log('✅ Workout templates saved');

        // Navigate to Home (reset navigation stack)
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Home' }]
          })
        );
      } else {
        console.error('❌ No templates generated');
        alert('Error generating workouts. Please check your internet connection and try again.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      alert('An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.title}>What are your fitness goals?</Text>
            <Text style={styles.subtitle}>Select all that apply</Text>

            <View style={styles.optionsContainer}>
              {FITNESS_GOALS.map(goal => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.optionCard,
                    fitnessGoals.includes(goal) && styles.optionCardSelected
                  ]}
                  onPress={() => toggleSelection(goal, fitnessGoals, setFitnessGoals)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      fitnessGoals.includes(goal) && styles.optionTextSelected
                    ]}
                  >
                    {goal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.title}>What's your experience level?</Text>
            <Text style={styles.subtitle}>Select one</Text>

            <View style={styles.optionsContainer}>
              {EXPERIENCE_LEVELS.map(level => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.optionCard,
                    experienceLevel === level.value && styles.optionCardSelected
                  ]}
                  onPress={() => setExperienceLevel(level.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      experienceLevel === level.value && styles.optionTextSelected
                    ]}
                  >
                    {level.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      experienceLevel === level.value && styles.optionDescriptionSelected
                    ]}
                  >
                    {level.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.title}>What equipment do you have?</Text>
            <Text style={styles.subtitle}>Select all available</Text>

            <View style={styles.optionsContainer}>
              {EQUIPMENT_OPTIONS.map(equipment => (
                <TouchableOpacity
                  key={equipment}
                  style={[
                    styles.optionCard,
                    styles.optionCardSmall,
                    availableEquipment.includes(equipment) && styles.optionCardSelected
                  ]}
                  onPress={() =>
                    toggleSelection(equipment, availableEquipment, setAvailableEquipment)
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      availableEquipment.includes(equipment) && styles.optionTextSelected
                    ]}
                  >
                    {equipment}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      case 4:
        return (
          <>
            <Text style={styles.title}>Choose your workout split</Text>
            <Text style={styles.subtitle}>Select one</Text>

            <View style={styles.optionsContainer}>
              {WORKOUT_SPLITS.map(split => (
                <TouchableOpacity
                  key={split.value}
                  style={[
                    styles.optionCard,
                    workoutSplit === split.value && styles.optionCardSelected
                  ]}
                  onPress={() => setWorkoutSplit(split.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      workoutSplit === split.value && styles.optionTextSelected
                    ]}
                  >
                    {split.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      workoutSplit === split.value && styles.optionDescriptionSelected
                    ]}
                  >
                    {split.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );

      default:
        return null;
    }
  };

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.processingText}>Creating your workout plan...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>Step {step} of 4</Text>
        </View>

        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed() && styles.nextButtonDisabled,
              step === 1 && styles.nextButtonFullWidth
            ]}
            onPress={handleNext}
            disabled={!canProceed() ? true : false}
          >
            <Text style={styles.nextButtonText}>{step === 4 ? 'Finish' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100
  },
  header: {
    marginBottom: 32
  },
  stepIndicator: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600'
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8
  },
  subtitle: {
    color: '#999',
    fontSize: 16,
    marginBottom: 24
  },
  optionsContainer: {
  },
  optionCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    marginBottom: 12
  },
  optionCardSmall: {
    padding: 16
  },
  optionCardSelected: {
    backgroundColor: '#003311',
    borderColor: '#00ff88'
  },
  optionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  optionTextSelected: {
    color: '#00ff88'
  },
  optionDescription: {
    color: '#999',
    fontSize: 14,
    marginTop: 4
  },
  optionDescriptionSelected: {
    color: '#00ff88',
    opacity: 0.8
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333'
  },
  buttonRow: {
    flexDirection: 'row'
  },
  backButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 12
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#00ff88',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  nextButtonFullWidth: {
    flex: 1
  },
  nextButtonDisabled: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333'
  },
  nextButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold'
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16
  }
});
