import Bull from "bull";
import fs from "fs";
import path from "path";
import { agentQueue } from "./queue";
import { runAgent } from "../services/pipeline.service";
import { db } from "../db/client";
import { JobPayload } from "../types";

function loadAgentPrompt(agentFolder: string): string | null {
  const filePath = path.join(process.cwd(), `../../agents/${agentFolder}/CLAUDE.md`);
  if (!fs.existsSync(filePath)) {
    console.warn(`[Processor] CLAUDE.md not found for ${agentFolder}`);
    return null;
  }
  return fs.readFileSync(filePath, "utf8");
}

const AGENT_FOLDER_MAP: Record<string, string> = {
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

agentQueue.process(async (job: Bull.Job<JobPayload>) => {
  const { jobName, agentId, agentName, teamMember, taskType, userInput, model, trigger } = job.data;

  // Insert job run record
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO job_runs (job_name, agent_id, task_type, trigger, status, started_at)
     VALUES ($1, $2, $3, $4, 'running', NOW()) RETURNING id`,
    [jobName, agentId, taskType, trigger]
  );
  const jobRunId = rows[0].id;

  const folder = AGENT_FOLDER_MAP[agentId];
  const systemPrompt = folder ? loadAgentPrompt(folder) : null;

  if (!systemPrompt) {
    await db.query(
      `UPDATE job_runs SET status = 'failed', error_message = $1, finished_at = NOW() WHERE id = $2`,
      ["CLAUDE.md not found", jobRunId]
    );
    throw new Error(`CLAUDE.md not found for agent ${agentId}`);
  }

  try {
    const result = await runAgent({ agentName, teamMember, taskType, systemPrompt, userInput, model });

    await db.query(
      `UPDATE job_runs
       SET status = 'done', output_id = $1, finished_at = NOW(), duration_ms = $2
       WHERE id = $3`,
      [result.outputId, result.durationMs, jobRunId]
    );

    return result;
  } catch (err) {
    await db.query(
      `UPDATE job_runs SET status = 'failed', error_message = $1, finished_at = NOW() WHERE id = $2`,
      [(err as Error).message, jobRunId]
    );
    throw err;
  }
});

agentQueue.on("failed", (job, err) => {
  console.error(`[Queue] Job ${job.data.jobName} failed:`, err.message);
});

agentQueue.on("completed", (job) => {
  console.log(`[Queue] Job ${job.data.jobName} completed`);
});
