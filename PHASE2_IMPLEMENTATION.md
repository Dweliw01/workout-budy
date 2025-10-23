# Phase 2 Implementation Plan

## Overview
Phase 2 brings the workout tracking functionality to life - allowing users to perform workouts, log sets/reps, and review their history.

---

## **1. WorkoutScreen** (Most Important)

### Purpose
Active workout tracking where users log their sets, reps, and weight in real-time.

### Key Features

#### A. Workout Initialization
- Receive workout template from HomeScreen
- Create a new workout log with empty sets
- Save as "active workout" (allows resuming if app closes)
- Display workout name and estimated duration
- Show timer (total workout duration)

#### B. Exercise Navigation (Swipe-Based)
- **Horizontal Swipe View** using FlatList with horizontal pagination
- Swipe left → Next exercise
- Swipe right → Previous exercise
- **Exercise Progress Indicator**:
  - Dots or progress bar showing "Exercise 2 of 6"
  - Current exercise highlighted
  - Completed exercises marked with checkmark
- **Exercise List Sidebar** (optional):
  - Small thumbnails/names on left side
  - Tap to jump to specific exercise

#### C. Current Exercise View
- **Exercise GIF**: Displayed at top of screen (from exercise.gifUrl)
  - Fetched from ExerciseDB API
  - Auto-playing loop
  - Fallback if GIF fails to load
- **Exercise Info Bar**:
  - Exercise name (large, bold)
  - Body part chip (e.g., "Chest")
  - Target muscle chip (e.g., "Pectorals")
  - Equipment chip (e.g., "Barbell")
- **Sets Table**:
  - Set # (1, 2, 3...)
  - Previous weight/reps (from history, if available) - grayed out
  - Current weight input (numeric keyboard)
  - Current reps input (numeric keyboard)
  - Checkmark button when completed
- **Rest Timer** (appears after completing a set):
  - Manual start button
  - Countdown display (MM:SS)
  - +15s and -15s buttons (active during countdown)
  - Skip rest button
  - Default rest time from template (e.g., 90s)
- Notes field for the exercise (optional)

#### D. Set Logging
- Tap on weight/reps to edit
- Number pad input for quick entry
- Mark set as complete (checkmark)
- Auto-start rest timer after completing set
- Skip set option
- Add extra set option

#### E. Navigation
- **Swipe Gestures**: Primary navigation method
  - Swipe left for next exercise
  - Swipe right for previous exercise
- **Top Bar**:
  - Back/Cancel button (with confirmation dialog)
  - Exercise progress (e.g., "2 / 6")
  - Workout timer (total elapsed time)
- **Bottom Bar**:
  - "Finish Workout" button (appears on last exercise after all sets completed)
  - Can swipe back to edit previous exercises before finishing

#### F. Workout Completion
- User taps "Finish Workout" button on last exercise
- **Show confirmation dialog**: "Are you sure you want to finish?"
- **Calculate stats**:
  - Total volume (sum of weight × reps for all completed sets)
  - Total sets completed
  - Total reps completed
  - Workout duration (from start time to finish time)
- **Save to database**:
  - Save to workout_logs table
  - Save all exercises to logged_exercises table
  - Save all sets to sets table
- **Clear active workout** from active_workout table
- **Navigate to HomeScreen** (using navigation.navigate('Home'))
- **Optional**: Show toast notification "Workout saved! Great job! 💪"

---

## **2. ExerciseDetailScreen**

### Purpose
View detailed information about a specific exercise (name, GIF, instructions, muscles worked).

### Key Features

#### A. Exercise Information
- Large exercise name
- Animated GIF (full screen or prominent)
- Body part chip
- Target muscle chip
- Equipment required chip

#### B. Instructions (if available from API)
- Step-by-step instructions
- Tips section

#### C. Personal Records (Bonus)
- Show user's PR (heaviest weight × reps)
- Show last time they did this exercise
- Show volume trend chart (optional)

#### D. Navigation
- Back button
- "Start Workout with this Exercise" (optional feature)

---

## **3. HistoryScreen**

### Purpose
View all past completed workouts with stats.

### Key Features

#### A. Workout List
- Grouped by date (Today, Yesterday, Last 7 Days, etc.)
- Each workout card shows:
  - Workout name
  - Date and time
  - Duration
  - Total volume
  - Total sets
  - Exercise count
- Tap to expand/view details

#### B. Workout Details View
- When tapping a workout, show:
  - All exercises performed
  - Each exercise's sets/reps/weight
  - Notes for that workout
  - Stats summary
- Option to "Repeat this Workout"

#### C. Filters/Stats (Optional)
- Filter by workout type (Push, Pull, Legs, etc.)
- Date range picker
- Search by exercise name
- Overall stats:
  - Total workouts completed
  - Total volume all time
  - Most frequent exercises
  - Longest streak

#### D. Empty State
- Show when no workouts logged yet
- Call to action: "Start your first workout!"

---

## **4. WorkoutScreen Technical Specification**

### Component Structure

```
WorkoutScreen (Main Container)
├── Header
│   ├── Cancel Button (with confirmation)
│   ├── Workout Title
│   ├── Workout Timer (00:00)
│   └── Exercise Progress (2 / 6)
├── FlatList (Horizontal, Paginated)
│   └── ExerciseCard (One per exercise)
│       ├── Exercise GIF (Image component)
│       ├── Exercise Info
│       │   ├── Name
│       │   ├── Body Part Chip
│       │   ├── Target Chip
│       │   └── Equipment Chip
│       ├── Sets Table
│       │   └── SetRow (One per set)
│       │       ├── Set Number
│       │       ├── Previous (grayed)
│       │       ├── Weight Input (TextInput)
│       │       ├── Reps Input (TextInput)
│       │       └── Complete Button (✓)
│       └── Rest Timer (Conditional)
│           ├── Time Display (MM:SS)
│           ├── Start/Pause Button
│           ├── -15s Button
│           ├── +15s Button
│           └── Skip Button
└── Footer
    └── Finish Workout Button (Last exercise only)
```

### State Management

```javascript
// WorkoutScreen State
const [workoutLog, setWorkoutLog] = useState(null);
const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
const [workoutStartTime, setWorkoutStartTime] = useState(null);
const [workoutElapsedTime, setWorkoutElapsedTime] = useState(0);
const [restTimerActive, setRestTimerActive] = useState(false);
const [restTimeRemaining, setRestTimeRemaining] = useState(0);
const [currentSetIndex, setCurrentSetIndex] = useState(0);
```

### Key Functions

```javascript
// Initialize workout from template
initializeWorkout(template)

// Update set data (weight, reps)
updateSet(exerciseIndex, setIndex, field, value)

// Mark set as complete
completeSet(exerciseIndex, setIndex)

// Start/pause rest timer
toggleRestTimer()

// Adjust rest time while running
adjustRestTime(seconds) // +15 or -15

// Navigate to next/previous exercise
goToNextExercise()
goToPreviousExercise()

// Save workout progress
autoSaveWorkout()

// Complete and save workout
finishWorkout()
```

---

## **5. Technical Implementation Details**

### Data Flow

```
HomeScreen → WorkoutScreen
  ├─ Pass template data
  ├─ Create workout log
  ├─ Save as active workout
  └─ User logs sets/reps
      └─ On finish:
          ├─ Calculate stats
          ├─ Save to workout_logs
          ├─ Clear active workout
          └─ Navigate to Home/History
```

### Database Tables (Already Created)
- ✅ `workout_logs` - Completed workouts
- ✅ `logged_exercises` - Exercises in a completed workout
- ✅ `sets` - Individual sets with weight/reps
- ✅ `active_workout` - Current in-progress workout

### Storage Functions (Already Implemented)
- ✅ `saveActiveWorkout()` - Save workout in progress
- ✅ `getActiveWorkout()` - Resume workout
- ✅ `clearActiveWorkout()` - Remove after completion
- ✅ `addWorkoutToHistory()` - Save completed workout
- ✅ `getWorkoutHistory()` - Fetch past workouts

### Helper Functions (Already Implemented)
- ✅ `createWorkoutLog()` - Convert template to workout log
- ✅ `calculateWorkoutStats()` - Sum volume/sets/reps

---

## **5. UI/UX Considerations**

### WorkoutScreen UX Flow:
1. User sees first exercise
2. Fills in weight/reps for set 1
3. Marks set complete → rest timer starts
4. After rest, do set 2
5. Repeat for all sets
6. Hit "Next Exercise"
7. Repeat for all exercises
8. Hit "Finish Workout" → see stats
9. Return to Home

### Key UX Features:
- Auto-save progress (so app crash doesn't lose data)
- Easy number input (numeric keyboard)
- Clear visual feedback (completed vs pending)
- Rest timer with sound/vibration (optional)
- Ability to go back/edit previous exercises
- Quick access to exercise GIF/instructions

---

## **6. Recommended Implementation Order**

### Phase 2.1 - WorkoutScreen Basic
1. Display exercises in order
2. Basic set logging (weight/reps input)
3. Next/Previous navigation
4. Finish workout button
5. Save to workout history

### Phase 2.2 - WorkoutScreen Enhanced
1. Rest timer
2. Auto-save active workout
3. Exercise GIFs
4. Add/skip sets
5. Previous weight/reps display

### Phase 2.3 - HistoryScreen
1. List past workouts
2. Basic workout details
3. Stats summary
4. Empty state

### Phase 2.4 - ExerciseDetailScreen
1. Exercise info + GIF
2. Personal records
3. Navigation from WorkoutScreen

### Phase 2.5 - Polish
1. Animations
2. Sound/vibration
3. Progress charts
4. Workout summary screen

---

## **7. Decision Points**

### ✅ Decisions Made:

1. **Rest Timer**: Manual start with +/- buttons to add/subtract time WHILE timer is running
2. **Set Input**: Text input with numeric keyboard
3. **Exercise Navigation**: Swipe-based (left/right between exercises)
4. **Workout Summary**: Return directly to HomeScreen after finishing
5. **Priority**: WorkoutScreen → HistoryScreen → ExerciseDetailScreen
6. **Exercise GIFs**: Display on WorkoutScreen for each exercise

---

## **8. Success Criteria**

Phase 2 is complete when:
- ✅ User can start a workout from HomeScreen
- ✅ User can log weight/reps for each set
- ✅ User can navigate between exercises
- ✅ User can complete workout and see it saved
- ✅ User can view workout history
- ✅ User can view exercise details with GIF
- ✅ App persists workout if closed mid-session
- ✅ All database operations work correctly

---

## **9. Detailed Implementation Checklist**

### WorkoutScreen - Phase 2.1 (Basic)
- [ ] Create WorkoutScreen component file
- [ ] Receive template from navigation params
- [ ] Initialize workout log using createWorkoutLog()
- [ ] Set up horizontal FlatList for exercises
- [ ] Implement swipe navigation between exercises
- [ ] Display exercise GIF (Image component with gifUrl)
- [ ] Display exercise info (name, bodyPart, target, equipment)
- [ ] Create sets table UI
- [ ] Implement weight/reps TextInput with numeric keyboard
- [ ] Add complete set button (checkmark)
- [ ] Update workoutLog state when user enters data
- [ ] Add "Finish Workout" button (last exercise only)
- [ ] Implement finishWorkout() function
- [ ] Calculate stats (volume, sets, reps, duration)
- [ ] Save to workout_logs using addWorkoutToHistory()
- [ ] Navigate back to HomeScreen

### WorkoutScreen - Phase 2.2 (Enhanced)
- [ ] Add workout header (title, timer, progress)
- [ ] Implement total workout timer (elapsed time)
- [ ] Add exercise progress indicator (e.g., "2 / 6")
- [ ] Create rest timer component
- [ ] Manual start rest timer button
- [ ] Countdown display (MM:SS)
- [ ] Add +15s and -15s buttons
- [ ] Implement adjustRestTime() function
- [ ] Add skip rest button
- [ ] Auto-save active workout every 30 seconds
- [ ] Implement resume workout on app load
- [ ] Add cancel workout button with confirmation
- [ ] Display previous set data (from history)
- [ ] Add ability to add/skip sets

### HistoryScreen - Phase 2.3
- [ ] Create HistoryScreen component
- [ ] Fetch workout history using getWorkoutHistory()
- [ ] Group workouts by date
- [ ] Display workout cards (name, date, duration, volume, sets)
- [ ] Implement tap to expand details
- [ ] Show all exercises and sets for a workout
- [ ] Add empty state when no history
- [ ] Add "Repeat Workout" functionality
- [ ] Implement date filters (optional)
- [ ] Add overall stats section (optional)

### ExerciseDetailScreen - Phase 2.4
- [ ] Create ExerciseDetailScreen component
- [ ] Receive exercise data from navigation params
- [ ] Display large exercise GIF
- [ ] Show exercise name and info chips
- [ ] Add instructions section (if available)
- [ ] Fetch and display personal records using getExercisePR()
- [ ] Show last time exercise was performed
- [ ] Add back button navigation

### Polish - Phase 2.5
- [ ] Add loading states for GIFs
- [ ] Add animations (page transitions, button presses)
- [ ] Add haptic feedback on set completion
- [ ] Add sound/vibration for rest timer end
- [ ] Implement workout summary toast
- [ ] Add error handling for all database operations
- [ ] Test auto-save and resume functionality
- [ ] Test with poor network (GIF loading)
- [ ] Add accessibility labels
- [ ] Performance optimization (FlatList, Image caching)

---

## Current Status
- **Phase 1**: ✅ Complete (Onboarding, Templates, Database)
- **Phase 2**: 🔄 Planning Complete, Ready to Implement
- **Next Step**: Build WorkoutScreen Phase 2.1 (Basic functionality)
