import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { saveGameResult } from '../utils/storage';
import { AdaptiveDifficultyManager } from '../utils/AdaptiveDifficultyManager';
import { HintManager } from '../utils/HintManager';
import { speak } from '../utils/VoiceManager';
import { PATTERN_COLORS, GAME_IDS } from '../data/games';
import DifficultyIndicator from '../components/DifficultyIndicator';
import HintButton from '../components/HintButton';
import VoiceButton from '../components/VoiceButton';
import GameResult from '../components/GameResult';

const COLORS = PATTERN_COLORS.slice(0, 6);

export default function PatternReplay() {
  const [gameState, setGameState] = useState('intro');
  const [pattern, setPattern] = useState([]);
  const [userSelection, setUserSelection] = useState([]);
  const [activeCellIndex, setActiveCellIndex] = useState(-1);
  const [result, setResult] = useState(null);
  const [hintMessage, setHintMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  const diffMgr = useRef(new AdaptiveDifficultyManager(GAME_IDS.PATTERN_REPLAY));
  const hintMgr = useRef(new HintManager());
  const displayTimerRef = useRef(null);
  const sequenceTimerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (displayTimerRef.current) clearTimeout(displayTimerRef.current);
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    };
  }, []);

  const generatePattern = useCallback((length) => {
    const newPattern = [];
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * COLORS.length);
      newPattern.push(idx);
    }
    return newPattern;
  }, []);

  const showPattern = useCallback(() => {
    const params = diffMgr.current.getParams();
    const patternLength = Math.min(params.itemCount, COLORS.length);
    const newPattern = generatePattern(patternLength);
    setPattern(newPattern);
    setUserSelection([]);
    setHintMessage('');
    setGameState('showing');
    setActiveCellIndex(-1);

    let step = 0;
    const interval = 800;

    const showNext = () => {
      if (step < newPattern.length) {
        setActiveCellIndex(step);
        step++;
        sequenceTimerRef.current = setTimeout(showNext, interval);
      } else {
        setActiveCellIndex(-1);
        setCountdown(Math.ceil(params.displayTime / 1000));
        let remaining = Math.ceil(params.displayTime / 1000);
        const countdownInterval = setInterval(() => {
          remaining--;
          setCountdown(remaining);
          if (remaining <= 0) {
            clearInterval(countdownInterval);
          }
        }, 1000);

        displayTimerRef.current = setTimeout(() => {
          clearInterval(countdownInterval);
          setGameState('input');
          startTimeRef.current = Date.now();
          speak('Your turn! Repeat the pattern.');
        }, params.displayTime);
      }
    };

    showNext();
  }, [generatePattern]);

  const startGame = useCallback(() => {
    hintMgr.current.reset();
    showPattern();
  }, [showPattern]);

  const handleCellClick = (colorIndex) => {
    if (gameState !== 'input') return;
    setUserSelection([...userSelection, colorIndex]);
  };

  const clearSelection = () => {
    setUserSelection([]);
  };

  const handleSubmit = () => {
    if (gameState !== 'input') return;

    const responseTime = Math.round((Date.now() - startTimeRef.current) / 1000);
    let correct = 0;
    pattern.forEach((colorIdx, i) => {
      if (userSelection[i] === colorIdx) {
        correct++;
      }
    });

    const accuracy = pattern.length > 0 ? Math.round((correct / pattern.length) * 100) : 0;
    const mistakes = pattern.length - correct;
    const hintsUsed = hintMgr.current.getHintsUsed();

    if (accuracy < 100) {
      hintMgr.current.recordMistake();
    }

    diffMgr.current.recordResult(accuracy, responseTime, mistakes, hintsUsed);

    const gameResult = {
      accuracy,
      responseTime,
      mistakes,
      hintsUsed,
      score: accuracy,
      level: diffMgr.current.getLevel(),
    };
    saveGameResult(GAME_IDS.PATTERN_REPLAY, gameResult);

    let message, emoji, submessage;
    if (accuracy === 100) {
      message = 'Perfect!';
      emoji = '🏆';
      submessage = 'You replayed the pattern perfectly!';
    } else if (accuracy >= 80) {
      message = 'Excellent!';
      emoji = '🌟';
      submessage = 'Great pattern memory!';
    } else if (accuracy >= 50) {
      message = 'Good effort!';
      emoji = '👍';
      submessage = 'Almost there! Keep practicing.';
    } else {
      message = 'Keep trying!';
      emoji = '💪';
      submessage = "You'll get it next time!";
    }

    setResult({
      message,
      emoji,
      submessage,
      stats: [
        { label: 'Accuracy', value: `${accuracy}%` },
        { label: 'Time', value: `${responseTime}s` },
        { label: 'Correct', value: `${correct}/${pattern.length}` },
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
        <h2>🎨 Pattern Replay</h2>
        <div className="game-subtitle-text">Pattern & Sequence Memory</div>
        <div style={{ marginTop: 8 }}>
          <DifficultyIndicator level={diffMgr.current.getLevel()} />
        </div>
      </div>

      {gameState === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div className="game-instruction">
            Remember and reproduce the pattern.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <VoiceButton text="Remember and reproduce the pattern." />
          </div>
          <button className="btn btn-primary btn-large" onClick={startGame}>
            Start Game
          </button>
        </div>
      )}

      {gameState === 'showing' && (
        <div style={{ textAlign: 'center' }}>
          <div className="game-instruction">Watch carefully...</div>

          <div className="pattern-display">
            {pattern.map((colorIdx, i) => (
              <div key={i} className="pattern-arrow">
                <div className="pattern-dot" style={{ backgroundColor: COLORS[colorIdx].color }} />
              </div>
            ))}
          </div>

          <div className="pattern-grid" style={{ marginTop: 24 }}>
            {COLORS.map((c, i) => (
              <div
                key={i}
                className={`pattern-cell ${activeCellIndex >= 0 && pattern[activeCellIndex] === i ? 'active' : ''}`}
                style={{ backgroundColor: c.color }}
              >
                <span style={{ fontSize: 32 }}>{c.symbol}</span>
              </div>
            ))}
          </div>

          {countdown > 0 && (
            <div className="timer" style={{ marginTop: 16 }}>
              Memorize in {countdown}s
            </div>
          )}
        </div>
      )}

      {gameState === 'input' && (
        <div style={{ textAlign: 'center' }}>
          <div className="game-instruction">Your turn! Repeat the pattern.</div>

          <div className="pattern-display">
            {pattern.map((_, i) => (
              <div key={i} className="pattern-arrow">
                <div
                  className="pattern-dot"
                  style={{
                    backgroundColor: userSelection[i] !== undefined
                      ? COLORS[userSelection[i]].color
                      : '#ccc',
                  }}
                />
              </div>
            ))}
          </div>

          <div className="pattern-grid" style={{ marginTop: 24 }}>
            {COLORS.map((c, i) => (
              <div
                key={i}
                className={`pattern-cell ${userSelection.length > 0 && userSelection[userSelection.length - 1] === i ? 'selected' : ''}`}
                style={{ backgroundColor: c.color, cursor: 'pointer' }}
                onClick={() => handleCellClick(i)}
              >
                <span style={{ fontSize: 32 }}>{c.symbol}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 8, color: 'var(--text-light)' }}>
            Selected: {userSelection.length} / {pattern.length}
          </div>

          {hintMessage && (
            <div className="hint-message">{hintMessage}</div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <HintButton onClick={handleHint} />
            <button className="btn btn-outline" onClick={clearSelection}>
              Clear
            </button>
            <button
              className="btn btn-primary btn-large"
              onClick={handleSubmit}
              disabled={userSelection.length === 0}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
