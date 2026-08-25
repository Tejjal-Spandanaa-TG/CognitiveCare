import { useState } from 'react';
import { speak, stopSpeaking, isSpeaking } from '../utils/VoiceManager';

export default function VoiceButton({ text, label = 'Listen', className = '' }) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speak(text, {
        onend: () => setSpeaking(false),
      });
      setTimeout(() => setSpeaking(false), 5000);
    }
  };

  return (
    <button
      className={`voice-btn ${speaking ? 'speaking' : ''} ${className}`}
      onClick={handleSpeak}
      type="button"
    >
      <span>{speaking ? '🔊' : '🔈'}</span>
      <span>{speaking ? 'Speaking...' : label}</span>
    </button>
  );
}
