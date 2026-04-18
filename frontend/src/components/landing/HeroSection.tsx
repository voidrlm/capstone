import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileUp, LockKeyhole, ShieldCheck } from "lucide-react";

const trustPoints = [
  {
    title: "Upload and store your medical records",
    description: "Keep visits, lab results, diagnoses, prescriptions, and patient documents in one place.",
    Icon: FileUp,
  },
  {
    title: "You control access",
    description: "Healthcare professionals only get access when you explicitly approve their request.",
    Icon: LockKeyhole,
  },
  {
    title: "Built for long-term record tracking",
    description: "Create a clear personal timeline so your medical history stays easy to review over time.",
    Icon: ShieldCheck,
  },
];

export default function HeroSection() {
  return (
    <section
      style={{
        background:
          "radial-gradient(circle at top, rgba(0,212,170,0.12) 0%, rgba(0,212,170,0.04) 22%, rgba(4,8,15,1) 58%)",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.06,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(220,232,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(220,232,255,1) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 80,
          left: "8%",
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,212,170,0.16) 0%, transparent 72%)",
          filter: "blur(10px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "10%",
          bottom: 120,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,159,255,0.12) 0%, transparent 70%)",
          filter: "blur(14px)",
          pointerEvents: "none",
        }}
      />

      <div className="land-wrap" style={{ position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          style={{
            minHeight: "100vh",
            display: "grid",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
            gap: "2rem",
            alignItems: "center",
            padding: "6.5rem 0 4rem",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            style={{
              gridColumn: "span 12",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #00d4aa 0%, #0099cc 100%)",
                  boxShadow: "0 16px 30px rgba(0,212,170,0.24)",
                }}
              >
                <svg viewBox="0 0 20 20" fill="none" style={{ width: 18, height: 18 }}>
                  <path d="M10 2v6M10 12v6M2 10h6M12 10h6" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="10" cy="10" r="2" fill="white" />
                </svg>
              </div>
              <div>
                <div style={{ color: "#dce8ff", fontWeight: 800, letterSpacing: "-0.02em" }}>MediRisk</div>
                <div style={{ color: "rgba(220,232,255,0.42)", fontSize: "0.74rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  Personal Record Control
                </div>
              </div>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                to="/login"
                style={{
                  color: "rgba(220,232,255,0.86)",
                  textDecoration: "none",
                  fontWeight: 600,
                  padding: "0.85rem 1.1rem",
                }}
              >
                Sign In
              </Link>
              <Link
                to="/signup/patient"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  background: "#00d4aa",
                  color: "#041019",
                  textDecoration: "none",
                  fontWeight: 800,
                  borderRadius: 999,
                  padding: "0.9rem 1.35rem",
                  boxShadow: "0 14px 34px rgba(0,212,170,0.24)",
                }}
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }}
            style={{
              gridColumn: "span 12",
              maxWidth: "48rem",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.55rem",
                borderRadius: 999,
                border: "1px solid rgba(0,212,170,0.24)",
                background: "rgba(0,212,170,0.08)",
                color: "#77f6db",
                padding: "0.45rem 0.9rem",
                fontSize: "0.74rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Patient-first access
            </div>

            <h1
              className="font-display"
              style={{
                color: "#ecf4ff",
                fontSize: "clamp(3rem, 7vw, 6.2rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.05em",
                marginTop: "1.5rem",
                marginBottom: "1.2rem",
                maxWidth: "9.5ch",
              }}
            >
              Upload and track your medical records.
            </h1>

            <p
              style={{
                color: "rgba(220,232,255,0.66)",
                fontSize: "clamp(1.05rem, 1.8vw, 1.28rem)",
                lineHeight: 1.75,
                maxWidth: "41rem",
              }}
            >
              Store your records in one place, keep a clean timeline of your health history, and decide when a healthcare
              professional can access your data.
            </p>

            <div style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap", marginTop: "2rem" }}>
              <Link
                to="/signup/patient"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  background: "#00d4aa",
                  color: "#041019",
                  textDecoration: "none",
                  fontWeight: 800,
                  borderRadius: 999,
                  padding: "1rem 1.4rem",
                }}
              >
                Create Patient Account
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/signup/provider"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  color: "#dce8ff",
                  textDecoration: "none",
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "1rem 1.4rem",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                Register Organization
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.2 }}
            style={{
              gridColumn: "span 12",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
              marginTop: "1.25rem",
            }}
          >
            {trustPoints.map(({ title, description, Icon }) => (
              <div
                key={title}
                style={{
                  borderRadius: "1.4rem",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(8,17,31,0.64)",
                  backdropFilter: "blur(14px)",
                  padding: "1.25rem",
                  boxShadow: "0 18px 42px rgba(0,0,0,0.22)",
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(0,212,170,0.12)",
                    color: "#00d4aa",
                    marginBottom: "0.9rem",
                  }}
                >
                  <Icon size={18} />
                </div>
                <h3 style={{ color: "#e8f1ff", fontWeight: 700, marginBottom: "0.45rem", fontSize: "0.98rem" }}>{title}</h3>
                <p style={{ color: "rgba(220,232,255,0.58)", fontSize: "0.9rem", lineHeight: 1.65 }}>{description}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
