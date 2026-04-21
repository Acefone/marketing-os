import { useState, useEffect } from "react";
import { api } from "../lib/api";

interface Output {
  id: string;
  agent_name: string;
  team_member: string;
  task_type: string;
  notion_url: string | null;
  score: number | null;
  status: string;
  created_at: string;
}

const AGENT_FILTERS = [
  "all",
  "Editor Agent",
  "Content Writer Agent",
  "Social Media Agent",
  "Strategy Agent",
  "SEO Agent",
  "Paid Media Agent",
  "FE Dev Agent",
  "BE Dev Agent",
  "UX Designer Agent",
];

export default function OutputLog() {
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    api.get<Output[]>(`/outputs?agent=${encodeURIComponent(filter)}`)
      .then((data) => { setOutputs(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Output Log</h2>

      <div className="flex flex-wrap gap-2">
        {AGENT_FILTERS.map((a) => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === a
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {a === "all" ? "All agents" : a}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading...</p>}

      {!loading && outputs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No outputs yet. Run an agent to see results here.</p>
        </div>
      )}

      <div className="space-y-3">
        {outputs.map((o) => (
          <div key={o.id} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{o.agent_name}</span>
                <span className="text-xs text-muted-foreground">{o.task_type}</span>
                <span className="text-xs text-muted-foreground">{o.team_member}</span>
              </div>
              <div className="flex items-center gap-3">
                {o.score !== null && (
                  <span className="text-xs font-medium text-primary">Score: {o.score}/5</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  o.status === "reviewed" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                }`}>
                  {o.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString("en-GB")}
                </span>
              </div>
            </div>
            {o.notion_url && (
              <a
                href={o.notion_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-primary underline"
              >
                Open in Notion →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
