import { useState } from "react";
import {
  Shield,
  Activity,
  Users,
  Lock,
  AlertTriangle,
  ClipboardList,
  Pill,
  Stethoscope,
  ChevronRight,
  Heart,
  FileText,
  BarChart3,
  CheckCircle2,
  Mail,
  KeyRound,
} from "lucide-react";
import { Button, Input, Select, Card } from "../components/ui";
import "./LandingPage.css";

type LoginMode = "patient" | "provider";
type ProviderRole = "doctor" | "nurse" | "admin";

function LandingPage() {
  const [loginMode, setLoginMode] = useState<LoginMode>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [providerRole, setProviderRole] = useState<ProviderRole>("doctor");
  const [isLoading, setIsLoading] = useState(false);

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement patient login logic
    console.log("Patient login:", { email, password });
    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleProviderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement provider login logic
    console.log("Provider login:", { email, password, role: providerRole });
    setTimeout(() => setIsLoading(false), 1500);
  };

  const patientFeatures = [
    {
      icon: ClipboardList,
      title: "Medication Tracking",
      description:
        "Complete digital record of your prescriptions and medication history",
    },
    {
      icon: AlertTriangle,
      title: "Risk Awareness",
      description: "Understand potential side effects and drug interactions",
    },
    {
      icon: Lock,
      title: "HIPAA Compliant",
      description: "Your health data is encrypted and protected",
    },
  ];

  const providerFeatures = [
    {
      icon: BarChart3,
      title: "Risk Analytics",
      description: "AI-powered patient risk assessment dashboard",
    },
    {
      icon: Pill,
      title: "Drug Interactions",
      description: "Real-time detection of dangerous combinations",
    },
    {
      icon: Users,
      title: "Patient Management",
      description: "Streamlined records and medication histories",
    },
  ];

  const roleOptions = [
    { value: "doctor", label: "Physician", icon: "🩺" },
    { value: "nurse", label: "Nurse", icon: "👨‍⚕️" },
    { value: "admin", label: "Administrator", icon: "⚙️" },
  ];

  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon-wrapper">
              <Shield size={28} strokeWidth={2} />
            </div>
            <div className="logo-text-wrapper">
              <span className="logo-text">MediRisk</span>
              <span className="logo-tagline">Drug Safety Platform</span>
            </div>
          </div>

          <nav className="header-nav">
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#about" className="nav-link">
              About
            </a>
            <a href="#contact" className="nav-link">
              Contact
            </a>
          </nav>

          <button
            className={`mode-toggle ${loginMode === "provider" ? "provider-mode" : ""}`}
            onClick={() =>
              setLoginMode(loginMode === "patient" ? "provider" : "patient")
            }
          >
            {loginMode === "patient" ? (
              <>
                <Stethoscope size={18} />
                <span>Healthcare Provider</span>
              </>
            ) : (
              <>
                <Heart size={18} />
                <span>Patient Portal</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="landing-main">
        <div className="hero-section">
          <div className="hero-content">
            {/* Left Side - Information */}
            <div className="hero-info">
              <div className="hero-badge">
                <Activity size={16} />
                <span>Trusted by Healthcare Professionals</span>
              </div>

              <h1 className="hero-title">
                Intelligent Drug Safety
                <span className="title-highlight"> Risk Assessment</span>
              </h1>

              <p className="hero-description">
                MediRisk provides comprehensive drug interaction analysis and
                personalized risk assessment to enhance patient safety and
                support clinical decision-making.
              </p>

              <div className="features-list">
                {(loginMode === "patient"
                  ? patientFeatures
                  : providerFeatures
                ).map((feature, index) => (
                  <div key={index} className="feature-item">
                    <div className="feature-icon-wrapper">
                      <feature.icon size={22} strokeWidth={1.5} />
                    </div>
                    <div className="feature-content">
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="trust-indicators">
                <div className="trust-item">
                  <CheckCircle2 size={18} className="trust-icon" />
                  <span>FDA Database Integration</span>
                </div>
                <div className="trust-item">
                  <CheckCircle2 size={18} className="trust-icon" />
                  <span>Evidence-Based Analysis</span>
                </div>
                <div className="trust-item">
                  <CheckCircle2 size={18} className="trust-icon" />
                  <span>Real-Time Monitoring</span>
                </div>
              </div>
            </div>

            {/* Right Side - Login Card */}
            <div className="login-section">
              <Card variant="elevated" padding="lg">
                {loginMode === "patient" ? (
                  <>
                    <div className="login-header">
                      <div className="login-icon patient">
                        <Heart size={24} strokeWidth={2} />
                      </div>
                      <h2>Patient Portal</h2>
                      <p>Access your medication profile and health insights</p>
                    </div>

                    <form onSubmit={handlePatientLogin} className="login-form">
                      <Input
                        label="Email Address"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        leftIcon={<Mail size={18} />}
                        required
                      />

                      <Input
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<KeyRound size={18} />}
                        required
                      />

                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        isLoading={isLoading}
                        rightIcon={<ChevronRight size={18} />}
                        style={{ width: "100%", marginTop: "0.5rem" }}
                      >
                        Sign In
                      </Button>

                      <div className="form-footer">
                        <a href="#forgot" className="forgot-link">
                          Forgot password?
                        </a>
                        <p className="signup-prompt">
                          New patient?{" "}
                          <a href="#signup" className="signup-link">
                            Create an account
                          </a>
                        </p>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="login-header provider">
                      <div className="login-icon provider">
                        <Stethoscope size={24} strokeWidth={2} />
                      </div>
                      <h2>Provider Login</h2>
                      <p>Access the clinical dashboard</p>
                    </div>

                    <form onSubmit={handleProviderLogin} className="login-form">
                      <Select
                        label="Select Role"
                        value={providerRole}
                        onChange={(e) =>
                          setProviderRole(e.target.value as ProviderRole)
                        }
                        options={roleOptions}
                      />

                      <Input
                        label="Work Email"
                        type="email"
                        placeholder="Enter your institutional email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        leftIcon={<Mail size={18} />}
                        required
                      />

                      <Input
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<KeyRound size={18} />}
                        required
                      />

                      <Button
                        type="submit"
                        variant="provider"
                        size="lg"
                        isLoading={isLoading}
                        rightIcon={<ChevronRight size={18} />}
                        style={{ width: "100%", marginTop: "0.5rem" }}
                      >
                        Access Dashboard
                      </Button>

                      <div className="form-footer">
                        <a href="#forgot" className="forgot-link">
                          Forgot password?
                        </a>
                        <p className="signup-prompt">
                          Need access?{" "}
                          <a href="#contact" className="signup-link">
                            Contact IT Administrator
                          </a>
                        </p>
                      </div>
                    </form>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stats-container">
            <div className="stat-item">
              <div className="stat-icon">
                <Pill size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">50,000+</span>
                <span className="stat-label">Drug Profiles</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <FileText size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">2M+</span>
                <span className="stat-label">Interaction Checks</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">10,000+</span>
                <span className="stat-label">Active Users</span>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">
                <Shield size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Disclaimer Banner */}
      <div className="disclaimer-section">
        <div className="disclaimer-content">
          <div className="disclaimer-header">
            <AlertTriangle size={20} className="disclaimer-icon" />
            <span className="disclaimer-title">
              Educational Project Disclaimer
            </span>
          </div>
          <p>
            This is a <strong>capstone demonstration project</strong> developed
            for educational purposes at Clark University. MediRisk is{" "}
            <strong>NOT</strong> a certified medical device and should{" "}
            <strong>NOT</strong> be used for actual clinical decision-making.
            All data shown is synthetic. Always consult qualified healthcare
            professionals for medical advice.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <Shield size={24} />
              <span>MediRisk</span>
            </div>
            <p>Drug Side-Effect Risk Assessment Platform</p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#security">Security</a>
              <a href="#integrations">Integrations</a>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <a href="#documentation">Documentation</a>
              <a href="#support">Support</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Use</a>
              <a href="#hipaa">HIPAA Notice</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 MediRisk — Clark University Capstone Project</p>
          <p className="footer-disclaimer">For Demonstration Purposes Only</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
