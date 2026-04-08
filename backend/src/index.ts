import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Import routes
import authRoutes from "./routes/auth.js";
import drugRoutes from "./routes/drugs.js";
import patientRoutes from "./routes/patients.js";
import analyticsRoutes from "./routes/analytics.js";

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

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  message: { error: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to MediRisk API Server",
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

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`
  🏥 MediRisk API Server
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server running on port ${PORT}
  📍 Environment: ${process.env.NODE_ENV || "development"}
  🔗 Health check: http://localhost:${PORT}/health
  📚 Auth API: http://localhost:${PORT}/api/auth
  💊 Drug API: http://localhost:${PORT}/api/drugs
  👤 Patient API: http://localhost:${PORT}/api/patients
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
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
