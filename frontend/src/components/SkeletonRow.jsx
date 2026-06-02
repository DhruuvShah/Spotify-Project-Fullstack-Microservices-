export function SkeletonRow() {
  return (
    <div className="skel-row" aria-hidden="true">
      <div className="skel-row__avatar" />
      <div className="skel-row__body">
        <div className="skel-row__title" />
        <div className="skel-row__sub" />
      </div>
      <div className="skel-row__dur" />
    </div>
  );
}
