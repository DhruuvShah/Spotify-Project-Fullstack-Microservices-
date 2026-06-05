import { CheckCircle2, XCircle, Info } from "lucide-react";

const ICONS = {
  success: <CheckCircle2 width={16} height={16} aria-hidden />,
  error:   <XCircle     width={16} height={16} aria-hidden />,
  info:    <Info        width={16} height={16} aria-hidden />,
};

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`} role="alert">
          <span className="toast__icon">{ICONS[t.type]}</span>
          <span className="toast__msg">{t.message}</span>
          <button
            className="toast__close"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
