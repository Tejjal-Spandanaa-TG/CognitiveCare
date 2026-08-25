import { getLevelLabel } from '../utils/AdaptiveDifficultyManager';

export default function DifficultyIndicator({ level }) {
  return (
    <div className="difficulty-indicator">
      <span>Level {level}</span>
      <span style={{ color: 'var(--text-light)' }}>|</span>
      <span>{getLevelLabel(level)}</span>
      <div className="difficulty-dots">
        {[1, 2, 3, 4, 5].map((l) => (
          <div
            key={l}
            className={`difficulty-dot ${l <= level ? 'filled' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
