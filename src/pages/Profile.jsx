import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getUserProfile, saveUserProfile, getRoutine, saveRoutine } from "../utils/storage";
import { getDefaultRoutine, generateId } from "../data/routines";

export default function Profile() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [language, setLanguage] = useState("English");
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const profile = getUserProfile();
    if (profile) {
      setName(profile.name || "");
      setAge(profile.age || "");
      setLanguage(profile.language || "English");
    }
    const routine = getRoutine();
    if (routine && routine.length > 0) {
      setActivities(routine);
    } else {
      setActivities(getDefaultRoutine());
    }
  }, []);

  const handleActivityChange = (index, value) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], text: value };
    setActivities(updated);
  };

  const handleTimeChange = (index, value) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], time: value };
    setActivities(updated);
  };

  const removeActivity = (index) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const addActivity = () => {
    setActivities([...activities, { id: generateId(), text: "", time: "" }]);
  };

  const handleSave = () => {
    saveUserProfile({ name, age, language });
    saveRoutine(activities);
  };

  return (
    <div className="game-page">
      <Link to="/" className="btn btn-ghost">Back</Link>
      <h1 className="section-title">My Profile</h1>

      <div className="form-group">
        <label className="setting-label">Name</label>
        <input
          className="form-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      <div className="form-group">
        <label className="setting-label">Age</label>
        <input
          className="form-input"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Enter your age"
        />
      </div>

      <div className="form-group">
        <label className="setting-label">Preferred Language</label>
        <select
          className="form-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
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

      <div className="routine-editor">
        <h2 className="section-title">Daily Routine</h2>
        {activities.map((activity, index) => (
          <div key={activity.id || index} className="routine-item-editor">
            <input
              className="form-input"
              type="text"
              value={activity.time || ""}
              onChange={(e) => handleTimeChange(index, e.target.value)}
              placeholder="Time (e.g. 8:00 AM)"
            />
            <input
              className="form-input"
              type="text"
              value={activity.text || ""}
              onChange={(e) => handleActivityChange(index, e.target.value)}
              placeholder="Activity"
            />
            <button
              className="routine-remove-btn"
              onClick={() => removeActivity(index)}
            >
              X
            </button>
          </div>
        ))}
        <button className="btn btn-ghost" onClick={addActivity}>
          + Add Activity
        </button>
      </div>

      <button className="btn btn-primary btn-full" onClick={handleSave}>
        Save Profile
      </button>
    </div>
  );
}
