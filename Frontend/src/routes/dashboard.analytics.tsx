import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export const Route = createFileRoute("/dashboard/analytics")({
  component: Analytics,
});

function Analytics() {
  const kpis = [
    { label: "Adoption", value: "+34%", trend: "up", sub: "MoM growth" },
    { label: "Avg retrieval latency", value: "240ms", trend: "down", sub: "p50" },
    { label: "Retrieval accuracy", value: "94.2%", trend: "up", sub: "verified by SMEs" },
    { label: "Productivity saved", value: "1,420h", trend: "up", sub: "this month" },
  ];
  const topics = [
    ["Oncology forecasting", 482],
    ["Patient adherence", 391],
    ["Real-world evidence", 348],
    ["Lab outcomes", 287],
    ["Competitive intelligence", 256],
    ["Cohort analysis", 198],
  ];

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <div className="text-[11px] tracking-[0.25em] text-gold uppercase mb-2">Analytics</div>
        <h1 className="font-display text-4xl text-gradient-warm">Intelligence performance</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-widest text-foreground/55">{k.label}</div>
              {k.trend === "up" ? <TrendingUp className="size-4 text-gold" /> : <TrendingDown className="size-4 text-gold" />}
            </div>
            <div className="font-display text-3xl text-gradient-warm">{k.value}</div>
            <div className="text-xs text-foreground/50 mt-1">{k.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl text-warm">Retrieval volume</h2>
              <p className="text-xs text-foreground/55 mt-1">90-day trend</p>
            </div>
            <div className="text-xs text-gold flex items-center gap-1.5"><Activity className="size-3.5" /> Live</div>
          </div>
          <BigChart />
          <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-border">
            {[["Total queries", "48,219"], ["Unique users", "1,284"], ["Avg session", "12m"]].map(([k, v]) => (
              <div key={k}>
                <div className="text-[10px] uppercase tracking-widest text-foreground/50">{k}</div>
                <div className="font-display text-xl text-gradient-gold mt-1">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display text-2xl text-warm mb-4">Top searched topics</h2>
          <div className="space-y-3">
            {topics.map(([topic, n]) => {
              const max = 482;
              const w = (n as number / max) * 100;
              return (
                <div key={topic as string}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-foreground/80">{topic}</span>
                    <span className="text-gold">{n}</span>
                  </div>
                  <div className="h-1.5 bg-black/[0.08] rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-gold rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 1 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display text-2xl text-warm mb-4">Document reuse</h2>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 49 }).map((_, i) => {
              const intensity = Math.random();
              return (
                <div key={i} className="aspect-square rounded-sm" style={{
                  background: `oklch(0.81 0.14 82 / ${0.05 + intensity * 0.6})`,
                }} />
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 text-[10px] uppercase tracking-widest text-foreground/50">
            <span>7 weeks</span>
            <div className="flex items-center gap-1">Less <span className="size-2 bg-gold/20 rounded-sm" /><span className="size-2 bg-gold/40 rounded-sm" /><span className="size-2 bg-gold rounded-sm" /> More</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display text-2xl text-warm mb-4">Knowledge utilization by team</h2>
          <div className="space-y-4">
            {[
              ["Pharma Analytics", 92],
              ["Commercial Strategy", 78],
              ["Delivery", 68],
              ["RWE", 54],
              ["Sales Enablement", 41],
            ].map(([team, pct]) => (
              <div key={team as string}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-warm">{team}</span>
                  <span className="text-gold font-display">{pct}%</span>
                </div>
                <div className="h-2 bg-black/[0.08] rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-gold rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BigChart() {
  const pts = Array.from({ length: 30 }).map((_, i) => 30 + Math.sin(i * 0.4) * 15 + Math.random() * 25 + i * 1.5);
  const max = Math.max(...pts);
  const path = pts.map((p, i) => `${(i / (pts.length - 1)) * 100},${100 - (p / max) * 90}`).join(" L");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-48">
      <defs>
        <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.81 0.14 82 / 0.4)" />
          <stop offset="100%" stopColor="oklch(0.81 0.14 82 / 0)" />
        </linearGradient>
      </defs>
      <path d={`M${path} L100,100 L0,100 Z`} fill="url(#bg)" />
      <path d={`M${path}`} fill="none" stroke="oklch(0.81 0.14 82)" strokeWidth="0.5" />
    </svg>
  );
}
