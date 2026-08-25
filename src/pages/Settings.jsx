import React, { useState, useEffect } from "react";
import { getSettings, saveSettings, clearAllData } from "../utils/storage";

export default function Settings() {
  const [settings, setSettings] = useState({
    language: "English",
    fontSize: "Large",
    voiceAssistance: false,
    highContrast: false,
    soundEffects: true,
  });
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    const saved = getSettings();
    if (saved) {
      setSettings((prev) => ({ ...prev, ...saved }));
    }
  }, []);

  useEffect(() => {
    const body = document.body;
    body.classList.remove("font-size-medium", "font-size-large", "font-size-extra-large");
    if (settings.fontSize === "Medium") {
      body.classList.add("font-size-medium");
    } else if (settings.fontSize === "Large") {
      body.classList.add("font-size-large");
    } else if (settings.fontSize === "Extra Large") {
      body.classList.add("font-size-extra-large");
    }
    body.classList.toggle("high-contrast", settings.highContrast);
    saveSettings(settings);
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    clearAllData();
    window.location.reload();
  };

  return (
    <div className="game-page">
      <h1 className="section-title">Settings</h1>

      <div className="setting-item">
        <label className="setting-label">Language</label>
        <select
          className="form-select"
          value={settings.language}
          onChange={(e) => updateSetting("language", e.target.value)}
        >
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
          <option value="Assamese">Assamese</option>
          <option value="Bengali">Bengali</option>
          <option value="Tamil">Tamil</option>
          <option value="Telugu">Telugu</option>
          <option value="Malayalam">Malayalam</option>
        </select>
      </div>

      <div className="setting-item">
        <label className="setting-label">Font Size</label>
        <select
          className="form-select"
          value={settings.fontSize}
          onChange={(e) => updateSetting("fontSize", e.target.value)}
        >
          <option value="Medium">Medium</option>
          <option value="Large">Large</option>
          <option value="Extra Large">Extra Large</option>
        </select>
      </div>

      <div className="setting-item">
        <label className="setting-label">Voice Assistance</label>
        <button
          className={`toggle-switch ${settings.voiceAssistance ? "active" : ""}`}
          onClick={() => updateSetting("voiceAssistance", !settings.voiceAssistance)}
        >
          <span className="toggle-knob" />
        </button>
      </div>

      <div className="setting-item">
        <label className="setting-label">High Contrast</label>
        <button
          className={`toggle-switch ${settings.highContrast ? "active" : ""}`}
          onClick={() => updateSetting("highContrast", !settings.highContrast)}
        >
          <span className="toggle-knob" />
        </button>
      </div>

      <div className="setting-item">
        <label className="setting-label">Sound Effects</label>
        <button
          className={`toggle-switch ${settings.soundEffects ? "active" : ""}`}
          onClick={() => updateSetting("soundEffects", !settings.soundEffects)}
        >
          <span className="toggle-knob" />
        </button>
      </div>

      <div className="form-group">
        <button
          className="btn btn-danger btn-full"
          onClick={() => setShowResetModal(true)}
        >
          Reset Progress
        </button>
      </div>

      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title">Confirm Reset</h2>
            <p>Are you sure you want to reset all progress? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleReset}>
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
