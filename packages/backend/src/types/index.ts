export type ModelAlias = "sonnet" | "haiku";

export type AgentId =
  | "editor"
  | "content-writer"
  | "social"
  | "strategy"
  | "seo"
  | "paid-media"
  | "fe-dev"
  | "be-dev"
  | "ux";

export type UserRole = "admin" | "editor" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface RunAgentParams {
  agentName: string;
  teamMember: string;
  taskType: string;
  systemPrompt: string;
  userInput: string;
  model?: ModelAlias;
}

export interface RunAgentResult {
  output: string;
  notionUrl: string | null;
  outputId: string;
  durationMs: number;
}

export interface NotionWriteParams {
  agentName: string;
  teamMember: string;
  taskType: string;
  outputText: string;
  score?: number;
}

export interface KBModule {
  id: string;
  label: string;
  filePath: string;
  status: "pending" | "draft" | "complete";
}

export interface JobPayload {
  jobName: string;
  trigger: "cron" | "manual";
  agentId: AgentId;
  agentName: string;
  teamMember: string;
  taskType: string;
  userInput: string;
  model?: ModelAlias;
  biweekly?: boolean;
}

export interface AgentOutput {
  id: string;
  agentId: string;
  agentName: string;
  teamMember: string;
  taskType: string;
  outputText: string;
  notionUrl: string | null;
  modelUsed: string;
  score: number | null;
  status: string;
  durationMs: number | null;
  createdAt: Date;
}

// Extend Express Request with authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
