export const GAME_IDS = {
  MY_DAY_MY_WAY: 'my-day-my-way',
  WHO_IS_THIS: 'who-is-this',
  FIND_IT: 'find-it-before-i-forget',
  PATTERN_REPLAY: 'pattern-replay',
  FAMILY_IDENTIFICATION: 'family-identification',
};

export const GAME_INFO = [
  {
    id: GAME_IDS.MY_DAY_MY_WAY,
    icon: '🧩',
    title: 'My Day, My Way',
    subtitle: 'Daily Routine Recall',
    description: 'Arrange your daily activities in the correct order.',
    route: '/games/my-day-my-way',
  },
  {
    id: GAME_IDS.WHO_IS_THIS,
    icon: '👤',
    title: 'Who Is This?',
    subtitle: 'Familiar Face & Voice Recognition',
    description: 'Recognize people you know.',
    route: '/games/who-is-this',
  },
  {
    id: GAME_IDS.FAMILY_IDENTIFICATION,
    icon: '👨‍👩‍👧‍👦',
    title: 'Family Photo Identification',
    subtitle: 'Photo-Based Family Recognition',
    description: 'Identify family members from uploaded photos.',
    route: '/games/family-identification',
  },
  {
    id: GAME_IDS.FIND_IT,
    icon: '🔎',
    title: 'Find It Before I Forget',
    subtitle: 'Object & Visual Memory',
    description: 'Find the requested object.',
    route: '/games/find-it-before-i-forget',
  },
  {
    id: GAME_IDS.PATTERN_REPLAY,
    icon: '🎨',
    title: 'Pattern Replay',
    subtitle: 'Pattern & Sequence Memory',
    description: 'Remember and reproduce the pattern.',
    route: '/games/pattern-replay',
  },
];

export const DEFAULT_ROUTINE = [
  { id: 1, text: 'Wake Up' },
  { id: 2, text: 'Drink Water' },
  { id: 3, text: 'Brush Teeth' },
  { id: 4, text: 'Breakfast' },
  { id: 5, text: 'Take Medicine' },
  { id: 6, text: 'Go for a Walk' },
];

export const PATTERN_COLORS = [
  { name: 'red', color: '#E74C3C', symbol: '🔴' },
  { name: 'blue', color: '#3498DB', symbol: '🔵' },
  { name: 'green', color: '#2ECC71', symbol: '🟢' },
  { name: 'yellow', color: '#F1C40F', symbol: '🟡' },
  { name: 'purple', color: '#9B59B6', symbol: '🟣' },
  { name: 'orange', color: '#E67E22', symbol: '🟠' },
];

export const FIND_OBJECTS = [
  { id: 'glasses', name: 'glasses', icon: '👓' },
  { id: 'phone', name: 'phone', icon: '📱' },
  { id: 'keys', name: 'keys', icon: '🔑' },
  { id: 'water-bottle', name: 'water bottle', icon: '🧴' },
  { id: 'book', name: 'book', icon: '📖' },
  { id: 'cup', name: 'cup', icon: '☕' },
  { id: 'remote', name: 'remote', icon: '📺' },
  { id: 'medicine-box', name: 'medicine box', icon: '💊' },
];
