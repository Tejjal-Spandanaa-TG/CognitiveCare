import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GameCard from '../components/GameCard';
import ProgressCard from '../components/ProgressCard';
import { GAME_INFO, GAME_IDS } from '../data/games';
import { AdaptiveDifficultyManager } from '../utils/AdaptiveDifficultyManager';

export default function GamesDashboard() {
  const [stats, setStats] = useState({
    currentLevel: 1,
    gamesCompleted: 0,
    averageAccuracy: 0,
  });

  useEffect(() => {
    let totalCompleted = 0;
    let totalAccuracy = 0;
    let count = 0;
    let maxLevel = 1;

    Object.values(GAME_IDS).forEach((gameId) => {
      const mgr = new AdaptiveDifficultyManager(gameId);
      const completed = mgr.getGamesCompleted();
      const accuracy = mgr.getAverageAccuracy();
      const level = mgr.getLevel();
      totalCompleted += completed;
      if (completed > 0) {
        totalAccuracy += accuracy;
        count++;
      }
      if (level > maxLevel) maxLevel = level;
    });

    setStats({
      currentLevel: maxLevel,
      gamesCompleted: totalCompleted,
      averageAccuracy: count > 0 ? Math.round(totalAccuracy / count) : 0,
    });
  }, []);

  return (
    <div className="game-page">
      <div className="dashboard-header">
        <h2>Cognitive Games</h2>
        <p>Choose a game to exercise your memory</p>
      </div>

      <div className="stats-row">
        <ProgressCard label="Current Level" value={`Lv.${stats.currentLevel}`} />
        <ProgressCard label="Games Played" value={stats.gamesCompleted} />
        <ProgressCard label="Avg Accuracy" value={`${stats.averageAccuracy}%`} />
      </div>

      <div className="family-quick-access">
        <Link to="/games/family-manager" className="family-manage-link">
          <span>👨‍👩‍👧‍👦</span>
          <span>Manage Family Photos</span>
          <span className="btn-arrow">›</span>
        </Link>
      </div>

      <div className="games-grid">
        {GAME_INFO.map((game) => (
          <GameCard
            key={game.id}
            icon={game.icon}
            title={game.title}
            subtitle={game.subtitle}
            description={game.description}
            route={game.route}
          />
        ))}
      </div>
    </div>
  );
}
