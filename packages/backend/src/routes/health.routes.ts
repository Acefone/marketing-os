import { Router, Request, Response } from "express";
import { callClaude } from "../services/pipeline.service";
import { db } from "../db/client";

const router = Router();

router.get("/health", async (_req: Request, res: Response) => {
  const results: Record<string, string> = {
    timestamp: new Date().toISOString(),
    claude: "unknown",
    database: "unknown",
  };

  await Promise.allSettled([
    callClaude("Respond with exactly: OK", "ping", "haiku").then((r) => {
      results.claude = r.trim() === "OK" ? "healthy" : `unexpected: ${r.trim()}`;
    }),
    db.query("SELECT 1").then(() => {
      results.database = "healthy";
    }),
  ]).then((outcomes) => {
    outcomes.forEach((o, i) => {
      if (o.status === "rejected") {
        const key = i === 0 ? "claude" : "database";
        results[key] = `error: ${o.reason?.message ?? "unknown"}`;
      }
    });
  });

  res.json(results);
});

export default router;
