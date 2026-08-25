import { getSettings } from './storage';

const HINT_MESSAGES = {
  firstMistake: 'Take your time. You can do this!',
  secondMistake: 'Here is a hint to help you.',
  repeatedMistake: 'Listen carefully for guidance.',
  poorPerformance: 'Let us try an easier level.',
};

export class HintManager {
  constructor() {
    this.mistakes = 0;
    this.hintsUsed = 0;
  }

  reset() {
    this.mistakes = 0;
    this.hintsUsed = 0;
  }

  recordMistake() {
    this.mistakes++;
  }

  getNextHint() {
    const settings = getSettings();
    const voiceOn = settings.voiceAssistance;

    if (this.mistakes === 1) {
      this.hintsUsed++;
      return {
        type: 'encouragement',
        message: HINT_MESSAGES.firstMistake,
        speak: voiceOn,
      };
    } else if (this.mistakes === 2) {
      this.hintsUsed++;
      return {
        type: 'visual',
        message: HINT_MESSAGES.secondMistake,
        speak: voiceOn,
      };
    } else if (this.mistakes >= 3) {
      this.hintsUsed++;
      return {
        type: 'voice',
        message: HINT_MESSAGES.repeatedMistake,
        speak: voiceOn,
        shouldReduceDifficulty: this.mistakes >= 4,
      };
    }

    return null;
  }

  getHintsUsed() {
    return this.hintsUsed;
  }
}
