import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { saveFamilyMembers, getFamilyMembers } from '../utils/storage';

function compressImage(file, maxSize = 400, quality = 0.6) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function FamilyManager() {
  const [members, setMembers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relationship: '', photo: null });
  const [cameraActive, setCameraActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    setMembers(getFamilyMembers());
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    const compressed = await compressImage(file, 400, 0.6);
    setNewMember({ ...newMember, photo: compressed });
    setSaving(false);
    e.target.value = '';
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      console.warn('Camera not available:', err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    const maxDim = 400;
    let w = videoRef.current.videoWidth;
    let h = videoRef.current.videoHeight;
    if (w > maxDim || h > maxDim) {
      if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
      else { w = Math.round(w * maxDim / h); h = maxDim; }
    }
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, w, h);
    setNewMember({ ...newMember, photo: canvas.toDataURL('image/jpeg', 0.6) });
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setCameraActive(false);
  };

  const addMember = () => {
    if (!newMember.name.trim() || !newMember.relationship.trim()) return;
    const updated = [...members, { ...newMember, id: Date.now() }];
    const saved = saveFamilyMembers(updated);
    if (!saved) {
      alert('Photo is too large. Please use a smaller image.');
      return;
    }
    setMembers(updated);
    setNewMember({ name: '', relationship: '', photo: null });
    setShowAdd(false);
  };

  const removeMember = (id) => {
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    saveFamilyMembers(updated);
  };

  return (
    <div className="game-page">
      <Link to="/games" className="back-btn">Back to Games</Link>

      <div className="family-manager">
        <div className="family-manager-header">
          <h2>Family Photo Manager</h2>
          <p>Upload photos of family members for the identification game</p>
        </div>

        {members.length > 0 && (
          <div className="family-grid">
            {members.map((member) => (
              <div key={member.id} className="family-member-card">
                <div className="family-photo">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} />
                  ) : (
                    <span className="family-placeholder">👤</span>
                  )}
                </div>
                <div className="family-info">
                  <div className="family-name">{member.name}</div>
                  <div className="family-relation">{member.relationship}</div>
                </div>
                <button className="family-remove" onClick={() => removeMember(member.id)} aria-label="Remove">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {members.length === 0 && !showAdd && (
          <div className="empty-state">
            <div className="empty-icon">👨‍👩‍👧‍👦</div>
            <div className="empty-text">No family members added yet</div>
            <p style={{ marginTop: 8, color: 'var(--text-light)' }}>Add family members with photos to play the identification game</p>
          </div>
        )}

        {!showAdd ? (
          <button className="btn btn-primary btn-full btn-large" onClick={() => setShowAdd(true)}>
            Add Family Member
          </button>
        ) : (
          <div className="add-member-form">
            <h3>Add Family Member</h3>

            <div className="form-group">
              <label>Name</label>
              <input className="form-input" type="text" value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                placeholder="Enter their name" />
            </div>

            <div className="form-group">
              <label>Relationship</label>
              <select className="form-select" value={newMember.relationship}
                onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}>
                <option value="">Select relationship</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Daughter">Daughter</option>
                <option value="Son">Son</option>
                <option value="Wife">Wife</option>
                <option value="Husband">Husband</option>
                <option value="Sister">Sister</option>
                <option value="Brother">Brother</option>
                <option value="Grandmother">Grandmother</option>
                <option value="Grandfather">Grandfather</option>
                <option value="Friend">Friend</option>
                <option value="Caregiver">Caregiver</option>
                <option value="Other">Other</option>
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
              ) : newMember.photo ? (
                <div className="photo-preview">
                  <img src={newMember.photo} alt="Preview" />
                  <button className="btn btn-ghost" onClick={() => setNewMember({ ...newMember, photo: null })}>Remove Photo</button>
                </div>
              ) : (
                <div className="photo-upload-area">
                  {saving && <p style={{ marginBottom: 8, color: 'var(--primary)', fontWeight: 700 }}>Processing photo...</p>}
                  <div className="upload-options">
                    <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                      Choose from Gallery
                    </button>
                    <button className="btn btn-outline" onClick={startCamera} disabled={saving}>
                      Take Photo
                    </button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload}
                    style={{ display: 'none' }} />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => { setShowAdd(false); stopCamera(); }}>Cancel</button>
              <button className="btn btn-primary" onClick={addMember}
                disabled={!newMember.name.trim() || !newMember.relationship.trim()}>
                Add Member
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
