import { getCachedExercises, filterExercises } from '../services/exerciseDB';

// Workout Split Configurations
const WORKOUT_SPLITS = {
  PPL: {
    name: 'Push Pull Legs',
    frequency: 6,
    workouts: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs']
  },
  UpperLower: {
    name: 'Upper/Lower',
    frequency: 4,
    workouts: ['Upper', 'Lower', 'Upper', 'Lower']
  },
  FullBody: {
    name: 'Full Body',
    frequency: 3,
    workouts: ['Full Body', 'Full Body', 'Full Body']
  }
};

// Exercise Selection by Workout Type
const WORKOUT_STRUCTURES = {
  Push: {
    bodyParts: ['chest', 'shoulders', 'triceps'],
    exerciseCount: { chest: 3, shoulders: 2, triceps: 2 }
  },
  Pull: {
    bodyParts: ['back', 'biceps'],
    exerciseCount: { back: 4, biceps: 2 }
  },
  Legs: {
    bodyParts: ['legs', 'glutes'],
    exerciseCount: { legs: 5, glutes: 1 }
  },
  Upper: {
    bodyParts: ['chest', 'back', 'shoulders', 'triceps', 'biceps'],
    exerciseCount: { chest: 2, back: 2, shoulders: 1, triceps: 1, biceps: 1 }
  },
  Lower: {
    bodyParts: ['legs', 'glutes', 'calves'],
    exerciseCount: { legs: 4, glutes: 2, calves: 1 }
  },
  'Full Body': {
    bodyParts: ['chest', 'back', 'legs', 'shoulders'],
    exerciseCount: { chest: 1, back: 2, legs: 2, shoulders: 1 }
  }
};

// Set/Rep Schemes by Goal and Experience
const REP_SCHEMES = {
  strength: {
    beginner: { sets: 3, reps: '5-8', rest: 180 },
    intermediate: { sets: 4, reps: '4-6', rest: 180 },
    advanced: { sets: 5, reps: '3-5', rest: 240 }
  },
  hypertrophy: {
    beginner: { sets: 3, reps: '8-12', rest: 90 },
    intermediate: { sets: 3, reps: '8-12', rest: 90 },
    advanced: { sets: 4, reps: '8-12', rest: 90 }
  },
  endurance: {
    beginner: { sets: 2, reps: '12-15', rest: 60 },
    intermediate: { sets: 3, reps: '15-20', rest: 60 },
    advanced: { sets: 3, reps: '20-25', rest: 45 }
  },
  'weight loss': {
    beginner: { sets: 3, reps: '12-15', rest: 60 },
    intermediate: { sets: 3, reps: '12-15', rest: 45 },
    advanced: { sets: 4, reps: '15-20', rest: 45 }
  }
};

// Helper to get primary goal
const getPrimaryGoal = (goals) => {
  if (!goals || goals.length === 0) return 'hypertrophy';

  const goalLower = goals[0].toLowerCase();

  // Map goal to rep scheme key
  if (goalLower.includes('strength')) return 'strength';
  if (goalLower.includes('hypertrophy')) return 'hypertrophy';
  if (goalLower.includes('endurance')) return 'endurance';
  if (goalLower.includes('weight') || goalLower.includes('loss')) return 'weight loss';

  return 'hypertrophy'; // Default
};

// Helper to get experience level key
const getExperienceKey = (level) => {
  const levelLower = level.toLowerCase();

  if (levelLower.includes('beginner')) return 'beginner';
  if (levelLower.includes('intermediate')) return 'intermediate';
  if (levelLower.includes('advanced')) return 'advanced';

  return 'beginner'; // Default
};

// Helper to normalize equipment names
const normalizeEquipment = (equipment) => {
  const equipmentLower = equipment.toLowerCase();

  // Map user's equipment to API equipment names
  const mapping = {
    'barbell': 'barbell',
    'dumbbells': 'dumbbell',
    'cable machine': 'cable',
    'resistance bands': 'band',
    'bodyweight': 'body weight',
    'smith machine': 'smith machine',
    'kettlebell': 'kettlebell'
  };

  return mapping[equipmentLower] || equipmentLower;
};

// Helper to randomly select exercises
const selectRandomExercises = (exercises, count) => {
  if (!exercises || exercises.length === 0) return [];

  const shuffled = [...exercises].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Generate workout plan based on user profile
export const generateWorkoutPlan = async (userProfile) => {
  try {
    console.log('🏋️ Generating workout plan...');

    // Get all exercises from API (cached)
    const allExercises = await getCachedExercises();

    if (!allExercises || allExercises.length === 0) {
      console.warn('⚠️ No exercises available from API');
      return [];
    }

    // Normalize equipment for filtering
    const userEquipment = userProfile.availableEquipment.map(normalizeEquipment);

    // Filter exercises by available equipment
    const availableExercises = filterExercises(allExercises, {
      equipment: userEquipment
    });

    console.log(`📦 ${availableExercises.length} exercises available with user's equipment`);

    // Get workout split configuration
    const splitConfig = WORKOUT_SPLITS[userProfile.preferredSplit];

    if (!splitConfig) {
      console.error('❌ Invalid workout split');
      return [];
    }

    // Get rep scheme based on goals and experience
    const primaryGoal = getPrimaryGoal(userProfile.fitnessGoals);
    const experienceKey = getExperienceKey(userProfile.experienceLevel);
    const repScheme = REP_SCHEMES[primaryGoal][experienceKey];

    console.log(`🎯 Goal: ${primaryGoal}, Experience: ${experienceKey}`);
    console.log(`📊 Rep scheme: ${repScheme.sets} sets x ${repScheme.reps} reps, ${repScheme.rest}s rest`);

    // Generate templates for each workout in the split
    const templates = [];

    // Use unique workout types (avoid duplicates in PPL split)
    const uniqueWorkoutTypes = [...new Set(splitConfig.workouts)];

    for (let i = 0; i < uniqueWorkoutTypes.length; i++) {
      const workoutType = uniqueWorkoutTypes[i];
      const structure = WORKOUT_STRUCTURES[workoutType];

      if (!structure) {
        console.warn(`⚠️ No structure defined for ${workoutType}`);
        continue;
      }

      const workoutExercises = [];

      // Select exercises for each body part
      for (const bodyPart of structure.bodyParts) {
        const count = structure.exerciseCount[bodyPart];

        // Filter exercises by body part
        const bodyPartExercises = availableExercises.filter(ex =>
          ex.bodyPart.toLowerCase() === bodyPart.toLowerCase()
        );

        // Select random exercises
        const selected = selectRandomExercises(bodyPartExercises, count);

        // Add to workout with rep scheme
        for (const exercise of selected) {
          workoutExercises.push({
            id: exercise.id,
            name: exercise.name,
            bodyPart: exercise.bodyPart,
            target: exercise.target,
            equipment: exercise.equipment,
            gifUrl: exercise.gifUrl,
            sets: repScheme.sets,
            targetReps: repScheme.reps,
            restTime: repScheme.rest,
            notes: null
          });
        }
      }

      // Calculate estimated duration (assume 3 minutes per set including rest)
      const totalSets = workoutExercises.reduce((sum, ex) => sum + ex.sets, 0);
      const estimatedDuration = Math.round(totalSets * 3);

      // Create template
      const template = {
        templateId: `template-${Date.now()}-${i}`,
        name: `${workoutType} Day`,
        type: workoutType,
        estimatedDuration: estimatedDuration,
        createdAt: new Date().toISOString(),
        exercises: workoutExercises
      };

      templates.push(template);

      console.log(`✅ Created ${workoutType} workout with ${workoutExercises.length} exercises`);
    }

    console.log(`🎉 Generated ${templates.length} workout templates`);

    return templates;
  } catch (error) {
    console.error('❌ Error generating workout plan:', error);
    return [];
  }
};

// Create empty workout log from template (for Phase 2)
export const createWorkoutLog = (template) => {
  return {
    logId: `log-${Date.now()}`,
    templateId: template.templateId,
    name: template.name,
    type: template.type,
    startedAt: new Date().toISOString(),
    completedAt: null,
    totalVolume: 0,
    totalSets: 0,
    totalReps: 0,
    durationMinutes: 0,
    notes: null,
    exercises: template.exercises.map(ex => ({
      ...ex,
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        weight: null,
        reps: null,
        completed: false,
        rpe: null,
        notes: null
      }))
    }))
  };
};

// Calculate workout stats (for Phase 2)
export const calculateWorkoutStats = (workoutLog) => {
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;

  for (const exercise of workoutLog.exercises) {
    for (const set of exercise.sets) {
      if (set.completed && set.weight && set.reps) {
        totalVolume += set.weight * set.reps;
        totalSets += 1;
        totalReps += set.reps;
      }
    }
  }

  return {
    totalVolume,
    totalSets,
    totalReps
  };
};
