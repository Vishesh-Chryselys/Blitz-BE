import { createFileRoute } from "@tanstack/react-router";
import { Bell, Lock, Sparkles, Database, Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: Settings,
});

function Settings() {
  const sections = [
    { icon: Sparkles, title: "AI Model Preferences", desc: "Tune semantic depth, citation strictness, retrieval breadth." },
    { icon: Database, title: "Data Sources", desc: "Manage SharePoint, Snowflake, Salesforce, Confluence connectors." },
    { icon: Users, title: "Workspace & Team", desc: "Roles, permissions, SSO, SCIM provisioning." },
    { icon: Bell, title: "Notifications", desc: "Indexing alerts, weekly intelligence digests, SME mentions." },
    { icon: Lock, title: "Security & Compliance", desc: "SOC 2 Type II, HIPAA, audit logs, data residency." },
  ];

  return (
    <div className="space-y-6 max-w-[900px]">
      <div>
        <div className="text-[11px] tracking-[0.25em] text-gold uppercase mb-2">Settings</div>
        <h1 className="font-display text-4xl text-gradient-warm">Workspace configuration</h1>
      </div>

      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.title} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5 hover:border-gold/30 transition-all cursor-pointer">
            <div className="size-12 rounded-xl bg-glass flex items-center justify-center text-gold shrink-0">
              <s.icon className="size-5" />
            </div>
            <div className="flex-1">
              <div className="text-warm font-medium">{s.title}</div>
              <div className="text-xs text-foreground/60 mt-0.5">{s.desc}</div>
            </div>
            <div className="text-foreground/40 text-sm">→</div>
          </div>
        ))}
      </div>
    </div>
  );
}
