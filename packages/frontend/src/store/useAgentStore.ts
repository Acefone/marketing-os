import { create } from "zustand";
import { api } from "../lib/api";

interface Agent {
  id: string;
  label: string;
  model: "sonnet" | "haiku";
  teamMember: string;
  trigger: string;
}

interface RunAgentResult {
  output: string;
  notionUrl: string | null;
  outputId: string;
  durationMs: number;
}

type RunStatus = "idle" | "running" | "done" | "error";

interface AgentStore {
  selectedAgent: Agent | null;
  taskType: string;
  input: string;
  status: RunStatus;
  result: RunAgentResult | null;
  errorMsg: string | null;
  selectAgent: (agent: Agent) => void;
  setTaskType: (t: string) => void;
  setInput: (i: string) => void;
  runAgent: () => Promise<void>;
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  selectedAgent: null,
  taskType: "",
  input: "",
  status: "idle",
  result: null,
  errorMsg: null,

  selectAgent: (agent) =>
    set({ selectedAgent: agent, taskType: "", input: "", result: null, status: "idle", errorMsg: null }),

  setTaskType: (taskType) => set({ taskType }),
  setInput: (input) => set({ input }),
  reset: () => set({ selectedAgent: null, taskType: "", input: "", result: null, status: "idle", errorMsg: null }),

  runAgent: async () => {
    const { selectedAgent, taskType, input } = get();
    if (!selectedAgent || !input.trim()) return;

    set({ status: "running", result: null, errorMsg: null });

    try {
      const result = await api.post<RunAgentResult>("/run-agent", {
        agentId: selectedAgent.id,
        taskType,
        userInput: input,
        model: selectedAgent.model,
        teamMember: selectedAgent.teamMember,
      });
      set({ result, status: "done" });
    } catch (err) {
      set({ status: "error", errorMsg: (err as Error).message });
    }
  },
}));
