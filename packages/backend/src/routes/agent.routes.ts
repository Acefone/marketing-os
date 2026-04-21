import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { runAgent } from "../services/pipeline.service";
import { AgentId } from "../types";

const router = Router();

const AGENT_FOLDER_MAP: Record<AgentId, string> = {
  editor: "editor-agent",
  "content-writer": "content-writer-agent",
  social: "social-media-agent",
  strategy: "strategy-agent",
  seo: "seo-agent",
  "paid-media": "paid-media-agent",
  "fe-dev": "fe-dev-agent",
  "be-dev": "be-dev-agent",
  ux: "ux-agent",
};

function loadAgentPrompt(agentId: AgentId): string | null {
  const folder = AGENT_FOLDER_MAP[agentId];
  if (!folder) return null;
  const filePath = path.join(process.cwd(), `../../agents/${folder}/CLAUDE.md`);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
}

router.post("/run-agent", async (req: Request, res: Response) => {
  const { agentId, taskType, userInput, model, teamMember } = req.body as {
    agentId: AgentId;
    taskType: string;
    userInput: string;
    model?: "sonnet" | "haiku";
    teamMember?: string;
  };

  if (!agentId || !userInput || !taskType) {
    return res.status(400).json({ error: "agentId, taskType, and userInput are required" });
  }

  const systemPrompt = loadAgentPrompt(agentId);
  if (!systemPrompt) {
    return res.status(404).json({ error: `Agent '${agentId}' not found or CLAUDE.md missing` });
  }

  try {
    const result = await runAgent({
      agentName: agentId,
      teamMember: teamMember ?? "Unknown",
      taskType,
      systemPrompt,
      userInput,
      model: model ?? "sonnet",
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
