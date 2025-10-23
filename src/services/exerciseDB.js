import axios from 'axios';

// API Configuration
const API_KEY = 'YOUR_RAPIDAPI_KEY_HERE'; // User will add their own key
const BASE_URL = 'https://exercisedb.p.rapidapi.com';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-RapidAPI-Key': '23d1893aa2mshe857ee350019b7ap1083e1jsn2c399ef2233d',
    'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
  }
});

// In-memory cache
let exerciseCache = {
  data: null,
  timestamp: null,
  expiryMs: 24 * 60 * 60 * 1000 // 24 hours
};

// Helper to check if cache is valid
const isCacheValid = () => {
  if (!exerciseCache.data || !exerciseCache.timestamp) {
    return false;
  }

  const now = Date.now();
  return (now - exerciseCache.timestamp) < exerciseCache.expiryMs;
};

// Fetch all exercises with caching
export const fetchAllExercises = async () => {
  try {
    if (isCacheValid()) {
      console.log('📦 Using cached exercises');
      return exerciseCache.data;
    }

    console.log('🌐 Fetching exercises from API...');
    const response = await apiClient.get('/exercises');

    exerciseCache.data = response.data;
    exerciseCache.timestamp = Date.now();

    console.log(`✅ Fetched ${response.data.length} exercises`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching exercises:', error.message);
    // Return cached data if available, even if expired
    if (exerciseCache.data) {
      console.log('⚠️ Using expired cache due to API error');
      return exerciseCache.data;
    }
    return [];
  }
};

// Fetch exercises by body part
export const fetchExercisesByBodyPart = async (bodyPart) => {
  try {
    console.log(`🌐 Fetching exercises for body part: ${bodyPart}`);
    const response = await apiClient.get(`/exercises/bodyPart/${bodyPart}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching exercises for ${bodyPart}:`, error.message);
    return [];
  }
};

// Fetch exercises by equipment
export const fetchExercisesByEquipment = async (equipment) => {
  try {
    console.log(`🌐 Fetching exercises for equipment: ${equipment}`);
    const response = await apiClient.get(`/exercises/equipment/${equipment}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching exercises for ${equipment}:`, error.message);
    return [];
  }
};

// Fetch exercises by target muscle
export const fetchExercisesByTarget = async (target) => {
  try {
    console.log(`🌐 Fetching exercises for target: ${target}`);
    const response = await apiClient.get(`/exercises/target/${target}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching exercises for ${target}:`, error.message);
    return [];
  }
};

// Fetch single exercise by ID
export const fetchExerciseById = async (id) => {
  try {
    console.log(`🌐 Fetching exercise with ID: ${id}`);
    const response = await apiClient.get(`/exercises/exercise/${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching exercise ${id}:`, error.message);
    return null;
  }
};

// Fetch list of body parts
export const fetchBodyPartsList = async () => {
  try {
    console.log('🌐 Fetching body parts list');
    const response = await apiClient.get('/exercises/bodyPartList');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching body parts list:', error.message);
    return [];
  }
};

// Fetch list of equipment
export const fetchEquipmentList = async () => {
  try {
    console.log('🌐 Fetching equipment list');
    const response = await apiClient.get('/exercises/equipmentList');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching equipment list:', error.message);
    return [];
  }
};

// Get cached exercises (fetch if not cached)
export const getCachedExercises = async () => {
  return await fetchAllExercises();
};

// Client-side filtering
export const filterExercises = (exercises, filters) => {
  if (!exercises || exercises.length === 0) {
    return [];
  }

  let filtered = [...exercises];

  // Filter by body part
  if (filters.bodyPart) {
    filtered = filtered.filter(ex =>
      ex.bodyPart.toLowerCase() === filters.bodyPart.toLowerCase()
    );
  }

  // Filter by equipment
  if (filters.equipment) {
    if (Array.isArray(filters.equipment)) {
      filtered = filtered.filter(ex =>
        filters.equipment.some(eq =>
          ex.equipment.toLowerCase() === eq.toLowerCase()
        )
      );
    } else {
      filtered = filtered.filter(ex =>
        ex.equipment.toLowerCase() === filters.equipment.toLowerCase()
      );
    }
  }

  // Filter by target muscle
  if (filters.target) {
    filtered = filtered.filter(ex =>
      ex.target.toLowerCase() === filters.target.toLowerCase()
    );
  }

  // Filter by name search
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(ex =>
      ex.name.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
};

// Clear cache (useful for debugging)
export const clearCache = () => {
  exerciseCache = {
    data: null,
    timestamp: null,
    expiryMs: 24 * 60 * 60 * 1000
  };
  console.log('🗑️ Exercise cache cleared');
};

// Update API key (for when user adds their key)
export const updateApiKey = (newKey) => {
  apiClient.defaults.headers['X-RapidAPI-Key'] = newKey;
  clearCache(); // Clear cache when API key changes
  console.log('🔑 API key updated');
};

// Get cache status (for debugging)
export const getCacheStatus = () => {
  return {
    hasCachedData: exerciseCache.data !== null,
    cacheAge: exerciseCache.timestamp ? Date.now() - exerciseCache.timestamp : null,
    isValid: isCacheValid(),
    exerciseCount: exerciseCache.data ? exerciseCache.data.length : 0
  };
};
