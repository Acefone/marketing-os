import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AgentPanel from "./AgentPanel";
import KBViewer from "./KBViewer";
import OutputLog from "./OutputLog";

type Tab = "agents" | "kb" | "outputs";

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("agents");

  const tabs: { id: Tab; label: string }[] = [
    { id: "agents", label: "Agents" },
    { id: "kb", label: "Knowledge Base" },
    { id: "outputs", label: "Output Log" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold">Marketing Agent OS</h1>
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{user?.email}</span>
          <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium capitalize">
            {user?.role}
          </span>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {activeTab === "agents" && <AgentPanel />}
        {activeTab === "kb" && <KBViewer />}
        {activeTab === "outputs" && <OutputLog />}
      </main>
    </div>
  );
}
