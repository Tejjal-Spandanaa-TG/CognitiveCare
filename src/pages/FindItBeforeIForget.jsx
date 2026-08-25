import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { saveGameResult } from '../utils/storage';
import { AdaptiveDifficultyManager } from '../utils/AdaptiveDifficultyManager';
import { HintManager } from '../utils/HintManager';
import { speak } from '../utils/VoiceManager';
import DifficultyIndicator from '../components/DifficultyIndicator';
import HintButton from '../components/HintButton';
import VoiceButton from '../components/VoiceButton';
import GameResult from '../components/GameResult';
import { FIND_OBJECTS, GAME_IDS } from '../data/games';

export default function FindItBeforeIForget() {
  const [gameState, setGameState] = useState('intro');
  const [currentObject, setCurrentObject] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [totalHints, setTotalHints] = useState(0);
  const [timer, setTimer] = useState(0);
  const [hintMessage, setHintMessage] = useState('');
  const [result, setResult] = useState(null);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const diffMgr = useRef(new AdaptiveDifficultyManager(GAME_IDS.FIND_IT));
  const hintMgr = useRef(new HintManager());
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const roundObjectsRef = useRef([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopCamera();
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraActive(true);
      setCameraFailed(false);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      console.warn('Camera not available:', err);
      setCameraFailed(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const pickRoundObjects = useCallback((count) => {
    const shuffled = [...FIND_OBJECTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, FIND_OBJECTS.length));
  }, []);

  const startRound = useCallback((index) => {
    const obj = roundObjectsRef.current[index];
    setCurrentObject(obj);
    setHintMessage('');
    startTimer();
    speak(`Find your ${obj.name}.`);
  }, [startTimer]);

  const startGame = useCallback(() => {
    const params = diffMgr.current.getParams();
    const rounds = params.itemCount + 2;
    const objects = pickRoundObjects(rounds);
    roundObjectsRef.current = objects;
    setTotalRounds(rounds);
    setCorrectCount(0);
    setTotalMistakes(0);
    setTotalHints(0);
    setRoundIndex(0);
    hintMgr.current.reset();
    setGameState('playing');
    startCamera();
    startRound(0);
  }, [pickRoundObjects, startCamera, startRound]);

  const advanceRound = useCallback((newCorrect, newMistakes, newHints) => {
    stopTimer();
    stopCamera();
    const next = roundIndex + 1;
    if (next >= totalRounds) {
      finishGame(newCorrect, totalRounds, newMistakes, newHints);
    } else {
      setRoundIndex(next);
      startCamera();
      startRound(next);
    }
  }, [roundIndex, totalRounds, stopTimer, stopCamera, startCamera, startRound]);

  const finishGame = useCallback((correct, total, mistakes, hints) => {
    stopTimer();
    stopCamera();
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const responseTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    diffMgr.current.recordResult(accuracy, responseTime, mistakes, hints);
    const gameResult = {
      accuracy,
      responseTime,
      mistakes,
      hintsUsed: hints,
      score: accuracy,
      level: diffMgr.current.getLevel(),
    };
    saveGameResult(GAME_IDS.FIND_IT, gameResult);

    let message, emoji, submessage;
    if (accuracy === 100) {
      message = 'Perfect!';
      emoji = '🏆';
      submessage = 'You found every object!';
    } else if (accuracy >= 80) {
      message = 'Excellent!';
      emoji = '🌟';
      submessage = 'Great visual memory!';
    } else if (accuracy >= 50) {
      message = 'Good effort!';
      emoji = '👍';
      submessage = 'Keep practicing!';
    } else {
      message = 'Keep trying!';
      emoji = '💪';
      submessage = 'Practice makes perfect!';
    }

    setResult({
      message,
      emoji,
      submessage,
      stats: [
        { label: 'Accuracy', value: accuracy + '%' },
        { label: 'Found', value: correct + '/' + total },
        { label: 'Skipped', value: mistakes },
        { label: 'Level', value: 'Lv.' + diffMgr.current.getLevel() },
      ],
      speakText: message,
    });
    setGameState('result');
  }, [stopTimer, stopCamera]);

  const handleFound = useCallback(() => {
    stopTimer();
    const newCorrect = correctCount + 1;
    setCorrectCount(newCorrect);
    speak('Great job!');
    advanceRound(newCorrect, totalMistakes, totalHints);
  }, [correctCount, totalMistakes, totalHints, stopTimer, advanceRound]);

  const handleSkip = useCallback(() => {
    stopTimer();
    const newMistakes = totalMistakes + 1;
    setTotalMistakes(newMistakes);
    hintMgr.current.recordMistake();
    const hint = hintMgr.current.getNextHint();
    if (hint) {
      setHintMessage(hint.message);
      if (hint.speak) speak(hint.message);
      setTotalHints(hints => hints + 1);
    }
    speak('No problem. Next one.');
    advanceRound(correctCount, newMistakes, totalHints);
  }, [correctCount, totalMistakes, totalHints, stopTimer, advanceRound]);

  const handleHint = useCallback(() => {
    hintMgr.current.recordMistake();
    const hint = hintMgr.current.getNextHint();
    if (hint) {
      setHintMessage(hint.message);
      if (hint.speak) speak(hint.message);
      setTotalHints((h) => h + 1);
    }
  }, []);

  if (gameState === 'result' && result) {
    return (
      <div className="game-page">
        <Link to="/games" className="back-btn">Back to Games</Link>
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
      <Link to="/games" className="back-btn">Back to Games</Link>
      <div className="game-header">
        <h2>Find It Before I Forget</h2>
        <DifficultyIndicator level={diffMgr.current.getLevel()} />
      </div>

      {gameState === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div className="game-instruction">
            Find the requested object.
          </div>
          <div style={{ marginBottom: 24 }}>
            <VoiceButton text="Find it before I forget. Find the requested object using your camera." />
          </div>
          <button
            className="btn btn-primary btn-large btn-full"
            onClick={startGame}
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && currentObject && (
        <>
          <div className="timer">Timer: {timer}s</div>
          <div style={{ textAlign: 'center', marginBottom: 8, color: 'var(--text-light)' }}>
            Round {roundIndex + 1} of {totalRounds}
          </div>

          <div className="game-instruction">
            Find your <strong>{currentObject.icon} {currentObject.name}</strong>
          </div>

          <div className="camera-view">
            {cameraFailed ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <p>Camera not available</p>
                <p style={{ fontSize: 14, color: 'var(--text-light)' }}>
                  Look around you and click the buttons below when ready.
                </p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', borderRadius: 12 }}
              />
            )}
          </div>

          <div className="camera-buttons">
            <button
              className="btn btn-primary btn-large"
              onClick={handleFound}
            >
              Yes, I Found It!
            </button>
            <button
              className="btn btn-outline btn-large"
              onClick={handleSkip}
            >
              Skip
            </button>
          </div>

          {hintMessage && (
            <div className="hint-message">{hintMessage}</div>
          )}

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <HintButton onClick={handleHint} />
          </div>
        </>
      )}
    </div>
  );
}
