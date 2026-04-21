import { Router, Request, Response } from "express";
import { db } from "../db/client";

const router = Router();

router.get("/outputs", async (req: Request, res: Response) => {
  const { agent } = req.query;

  const query =
    agent && agent !== "all"
      ? `SELECT id, agent_id, agent_name, team_member, task_type, notion_url, score, status, created_at
         FROM agent_outputs WHERE agent_name = $1 ORDER BY created_at DESC LIMIT 50`
      : `SELECT id, agent_id, agent_name, team_member, task_type, notion_url, score, status, created_at
         FROM agent_outputs ORDER BY created_at DESC LIMIT 50`;

  try {
    const { rows } = await db.query(query, agent && agent !== "all" ? [agent] : []);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
