import { motion } from "framer-motion";
import { FileArchive, FolderLock, History, UserRoundCheck } from "lucide-react";

const capabilities = [
  {
    title: "Keep every record in one place",
    description: "Upload visit summaries, prescriptions, lab reports, diagnoses, and personal documents into a single timeline you can revisit anytime.",
    Icon: FileArchive,
  },
  {
    title: "Share only when you approve it",
    description: "Doctors and nurses request access first. You decide whether an organization can view your information.",
    Icon: FolderLock,
  },
  {
    title: "Build a clearer medical history",
    description: "Your health information stays organized across time, so it is easier to understand what happened and when.",
    Icon: History,
  },
  {
    title: "Give providers the right context",
    description: "Once you approve access, professionals can review the records tied to your care without asking you to reassemble everything manually.",
    Icon: UserRoundCheck,
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f5fbfa 100%)",
        padding: "2rem 0 6rem",
        position: "relative",
      }}
    >
      <div className="land-wrap">
        <motion.div
          initial={{ opacity: 1 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="land-center"
            style={{ marginBottom: "3rem" }}
          >
            <span
              style={{
                color: "#009b7d",
                fontSize: "0.74rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              What MediRisk Helps You Do
            </span>
            <h2
              className="font-display"
              style={{
                color: "#0f172a",
                fontSize: "clamp(2rem, 4vw, 3.4rem)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                marginTop: "1rem",
              }}
            >
              A cleaner way to manage records and control access.
            </h2>
            <p
              style={{
                maxWidth: "40rem",
                margin: "1rem auto 0",
                color: "rgba(15,23,42,0.62)",
                lineHeight: 1.8,
              }}
            >
              The experience is designed around patient ownership: store your records, organize them over time, and approve
              provider access only when you want to share.
            </p>
          </motion.div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              maxWidth: "46rem",
              margin: "0 auto",
            }}
          >
            {capabilities.map(({ title, description, Icon }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{
                  borderRadius: "1.5rem",
                  padding: "1.55rem",
                  background: "#ffffff",
                  border: "1px solid rgba(15,23,42,0.08)",
                  boxShadow: "0 18px 38px rgba(15,23,42,0.08)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 15,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(0,212,170,0.1)",
                    color: "#00d4aa",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <h3 style={{ color: "#0f172a", fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>{title}</h3>
                  <p style={{ color: "rgba(15,23,42,0.62)", fontSize: "0.94rem", lineHeight: 1.72 }}>{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
