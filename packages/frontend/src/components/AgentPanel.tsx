import { useAuthStore } from "../store/useAuthStore";
import { useAgentStore } from "../store/useAgentStore";

const AGENTS = [
  { id: "editor",         label: "Editor Agent",          model: "sonnet" as const, teamMember: "All",              trigger: "manual" },
  { id: "content-writer", label: "Content Writer Agent",  model: "sonnet" as const, teamMember: "Content Writer",   trigger: "cron + manual" },
  { id: "social",         label: "Social Media Agent",    model: "haiku"  as const, teamMember: "Social Marketer",  trigger: "daily 7 AM" },
  { id: "strategy",       label: "Strategy Agent",        model: "sonnet" as const, teamMember: "Digital Mktg Mgr", trigger: "manual" },
  { id: "seo",            label: "SEO Agent",             model: "sonnet" as const, teamMember: "SEO Executive",    trigger: "Mon 8 AM" },
  { id: "paid-media",     label: "Paid Media Agent",      model: "sonnet" as const, teamMember: "Paid Marketer",    trigger: "manual + Mon 9 AM" },
  { id: "fe-dev",         label: "FE Dev Agent",          model: "haiku"  as const, teamMember: "FE Developer",     trigger: "manual" },
  { id: "be-dev",         label: "BE Dev Agent",          model: "haiku"  as const, teamMember: "BE Developer",     trigger: "manual" },
  { id: "ux",             label: "UX Designer Agent",     model: "haiku"  as const, teamMember: "UX Designer",      trigger: "manual" },
];

const TASK_TYPES: Record<string, string[]> = {
  "editor":         ["Review Draft"],
  "content-writer": ["SEO Blog Draft", "Thought Leadership", "Blog Revamp"],
  "social":         ["LinkedIn Post + Creative Brief"],
  "strategy":       ["Deck Outline", "Sales Enablement One-Pager", "Competitor Synthesis"],
  "seo":            ["Keyword Cluster", "On-Page SEO Audit", "Content Brief (SEO)"],
  "paid-media":     ["Ad Copy Variants", "Audience Brief", "Performance Summary"],
  "fe-dev":         ["Component Spec"],
  "be-dev":         ["API Integration Spec"],
  "ux":             ["Design Direction Doc"],
};

export default function AgentPanel() {
  const { user } = useAuthStore();
  const { selectedAgent, taskType, input, status, result, errorMsg, selectAgent, setTaskType, setInput, runAgent } =
    useAgentStore();

  const canRun = user?.role === "admin" || user?.role === "editor";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Run an Agent</h2>

      <div className="grid grid-cols-3 gap-3">
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => { selectAgent(agent); setTaskType(TASK_TYPES[agent.id][0]); }}
            className={`text-left p-4 rounded-lg border transition-colors ${
              selectedAgent?.id === agent.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <p className="font-medium text-sm">{agent.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{agent.model} · {agent.trigger}</p>
          </button>
        ))}
      </div>

      {selectedAgent && (
        <div className="border border-border rounded-lg p-5 space-y-4">
          <div>
            <h3 className="font-medium">{selectedAgent.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Routes to: <strong>{selectedAgent.teamMember}</strong> in Notion
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Task type</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {TASK_TYPES[selectedAgent.id].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Brief / Input</label>
            <textarea
              rows={8}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Paste the brief or task input for ${selectedAgent.label}...`}
              className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {canRun ? (
            <button
              onClick={runAgent}
              disabled={status === "running" || !input.trim()}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {status === "running" ? "Running..." : `Run ${selectedAgent.label}`}
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">Viewer role — read only access</p>
          )}
        </div>
      )}

      {status === "done" && result && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-green-700">Done — output saved</p>
          {result.notionUrl && (
            <a
              href={result.notionUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline"
            >
              Open in Notion →
            </a>
          )}
          <pre className="mt-2 text-xs text-foreground whitespace-pre-wrap bg-background border border-border rounded p-3 max-h-64 overflow-y-auto">
            {result.output}
          </pre>
        </div>
      )}

      {status === "error" && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-700">Error: {errorMsg}</p>
        </div>
      )}
    </div>
  );
}
