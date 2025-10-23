import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('workout.db');

// Initialize database with all required tables
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      // User Profile table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS user_profile (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT UNIQUE NOT NULL,
          fitness_goals TEXT NOT NULL,
          experience_level TEXT NOT NULL,
          available_equipment TEXT NOT NULL,
          workout_frequency INTEGER,
          preferred_split TEXT,
          rest_timer_default INTEGER,
          weight_unit TEXT,
          created_at TEXT NOT NULL
        );
      `);

      // Workout Templates table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS workout_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          template_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          estimated_duration INTEGER,
          created_at TEXT NOT NULL
        );
      `);

      // Template Exercises table
      db.execSync(`
        CREATE TABLE IF NOT EXISTS template_exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          template_id TEXT NOT NULL,
          exercise_id TEXT NOT NULL,
          name TEXT NOT NULL,
          body_part TEXT,
          target TEXT,
          equipment TEXT,
          gif_url TEXT,
          sets INTEGER NOT NULL,
          target_reps TEXT NOT NULL,
          rest_time INTEGER,
          notes TEXT,
          exercise_order INTEGER,
          FOREIGN KEY (template_id) REFERENCES workout_templates(template_id)
        );
      `);

      // Workout Logs table (for Phase 2)
      db.execSync(`
        CREATE TABLE IF NOT EXISTS workout_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          log_id TEXT UNIQUE NOT NULL,
          template_id TEXT,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          total_volume REAL,
          total_sets INTEGER,
          total_reps INTEGER,
          duration_minutes INTEGER,
          notes TEXT
        );
      `);

      // Logged Exercises table (for Phase 2)
      db.execSync(`
        CREATE TABLE IF NOT EXISTS logged_exercises (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          log_id TEXT NOT NULL,
          exercise_id TEXT NOT NULL,
          name TEXT NOT NULL,
          body_part TEXT,
          target TEXT,
          equipment TEXT,
          exercise_order INTEGER,
          FOREIGN KEY (log_id) REFERENCES workout_logs(log_id)
        );
      `);

      // Sets table (for Phase 2)
      db.execSync(`
        CREATE TABLE IF NOT EXISTS sets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          logged_exercise_id INTEGER NOT NULL,
          set_number INTEGER NOT NULL,
          weight REAL,
          reps INTEGER,
          completed INTEGER DEFAULT 0,
          rpe REAL,
          notes TEXT,
          FOREIGN KEY (logged_exercise_id) REFERENCES logged_exercises(id)
        );
      `);

      // Active Workout table (for Phase 2)
      db.execSync(`
        CREATE TABLE IF NOT EXISTS active_workout (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          workout_data TEXT NOT NULL,
          last_updated TEXT NOT NULL
        );
      `);

      console.log('✅ Database initialized successfully');
      resolve();
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      reject(error);
    }
  });
};

// User Profile Functions
export const saveUserProfile = async (profile) => {
  try {
    const fitnessGoalsJson = JSON.stringify(profile.fitnessGoals);
    const equipmentJson = JSON.stringify(profile.availableEquipment);

    db.runSync(
      `INSERT OR REPLACE INTO user_profile
       (user_id, fitness_goals, experience_level, available_equipment,
        workout_frequency, preferred_split, rest_timer_default, weight_unit, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.userId,
        fitnessGoalsJson,
        profile.experienceLevel,
        equipmentJson,
        profile.workoutFrequency,
        profile.preferredSplit,
        profile.restTimerDefault,
        profile.weightUnit,
        profile.createdAt
      ]
    );

    console.log('✅ User profile saved');
    return profile;
  } catch (error) {
    console.error('❌ Error saving user profile:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const result = db.getFirstSync('SELECT * FROM user_profile ORDER BY id DESC LIMIT 1');

    if (!result) {
      return null;
    }

    return {
      userId: result.user_id,
      fitnessGoals: JSON.parse(result.fitness_goals),
      experienceLevel: result.experience_level,
      availableEquipment: JSON.parse(result.available_equipment),
      workoutFrequency: result.workout_frequency,
      preferredSplit: result.preferred_split,
      restTimerDefault: result.rest_timer_default,
      weightUnit: result.weight_unit,
      createdAt: result.created_at
    };
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return null;
  }
};

// Workout Template Functions
export const saveWorkoutTemplates = async (templates) => {
  try {
    // Start transaction by deleting old data
    db.runSync('DELETE FROM template_exercises');
    db.runSync('DELETE FROM workout_templates');

    // Insert new templates
    for (const template of templates) {
      db.runSync(
        `INSERT INTO workout_templates
         (template_id, name, type, estimated_duration, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          template.templateId,
          template.name,
          template.type,
          template.estimatedDuration,
          template.createdAt
        ]
      );

      // Insert exercises for this template
      for (let i = 0; i < template.exercises.length; i++) {
        const exercise = template.exercises[i];
        db.runSync(
          `INSERT INTO template_exercises
           (template_id, exercise_id, name, body_part, target, equipment, gif_url,
            sets, target_reps, rest_time, notes, exercise_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            template.templateId,
            exercise.id,
            exercise.name,
            exercise.bodyPart,
            exercise.target,
            exercise.equipment,
            exercise.gifUrl,
            exercise.sets,
            exercise.targetReps,
            exercise.restTime,
            exercise.notes || null,
            i
          ]
        );
      }
    }

    console.log(`✅ Saved ${templates.length} workout templates`);
    return templates;
  } catch (error) {
    console.error('❌ Error saving workout templates:', error);
    throw error;
  }
};

export const getWorkoutTemplates = async () => {
  try {
    const templates = db.getAllSync('SELECT * FROM workout_templates ORDER BY id');

    if (!templates || templates.length === 0) {
      return [];
    }

    // Get exercises for each template
    const templatesWithExercises = templates.map(template => {
      const exercises = db.getAllSync(
        'SELECT * FROM template_exercises WHERE template_id = ? ORDER BY exercise_order',
        [template.template_id]
      );

      return {
        templateId: template.template_id,
        name: template.name,
        type: template.type,
        estimatedDuration: template.estimated_duration,
        createdAt: template.created_at,
        exercises: exercises.map(ex => ({
          id: ex.exercise_id,
          name: ex.name,
          bodyPart: ex.body_part,
          target: ex.target,
          equipment: ex.equipment,
          gifUrl: ex.gif_url,
          sets: ex.sets,
          targetReps: ex.target_reps,
          restTime: ex.rest_time,
          notes: ex.notes
        }))
      };
    });

    return templatesWithExercises;
  } catch (error) {
    console.error('❌ Error getting workout templates:', error);
    return [];
  }
};

// Active Workout Functions (for Phase 2)
export const saveActiveWorkout = async (workout) => {
  try {
    db.runSync('DELETE FROM active_workout');

    db.runSync(
      'INSERT INTO active_workout (workout_data, last_updated) VALUES (?, ?)',
      [JSON.stringify(workout), new Date().toISOString()]
    );

    console.log('✅ Active workout saved');
    return workout;
  } catch (error) {
    console.error('❌ Error saving active workout:', error);
    throw error;
  }
};

export const getActiveWorkout = async () => {
  try {
    const result = db.getFirstSync('SELECT * FROM active_workout LIMIT 1');

    if (!result) {
      return null;
    }

    return JSON.parse(result.workout_data);
  } catch (error) {
    console.error('❌ Error getting active workout:', error);
    return null;
  }
};

export const clearActiveWorkout = async () => {
  try {
    db.runSync('DELETE FROM active_workout');
    console.log('✅ Active workout cleared');
  } catch (error) {
    console.error('❌ Error clearing active workout:', error);
  }
};

// Workout History Functions (for Phase 2)
export const addWorkoutToHistory = async (workoutLog) => {
  try {
    db.runSync(
      `INSERT INTO workout_logs
       (log_id, template_id, name, type, started_at, completed_at,
        total_volume, total_sets, total_reps, duration_minutes, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workoutLog.logId,
        workoutLog.templateId || null,
        workoutLog.name,
        workoutLog.type,
        workoutLog.startedAt,
        workoutLog.completedAt,
        workoutLog.totalVolume || 0,
        workoutLog.totalSets || 0,
        workoutLog.totalReps || 0,
        workoutLog.durationMinutes || 0,
        workoutLog.notes || null
      ]
    );

    // Insert logged exercises
    for (let i = 0; i < workoutLog.exercises.length; i++) {
      const exercise = workoutLog.exercises[i];

      const result = db.runSync(
        `INSERT INTO logged_exercises
         (log_id, exercise_id, name, body_part, target, equipment, exercise_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          workoutLog.logId,
          exercise.id,
          exercise.name,
          exercise.bodyPart,
          exercise.target,
          exercise.equipment,
          i
        ]
      );

      const loggedExerciseId = result.lastInsertRowId;

      // Insert sets for this exercise
      if (exercise.sets && exercise.sets.length > 0) {
        for (const set of exercise.sets) {
          db.runSync(
            `INSERT INTO sets
             (logged_exercise_id, set_number, weight, reps, completed, rpe, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              loggedExerciseId,
              set.setNumber,
              set.weight || null,
              set.reps || null,
              set.completed ? 1 : 0,
              set.rpe || null,
              set.notes || null
            ]
          );
        }
      }
    }

    console.log('✅ Workout added to history');
    return workoutLog;
  } catch (error) {
    console.error('❌ Error adding workout to history:', error);
    throw error;
  }
};

export const getWorkoutHistory = async (limit = 50) => {
  try {
    const logs = db.getAllSync(
      'SELECT * FROM workout_logs ORDER BY completed_at DESC LIMIT ?',
      [limit]
    );

    if (!logs || logs.length === 0) {
      return [];
    }

    const logsWithExercises = logs.map(log => {
      const exercises = db.getAllSync(
        'SELECT * FROM logged_exercises WHERE log_id = ? ORDER BY exercise_order',
        [log.log_id]
      );

      return {
        logId: log.log_id,
        templateId: log.template_id,
        name: log.name,
        type: log.type,
        startedAt: log.started_at,
        completedAt: log.completed_at,
        totalVolume: log.total_volume,
        totalSets: log.total_sets,
        totalReps: log.total_reps,
        durationMinutes: log.duration_minutes,
        notes: log.notes,
        exercises: exercises.map(ex => {
          const sets = db.getAllSync(
            'SELECT * FROM sets WHERE logged_exercise_id = ? ORDER BY set_number',
            [ex.id]
          );

          return {
            id: ex.exercise_id,
            name: ex.name,
            bodyPart: ex.body_part,
            target: ex.target,
            equipment: ex.equipment,
            sets: sets.map(s => ({
              setNumber: s.set_number,
              weight: s.weight,
              reps: s.reps,
              completed: s.completed === 1,
              rpe: s.rpe,
              notes: s.notes
            }))
          };
        })
      };
    });

    return logsWithExercises;
  } catch (error) {
    console.error('❌ Error getting workout history:', error);
    return [];
  }
};

// Analytics Functions (bonus)
export const getExercisePR = async (exerciseName) => {
  try {
    const result = db.getFirstSync(
      `SELECT MAX(weight) as max_weight, reps
       FROM sets s
       JOIN logged_exercises le ON s.logged_exercise_id = le.id
       WHERE le.name = ? AND s.completed = 1
       GROUP BY s.weight
       ORDER BY s.weight DESC
       LIMIT 1`,
      [exerciseName]
    );

    return result || null;
  } catch (error) {
    console.error('❌ Error getting exercise PR:', error);
    return null;
  }
};

export const getExerciseVolumeTrend = async (exerciseName, days = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const results = db.getAllSync(
      `SELECT
         wl.completed_at,
         SUM(s.weight * s.reps) as volume
       FROM sets s
       JOIN logged_exercises le ON s.logged_exercise_id = le.id
       JOIN workout_logs wl ON le.log_id = wl.log_id
       WHERE le.name = ?
         AND s.completed = 1
         AND wl.completed_at >= ?
       GROUP BY wl.completed_at
       ORDER BY wl.completed_at ASC`,
      [exerciseName, cutoffDate.toISOString()]
    );

    return results || [];
  } catch (error) {
    console.error('❌ Error getting exercise volume trend:', error);
    return [];
  }
};

// Utility Functions
export const clearAllData = async () => {
  try {
    db.runSync('DELETE FROM sets');
    db.runSync('DELETE FROM logged_exercises');
    db.runSync('DELETE FROM workout_logs');
    db.runSync('DELETE FROM active_workout');
    db.runSync('DELETE FROM template_exercises');
    db.runSync('DELETE FROM workout_templates');
    db.runSync('DELETE FROM user_profile');

    console.log('✅ All data cleared');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
};

export const exportDatabase = async () => {
  try {
    const data = {
      userProfile: await getUserProfile(),
      templates: await getWorkoutTemplates(),
      history: await getWorkoutHistory(),
      activeWorkout: await getActiveWorkout()
    };

    console.log('📦 Database Export:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Error exporting database:', error);
    return null;
  }
};
