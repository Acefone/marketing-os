import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ text: "Mocked Claude response" }],
      }),
    },
  })),
}));

vi.mock("../src/db/client", () => ({
  db: {
    query: vi.fn().mockResolvedValue({ rows: [{ id: "test-uuid-123" }] }),
  },
}));

vi.mock("../src/services/notion.service", () => ({
  writeToNotion: vi.fn().mockResolvedValue("https://notion.so/test-page"),
}));

let callClaude: (s: string, u: string, m?: "sonnet" | "haiku") => Promise<string>;
let runAgent: (p: {
  agentName: string;
  teamMember: string;
  taskType: string;
  systemPrompt: string;
  userInput: string;
  model?: "sonnet" | "haiku";
}) => Promise<{ output: string; notionUrl: string | null; outputId: string; durationMs: number }>;

beforeAll(async () => {
  const mod = await import("../src/services/pipeline.service");
  callClaude = mod.callClaude;
  runAgent = mod.runAgent;
});

describe("callClaude", () => {
  it("returns the text content from Claude response", async () => {
    const result = await callClaude("System prompt", "User message");
    expect(result).toBe("Mocked Claude response");
  });
});

describe("runAgent", () => {
  it("returns output, outputId, and durationMs", async () => {
    const result = await runAgent({
      agentName: "content-writer",
      teamMember: "Content Writer",
      taskType: "SEO Blog Draft",
      systemPrompt: "You are a content writer.",
      userInput: "Write a blog about VoIP",
    });

    expect(result.output).toBe("Mocked Claude response");
    expect(result.outputId).toBe("test-uuid-123");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("still returns a result if Notion write fails", async () => {
    const { writeToNotion } = await import("../src/services/notion.service");
    vi.mocked(writeToNotion).mockRejectedValueOnce(new Error("Notion down"));

    const result = await runAgent({
      agentName: "seo",
      teamMember: "SEO Executive",
      taskType: "Keyword Cluster",
      systemPrompt: "You are an SEO agent.",
      userInput: "Find keywords for cloud telephony",
    });

    expect(result.output).toBe("Mocked Claude response");
    expect(result.notionUrl).toBeNull();
  });
});
