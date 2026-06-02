export function ErrorState({ message = "Something went wrong", onRetry }) {
  return (
    <div className="error-state">
      <span className="error-state__icon" aria-hidden="true" style={{ fontSize: 32 }}>
        ⚠
      </span>
      <p className="error-state__msg">{message}</p>
      {onRetry && (
        <button className="error-state__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
