import { useState, useEffect } from 'react';
import { getGameResults } from '../utils/storage';
import { AdaptiveDifficultyManager, getLevelLabel } from '../utils/AdaptiveDifficultyManager';
import { GAME_IDS, GAME_INFO } from '../data/games';

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function computeStreak(allResults) {
  const daySet = new Set();
  Object.values(allResults).forEach((results) => {
    results.forEach((r) => {
      const d = new Date(r.timestamp);
      daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
  });

  if (daySet.size === 0) return 0;

  let streak = 0;
  const now = new Date();
  let check = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  while (daySet.has(`${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`)) {
    streak++;
    check.setDate(check.getDate() - 1);
  }

  return streak;
}

export default function Progress() {
  const [allResults, setAllResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAllResults(getGameResults());
    setLoading(false);
  }, []);

  if (loading) return null;

  const allGamesResults = Object.entries(allResults).flatMap(([gameId, results]) =>
    results.map((r) => ({ ...r, gameId }))
  );
  const hasData = allGamesResults.length > 0;

  const totalCompleted = allGamesResults.length;

  const averageAccuracy =
    totalCompleted > 0
      ? Math.round(
          allGamesResults.reduce((sum, r) => sum + (r.accuracy || 0), 0) / totalCompleted
        )
      : 0;

  let maxLevel = 1;
  GAME_INFO.forEach((game) => {
    const mgr = new AdaptiveDifficultyManager(game.id);
    const lvl = mgr.getLevel();
    if (lvl > maxLevel) maxLevel = lvl;
  });

  const streak = computeStreak(allResults);

  const recentResults = allGamesResults
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  const gameAccuracies = GAME_INFO.map((game) => {
    const results = allResults[game.id] || [];
    const avg =
      results.length > 0
        ? Math.round(results.reduce((s, r) => s + (r.accuracy || 0), 0) / results.length)
        : 0;
    return { game, accuracy: avg, count: results.length };
  });

  return (
    <div className="game-page">
      <h1 className="section-title">My Progress</h1>
      <p style={{ marginBottom: 24, opacity: 0.7 }}>Cognitive Activity Progress</p>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{totalCompleted}</div>
          <div className="stat-label">Games Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{averageAccuracy}%</div>
          <div className="stat-label">Average Accuracy</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {getLevelLabel(maxLevel)}
          </div>
          <div className="stat-label">Current Cognitive Level</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{streak}</div>
          <div className="stat-label">Current Streak</div>
        </div>
      </div>

      <h2 className="section-title" style={{ marginTop: 32 }}>Game Performance</h2>
      {gameAccuracies.map(({ game, accuracy, count }) => (
        <div key={game.id} className="progress-bar-container">
          <div className="progress-bar-label">
            <span>{game.icon} {game.title}</span>
            <span>{count > 0 ? `${accuracy}%` : 'No data'}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: count > 0 ? `${accuracy}%` : '0%' }}
            />
          </div>
        </div>
      ))}

      <h2 className="section-title" style={{ marginTop: 32 }}>Recent Activity</h2>
      {!hasData ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-text">No activity yet. Start playing games to see your progress!</div>
        </div>
      ) : (
        <div className="activity-list">
          {recentResults.map((result, idx) => {
            const gameInfo = GAME_INFO.find((g) => g.id === result.gameId);
            return (
              <div key={result.timestamp + '-' + idx} className="activity-item">
                <div className="activity-time">{formatDate(result.timestamp)}</div>
                <div className="activity-game">
                  {gameInfo ? `${gameInfo.icon} ${gameInfo.title}` : result.gameId}
                </div>
                <div className="activity-score">{result.accuracy || 0}%</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
