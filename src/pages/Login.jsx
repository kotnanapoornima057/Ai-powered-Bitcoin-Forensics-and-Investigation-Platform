import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

import {
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(
        email.trim(),
        password
      );

      if (!result.success) {
        setError(
          result.message || "Unable to sign in."
        );
        return;
      }

      const destination =
        location.state?.from || "/dashboard";

      navigate(destination, {
        replace: true,
      });
    } catch (err) {
      console.error("Login error:", err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Background glow */}

      <div className="auth-orb auth-orb-purple" />
      <div className="auth-orb auth-orb-orange" />
      <div className="auth-orb auth-orb-blue" />

      <div className="auth-container">

        {/* =================================================
            BRAND
            ================================================= */}

        <div className="auth-brand">

          <div className="auth-brand-icon">
            ₿
          </div>

          <div className="auth-brand-text">

            <div className="auth-brand-title">
              BITCOIN
            </div>

            <div className="auth-brand-subtitle">
              FORENSICS
            </div>

            <div className="auth-brand-tagline">
              INVESTIGATION CONSOLE
            </div>

          </div>

        </div>


        {/* =================================================
            LOGIN CARD
            ================================================= */}

        <div className="auth-card">

          {/* Header */}

          <div className="auth-card-header">

            <div className="auth-security-icon">
              <ShieldCheck size={27} />
            </div>

            <div className="auth-header-text">

              <h1>
                Welcome back
              </h1>

              <p>
                Sign in to your investigation console
              </p>

            </div>

          </div>


          {/* Security line */}

          <div className="auth-status">

            <span className="auth-status-dot" />

            <span>
              SECURE OFFLINE ENVIRONMENT
            </span>

          </div>


          {/* Error */}

          {error && (
            <div className="auth-error">

              <ShieldCheck size={17} />

              <span>
                {error}
              </span>

            </div>
          )}


          {/* Form */}

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            {/* Email */}

            <div className="auth-field">

              <label htmlFor="email">
                Email address
              </label>

              <div className="auth-input-wrapper">

                <Mail
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="analyst@example.com"
                  required
                  autoComplete="email"
                />

              </div>

            </div>


            {/* Password */}

            <div className="auth-field">

              <div className="auth-label-row">

                <label htmlFor="password">
                  Password
                </label>

                <span>
                  Protected
                </span>

              </div>

              <div className="auth-input-wrapper">

                <LockKeyhole
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}

                </button>

              </div>

            </div>


            {/* Submit */}

            <button
              type="submit"
              className="auth-submit"
              disabled={isSubmitting}
            >

              {isSubmitting ? (
                <span className="auth-loading">

                  <span className="auth-spinner" />

                  Signing in...

                </span>
              ) : (
                <>

                  <span>
                    Sign in
                  </span>

                  <ArrowRight size={19} />

                </>
              )}

            </button>

          </form>


          {/* =================================================
              REGISTER LINK
              ================================================= */}

          <div className="auth-register">

            <span>
              Don't have an account?
            </span>

            <Link to="/register">
              Register
            </Link>

          </div>


          {/* =================================================
              SECURITY INFORMATION
              ================================================= */}

          <div className="auth-security">

            <div className="auth-security-icon-small">
              <ShieldCheck size={18} />
            </div>

            <div className="auth-security-text">

              <strong>
                Secure investigation access
              </strong>

              <span>
                Your session is protected and stored locally.
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            FOOTER
            ================================================= */}

        <div className="auth-footer">

          <span>
            Bitcoin Forensics Investigation Platform
          </span>

          <span className="auth-footer-dot">
            •
          </span>

          <span>
            Offline analysis enabled
          </span>

        </div>

      </div>

    </div>
  );
}

export default Login;