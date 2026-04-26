import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      style={{
        background:
          "linear-gradient(180deg, #f7fbfc 0%, #eef7f6 48%, #ffffff 100%)",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          pointerEvents: "none",
          backgroundImage:
            "linear-gradient(rgba(15,23,42,1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,1) 1px, transparent 1px)",
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
          background: "radial-gradient(circle, rgba(0,212,170,0.14) 0%, transparent 72%)",
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
          background: "radial-gradient(circle, rgba(59,159,255,0.1) 0%, transparent 70%)",
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
            alignItems: "start",
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
                <div style={{ color: "#0f172a", fontWeight: 800, letterSpacing: "-0.02em" }}>PharmaLogs</div>
                <div style={{ color: "rgba(15,23,42,0.45)", fontSize: "0.74rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  Personal Record Control
                </div>
              </div>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                to="/login"
                style={{
                  color: "#0f172a",
                  textDecoration: "none",
                  fontWeight: 700,
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

          <div
            style={{
              gridColumn: "span 12",
              display: "grid",
              gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
              gap: "2rem",
              alignItems: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }}
              className="lg:col-span-7"
              style={{ gridColumn: "span 12", maxWidth: "48rem" }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  borderRadius: 999,
                  border: "1px solid rgba(0,212,170,0.24)",
                  background: "rgba(0,212,170,0.08)",
                  color: "#009b7d",
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
                  color: "#0f172a",
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
                  color: "rgba(15,23,42,0.68)",
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
                    color: "#0f172a",
                    textDecoration: "none",
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "1rem 1.4rem",
                    border: "1px solid rgba(15,23,42,0.12)",
                    background: "rgba(255,255,255,0.78)",
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
              className="lg:col-span-5"
              style={{
                gridColumn: "span 12",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                maxWidth: "38rem",
                justifySelf: "end",
                width: "100%",
              }}
            >
              <FloatingRecordsOrb />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FloatingRecordsOrb() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, ease: "easeOut", delay: 0.25 }}
      className="hidden lg:block"
      style={{
        position: "relative",
        height: 420,
        marginBottom: "1.2rem",
        perspective: 1400,
      }}
    >
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [-2, 1, -2] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: 28,
          right: 24,
          width: 250,
          height: 320,
          borderRadius: 32,
          background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(238,247,246,0.95) 100%)",
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 30px 70px rgba(15,23,42,0.16)",
          transform: "rotateY(-16deg) rotateX(10deg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 88,
            background: "linear-gradient(135deg, #0f172a 0%, #143848 100%)",
            padding: "1.1rem 1.15rem",
            color: "white",
          }}
        >
          <div style={{ fontSize: "0.72rem", letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.72 }}>
            Record Vault
          </div>
          <div style={{ marginTop: "0.55rem", fontSize: "1.15rem", fontWeight: 800 }}>
            Patient Timeline
          </div>
        </div>
        <div style={{ padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {[
            { label: "Lab Results", tone: "#3b82f6", width: "76%" },
            { label: "Visit Notes", tone: "#00b894", width: "88%" },
            { label: "Prescriptions", tone: "#f59e0b", width: "68%" },
            { label: "Documents", tone: "#8b5cf6", width: "82%" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                borderRadius: 18,
                padding: "0.85rem 0.9rem",
                background: "rgba(255,255,255,0.84)",
                border: "1px solid rgba(15,23,42,0.07)",
                boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
              }}
            >
              <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.45rem" }}>
                {item.label}
              </div>
              <div
                style={{
                  height: 7,
                  borderRadius: 999,
                  background: "rgba(15,23,42,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: item.width,
                    height: "100%",
                    borderRadius: 999,
                    background: item.tone,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0], rotate: [2, -1, 2] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          left: 18,
          bottom: 22,
          width: 210,
          borderRadius: 28,
          padding: "1.05rem",
          background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.8) 100%)",
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 26px 52px rgba(15,23,42,0.12)",
          transform: "rotateY(18deg) rotateX(8deg)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "rgba(15,23,42,0.45)" }}>
          Access Control
        </div>
        <div style={{ marginTop: "0.7rem", fontSize: "1rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.35 }}>
          Providers only see records after your approval.
        </div>
        <div style={{ marginTop: "0.95rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <span style={{ padding: "0.45rem 0.7rem", borderRadius: 999, background: "rgba(0,212,170,0.12)", color: "#009b7d", fontSize: "0.78rem", fontWeight: 700 }}>
            Pending
          </span>
          <span style={{ padding: "0.45rem 0.7rem", borderRadius: 999, background: "rgba(15,23,42,0.06)", color: "#0f172a", fontSize: "0.78rem", fontWeight: 700 }}>
            Patient Decides
          </span>
        </div>
      </motion.div>

      <div
        style={{
          position: "absolute",
          inset: "30px 20px 10px 40px",
          borderRadius: 40,
          background: "radial-gradient(circle, rgba(0,212,170,0.14) 0%, rgba(59,159,255,0.08) 35%, transparent 72%)",
          filter: "blur(18px)",
          pointerEvents: "none",
        }}
      />
    </motion.div>
  );
}
