import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getWorkoutHistory } from '../services/storage';

export default function HistoryScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState(null);

  // Load workout history when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const history = await getWorkoutHistory();
      setWorkoutHistory(history);
      console.log(`Loaded ${history.length} workout logs`);
    } catch (error) {
      console.error('Error loading workout history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for grouping
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if same day
    const isSameDay = (d1, d2) => {
      return d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();
    };

    if (isSameDay(date, today)) {
      return 'Today';
    } else if (isSameDay(date, yesterday)) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Format time
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Toggle workout expansion
  const toggleExpand = (logId) => {
    setExpandedWorkoutId(expandedWorkoutId === logId ? null : logId);
  };

  // Repeat workout - navigate to WorkoutScreen with template
  const handleRepeatWorkout = (workout) => {
    // Create a template from the workout log
    const template = {
      templateId: workout.templateId,
      name: workout.name,
      type: workout.type,
      exercises: workout.exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        bodyPart: ex.bodyPart,
        target: ex.target,
        equipment: ex.equipment,
        gifUrl: ex.gifUrl || null,
        sets: ex.sets.length,
        targetReps: '8-12', // Default
        restTime: 90, // Default
        notes: null
      }))
    };

    navigation.navigate('Workout', { template });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff88" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (workoutHistory.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No workouts yet</Text>
        <Text style={styles.emptyText}>
          Complete your first workout to see it here!
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.emptyButtonText}>Start Your First Workout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Group workouts by date
  const groupedWorkouts = workoutHistory.reduce((groups, workout) => {
    const dateKey = formatDate(workout.completedAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(workout);
    return groups;
  }, {});

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Total Workouts</Text>
        <Text style={styles.statsValue}>{workoutHistory.length}</Text>
      </View>

      {/* Grouped Workout List */}
      {Object.keys(groupedWorkouts).map((dateKey) => (
        <View key={dateKey} style={styles.dateGroup}>
          <Text style={styles.dateHeader}>{dateKey}</Text>

          {groupedWorkouts[dateKey].map((workout) => {
            const isExpanded = expandedWorkoutId === workout.logId;

            return (
              <View key={workout.logId} style={styles.workoutCard}>
                {/* Workout Summary */}
                <TouchableOpacity
                  style={styles.workoutSummary}
                  onPress={() => toggleExpand(workout.logId)}
                >
                  <View style={styles.workoutHeader}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <Text style={styles.workoutTime}>{formatTime(workout.completedAt)}</Text>
                  </View>

                  <View style={styles.workoutStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Duration</Text>
                      <Text style={styles.statValue}>{formatDuration(workout.durationMinutes)}</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Volume</Text>
                      <Text style={styles.statValue}>{Math.round(workout.totalVolume)} lbs</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Sets</Text>
                      <Text style={styles.statValue}>{workout.totalSets}</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Exercises</Text>
                      <Text style={styles.statValue}>{workout.exercises.length}</Text>
                    </View>
                  </View>

                  <Text style={styles.expandIndicator}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.workoutDetails}>
                    <Text style={styles.detailsTitle}>Exercises</Text>

                    {workout.exercises.map((exercise, idx) => (
                      <View key={idx} style={styles.exerciseDetail}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>

                        <View style={styles.setsDetail}>
                          {exercise.sets.filter(s => s.completed).map((set, setIdx) => (
                            <Text key={setIdx} style={styles.setText}>
                              Set {set.setNumber}: {set.weight} lbs × {set.reps} reps
                            </Text>
                          ))}
                        </View>
                      </View>
                    ))}

                    {/* Repeat Workout Button */}
                    <TouchableOpacity
                      style={styles.repeatButton}
                      onPress={() => handleRepeatWorkout(workout)}
                    >
                      <Text style={styles.repeatButtonText}>Repeat This Workout</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}

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
    padding: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 40
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32
  },
  emptyButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12
  },
  emptyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold'
  },

  // Stats Summary
  statsContainer: {
    backgroundColor: '#00ff88',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24
  },
  statsTitle: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  statsValue: {
    color: '#000',
    fontSize: 48,
    fontWeight: 'bold'
  },

  // Date Groups
  dateGroup: {
    marginBottom: 24
  },
  dateHeader: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 1
  },

  // Workout Cards
  workoutCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333'
  },
  workoutSummary: {
    padding: 16
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  workoutName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1
  },
  workoutTime: {
    color: '#999',
    fontSize: 14
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4
  },
  statValue: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold'
  },
  expandIndicator: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8
  },

  // Workout Details
  workoutDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#333'
  },
  detailsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  exerciseDetail: {
    marginBottom: 16
  },
  exerciseName: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'capitalize'
  },
  setsDetail: {
    paddingLeft: 12
  },
  setText: {
    color: '#999',
    fontSize: 13,
    marginBottom: 4
  },
  repeatButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  repeatButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold'
  }
});
