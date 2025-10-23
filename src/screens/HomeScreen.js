import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { getUserProfile, getWorkoutTemplates, getActiveWorkout } from '../services/storage';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [todaysWorkout, setTodaysWorkout] = useState(null);

  // Load data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load user profile
      const profile = await getUserProfile();
      setUserProfile(profile);

      // Load workout templates
      const loadedTemplates = await getWorkoutTemplates();
      setTemplates(loadedTemplates);

      // Check for active workout (for Phase 2)
      const active = await getActiveWorkout();
      setActiveWorkout(active);

      // Determine today's workout (simple rotation by day of week)
      if (loadedTemplates.length > 0) {
        const dayOfWeek = new Date().getDay();
        const workoutIndex = dayOfWeek % loadedTemplates.length;
        setTodaysWorkout(loadedTemplates[workoutIndex]);
      }

      console.log(`✅ Loaded ${loadedTemplates.length} workout templates`);
    } catch (error) {
      console.error('❌ Error loading home screen data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWorkout = (template) => {
    // Navigate to WorkoutScreen with template data
    navigation.navigate('Workout', { template });
  };

  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Loading your workouts...</Text>
        </View>
      </View>
    );
  }

  if (!userProfile || templates.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No workout data found</Text>
          <Text style={styles.emptySubtext}>
            Please restart the app to set up your profile
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ready to train?</Text>
          <Text style={styles.headerSubtitle}>
            {userProfile.fitnessGoals.map(g => g.toUpperCase()).join(' • ')}
          </Text>
        </View>

        {/* Active Workout or Today's Workout */}
        {activeWorkout ? (
          <View style={styles.todaysWorkoutCard}>
            <Text style={styles.cardLabel}>CONTINUE WORKOUT</Text>
            <Text style={styles.todaysWorkoutTitle}>{activeWorkout.name}</Text>
            <Text style={styles.todaysWorkoutMeta}>
              In Progress • Started {new Date(activeWorkout.startedAt).toLocaleTimeString()}
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => handleStartWorkout(activeWorkout)}
            >
              <Text style={styles.startButtonText}>Continue Workout</Text>
            </TouchableOpacity>
          </View>
        ) : todaysWorkout ? (
          <View style={styles.todaysWorkoutCard}>
            <Text style={styles.cardLabel}>TODAY'S WORKOUT</Text>
            <Text style={styles.todaysWorkoutTitle}>{todaysWorkout.name}</Text>
            <Text style={styles.todaysWorkoutMeta}>
              {todaysWorkout.exercises.length} exercises • ~{todaysWorkout.estimatedDuration} min
            </Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => handleStartWorkout(todaysWorkout)}
            >
              <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* All Workouts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Workouts</Text>

          {templates.map((template, index) => (
            <TouchableOpacity
              key={template.templateId}
              style={styles.workoutCard}
              onPress={() => handleStartWorkout(template)}
            >
              <View style={styles.workoutCardContent}>
                <View style={styles.workoutCardLeft}>
                  <Text style={styles.workoutCardTitle}>{template.name}</Text>
                  <Text style={styles.workoutCardMeta}>
                    {template.exercises.length} exercises
                  </Text>
                </View>
                <Text style={styles.workoutCardArrow}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleViewHistory}
          >
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardText}>📊 View History</Text>
              <Text style={styles.workoutCardArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center'
  },
  header: {
    marginBottom: 24
  },
  headerTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8
  },
  headerSubtitle: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1
  },
  cardLabel: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 8
  },
  todaysWorkoutCard: {
    backgroundColor: '#00ff88',
    padding: 24,
    borderRadius: 16,
    marginBottom: 32
  },
  todaysWorkoutTitle: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8
  },
  todaysWorkoutMeta: {
    color: '#003311',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20
  },
  startButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  startButtonText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16
  },
  workoutCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333'
  },
  workoutCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  workoutCardLeft: {
    flex: 1
  },
  workoutCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4
  },
  workoutCardMeta: {
    color: '#999',
    fontSize: 14
  },
  workoutCardArrow: {
    color: '#999',
    fontSize: 24,
    marginLeft: 12
  },
  actionCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333'
  },
  actionCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  actionCardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
