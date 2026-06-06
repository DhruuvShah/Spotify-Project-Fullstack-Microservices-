import { Component } from "react";
import { Link } from "react-router-dom";
import { LuminaLogoIcon } from "./icons/index.jsx";

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(_error, _info) {}

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="errb-root">
        <div className="errb-card">
          <div className="errb-logo" aria-label="LUMINA">
            <LuminaLogoIcon width={36} height={36} />
          </div>
          <p className="errb-icon" aria-hidden="true">♩</p>
          <h1 className="errb-title">Something skipped a beat</h1>
          <p className="errb-msg">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <div className="errb-actions">
            <button className="errb-btn-retry" onClick={this.handleRetry}>
              Try again
            </button>
            <Link to="/" className="errb-btn-home" onClick={this.handleRetry}>
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
