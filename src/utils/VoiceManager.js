let synth = null;
let currentUtterance = null;

function getSynth() {
  if (!synth && typeof window !== 'undefined' && window.speechSynthesis) {
    synth = window.speechSynthesis;
  }
  return synth;
}

export function speak(text, options = {}) {
  const s = getSynth();
  if (!s) return;

  if (currentUtterance) {
    s.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || 0.9;
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;
  utterance.lang = options.lang || 'en-US';

  utterance.onend = () => {
    currentUtterance = null;
  };

  utterance.onerror = () => {
    currentUtterance = null;
  };

  currentUtterance = utterance;
  s.speak(utterance);
}

export function stopSpeaking() {
  const s = getSynth();
  if (s) {
    s.cancel();
    currentUtterance = null;
  }
}

export function isSpeaking() {
  const s = getSynth();
  return s ? s.speaking : false;
}

export function getVoiceCommands() {
  return {
    'start my day my way': 'games/my-day-my-way',
    'open games': '/games',
    'who is this': '/games/who-is-this',
    'find it': '/games/find-it-before-i-forget',
    'pattern replay': '/games/pattern-replay',
    'my progress': '/progress',
    'my profile': '/profile',
    'settings': '/settings',
    'home': '/',
  };
}

let recognition = null;
let onResultCallback = null;

export function startListening(callback) {
  const SpeechRecognition = typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported');
    return false;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  onResultCallback = callback;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase().trim();
    if (onResultCallback) {
      onResultCallback(transcript);
    }
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
  };

  recognition.onend = () => {
    recognition = null;
  };

  try {
    recognition.start();
    return true;
  } catch (e) {
    console.warn('Failed to start recognition:', e);
    return false;
  }
}

export function stopListening() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}
