import { useState, useEffect } from "react";
import { api } from "../lib/api";

const KB_MODULES = [
  { id: "KB-01", label: "Brand Voice Guide",         file: "brand-voice/BRAND-VOICE-GUIDE.md",   week: 2, critical: true },
  { id: "KB-02", label: "ICP",                        file: "icp/ICP.md",                         week: 2, critical: true },
  { id: "KB-03", label: "Positioning",                file: "positioning/POSITIONING.md",          week: 2, critical: true },
  { id: "KB-04", label: "Competitor Analysis",        file: "competitors/COMPETITOR-ANALYSIS.md",  week: 2, critical: false },
  { id: "KB-05", label: "Funnel Stage Definitions",   file: "funnel/FUNNEL-STAGE-DEFINITIONS.md",  week: 2, critical: true },
  { id: "KB-06", label: "Content Brief Template",     file: "templates/CONTENT-BRIEF-TEMPLATE.md", week: 2, critical: true },
  { id: "KB-07", label: "Product Differentiators",    file: "products/PRODUCT-DIFFERENTIATORS.md", week: 2, critical: false },
  { id: "KB-08", label: "Content Calendar",           file: "templates/CONTENT-CALENDAR.md",       week: 5, critical: false },
  { id: "KB-09", label: "SEO Keyword Library",        file: "seo/KEYWORD-LIBRARY.md",              week: 2, critical: false },
  { id: "KB-10", label: "Quality Rubric",             file: "templates/QUALITY-RUBRIC.md",         week: 2, critical: true },
  { id: "KB-11", label: "Deck Templates",             file: "templates/DECK-TEMPLATES.md",         week: 5, critical: false },
  { id: "KB-12", label: "Ad Copy Library",            file: "ad-copy/AD-COPY-LIBRARY.md",          week: 6, critical: false },
];

const STATUS_STYLES: Record<string, string> = {
  complete: "border-green-200 bg-green-50",
  draft:    "border-yellow-200 bg-yellow-50",
  pending:  "border-border bg-muted/30",
};

const STATUS_LABELS: Record<string, string> = {
  complete: "Complete",
  draft:    "Draft",
  pending:  "Pending",
};

export default function KBViewer() {
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get<Record<string, string>>("/kb-status")
      .then(setStatuses)
      .catch(() => setStatuses({}));
  }, []);

  const complete = KB_MODULES.filter((m) => statuses[m.id] === "complete").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Knowledge Base</h2>
        <span className="text-sm text-muted-foreground">{complete} / {KB_MODULES.length} complete</span>
      </div>

      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${(complete / KB_MODULES.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {KB_MODULES.map((m) => {
          const status = statuses[m.id] ?? "pending";
          return (
            <div key={m.id} className={`rounded-lg border p-4 ${STATUS_STYLES[status]}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground">{m.id}</span>
                <div className="flex items-center gap-2">
                  {m.critical && (
                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">
                      Critical
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{STATUS_LABELS[status]}</span>
                </div>
              </div>
              <p className="text-sm font-medium">{m.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Week {m.week}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
