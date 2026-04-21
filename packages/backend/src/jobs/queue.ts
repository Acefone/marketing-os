import Bull from "bull";
import { JobPayload } from "../types";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const agentQueue = new Bull<JobPayload>("agent-jobs", REDIS_URL, {
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 200,
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
  },
});
