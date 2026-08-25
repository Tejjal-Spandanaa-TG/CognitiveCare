export default function HintButton({ onClick, disabled }) {
  return (
    <button
      className="hint-btn"
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <span>💡</span>
      <span>Hint</span>
    </button>
  );
}
