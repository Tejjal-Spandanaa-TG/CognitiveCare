import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { saveGameResult, getFamilyMembers } from '../utils/storage';
import { AdaptiveDifficultyManager } from '../utils/AdaptiveDifficultyManager';
import { HintManager } from '../utils/HintManager';
import { speak } from '../utils/VoiceManager';
import DifficultyIndicator from '../components/DifficultyIndicator';
import HintButton from '../components/HintButton';
import VoiceButton from '../components/VoiceButton';
import GameResult from '../components/GameResult';
import { GAME_IDS } from '../data/games';

function shuffleAndPick(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function generateChoices(correct, allMembers, count) {
  const choices = [correct.name];
  const others = allMembers.filter(m => m.id !== correct.id);
  const shuffled = others.sort(() => Math.random() - 0.5);
  for (const m of shuffled) {
    if (choices.length >= count) break;
    if (!choices.includes(m.name)) choices.push(m.name);
  }
  let n = 1;
  while (choices.length < count) {
    choices.push('Person ' + n);
    n++;
  }
  return choices.sort(() => Math.random() - 0.5);
}

export default function FamilyIdentification() {
  const [members, setMembers] = useState([]);
  const [gameState, setGameState] = useState('intro');
  const [currentMember, setCurrentMember] = useState(null);
  const [currentMemberPhoto, setCurrentMemberPhoto] = useState(null);
  const [choices, setChoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [hintMessage, setHintMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [totalQ, setTotalQ] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  const diffMgr = useRef(new AdaptiveDifficultyManager(GAME_IDS.FAMILY_IDENTIFICATION));
  const hintMgr = useRef(new HintManager());
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const membersRef = useRef([]);
  const questionMembersRef = useRef([]);
  const choicePhotosRef = useRef({});

  const loadMembers = useCallback(() => {
    const list = getFamilyMembers();
    setMembers(list);
    membersRef.current = list;
    const photoMap = {};
    list.forEach(m => { if (m.photo) photoMap[m.name] = m.photo; });
    choicePhotosRef.current = photoMap;
    return list;
  }, []);

  useEffect(() => {
    loadMembers();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loadMembers]);

  const showQuestion = useCallback((list, index) => {
    if (index >= list.length) return;
    const member = list[index];
    setCurrentMember(member);
    setCurrentMemberPhoto(member.photo || null);
    const params = diffMgr.current.getParams();
    const choiceCount = Math.min(params.itemCount + 1, membersRef.current.length);
    const opts = generateChoices(member, membersRef.current, choiceCount);
    setChoices(opts);
    setSelected(null);
    setHintMessage('');
    startRef.current = Date.now();
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    speak('Who is this person?');
  }, []);

  const startGame = useCallback(() => {
    const freshMembers = loadMembers();
    if (freshMembers.length < 2) {
      speak('Please add at least two family members first.');
      return;
    }
    const params = diffMgr.current.getParams();
    const count = Math.min(freshMembers.length, params.itemCount + 2);
    const selectedMembers = shuffleAndPick(freshMembers, count);
    questionMembersRef.current = selectedMembers;
    setTotalQ(selectedMembers.length);
    setCorrectCount(0);
    setMistakes(0);
    setHintsUsed(0);
    setQIndex(0);
    hintMgr.current.reset();
    setGameState('playing');
    showQuestion(selectedMembers, 0);
  }, [loadMembers, showQuestion]);

  const finishGame = useCallback((correct, total, mis, hints) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const responseTime = Math.floor((Date.now() - startRef.current) / 1000);
    diffMgr.current.recordResult(accuracy, responseTime, mis, hints);
    const gameResult = { accuracy, responseTime, mistakes: mis, hintsUsed: hints, score: accuracy, level: diffMgr.current.getLevel() };
    saveGameResult(GAME_IDS.FAMILY_IDENTIFICATION, gameResult);
    let message, emoji, submessage;
    if (accuracy === 100) { message = 'Perfect!'; emoji = '🏆'; submessage = 'You identified every family member!'; }
    else if (accuracy >= 80) { message = 'Excellent!'; emoji = '🌟'; submessage = 'Great family recognition!'; }
    else if (accuracy >= 50) { message = 'Good effort!'; emoji = '👍'; submessage = 'Keep practicing!'; }
    else { message = 'Keep trying!'; emoji = '💪'; submessage = 'You will get better with practice!'; }
    setResult({ message, emoji, submessage, stats: [
      { label: 'Accuracy', value: accuracy + '%' },
      { label: 'Correct', value: correct + '/' + total },
      { label: 'Mistakes', value: mis },
      { label: 'Level', value: 'Lv.' + diffMgr.current.getLevel() },
    ], speakText: message });
    setGameState('result');
  }, []);

  const handleSelect = useCallback((name) => {
    if (selected) return;
    setSelected(name);
    if (timerRef.current) clearInterval(timerRef.current);
    const isCorrect = name === currentMember.name;
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    const newMis = isCorrect ? mistakes : mistakes + 1;
    if (isCorrect) { speak('Correct! That is ' + currentMember.name + '.'); }
    else { speak('That was ' + currentMember.name + '.'); hintMgr.current.recordMistake(); }
    setCorrectCount(newCorrect);
    setMistakes(newMis);
    setTimeout(() => {
      const next = qIndex + 1;
      if (next >= totalQ) {
        finishGame(newCorrect, totalQ, newMis, hintsUsed);
      } else {
        setQIndex(next);
        showQuestion(questionMembersRef.current, next);
      }
    }, 1800);
  }, [selected, currentMember, correctCount, mistakes, hintsUsed, qIndex, totalQ, finishGame, showQuestion]);

  const handleHint = () => {
    hintMgr.current.recordMistake();
    const hint = hintMgr.current.getNextHint();
    if (hint) {
      setHintMessage(hint.message);
      if (hint.speak) speak(hint.message);
      setHintsUsed(h => h + 1);
    }
  };

  const getPhoto = (name) => choicePhotosRef.current[name] || null;

  if (gameState === 'result' && result) {
    return (
      <div className="game-page">
        <Link to="/games" className="back-btn">Back to Games</Link>
        <GameResult message={result.message} submessage={result.submessage} emoji={result.emoji}
          stats={result.stats} speakText={result.speakText} onPlayAgain={startGame} />
      </div>
    );
  }

  return (
    <div className="game-page">
      <Link to="/games" className="back-btn">Back to Games</Link>

      <div className="game-header">
        <h2>👨‍👩‍👧‍👦 Family Photo Identification</h2>
        <div className="game-subtitle-text">Photo-Based Family Recognition</div>
        <div style={{ marginTop: 8 }}><DifficultyIndicator level={diffMgr.current.getLevel()} /></div>
      </div>

      {gameState === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div className="game-instruction">
            Identify your family members from their photos.
          </div>

          {members.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📷</div>
              <div className="empty-text">No family members added yet</div>
              <p style={{ margin: '8px 0 20px', color: 'var(--text-light)' }}>
                Ask a caregiver to upload family photos first
              </p>
              <Link to="/games/family-manager" className="btn btn-primary btn-large">
                Add Family Members
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <VoiceButton text="Identify your family members from their photos." />
              </div>
              <p style={{ marginBottom: 16, color: 'var(--text-secondary)', fontWeight: 700 }}>
                {members.length} family member{members.length !== 1 ? 's' : ''} ready
              </p>

              <div className="family-preview-grid">
                {members.map(m => (
                  <div key={m.id} className="family-preview-card">
                    <div className="family-preview-photo">
                      {m.photo ? <img src={m.photo} alt={m.name} /> : <span>👤</span>}
                    </div>
                    <div className="family-preview-name">{m.name}</div>
                    <div className="family-preview-rel">{m.relationship}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                <Link to="/games/family-manager" className="btn btn-outline">
                  Manage Photos
                </Link>
                <button className="btn btn-primary btn-large" onClick={startGame}>Start Game</button>
              </div>
            </>
          )}
        </div>
      )}

      {gameState === 'playing' && currentMember && (
        <>
          <div className="timer">Timer: {timer}s</div>
          <div style={{ textAlign: 'center', marginBottom: 12, color: 'var(--text-light)', fontWeight: 700 }}>
            Question {qIndex + 1} of {totalQ}
          </div>

          <div className="person-card" style={{ maxWidth: 420, margin: '0 auto 24px' }}>
            <div className="person-photo" style={{ width: 180, height: 180 }}>
              {currentMemberPhoto ? (
                <img src={currentMemberPhoto} alt="Who is this?" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <span style={{ fontSize: 72 }}>👤</span>
              )}
            </div>
            <div className="person-question">Who is this person?</div>
          </div>

          <div className="options-grid" style={{ maxWidth: 520, margin: '0 auto' }}>
            {choices.map((name) => {
              const photo = getPhoto(name);
              return (
                <button key={name} disabled={!!selected} onClick={() => handleSelect(name)}
                  className={'option-btn family-option' + (selected === name ? (name === currentMember.name ? ' correct' : ' incorrect') : '')}>
                  <div className="family-option-inner">
                    {photo ? (
                      <img src={photo} alt={name} className="family-option-thumb" />
                    ) : (
                      <div className="family-option-avatar">👤</div>
                    )}
                    <span style={{ fontWeight: 700 }}>{name}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {hintMessage && <div className="hint-message" style={{ maxWidth: 520, margin: '16px auto' }}>{hintMessage}</div>}

          {!selected && <div style={{ textAlign: 'center', marginTop: 16 }}><HintButton onClick={handleHint} /></div>}
        </>
      )}
    </div>
  );
}
