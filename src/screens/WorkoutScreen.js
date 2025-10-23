import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { addWorkoutToHistory, clearActiveWorkout, saveActiveWorkout } from '../services/storage';
import { createWorkoutLog, calculateWorkoutStats } from '../utils/workoutGenerator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WorkoutScreen({ route, navigation }) {
  const { template } = route.params;

  // State
  const [workoutLog, setWorkoutLog] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutStartTime] = useState(new Date().toISOString());
  const [workoutElapsedTime, setWorkoutElapsedTime] = useState(0);

  // Refs
  const flatListRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize workout on mount
  useEffect(() => {
    const log = createWorkoutLog(template);
    setWorkoutLog(log);
    console.log('Workout initialized:', log.name);

    // Start workout timer
    timerRef.current = setInterval(() => {
      setWorkoutElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [template]);

  // Auto-save workout every 30 seconds
  useEffect(() => {
    if (!workoutLog) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        await saveActiveWorkout(workoutLog);
        console.log('Auto-saved workout');
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [workoutLog]);

  // Format elapsed time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update set data (weight or reps)
  const updateSet = (exerciseIndex, setIndex, field, value) => {
    setWorkoutLog(prev => {
      const updated = { ...prev };
      updated.exercises[exerciseIndex].sets[setIndex][field] = value;
      return updated;
    });
  };

  // Mark set as complete
  const completeSet = (exerciseIndex, setIndex) => {
    setWorkoutLog(prev => {
      const updated = { ...prev };
      const set = updated.exercises[exerciseIndex].sets[setIndex];

      // Toggle completion
      set.completed = !set.completed;

      return updated;
    });
  };

  // Handle cancel workout
  const handleCancelWorkout = () => {
    Alert.alert(
      'Cancel Workout',
      'Are you sure you want to cancel this workout? All progress will be lost.',
      [
        { text: 'Continue Workout', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: async () => {
            await clearActiveWorkout();
            navigation.goBack();
          }
        }
      ]
    );
  };

  // Finish workout
  const handleFinishWorkout = async () => {
    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish this workout?',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            try {
              // Calculate stats
              const stats = calculateWorkoutStats(workoutLog);
              const durationMinutes = Math.round(workoutElapsedTime / 60);

              // Update workout log with completion data
              const completedLog = {
                ...workoutLog,
                completedAt: new Date().toISOString(),
                totalVolume: stats.totalVolume,
                totalSets: stats.totalSets,
                totalReps: stats.totalReps,
                durationMinutes: durationMinutes
              };

              // Save to history
              await addWorkoutToHistory(completedLog);

              // Clear active workout
              await clearActiveWorkout();

              console.log('Workout completed:', completedLog);

              // Navigate back to home
              navigation.navigate('Home');
            } catch (error) {
              console.error('Error finishing workout:', error);
              Alert.alert('Error', 'Failed to save workout. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Render exercise card
  const renderExerciseCard = ({ item: exercise, index }) => {
    return (
      <View style={styles.exerciseCard}>
        <ScrollView
          style={styles.exerciseScrollView}
          contentContainerStyle={styles.exerciseScrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Exercise GIF */}
          {exercise.gifUrl && (
            <View style={styles.gifContainer}>
              <Image
                source={{ uri: exercise.gifUrl }}
                style={styles.exerciseGif}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Exercise Info */}
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>

            <View style={styles.chipsContainer}>
              {exercise.bodyPart && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{exercise.bodyPart}</Text>
                </View>
              )}
              {exercise.target && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{exercise.target}</Text>
                </View>
              )}
              {exercise.equipment && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{exercise.equipment}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Sets Table */}
          <View style={styles.setsContainer}>
            <Text style={styles.setsTitle}>Sets</Text>

            {/* Header Row */}
            <View style={styles.setsHeader}>
              <Text style={[styles.headerText, styles.setNumberCol]}>Set</Text>
              <Text style={[styles.headerText, styles.weightCol]}>Weight</Text>
              <Text style={[styles.headerText, styles.repsCol]}>Reps</Text>
              <Text style={[styles.headerText, styles.completeCol]}></Text>
            </View>

            {/* Set Rows */}
            {exercise.sets.map((set, setIndex) => (
              <View
                key={setIndex}
                style={[
                  styles.setRow,
                  set.completed && styles.setRowCompleted
                ]}
              >
                {/* Set Number */}
                <Text style={[styles.setNumber, styles.setNumberCol]}>
                  {set.setNumber}
                </Text>

                {/* Weight Input */}
                <TextInput
                  style={[styles.input, styles.weightCol]}
                  value={set.weight ? String(set.weight) : ''}
                  onChangeText={(text) => {
                    const value = text.replace(/[^0-9.]/g, '');
                    updateSet(index, setIndex, 'weight', value ? parseFloat(value) : null);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#666"
                />

                {/* Reps Input */}
                <TextInput
                  style={[styles.input, styles.repsCol]}
                  value={set.reps ? String(set.reps) : ''}
                  onChangeText={(text) => {
                    const value = text.replace(/[^0-9]/g, '');
                    updateSet(index, setIndex, 'reps', value ? parseInt(value) : null);
                  }}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#666"
                />

                {/* Complete Button */}
                <TouchableOpacity
                  style={[
                    styles.completeButton,
                    styles.completeCol,
                    set.completed && styles.completeButtonActive
                  ]}
                  onPress={() => completeSet(index, setIndex)}
                >
                  <Text style={styles.completeButtonText}>
                    {set.completed ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Bottom spacing for keyboard */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  };

  if (!workoutLog) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  const isLastExercise = currentExerciseIndex === workoutLog.exercises.length - 1;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancelWorkout} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle}>{workoutLog.name}</Text>
          <Text style={styles.workoutTimer}>{formatTime(workoutElapsedTime)}</Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.exerciseProgress}>
            {currentExerciseIndex + 1} / {workoutLog.exercises.length}
          </Text>
        </View>
      </View>

      {/* Exercise FlatList */}
      <FlatList
        ref={flatListRef}
        data={workoutLog.exercises}
        renderItem={renderExerciseCard}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentExerciseIndex(index);
        }}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index
        })}
      />

      {/* Footer - Finish Workout Button */}
      {isLastExercise && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishWorkout}
          >
            <Text style={styles.finishButtonText}>Finish Workout</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  loadingText: {
    color: '#fff',
    fontSize: 16
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  cancelButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#ff4444',
    fontSize: 24,
    fontWeight: 'bold'
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center'
  },
  workoutTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  workoutTimer: {
    color: '#00ff88',
    fontSize: 14,
    marginTop: 2
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end'
  },
  exerciseProgress: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600'
  },

  // Exercise Card
  exerciseCard: {
    width: SCREEN_WIDTH,
    flex: 1
  },
  exerciseScrollView: {
    flex: 1
  },
  exerciseScrollContent: {
    padding: 20
  },

  // Exercise GIF
  gifContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20
  },
  exerciseGif: {
    width: '100%',
    height: '100%'
  },

  // Exercise Info
  exerciseInfo: {
    marginBottom: 24
  },
  exerciseName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'capitalize'
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  chipText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize'
  },

  // Sets Table
  setsContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16
  },
  setsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12
  },
  setsHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 8
  },
  headerText: {
    color: '#999',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a'
  },
  setRowCompleted: {
    opacity: 0.6
  },

  // Column widths
  setNumberCol: {
    width: 40
  },
  weightCol: {
    flex: 1,
    marginHorizontal: 8
  },
  repsCol: {
    flex: 1,
    marginHorizontal: 8
  },
  completeCol: {
    width: 50
  },

  // Inputs
  setNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    textAlign: 'center'
  },
  completeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  completeButtonActive: {
    backgroundColor: '#00ff88'
  },
  completeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },

  // Footer
  footer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333'
  },
  finishButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  finishButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
