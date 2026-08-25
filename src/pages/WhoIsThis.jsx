import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { saveGameResult, getFamilyMembers, saveFamilyMembers } from '../utils/storage';
import { AdaptiveDifficultyManager } from '../utils/AdaptiveDifficultyManager';
import { HintManager } from '../utils/HintManager';
import { speak } from '../utils/VoiceManager';
import DifficultyIndicator from '../components/DifficultyIndicator';
import HintButton from '../components/HintButton';
import VoiceButton from '../components/VoiceButton';
import GameResult from '../components/GameResult';
import { GAME_IDS } from '../data/games';

function generateOptions(correctPerson, allPeople, count) {
  const opts = [correctPerson.name];
  const others = allPeople.filter(p => p.id !== correctPerson.id).sort(() => Math.random() - 0.5);
  for (const p of others) {
    if (opts.length >= count) break;
    if (!opts.includes(p.name)) opts.push(p.name);
  }
  let n = opts.length + 1;
  while (opts.length < count) {
    opts.push('Person ' + n);
    n++;
  }
  return opts.sort(() => Math.random() - 0.5);
}

export default function WhoIsThis() {
  const [people, setPeople] = useState([]);
  const [gameState, setGameState] = useState('intro');
  const [currentPerson, setCurrentPerson] = useState(null);
  const [currentPersonPhoto, setCurrentPersonPhoto] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [hintMessage, setHintMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [totalHints, setTotalHints] = useState(0);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: '', relationship: 'Family Member', photo: null });
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const peopleRef = useRef([]);
  const photoMapRef = useRef({});

  const diffMgr = useRef(new AdaptiveDifficultyManager(GAME_IDS.WHO_IS_THIS));
  const hintMgr = useRef(new HintManager());
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const videoRef = useRef(null);
  const questionPeopleRef = useRef([]);
  const fileInputRef = useRef(null);

  const loadPeople = useCallback(() => {
    const list = getFamilyMembers();
    setPeople(list);
    peopleRef.current = list;
    const map = {};
    list.forEach(p => { if (p.photo) map[p.name] = p.photo; });
    photoMapRef.current = map;
    return list;
  }, []);

  useEffect(() => {
    loadPeople();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loadPeople]);

  const startNewQuestion = useCallback((list, index) => {
    if (index >= list.length) return;
    const person = list[index];
    setCurrentPerson(person);
    setCurrentPersonPhoto(person.photo || null);
    const params = diffMgr.current.getParams();
    const opts = generateOptions(person, peopleRef.current, params.itemCount + 2);
    setOptions(opts);
    setSelectedOption(null);
    setHintMessage('');
    startTimeRef.current = Date.now();
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    speak('Who is this?');
  }, []);

  const startGame = useCallback(() => {
    const freshPeople = loadPeople();
    if (freshPeople.length < 2) {
      speak('Please add at least two people first.');
      return;
    }
    const params = diffMgr.current.getParams();
    const count = Math.min(freshPeople.length, params.itemCount + 2);
    const shuffled = [...freshPeople].sort(() => Math.random() - 0.5).slice(0, count);
    questionPeopleRef.current = shuffled;
    setTotalQuestions(shuffled.length);
    setCorrectCount(0);
    setTotalMistakes(0);
    setTotalHints(0);
    setQuestionIndex(0);
    hintMgr.current.reset();
    setHintMessage('');
    setGameState('playing');
    startNewQuestion(shuffled, 0);
  }, [loadPeople, startNewQuestion]);

  const finishGame = useCallback((correct, total, mistakes, hints) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const responseTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    diffMgr.current.recordResult(accuracy, responseTime, mistakes, hints);
    const gameResult = { accuracy, responseTime, mistakes, hintsUsed: hints, score: accuracy, level: diffMgr.current.getLevel() };
    saveGameResult(GAME_IDS.WHO_IS_THIS, gameResult);
    let message, emoji, submessage;
    if (accuracy === 100) { message = 'Perfect!'; emoji = '🏆'; submessage = 'You recognized everyone!'; }
    else if (accuracy >= 80) { message = 'Excellent!'; emoji = '🌟'; submessage = 'Great recognition skills!'; }
    else if (accuracy >= 50) { message = 'Good effort!'; emoji = '👍'; submessage = 'Keep practicing!'; }
    else { message = 'Keep trying!'; emoji = '💪'; submessage = 'Practice makes perfect!'; }
    setResult({ message, emoji, submessage, stats: [
      { label: 'Accuracy', value: accuracy + '%' },
      { label: 'Correct', value: correct + '/' + total },
      { label: 'Mistakes', value: mistakes },
      { label: 'Level', value: 'Lv.' + diffMgr.current.getLevel() },
    ], speakText: message });
    setGameState('result');
  }, []);

  const handleOptionSelect = (option) => {
    if (selectedOption) return;
    setSelectedOption(option);
    if (timerRef.current) clearInterval(timerRef.current);
    const isCorrect = option === currentPerson.name;
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    const newMistakes = isCorrect ? totalMistakes : totalMistakes + 1;
    if (isCorrect) { speak('Correct! That is ' + currentPerson.name + '.'); }
    else { speak('That was ' + currentPerson.name + '.'); hintMgr.current.recordMistake(); }
    setCorrectCount(newCorrect);
    setTotalMistakes(newMistakes);
    setTimeout(() => {
      const next = questionIndex + 1;
      if (next >= totalQuestions) {
        finishGame(newCorrect, totalQuestions, newMistakes, totalHints);
      } else {
        setQuestionIndex(next);
        startNewQuestion(questionPeopleRef.current, next);
      }
    }, 1500);
  };

  const handleHint = () => {
    hintMgr.current.recordMistake();
    const hint = hintMgr.current.getNextHint();
    if (hint) {
      setHintMessage(hint.message);
      if (hint.speak) speak(hint.message);
      setTotalHints(h => h + 1);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPerson({ ...newPerson, photo: reader.result });
      setSaving(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addPerson = () => {
    if (!newPerson.name.trim()) return;
    const updated = [...people, { ...newPerson, id: Date.now() }];
    const saved = saveFamilyMembers(updated);
    if (!saved) {
      alert('Photo is too large. Please use a smaller image.');
      return;
    }
    setPeople(updated);
    peopleRef.current = updated;
    const map = { ...photoMapRef.current };
    if (newPerson.photo) map[newPerson.name] = newPerson.photo;
    photoMapRef.current = map;
    setNewPerson({ name: '', relationship: 'Family Member', photo: null });
    setShowAddPerson(false);
    stopCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraActive(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (err) { console.warn('Camera not available:', err); }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setNewPerson({ ...newPerson, photo: canvas.toDataURL('image/jpeg', 0.6) });
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setCameraActive(false);
  };

  const getPhoto = (name) => photoMapRef.current[name] || null;

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
        <h2>👤 Who Is This?</h2>
        <div className="game-subtitle-text">Familiar Face &amp; Voice Recognition</div>
        <div style={{ marginTop: 8 }}><DifficultyIndicator level={diffMgr.current.getLevel()} /></div>
      </div>

      {gameState === 'intro' && (
        <div style={{ textAlign: 'center' }}>
          <div className="game-instruction">Recognize people you know.</div>

          {people.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📷</div>
              <div className="empty-text">No people added yet</div>
              <p style={{ margin: '8px 0 20px', color: 'var(--text-light)' }}>
                Add people with photos to play this game
              </p>
              <button className="btn btn-primary btn-large" onClick={() => setShowAddPerson(true)}>
                Add First Person
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                <VoiceButton text="Recognize people you know. Who is this?" />
                <button className="btn btn-outline" onClick={() => setShowAddPerson(true)}>Add Person</button>
              </div>

              <p style={{ marginBottom: 16, color: 'var(--text-secondary)', fontWeight: 700 }}>
                {people.length} people added
              </p>

              <div className="family-preview-grid">
                {people.map(person => (
                  <div key={person.id} className="family-preview-card">
                    <div className="family-preview-photo">
                      {person.photo ? <img src={person.photo} alt={person.name} /> : <span>👤</span>}
                    </div>
                    <div className="family-preview-name">{person.name}</div>
                    <div className="family-preview-rel">{person.relationship}</div>
                  </div>
                ))}
              </div>

              <button className="btn btn-primary btn-large btn-full" onClick={startGame} disabled={people.length < 2}>
                {people.length < 2 ? 'Add at least 2 people' : 'Start Game'}
              </button>
            </>
          )}
        </div>
      )}

      {gameState === 'playing' && currentPerson && (
        <>
          <div className="timer">Timer: {timer}s</div>
          <div style={{ textAlign: 'center', marginBottom: 12, color: 'var(--text-light)', fontWeight: 700 }}>
            Question {questionIndex + 1} of {totalQuestions}
          </div>
          <div className="person-card" style={{ maxWidth: 420, margin: '0 auto 24px' }}>
            <div className="person-photo" style={{ width: 180, height: 180 }}>
              {currentPersonPhoto ? (
                <img src={currentPersonPhoto} alt="Who is this?" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <span style={{ fontSize: 72 }}>👤</span>
              )}
            </div>
            <div className="person-question">Who is this?</div>
          </div>
          <div className="options-grid" style={{ maxWidth: 520, margin: '0 auto' }}>
            {options.map((opt) => {
              const photo = getPhoto(opt);
              return (
                <button key={opt} disabled={!!selectedOption} onClick={() => handleOptionSelect(opt)}
                  className={'option-btn family-option' + (selectedOption === opt ? (opt === currentPerson.name ? ' correct' : ' incorrect') : '')}>
                  <div className="family-option-inner">
                    {photo ? (
                      <img src={photo} alt={opt} className="family-option-thumb" />
                    ) : (
                      <div className="family-option-avatar">👤</div>
                    )}
                    <span style={{ fontWeight: 700 }}>{opt}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {hintMessage && <div className="hint-message" style={{ maxWidth: 520, margin: '16px auto' }}>{hintMessage}</div>}
          {!selectedOption && <div style={{ textAlign: 'center', marginTop: 16 }}><HintButton onClick={handleHint} /></div>}
        </>
      )}

      {showAddPerson && (
        <div className="modal-overlay" onClick={() => { setShowAddPerson(false); stopCamera(); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Person</h3>
            <div className="form-group">
              <label>Name</label>
              <input className="form-input" type="text" value={newPerson.name} placeholder="Enter name"
                onChange={e => setNewPerson({ ...newPerson, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Relationship</label>
              <select className="form-select" value={newPerson.relationship}
                onChange={e => setNewPerson({ ...newPerson, relationship: e.target.value })}>
                {['Mother', 'Father', 'Daughter', 'Son', 'Wife', 'Husband', 'Sister', 'Brother', 'Grandmother', 'Grandfather', 'Friend', 'Caregiver', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Photo</label>
              {cameraActive ? (
                <div className="camera-view">
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 12 }} />
                  <div className="camera-buttons" style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" onClick={capturePhoto}>Capture</button>
                    <button className="btn btn-ghost" onClick={stopCamera}>Cancel</button>
                  </div>
                </div>
              ) : newPerson.photo ? (
                <div className="photo-preview">
                  <img src={newPerson.photo} alt="Preview" />
                  <button className="btn btn-ghost" onClick={() => setNewPerson({ ...newPerson, photo: null })}>Remove Photo</button>
                </div>
              ) : (
                <div className="photo-upload-area">
                  {saving && <p style={{ marginBottom: 8, color: 'var(--primary)', fontWeight: 700 }}>Processing photo...</p>}
                  <div className="upload-options">
                    <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={saving}>Choose from Gallery</button>
                    <button className="btn btn-outline" onClick={startCamera} disabled={saving}>Take Photo</button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { setShowAddPerson(false); stopCamera(); }}>Cancel</button>
              <button className="btn btn-primary" onClick={addPerson} disabled={!newPerson.name.trim()}>Save Person</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
