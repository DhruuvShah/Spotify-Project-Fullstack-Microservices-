export function SkeletonCard() {
  return (
    <div className="skel-card" aria-hidden="true">
      <div className="skel-card__cover" />
      <div className="skel-card__title" />
      <div className="skel-card__sub" />
    </div>
  );
}
