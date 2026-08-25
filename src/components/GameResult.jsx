import { Link } from 'react-router-dom';
import VoiceButton from './VoiceButton';

export default function GameResult({
  message,
  submessage,
  emoji,
  stats,
  onPlayAgain,
  speakText,
  gameName,
}) {
  return (
    <div className="game-result">
      <div className="result-emoji">{emoji || '🎉'}</div>
      <div className="result-message">{message}</div>
      <div className="result-submessage">{submessage}</div>

      {speakText && (
        <div style={{ marginBottom: 20 }}>
          <VoiceButton text={speakText} />
        </div>
      )}

      <div className="result-stats">
        {stats.map((stat, i) => (
          <div key={i} className="result-stat">
            <div className="stat-val">{stat.value}</div>
            <div className="stat-lbl">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="result-actions">
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Play Again
        </button>
        <Link to="/games" className="btn btn-outline">
          Back to Games
        </Link>
      </div>
    </div>
  );
}
