import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowUpRight, Search, FileText, BarChart3, Network,
  TrendingUp, Clock, Users, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const kpis = [
    { icon: TrendingUp, label: "Knowledge reuse", value: "+128%", sub: "vs last quarter", tone: "gold" },
    { icon: Clock, label: "Avg retrieval", value: "240ms", sub: "p50 latency" },
    { icon: Users, label: "Active SMEs", value: "84", sub: "across 12 capabilities" },
    { icon: Zap, label: "Productivity saved", value: "1,420h", sub: "this month" },
  ];
  const recent = [
    { title: "Oncology Demand Forecasting Q3", dept: "Pharma Analytics", conf: 98, badge: "Verified" },
    { title: "Patient Adherence Benchmarking v4", dept: "Commercial", conf: 94, badge: "Latest" },
    { title: "Lab Outcomes Synthesis — Northwind", dept: "Life Sciences", conf: 91, badge: "Recommended" },
    { title: "Real-World Evidence Pipeline Brief", dept: "RWE", conf: 88, badge: "Highly Referenced" },
  ];
  const prompts = [
    "Show oncology forecasting projects from last 18 months",
    "Find competitive intelligence decks on patient adherence",
    "Generate a one-slider for Northwind lab analytics",
    "Who are SMEs on real-world evidence pipelines?",
  ];

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Greeting */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.25em] text-gold uppercase mb-2">Workspace · Friday</div>
          <h1 className="font-display text-4xl text-gradient-warm">Good evening, Marcus.</h1>
          <p className="text-foreground/60 mt-2">Your intelligence engine indexed 412 new artifacts overnight.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="hero">
            <Link to="/dashboard/workspace"><Sparkles className="size-4" /> New AI Session</Link>
          </Button>
          <Button asChild variant="outlineGold">
            <Link to="/dashboard/upload">Upload</Link>
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-card border border-border rounded-2xl p-5 hover:border-gold/30 transition-all ${k.tone === "gold" ? "bg-gradient-teal" : ""}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`size-9 rounded-lg flex items-center justify-center ${k.tone === "gold" ? "bg-gold/20 text-gold" : "bg-glass text-gold"}`}>
                <k.icon className="size-4" />
              </div>
              <ArrowUpRight className="size-4 text-foreground/40" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-foreground/55">{k.label}</div>
            <div className="font-display text-3xl text-gradient-warm mt-1">{k.value}</div>
            <div className="text-xs text-foreground/50 mt-1">{k.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent retrievals */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl text-warm">Recent retrievals</h2>
              <p className="text-xs text-foreground/55 mt-1">Verified intelligence surfaced this week.</p>
            </div>
            <Link to="/dashboard/search" className="text-xs text-gold hover:text-gold-soft">View all →</Link>
          </div>
          <div className="space-y-2">
            {recent.map((r, i) => (
              <div key={r.title} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-border transition-all group cursor-pointer">
                <div className="size-10 rounded-lg bg-glass flex items-center justify-center text-gold shrink-0">
                  <FileText className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-warm text-sm truncate group-hover:text-gold transition-colors">{r.title}</div>
                  <div className="text-[11px] text-foreground/50 mt-0.5">{r.dept} · Updated {i + 1}d ago</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-gold font-display text-lg leading-none">{r.conf}%</div>
                  <div className="text-[9px] text-foreground/50 tracking-widest mt-0.5">CONFIDENCE</div>
                </div>
                <span className="hidden md:inline text-[10px] tracking-widest text-gold border border-gold/30 rounded-full px-2 py-0.5 uppercase">{r.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested prompts */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="size-4 text-gold" />
            <h2 className="font-display text-2xl text-warm">Try a prompt</h2>
          </div>
          <div className="space-y-2">
            {prompts.map((p) => (
              <Link
                key={p}
                to="/dashboard/workspace"
                className="block bg-glass rounded-xl p-3 text-sm text-foreground/80 hover:text-warm hover:border-gold/40 transition-all"
              >
                {p}
              </Link>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-border">
            <div className="text-[10px] uppercase tracking-widest text-gold mb-2">Quick actions</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Search, l: "Search", to: "/dashboard/search" },
                { icon: Network, l: "Graph", to: "/dashboard/graph" },
                { icon: BarChart3, l: "Analytics", to: "/dashboard/analytics" },
                { icon: FileText, l: "Cases", to: "/dashboard/case-studies" },
              ].map((a) => (
                <Link key={a.l} to={a.to} className="bg-glass rounded-lg p-2.5 flex items-center gap-2 text-xs text-foreground/75 hover:text-gold hover:border-gold/30">
                  <a.icon className="size-3.5" /> {a.l}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity strip */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display text-2xl text-warm mb-5">Knowledge utilization</h2>
        <div className="grid grid-cols-12 gap-1 h-32 items-end">
          {Array.from({ length: 60 }).map((_, i) => {
            const h = 30 + Math.sin(i * 0.4) * 20 + Math.random() * 40;
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.01, duration: 0.6 }}
                className={`rounded-sm ${i > 50 ? "bg-gold" : "bg-gold/30"}`}
                style={{ gridColumn: "span 1" }}
              />
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-4 text-[10px] tracking-widest text-foreground/50 uppercase">
          <span>60 days</span>
          <span className="text-gold">+128% this quarter</span>
        </div>
      </div>
    </div>
  );
}
