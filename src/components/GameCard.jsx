import { Link } from 'react-router-dom';

export default function GameCard({ icon, title, subtitle, description, route }) {
  return (
    <Link to={route} style={{ textDecoration: 'none' }}>
      <div className="card card-game">
        <div className="game-icon">{icon}</div>
        <div className="game-title">{title}</div>
        <div className="game-subtitle">{subtitle}</div>
        <div className="game-desc">{description}</div>
        <button className="btn btn-primary">PLAY</button>
      </div>
    </Link>
  );
}
