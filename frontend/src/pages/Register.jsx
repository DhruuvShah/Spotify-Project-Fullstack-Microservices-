import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AlertTriangle, Headphones, Mic } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { tokenStore } from "../services/tokenStore.js";
import "./Login.css";
import { AUTH_URL } from "../config.js";

export default function Register() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${AUTH_URL}/api/auth/register`,
        {
          email: form.email,
          fullname: { firstName: form.firstName, lastName: form.lastName },
          password: form.password,
          role: form.role,
        },
        { withCredentials: true },
      );
      const t = res.data.token ?? null;
      tokenStore.set(t);
      setToken(t);
      setUser(res.data.user);
      if (res.data.user.role === "artist") {
        navigate("/artist/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-root">
      <AuthPanel />

      <div className="auth-right">
        <div className="auth-box">
          <h1 className="auth-heading">Create an account</h1>
          <p className="auth-subhead">Join and start your musical journey.</p>

          <button
            type="button"
            className="auth-google-btn"
            onClick={() => { window.location.href = `${AUTH_URL}/api/auth/google`; }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="auth-or"><span>or</span></div>

          {error && (
            <div className="auth-error" role="alert">
              <WarnIcon />
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Role selector */}
            <div className="auth-role-wrap">
              <p className="auth-role-label">I want to</p>
              <div className="auth-role-cards">
                <label className={`auth-role-card${form.role === "user" ? " selected" : ""}`}>
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={form.role === "user"}
                    onChange={handleChange}
                  />
                  <HeadphonesIcon />
                  <span>Listen</span>
                </label>
                <label className={`auth-role-card${form.role === "artist" ? " selected" : ""}`}>
                  <input
                    type="radio"
                    name="role"
                    value="artist"
                    checked={form.role === "artist"}
                    onChange={handleChange}
                  />
                  <MicIcon />
                  <span>Create</span>
                </label>
              </div>
            </div>

            {/* Name row */}
            <div className="auth-form-row">
              <FloatField
                id="reg-first"
                name="firstName"
                type="text"
                label="First name"
                autoComplete="given-name"
                value={form.firstName}
                onChange={handleChange}
                required
              />
              <FloatField
                id="reg-last"
                name="lastName"
                type="text"
                label="Last name"
                autoComplete="family-name"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <FloatField
              id="reg-email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <FloatField
              id="reg-password"
              name="password"
              type="password"
              label="Password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              required
            />

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Shared sub-components ────────────────────────────────────── */

function AuthPanel() {
  return (
    <div className="auth-panel" aria-hidden="true">
      <div className="auth-panel-inner">
        <WaveformIllustration />
        <blockquote className="auth-panel-quote">
          "Music is the shorthand of emotion."
          <cite className="auth-panel-cite">— Leo Tolstoy</cite>
        </blockquote>
      </div>
      <div className="auth-brand">
        <LuminaMark />
        <span className="auth-brand-name">Lumina</span>
      </div>
    </div>
  );
}

function FloatField({ id, name, type, label, autoComplete, value, onChange, required }) {
  return (
    <div className="fl-group">
      <input
        id={id}
        name={name}
        type={type}
        placeholder=" "
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        className="fl-input"
        required={required}
      />
      <label htmlFor={id} className="fl-label">{label}</label>
    </div>
  );
}

function WaveformIllustration() {
  const bars = [22, 45, 62, 80, 72, 90, 76, 55, 88, 95, 82, 68, 58, 78, 66, 44, 72, 55, 35, 18];
  return (
    <svg
      className="auth-waveform"
      viewBox="0 0 177 80"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 9}
          y={(80 - h * 0.8) / 2}
          width={6}
          height={h * 0.8}
          rx={3}
        />
      ))}
    </svg>
  );
}

function LuminaMark() {
  return (
    <svg className="auth-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
      <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2.5 2" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function WarnIcon()       { return <AlertTriangle className="auth-warn-icon" size={16} aria-hidden="true" />; }
function HeadphonesIcon() { return <Headphones size={22} aria-hidden="true" />; }
function MicIcon()        { return <Mic size={22} aria-hidden="true" />; }
