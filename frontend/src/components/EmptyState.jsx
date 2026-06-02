import { MusicNoteIcon } from "./icons/index.jsx";

export function EmptyState({
  icon,
  title = "Nothing here yet",
  subtitle,
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        {icon ?? <MusicNoteIcon width={52} height={52} />}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {subtitle && <p className="empty-state__subtitle">{subtitle}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
