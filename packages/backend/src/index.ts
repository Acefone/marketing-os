import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./logger";
import { authenticate, requireRole } from "./middleware/auth";
import authRoutes from "./routes/auth.routes";
import agentRoutes from "./routes/agent.routes";
import kbRoutes from "./routes/kb.routes";
import outputRoutes from "./routes/output.routes";
import healthRoutes from "./routes/health.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000" }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Public: auth endpoints
  app.use("/api", authRoutes);

  // Public: health check
  app.use("/api", healthRoutes);

  // Protected: all agent / kb / output routes require a valid JWT
  app.use("/api", authenticate, agentRoutes);
  app.use("/api", authenticate, kbRoutes);
  app.use("/api", authenticate, outputRoutes);

  // Admin-only example guard (applied per-route in auth.routes.ts as needed)
  // requireRole("admin") can be applied to any router above

  return app;
}
