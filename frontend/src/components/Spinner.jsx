export function Spinner({ size = 20, className = "" }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`spinner${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
    />
  );
}
