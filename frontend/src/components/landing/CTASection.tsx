import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section
      id="cta"
      style={{
        background: "linear-gradient(180deg, #091221 0%, #04080f 100%)",
        padding: "0 0 6rem",
      }}
    >
      <div className="land-wrap">
        <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{
            borderRadius: "2rem",
            padding: "clamp(1.75rem, 4vw, 3rem)",
            border: "1px solid rgba(255,255,255,0.08)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,212,170,0.06) 45%, rgba(255,255,255,0.03) 100%)",
            boxShadow: "0 24px 50px rgba(0,0,0,0.24)",
          }}
        >
          <div style={{ maxWidth: "42rem" }}>
            <span
              style={{
                color: "rgba(119,246,219,0.92)",
                fontSize: "0.74rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              Start With Patient Control
            </span>
            <h2
              className="font-display"
              style={{
                color: "#edf4ff",
                fontSize: "clamp(2rem, 4vw, 3.3rem)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
                marginTop: "1rem",
              }}
            >
              Store your records once. Share them only when you approve it.
            </h2>
            <p
              style={{
                color: "rgba(220,232,255,0.62)",
                lineHeight: 1.8,
                marginTop: "1rem",
                maxWidth: "36rem",
              }}
            >
              MediRisk is built around long-term record storage and patient permission, so your information stays organized and
              your access decisions stay yours.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", marginTop: "2rem" }}>
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
                to="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: "#dce8ff",
                  textDecoration: "none",
                  fontWeight: 700,
                  borderRadius: 999,
                  padding: "1rem 1.4rem",
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
