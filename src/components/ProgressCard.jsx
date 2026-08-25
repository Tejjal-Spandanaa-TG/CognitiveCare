export default function ProgressCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{icon || value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
