import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getRoutine, saveRoutine, saveGameResult } from '../utils/storage';
import { getDefaultRoutine, shuffleArray, generateId } from '../data/routines';
import { AdaptiveDifficultyManager } from '../utils/AdaptiveDifficultyManager';
import { HintManager } from '../utils/HintManager';
import { speak } from '../utils/VoiceManager';
import DifficultyIndicator from '../components/DifficultyIndicator';
import HintButton from '../components/HintButton';
import VoiceButton from '../components/VoiceButton';
import GameResult from '../components/GameResult';
import { GAME_IDS } from '../data/games';

export default function MyDayMyWay() {
  const [activities, setActivities] = useState([]);
  const [shuffledActivities, setShuffledActivities] = useState([]);
  const [gameState, setGameState] = useState('intro');
  const [result, setResult] = useState(null);
  const [hintMessage, setHintMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [showRoutineEditor, setShowRoutineEditor] = useState(false);
  const [editedRoutine, setEditedRoutine] = useState([]);
  const [newActivity, setNewActivity] = useState('');
  const [dragIndex, setDragIndex] = useState(null);

  const diffMgr = useRef(new AdaptiveDifficultyManager(GAME_IDS.MY_DAY_MY_WAY));
  const hintMgr = useRef(new HintManager());
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const routine = getRoutine() || getDefaultRoutine();
    setActivities(routine);
    setEditedRoutine(routine);
  }, []);

  const startGame = useCallback(() => {
    const params = diffMgr.current.getParams();
    const activitySubset = activities.slice(0, Math.min(activities.length, params.itemCount + 2));
    const shuffled = shuffleArray(activitySubset).map((a, i) => ({
      ...a,
      tempId: i,
    }));
    setShuffledActivities(shuffled);
    hintMgr.current.reset();
    setHintMessage('');
    setGameState('playing');
    startTimeRef.current = Date.now();
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    speak('Arrange the activities in the correct order.');
  }, [activities]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const moveItem = (index, direction) => {
    const newList = [...shuffledActivities];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= newList.length) return;
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    setShuffledActivities(newList);
  };

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const responseTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    let correctPositions = 0;
    const originalOrder = activities.slice(0, shuffledActivities.length);

    shuffledActivities.forEach((item, i) => {
      if (originalOrder[i] && item.text === originalOrder[i].text) {
        correctPositions++;
      }
    });

    const accuracy = Math.round((correctPositions / shuffledActivities.length) * 100);
    const mistakes = shuffledActivities.length - correctPositions;
    const hintsUsed = hintMgr.current.getHintsUsed();

    diffMgr.current.recordResult(accuracy, responseTime, mistakes, hintsUsed);

    const gameResult = {
      accuracy,
      responseTime,
      mistakes,
      hintsUsed,
      score: accuracy,
      level: diffMgr.current.getLevel(),
    };
    saveGameResult(GAME_IDS.MY_DAY_MY_WAY, gameResult);

    let message, emoji, submessage;
    if (accuracy === 100) {
      message = 'Perfect!';
      emoji = '🏆';
      submessage = 'You arranged everything perfectly!';
    } else if (accuracy >= 80) {
      message = 'Excellent!';
      emoji = '🌟';
      submessage = 'Great memory!';
    } else if (accuracy >= 50) {
      message = 'Good effort!';
      emoji = '👍';
      submessage = 'Almost there!';
    } else {
      message = 'Keep trying!';
      emoji = '💪';
      submessage = "Let's try again.";
    }

    setResult({
      message,
      emoji,
      submessage,
      stats: [
        { label: 'Accuracy', value: `${accuracy}%` },
        { label: 'Time', value: `${responseTime}s` },
        { label: 'Correct', value: `${correctPositions}/${shuffledActivities.length}` },
        { label: 'Hints Used', value: hintsUsed },
      ],
      speakText: message,
    });
    setGameState('result');
  };

  const handleHint = () => {
    hintMgr.current.recordMistake();
    const hint = hintMgr.current.getNextHint();
    if (hint) {
      setHintMessage(hint.message);
      if (hint.speak) speak(hint.message);
      if (hint.shouldReduceDifficulty) {
        speak('Let us try an easier level.');
      }
    }
  };

  const saveEditedRoutine = () => {
    const valid = editedRoutine.filter(a => a.text.trim());
    if (valid.length > 0) {
      setActivities(valid);
      saveRoutine(valid);
    }
    setShowRoutineEditor(false);
  };

  const addActivity = () => {
    if (newActivity.trim()) {
      setEditedRoutine([...editedRoutine, { id: generateId(), text: newActivity.trim() }]);
      setNewActivity('');
    }
  };

  const removeActivity = (id) => {
    setEditedRoutine(editedRoutine.filter(a => a.id !== id));
  };

  if (gameState === 'result' && result) {
    return (
      <div className="game-page">
        <Link to="/games" className="back-btn">← Back to Games</Link>
        <GameResult
          message={result.message}
          submessage={result.submessage}
          emoji={result.emoji}
          stats={result.stats}
          speakText={result.speakText}
          onPlayAgain={startGame}
        />
      </div>
    );
  }

  return (
    <div className="game-page">
      <Link to="/games" className="back-btn">← Back to Games</Link>

      <div className="game-header">
        <h2>🧩 My Day, My Way</h2>
        <div className="game-subtitle-text">Daily Routine Recall</div>
        <div style={{ marginTop: 8 }}>
          <DifficultyIndicator level={diffMgr.current.getLevel()} />
        </div>
      </div>

      {gameState === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div className="game-instruction">
            Arrange your daily activities in the correct order.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <VoiceButton text="Arrange the activities in the correct order." />
            <button className="btn btn-outline" onClick={() => setShowRoutineEditor(true)}>
              ✏️ Edit Routine
            </button>
          </div>
          <button className="btn btn-primary btn-large btn-full" onClick={startGame}>
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          <div className="timer">⏱ {timer}s</div>
          <div className="game-instruction">
            Arrange your day in the correct order.
          </div>

          <div className="drag-list">
            {shuffledActivities.map((item, index) => (
              <div key={item.tempId} className="drag-item">
                <span className="drag-number">{index + 1}</span>
                <span style={{ flex: 1 }}>{item.text}</span>
                <button
                  className="move-btn"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  ▲
                </button>
                <button
                  className="move-btn"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === shuffledActivities.length - 1}
                  aria-label="Move down"
                >
                  ▼
                </button>
              </div>
            ))}
          </div>

          {hintMessage && (
            <div className="hint-message">{hintMessage}</div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <HintButton onClick={handleHint} />
            <button className="btn btn-primary btn-large" onClick={handleSubmit}>
              Check My Order
            </button>
          </div>
        </>
      )}

      {showRoutineEditor && (
        <div className="modal-overlay" onClick={() => setShowRoutineEditor(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Daily Routine</h3>
            <div className="routine-editor">
              {editedRoutine.map((item) => (
                <div key={item.id} className="routine-item-editor">
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => {
                      setEditedRoutine(editedRoutine.map(a =>
                        a.id === item.id ? { ...a, text: e.target.value } : a
                      ));
                    }}
                  />
                  <button className="routine-remove-btn" onClick={() => removeActivity(item.id)}>
                    ✕
                  </button>
                </div>
              ))}
              <div className="routine-item-editor">
                <input
                  type="text"
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  placeholder="Add new activity..."
                  onKeyDown={(e) => e.key === 'Enter' && addActivity()}
                />
                <button className="btn btn-secondary" onClick={addActivity}>
                  Add
                </button>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowRoutineEditor(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEditedRoutine}>
                Save Routine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
