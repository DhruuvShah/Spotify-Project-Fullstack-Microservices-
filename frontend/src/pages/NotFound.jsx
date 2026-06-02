import { Link } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  return (
    <div className="nf-root">
      <p className="nf-code" aria-hidden="true">404</p>
      <h1 className="nf-title">This page skipped the queue.</h1>
      <p className="nf-sub">
        The track you&rsquo;re looking for doesn&rsquo;t exist or was removed.
      </p>
      <Link to="/" className="nf-btn">
        Back to Lumina
      </Link>
    </div>
  );
}
