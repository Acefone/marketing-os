import { Client } from "@notionhq/client";
import { NotionWriteParams } from "../types";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.NOTION_DATABASE_ID ?? "";

const TEAM_MEMBER_PAGE_IDS: Record<string, string> = {
  "Content Writer": "PASTE_NOTION_PAGE_ID_HERE",
  "Social Marketer": "PASTE_NOTION_PAGE_ID_HERE",
  "Digital Mktg Mgr": "PASTE_NOTION_PAGE_ID_HERE",
  "SEO Executive": "PASTE_NOTION_PAGE_ID_HERE",
  "Paid Marketer": "PASTE_NOTION_PAGE_ID_HERE",
  "FE Developer": "PASTE_NOTION_PAGE_ID_HERE",
  "BE Developer": "PASTE_NOTION_PAGE_ID_HERE",
  "UX Designer": "PASTE_NOTION_PAGE_ID_HERE",
};

function chunkText(text: string, maxLength = 1900): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

export async function writeToNotion({
  agentName,
  teamMember,
  taskType,
  outputText,
  score,
}: NotionWriteParams): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any = {
    Name: {
      title: [
        {
          text: {
            content: `${agentName} — ${taskType} — ${new Date().toLocaleDateString("en-GB")}`,
          },
        },
      ],
    },
    Agent: { select: { name: agentName } },
    "Team Member": { select: { name: teamMember } },
    "Task Type": { rich_text: [{ text: { content: taskType } }] },
    Date: { date: { start: new Date().toISOString().split("T")[0] } },
    Status: { select: { name: "Draft" } },
  };

  if (score !== undefined) {
    properties["Score"] = { number: score };
  }

  const chunks = chunkText(outputText, 1900);
  const children = chunks.map((chunk) => ({
    object: "block" as const,
    type: "paragraph" as const,
    paragraph: {
      rich_text: [{ type: "text" as const, text: { content: chunk } }],
    },
  }));

  const response = await notion.pages.create({
    parent: { database_id: DATABASE_ID },
    properties,
    children,
  });

  return (response as { url: string }).url;
}

export { TEAM_MEMBER_PAGE_IDS };
