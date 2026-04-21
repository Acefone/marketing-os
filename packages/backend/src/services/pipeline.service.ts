import Anthropic from "@anthropic-ai/sdk";
import { db } from "../db/client";
import { getKBContext } from "./kb-parser.service";
import { writeToNotion } from "./notion.service";
import { ModelAlias, RunAgentParams, RunAgentResult } from "../types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODELS: Record<ModelAlias, string> = {
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5-20251001",
};

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  model: ModelAlias = "sonnet"
): Promise<string> {
  const response = await client.messages.create({
    model: MODELS[model],
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });
  return (response.content[0] as { text: string }).text;
}

export async function callWithKB(
  agentName: string,
  systemPrompt: string,
  userMessage: string,
  model: ModelAlias = "sonnet"
): Promise<string> {
  const kbContext = getKBContext(agentName);
  const fullSystemPrompt = kbContext ? `${kbContext}\n\n---\n\n${systemPrompt}` : systemPrompt;
  return callClaude(fullSystemPrompt, userMessage, model);
}

export async function runAgent({
  agentName,
  teamMember,
  taskType,
  systemPrompt,
  userInput,
  model = "sonnet",
}: RunAgentParams): Promise<RunAgentResult> {
  const startTime = Date.now();
  console.log(`[${agentName}] Starting — task: ${taskType}`);

  const output = await callWithKB(agentName, systemPrompt, userInput, model);
  const durationMs = Date.now() - startTime;

  // Write to PostgreSQL (canonical store)
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO agent_outputs
       (agent_id, agent_name, team_member, task_type, output_text, model_used, duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [agentName.toLowerCase().replace(/ /g, "-"), agentName, teamMember, taskType, output, MODELS[model], durationMs]
  );
  const outputId = rows[0].id;

  // Write to Notion (secondary — failure is non-fatal)
  let notionUrl: string | null = null;
  try {
    notionUrl = await writeToNotion({ agentName, teamMember, taskType, outputText: output });
    await db.query("UPDATE agent_outputs SET notion_url = $1 WHERE id = $2", [notionUrl, outputId]);
  } catch (err) {
    console.warn(`[${agentName}] Notion write failed — output saved to DB only:`, (err as Error).message);
  }

  console.log(`[${agentName}] Done in ${(durationMs / 1000).toFixed(1)}s`);
  return { output, notionUrl, outputId, durationMs };
}
