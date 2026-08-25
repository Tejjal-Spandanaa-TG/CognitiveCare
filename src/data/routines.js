import { DEFAULT_ROUTINE } from './games';

export function getDefaultRoutine() {
  return DEFAULT_ROUTINE.map(item => ({ ...item }));
}

export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}
