import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { getExercisePR, getWorkoutHistory } from '../services/storage';

export default function ExerciseDetailScreen({ route }) {
  const { exercise } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [personalRecord, setPersonalRecord] = useState(null);
  const [lastPerformed, setLastPerformed] = useState(null);

  useEffect(() => {
    loadExerciseData();
  }, [exercise]);

  const loadExerciseData = async () => {
    try {
      setIsLoading(true);

      // Get personal record for this exercise
      const pr = await getExercisePR(exercise.name);
      setPersonalRecord(pr);

      // Get last time this exercise was performed
      const history = await getWorkoutHistory();
      const lastWorkout = history.find(workout =>
        workout.exercises.some(ex => ex.name === exercise.name)
      );

      if (lastWorkout) {
        setLastPerformed(lastWorkout.completedAt);
      }

      console.log(`Loaded data for exercise: ${exercise.name}`);
    } catch (error) {
      console.error('Error loading exercise data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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
      <View style={styles.infoSection}>
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

      {/* Personal Records Section */}
      {isLoading ? (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color="#00ff88" />
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      ) : (
        <>
          {/* Personal Record */}
          {personalRecord ? (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Personal Record</Text>
              <View style={styles.prContainer}>
                <Text style={styles.prValue}>
                  {personalRecord.max_weight} lbs × {personalRecord.reps} reps
                </Text>
                <Text style={styles.prLabel}>Heaviest Weight</Text>
              </View>
            </View>
          ) : (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Personal Record</Text>
              <Text style={styles.noDataText}>No PR yet - complete this exercise to set your record!</Text>
            </View>
          )}

          {/* Last Performed */}
          {lastPerformed ? (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Last Performed</Text>
              <Text style={styles.lastPerformedDate}>{formatDate(lastPerformed)}</Text>
            </View>
          ) : (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Last Performed</Text>
              <Text style={styles.noDataText}>Not performed yet</Text>
            </View>
          )}
        </>
      )}

      {/* Instructions Section (Placeholder) */}
      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>About This Exercise</Text>
        <Text style={styles.instructionsText}>
          This exercise targets your {exercise.target || 'muscles'} using {exercise.equipment || 'equipment'}.
        </Text>
        <Text style={styles.instructionsText}>
          Focus on proper form and controlled movements for best results.
        </Text>
      </View>

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Tips</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>Warm up properly before starting</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>Control the weight throughout the movement</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>Focus on mind-muscle connection</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>Rest adequately between sets</Text>
        </View>
      </View>

      {/* Bottom spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  scrollContent: {
    paddingBottom: 20
  },

  // Exercise GIF
  gifContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#1a1a1a'
  },
  exerciseGif: {
    width: '100%',
    height: '100%'
  },

  // Exercise Info
  infoSection: {
    padding: 20
  },
  exerciseName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'capitalize'
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20
  },
  chipText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize'
  },

  // Loading Section
  loadingSection: {
    padding: 20,
    alignItems: 'center'
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8
  },

  // Stats Cards
  statsCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333'
  },
  statsTitle: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 1
  },
  prContainer: {
    alignItems: 'center'
  },
  prValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8
  },
  prLabel: {
    color: '#999',
    fontSize: 14
  },
  lastPerformedDate: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600'
  },
  noDataText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic'
  },

  // Instructions Section
  instructionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12
  },
  instructionsText: {
    color: '#999',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8
  },

  // Tips Section
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 24
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 8
  },
  tipBullet: {
    color: '#00ff88',
    fontSize: 18,
    marginRight: 12,
    width: 20
  },
  tipText: {
    color: '#999',
    fontSize: 15,
    lineHeight: 22,
    flex: 1
  }
});
