import { saveDifficulty, getDifficulty } from './storage';

const MAX_LEVEL = 5;
const MIN_LEVEL = 1;

const LEVEL_PARAMS = {
  1: { itemCount: 3, timeAllowed: 30, hintsAllowed: 3, displayTime: 5000 },
  2: { itemCount: 4, timeAllowed: 25, hintsAllowed: 2, displayTime: 4000 },
  3: { itemCount: 5, timeAllowed: 20, hintsAllowed: 1, displayTime: 3000 },
  4: { itemCount: 6, timeAllowed: 15, hintsAllowed: 1, displayTime: 2500 },
  5: { itemCount: 7, timeAllowed: 10, hintsAllowed: 0, displayTime: 2000 },
};

export class AdaptiveDifficultyManager {
  constructor(gameId) {
    this.gameId = gameId;
    const saved = getDifficulty(gameId);
    this.level = saved.level || 1;
    this.history = saved.history || [];
  }

  getLevel() {
    return this.level;
  }

  getParams() {
    return { ...LEVEL_PARAMS[this.level] };
  }

  recordResult(accuracy, responseTime, mistakes, hintsUsed) {
    const record = {
      accuracy,
      responseTime,
      mistakes,
      hintsUsed,
      level: this.level,
      timestamp: Date.now(),
    };
    this.history.push(record);
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
    this.adjustDifficulty(accuracy);
    this.save();
  }

  adjustDifficulty(currentAccuracy) {
    const recentHistory = this.history.slice(-5);
    const avgAccuracy = recentHistory.reduce((sum, r) => sum + r.accuracy, 0) / recentHistory.length;

    if (avgAccuracy >= 80 && this.level < MAX_LEVEL) {
      this.level = Math.min(this.level + 1, MAX_LEVEL);
    } else if (avgAccuracy < 50 && this.level > MIN_LEVEL) {
      this.level = Math.max(this.level - 1, MIN_LEVEL);
    }
  }

  save() {
    saveDifficulty(this.gameId, {
      level: this.level,
      history: this.history,
    });
  }

  reset() {
    this.level = 1;
    this.history = [];
    this.save();
  }

  getAverageAccuracy() {
    if (this.history.length === 0) return 0;
    const sum = this.history.reduce((acc, r) => acc + r.accuracy, 0);
    return Math.round(sum / this.history.length);
  }

  getGamesCompleted() {
    return this.history.length;
  }
}

export function getLevelLabel(level) {
  const labels = {
    1: 'Beginner',
    2: 'Easy',
    3: 'Moderate',
    4: 'Challenging',
    5: 'Advanced',
  };
  return labels[level] || 'Beginner';
}

export { LEVEL_PARAMS };
