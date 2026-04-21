import "dotenv/config";
import { agentQueue } from "./queue";
import "./processor"; // registers the processor
import { JobPayload } from "../types";

const PLACEHOLDER = "PLACEHOLDER — replace with Notion calendar brief fetch";

const SCHEDULED_JOBS: Array<{
  name: string;
  cron: string;
  payload: Omit<JobPayload, "jobName">;
  biweekly?: boolean;
}> = [
  {
    name: "content-writer-seo-blog",
    cron: "0 6 * * 1",
    payload: {
      agentId: "content-writer",
      agentName: "Content Writer Agent",
      teamMember: "Content Writer",
      taskType: "SEO Blog Draft",
      userInput: PLACEHOLDER,
      model: "sonnet",
      trigger: "cron",
    },
  },
  {
    name: "content-writer-thought-leadership",
    cron: "0 6 * * 4",
    payload: {
      agentId: "content-writer",
      agentName: "Content Writer Agent",
      teamMember: "Content Writer",
      taskType: "Thought Leadership Draft",
      userInput: PLACEHOLDER,
      model: "sonnet",
      trigger: "cron",
    },
  },
  {
    name: "social-daily",
    cron: "0 7 * * 1-5",
    payload: {
      agentId: "social",
      agentName: "Social Media Agent",
      teamMember: "Social Marketer",
      taskType: "LinkedIn Post + Creative Brief",
      userInput: PLACEHOLDER,
      model: "haiku",
      trigger: "cron",
    },
  },
  {
    name: "seo-weekly-keywords",
    cron: "0 8 * * 1",
    payload: {
      agentId: "seo",
      agentName: "SEO Agent",
      teamMember: "SEO Executive",
      taskType: "Weekly Keyword Clusters",
      userInput: PLACEHOLDER,
      model: "sonnet",
      trigger: "cron",
    },
  },
  {
    name: "paid-media-performance",
    cron: "0 9 * * 1",
    payload: {
      agentId: "paid-media",
      agentName: "Paid Media Agent",
      teamMember: "Paid Marketer",
      taskType: "Weekly Performance Summary",
      userInput: PLACEHOLDER,
      model: "sonnet",
      trigger: "cron",
    },
  },
  {
    name: "content-writer-blog-revamp",
    cron: "0 6 * * 3",
    payload: {
      agentId: "content-writer",
      agentName: "Content Writer Agent",
      teamMember: "Content Writer",
      taskType: "Blog Revamp",
      userInput: PLACEHOLDER,
      model: "sonnet",
      trigger: "cron",
    },
    biweekly: true, // runs weeks 1 and 3 only — checked in processor
  },
];

async function registerJobs() {
  // Remove all existing repeatable jobs before re-registering
  const existing = await agentQueue.getRepeatableJobs();
  for (const job of existing) {
    await agentQueue.removeRepeatableByKey(job.key);
  }

  for (const { name, cron, payload, biweekly } of SCHEDULED_JOBS) {
    await agentQueue.add(
      { ...payload, jobName: name, biweekly },
      { repeat: { cron } }
    );
    console.log(`[Scheduler] Registered: ${name} (${cron})`);
  }

  console.log(`\n[Scheduler] ${SCHEDULED_JOBS.length} jobs registered. Queue is running.`);
}

registerJobs().catch((err) => {
  console.error("[Scheduler] Failed to register jobs:", err);
  process.exit(1);
});
