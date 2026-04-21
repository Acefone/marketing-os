import fs from "fs";
import path from "path";

const KB_ROOT = path.join(process.cwd(), "../../knowledge-base");

const KB: Record<string, string> = {
  "KB-01": "brand-voice/BRAND-VOICE-GUIDE.md",
  "KB-02": "icp/ICP.md",
  "KB-03": "positioning/POSITIONING.md",
  "KB-04": "competitors/COMPETITOR-ANALYSIS.md",
  "KB-05": "funnel/FUNNEL-STAGE-DEFINITIONS.md",
  "KB-06": "templates/CONTENT-BRIEF-TEMPLATE.md",
  "KB-07": "products/PRODUCT-DIFFERENTIATORS.md",
  "KB-08": "templates/CONTENT-CALENDAR.md",
  "KB-09": "seo/KEYWORD-LIBRARY.md",
  "KB-10": "templates/QUALITY-RUBRIC.md",
  "KB-11": "templates/DECK-TEMPLATES.md",
  "KB-12": "ad-copy/AD-COPY-LIBRARY.md",
};

const AGENT_KB_MAP: Record<string, string[]> = {
  editor: ["KB-01", "KB-03", "KB-10"],
  "content-writer": ["KB-01", "KB-02", "KB-03", "KB-05", "KB-06", "KB-07", "KB-09"],
  social: ["KB-01", "KB-02", "KB-03", "KB-08"],
  strategy: ["KB-02", "KB-03", "KB-04", "KB-07", "KB-11"],
  seo: ["KB-02", "KB-05", "KB-09"],
  "paid-media": ["KB-02", "KB-03", "KB-07", "KB-12"],
  "fe-dev": ["KB-03", "KB-11"],
  "be-dev": [],
  ux: ["KB-01", "KB-02", "KB-03"],
};

export const KB_FILES = KB;

function readKBFile(kbId: string): string | null {
  const filePath = path.join(KB_ROOT, KB[kbId]);
  if (!fs.existsSync(filePath)) {
    console.warn(`[KB Parser] ${kbId} not found at ${filePath} — skipping`);
    return null;
  }
  const content = fs.readFileSync(filePath, "utf8");
  return `\n\n## ${kbId}: ${path.basename(filePath, ".md")}\n\n${content}`;
}

export function getKBContext(agentName: string): string {
  const modules = AGENT_KB_MAP[agentName];
  if (!modules) {
    console.warn(`[KB Parser] Unknown agent: "${agentName}"`);
    return "";
  }
  if (modules.length === 0) return "";

  const header = `# KNOWLEDGE BASE CONTEXT\nThe following documents are the institutional knowledge base for Acefone's marketing team. Apply all rules, tone guidelines, and strategic context from these documents in your output.\n`;
  const sections = modules.map(readKBFile).filter(Boolean).join("\n\n---");

  return header + sections;
}

export function getKBStatus(): Record<string, "pending" | "draft" | "complete"> {
  const statuses: Record<string, "pending" | "draft" | "complete"> = {};
  for (const [id, relPath] of Object.entries(KB)) {
    const fullPath = path.join(KB_ROOT, relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      statuses[id] = content.includes("[FILL IN]") ? "draft" : "complete";
    } else {
      statuses[id] = "pending";
    }
  }
  return statuses;
}
