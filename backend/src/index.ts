/**
 * Entry point for ZYNK Backend
 * IMPORTANT:
 * dotenv.config() MUST run before any file that reads process.env
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "..", ".env");

console.log("Loading .env from:", envPath);
const result = dotenv.config({ path: envPath });
console.log("Dotenv config result:", result);

// NOW import other modules after dotenv.config()
import express from "express";
import cors from "cors";

import { initializeDatabase } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import skipDecisionRoutes from "./routes/skipDecisionRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { ensureDefaultAdminUser } from "./services/adminBootstrap.js";
import { seedCatalogIfEmpty } from "./data/seedCatalog.js";

// -----------------------------------------------------------------------------
// App & Config
// -----------------------------------------------------------------------------

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const configuredClientOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedClientOrigins = Array.from(
  new Set([
    ...configuredClientOrigins,
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8082",
    "http://localhost:8083",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8082",
    "http://127.0.0.1:8083",
  ])
);

const isAllowedOrigin = (origin?: string | null) => {
  if (!origin) return true;
  if (allowedClientOrigins.includes(origin)) return true;

  if (process.env.NODE_ENV !== "production") {
    try {
      const url = new URL(origin);
      return ["localhost", "127.0.0.1"].includes(url.hostname);
    } catch {
      return false;
    }
  }

  return false;
};

// -----------------------------------------------------------------------------
// Global Middleware
// -----------------------------------------------------------------------------

app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// -----------------------------------------------------------------------------
// Health Check (no DB required)
// -----------------------------------------------------------------------------

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// -----------------------------------------------------------------------------
// Server Bootstrap
// -----------------------------------------------------------------------------

async function startServer() {
  try {
    // 1️⃣ Initialize database FIRST
    await initializeDatabase();
    await ensureDefaultAdminUser();
    const catalogSeed = await seedCatalogIfEmpty();
    console.log("✓ Database connected successfully");
    console.log(`✓ Catalog ready (${catalogSeed.totalChefCount} chefs, ${catalogSeed.totalDishCount} dishes)`);

    // 2️⃣ Register routes AFTER DB is ready
    app.use("/api/auth", authRoutes);
    app.use("/api/subscriptions", subscriptionRoutes);
    app.use("/api/recommendations", recommendationRoutes);
    app.use("/api/skip-decision", skipDecisionRoutes);
    app.use("/api/payment", paymentRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api", catalogRoutes);

    // 3️⃣ 404 handler
    app.use(notFoundHandler);

    // 4️⃣ Global error handler (LAST)
    app.use(errorHandler);

    // 5️⃣ Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 CORS enabled for ${allowedClientOrigins.join(", ")}`);
      console.log(`🔒 JWT authentication enabled`);
      console.log("✓ All middleware and routes loaded");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// Start Application
// -----------------------------------------------------------------------------

startServer();
