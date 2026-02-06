import { useState } from "react";
import "./LandingPage.css";

type LoginMode = "patient" | "provider";

function LandingPage() {
  const [loginMode, setLoginMode] = useState<LoginMode>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [providerRole, setProviderRole] = useState<
    "doctor" | "nurse" | "admin"
  >("doctor");

  const handlePatientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement patient login logic
    console.log("Patient login:", { email, password });
  };

  const handleProviderLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement provider login logic
    console.log("Provider login:", { email, password, role: providerRole });
  };

  return (
    <div className="landing-container">
      {/* Header with provider login toggle */}
      <header className="landing-header">
        <div className="logo">
          <span className="logo-icon">💊</span>
          <span className="logo-text">MediRisk</span>
        </div>
        <button
          className="provider-toggle-btn"
          onClick={() =>
            setLoginMode(loginMode === "patient" ? "provider" : "patient")
          }
        >
          {loginMode === "patient"
            ? "🏥 Healthcare Provider Login"
            : "👤 Patient Login"}
        </button>
      </header>

      {/* Main content */}
      <main className="landing-main">
        <div className="landing-content">
          {/* Left side - Info */}
          <div className="landing-info">
            <h1>
              Welcome to <span className="highlight">MediRisk</span>
            </h1>
            <p className="tagline">
              Your trusted platform for drug safety and risk assessment
            </p>

            {loginMode === "patient" ? (
              <div className="info-features">
                <div className="feature">
                  <span className="feature-icon">📋</span>
                  <div>
                    <h3>Track Your Medications</h3>
                    <p>
                      Keep a complete record of your medications and history
                    </p>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">⚠️</span>
                  <div>
                    <h3>Know Your Risks</h3>
                    <p>
                      Understand potential side effects and drug interactions
                    </p>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">🔒</span>
                  <div>
                    <h3>Secure & Private</h3>
                    <p>Your health data is protected and confidential</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="info-features">
                <div className="feature">
                  <span className="feature-icon">📊</span>
                  <div>
                    <h3>Risk Analytics Dashboard</h3>
                    <p>View comprehensive patient risk assessments</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">💉</span>
                  <div>
                    <h3>Drug Interaction Checker</h3>
                    <p>Instantly detect dangerous drug combinations</p>
                  </div>
                </div>
                <div className="feature">
                  <span className="feature-icon">👥</span>
                  <div>
                    <h3>Patient Management</h3>
                    <p>Manage patient records and medication histories</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Login Form */}
          <div className="login-card">
            {loginMode === "patient" ? (
              <>
                <div className="login-header">
                  <h2>Patient Login</h2>
                  <p>Access your medication profile</p>
                </div>
                <form onSubmit={handlePatientLogin} className="login-form">
                  <div className="form-group">
                    <label htmlFor="patient-email">Email</label>
                    <input
                      type="email"
                      id="patient-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="patient-password">Password</label>
                    <input
                      type="password"
                      id="patient-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <button type="submit" className="login-btn primary">
                    Sign In
                  </button>
                  <div className="form-footer">
                    <a href="#forgot" className="forgot-link">
                      Forgot password?
                    </a>
                    <p className="signup-prompt">
                      Don't have an account? <a href="#signup">Sign up</a>
                    </p>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="login-header provider-header">
                  <h2>Healthcare Provider Login</h2>
                  <p>Access the clinical dashboard</p>
                </div>
                <form onSubmit={handleProviderLogin} className="login-form">
                  <div className="form-group">
                    <label htmlFor="provider-role">Role</label>
                    <select
                      id="provider-role"
                      value={providerRole}
                      onChange={(e) =>
                        setProviderRole(
                          e.target.value as "doctor" | "nurse" | "admin",
                        )
                      }
                    >
                      <option value="doctor">👨‍⚕️ Doctor</option>
                      <option value="nurse">👩‍⚕️ Nurse</option>
                      <option value="admin">🔧 Admin</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="provider-email">Email</label>
                    <input
                      type="email"
                      id="provider-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your work email"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="provider-password">Password</label>
                    <input
                      type="password"
                      id="provider-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <button type="submit" className="login-btn provider">
                    Sign In as{" "}
                    {providerRole.charAt(0).toUpperCase() +
                      providerRole.slice(1)}
                  </button>
                  <div className="form-footer">
                    <a href="#forgot" className="forgot-link">
                      Forgot password?
                    </a>
                    <p className="contact-admin">
                      Need access?{" "}
                      <a href="#contact">Contact your administrator</a>
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Disclaimer */}
      <div className="disclaimer-section">
        <div className="disclaimer-content">
          <p className="disclaimer-title">⚠️ Important Disclaimer</p>
          <p>
            This is a <strong>capstone demonstration project</strong> developed
            for educational purposes at Clark University. MediRisk is{" "}
            <strong>NOT</strong> a certified medical device and should{" "}
            <strong>NOT</strong> be used for actual clinical decision-making or
            patient care.
          </p>
          <p>
            All patient data shown is synthetic/simulated. This platform has not
            undergone FDA approval, HIPAA certification, or any regulatory
            compliance review. Always consult qualified healthcare professionals
            for medical advice.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Use</a>
          <a href="#contact">Contact</a>
        </div>
        <p>© 2026 MediRisk - Drug Side-Effect Risk Assessment Platform</p>
        <p className="footer-sub">
          Clark University Capstone Project | For Demonstration Purposes Only
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;
