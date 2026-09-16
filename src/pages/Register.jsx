import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  User,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

import { useAuth } from "../auth/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRules = [
    {
      label: "8+ characters",
      valid: password.length >= 8,
    },
    {
      label: "Uppercase letter",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "Lowercase letter",
      valid: /[a-z]/.test(password),
    },
    {
      label: "Number",
      valid: /[0-9]/.test(password),
    },
    {
      label: "Special character",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const passwordValid = passwordRules.every(
    (rule) => rule.valid
  );

  const passwordsMatch =
    password.length > 0 &&
    password === confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!passwordValid) {
      setError("Please satisfy all password requirements.");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register(
        name.trim(),
        email.trim(),
        password
      );

      if (!result.success) {
        setError(
          result.message || "Unable to create account."
        );
        return;
      }

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Account created successfully. Please sign in.",
        },
      });
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Background effects */}
      <div className="auth-orb auth-orb-purple" />
      <div className="auth-orb auth-orb-orange" />
      <div className="auth-orb auth-orb-blue" />

      <div className="auth-container register-container">

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
              INVESTIGATOR REGISTRATION
            </div>

          </div>

        </div>


        {/* =================================================
            REGISTER CARD
            ================================================= */}

        <div className="auth-card register-card">

          {/* Header */}

          <div className="auth-card-header">

            <div className="auth-security-icon">
              <ShieldCheck size={27} />
            </div>

            <div className="auth-header-text">

              <h1>
                Create investigator account
              </h1>

              <p>
                Set up your local forensic investigation
                profile.
              </p>

            </div>

          </div>


          {/* Security status */}

          <div className="auth-status">

            <span className="auth-status-dot" />

            <span>
              PROTECTED LOCAL ACCOUNT
            </span>

          </div>


          {/* Error */}

          {error && (
            <div className="auth-error">

              <X size={17} />

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

            {/* Full name */}

            <div className="auth-field">

              <label htmlFor="name">
                Full name
              </label>

              <div className="auth-input-wrapper">

                <User
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  required
                  autoComplete="name"
                />

              </div>

            </div>


            {/* Email */}

            <div className="auth-field">

              <label htmlFor="register-email">
                Email address
              </label>

              <div className="auth-input-wrapper">

                <Mail
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="register-email"
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

              <label htmlFor="register-password">
                Password
              </label>

              <div className="auth-input-wrapper">

                <LockKeyhole
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="register-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                  autoComplete="new-password"
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


              {/* Password requirements */}

              <div className="password-requirements">

                {passwordRules.map((rule) => (

                  <div
                    key={rule.label}
                    className={
                      rule.valid
                        ? "password-rule valid"
                        : "password-rule"
                    }
                  >

                    <span className="password-rule-icon">

                      {rule.valid ? (
                        <Check size={12} />
                      ) : (
                        <span />
                      )}

                    </span>

                    <span>
                      {rule.label}
                    </span>

                  </div>

                ))}

              </div>

            </div>


            {/* Confirm password */}

            <div className="auth-field">

              <label htmlFor="confirm-password">
                Confirm password
              </label>

              <div className="auth-input-wrapper">

                <LockKeyhole
                  size={19}
                  className="auth-input-icon"
                />

                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>


              {/* Password match */}

              {confirmPassword.length > 0 && (
                <div
                  className={
                    passwordsMatch
                      ? "password-match valid"
                      : "password-match invalid"
                  }
                >

                  {passwordsMatch ? (
                    <>
                      <Check size={14} />
                      Passwords match
                    </>
                  ) : (
                    <>
                      <X size={14} />
                      Passwords do not match
                    </>
                  )}

                </div>
              )}

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

                  Creating account...

                </span>

              ) : (

                <>
                  <span>
                    Create account
                  </span>

                  <ArrowRight size={19} />
                </>

              )}

            </button>

          </form>


          {/* Security information */}

          <div className="auth-security">

            <div className="auth-security-icon-small">
              <ShieldCheck size={18} />
            </div>

            <div className="auth-security-text">

              <strong>
                Local forensic security
              </strong>

              <span>
                Your investigator profile is stored
                securely on this device.
              </span>

            </div>

          </div>


          {/* Login link */}

          <div className="auth-switch">

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Sign in
              <ArrowRight size={15} />
            </button>

          </div>

        </div>


        {/* Footer */}

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

export default Register;