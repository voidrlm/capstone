import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { query } from "./db/index.js";

// Import routes
import authRoutes from "./routes/auth.js";
import drugRoutes from "./routes/drugs.js";
import patientRoutes from "./routes/patients.js";
import analyticsRoutes from "./routes/analytics.js";
import organizationRoutes from "./routes/organizations.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      const configuredOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const isLocalDevOrigin = !!origin && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      const isConfiguredOrigin = !!origin && configuredOrigins.includes(origin);

      if (!origin || isLocalDevOrigin || isConfiguredOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS blocked for this origin"));
    },
    credentials: true,
  }),
);

// Rate limiting - disabled for development
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"), // 1 minute
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "1000"),
//   message: { error: "Too many requests, please try again later." },
// });
// app.use("/api", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to PharmaLogs API Server",
    health_check: "/health",
    api_docs: "Available at /api/...",
  });
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/drugs", drugRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/organizations", organizationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Run lightweight startup migrations for tables added after initial schema
async function runStartupMigrations() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS patient_discharge_summaries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        admission_date DATE,
        discharge_date DATE,
        primary_diagnosis TEXT,
        attending_physician VARCHAR(255),
        los_days INTEGER,
        discharge_diagnoses TEXT[],
        document_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_patient_discharge_summaries_patient ON patient_discharge_summaries(patient_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_patient_discharge_summaries_discharge_date ON patient_discharge_summaries(discharge_date)`);
    // Add medication_name column to patient_medications if it doesn't exist
    await query(`ALTER TABLE patient_medications ADD COLUMN IF NOT EXISTS medication_name VARCHAR(255)`);
    console.log("  ✅ Startup migrations complete");
  } catch (err) {
    console.warn("  ⚠️  Startup migrations failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`
  🏥 PharmaLogs API Server
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server running on port ${PORT}
  📍 Environment: ${process.env.NODE_ENV || "development"}
  🔗 Health check: http://localhost:${PORT}/health
  📚 Auth API: http://localhost:${PORT}/api/auth
  💊 Drug API: http://localhost:${PORT}/api/drugs
  👤 Patient API: http://localhost:${PORT}/api/patients
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
  void runStartupMigrations();
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the process/container using it, or start the backend with PORT set to a different value.`,
    );
    process.exit(1);
  }

  throw error;
});

export default app;
