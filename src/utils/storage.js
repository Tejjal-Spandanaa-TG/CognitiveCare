const PREFIX = 'cognitivecare_';

function getKey(key) {
  return PREFIX + key;
}

export function saveData(key, data) {
  try {
    localStorage.setItem(getKey(key), JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('Storage save failed:', e);
    return false;
  }
}

export function loadData(key, fallback = null) {
  try {
    const raw = localStorage.getItem(getKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn('Storage load failed:', e);
    return fallback;
  }
}

export function removeData(key) {
  try {
    localStorage.removeItem(getKey(key));
  } catch (e) {
    console.warn('Storage remove failed:', e);
  }
}

export function clearAllData() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Storage clear failed:', e);
  }
}

export function saveUserProfile(profile) {
  return saveData('user_profile', profile);
}

export function getUserProfile() {
  return loadData('user_profile', {
    name: '',
    age: '',
    preferredLanguage: 'en',
    dailyRoutine: null,
    gamePreferences: {},
  });
}

export function saveRoutine(routine) {
  return saveData('daily_routine', routine);
}

export function getRoutine() {
  return loadData('daily_routine', null);
}

export function saveGameResult(gameId, result) {
  const results = loadData('game_results', {});
  if (!results[gameId]) {
    results[gameId] = [];
  }
  results[gameId].push({
    ...result,
    timestamp: Date.now(),
  });
  if (results[gameId].length > 100) {
    results[gameId] = results[gameId].slice(-100);
  }
  return saveData('game_results', results);
}

export function getGameResults(gameId = null) {
  const results = loadData('game_results', {});
  if (gameId) {
    return results[gameId] || [];
  }
  return results;
}

export function saveDifficulty(gameId, difficultyData) {
  const difficulties = loadData('difficulties', {});
  difficulties[gameId] = difficultyData;
  return saveData('difficulties', difficulties);
}

export function getDifficulty(gameId) {
  const difficulties = loadData('difficulties', {});
  return difficulties[gameId] || {
    level: 1,
    history: [],
  };
}

export function saveSettings(settings) {
  return saveData('settings', settings);
}

export function getSettings() {
  return loadData('settings', {
    language: 'en',
    fontSize: 'large',
    voiceAssistance: true,
    highContrast: false,
    soundEffects: true,
  });
}

export function saveFamiliarPeople(people) {
  return saveData('familiar_people', people);
}

export function getFamiliarPeople() {
  return loadData('familiar_people', []);
}

export function saveAuth(auth) {
  return saveData('auth', auth);
}

export function getAuth() {
  return loadData('auth', null);
}

export function clearAuth() {
  removeData('auth');
}

export function isLoggedIn() {
  return getAuth() !== null;
}

export function saveFamilyMembers(members) {
  return saveData('family_members', members);
}

export function getFamilyMembers() {
  return loadData('family_members', []);
}
