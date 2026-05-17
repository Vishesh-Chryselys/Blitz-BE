import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, Layers, Maximize2 } from "lucide-react";

export const Route = createFileRoute("/dashboard/graph")({
  component: GraphPage,
});

function GraphPage() {
  const center = { x: 50, y: 50 };
  const r1 = Array.from({ length: 8 }).map((_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return { x: 50 + Math.cos(a) * 18, y: 50 + Math.sin(a) * 18, label: ["Forecast", "RWE", "Adherence", "Strategy", "Decks", "KPIs", "SMEs", "Datasets"][i] };
  });
  const r2 = Array.from({ length: 24 }).map((_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const rad = 32 + (i % 3) * 4;
    return { x: 50 + Math.cos(a) * rad, y: 50 + Math.sin(a) * rad };
  });

  return (
    <div className="space-y-6 max-w-[1500px]">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.25em] text-gold uppercase mb-2">Knowledge Graph</div>
          <h1 className="font-display text-4xl text-gradient-warm">Northwind Pharma · Living graph</h1>
          <p className="text-foreground/60 mt-2">Traverse semantic relationships across clients, projects, datasets, SMEs, and capabilities.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-glass rounded-lg px-3 h-9 text-xs flex items-center gap-2 text-foreground/75 hover:text-gold">
            <Layers className="size-3.5" /> Layers
          </button>
          <button className="bg-glass rounded-lg px-3 h-9 text-xs flex items-center gap-2 text-foreground/75 hover:text-gold">
            <Maximize2 className="size-3.5" /> Fullscreen
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden aspect-square lg:aspect-auto lg:h-[640px]">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="absolute top-4 left-4 bg-glass rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
            <Search className="size-3 text-gold" /> Filter graph…
          </div>
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
            <defs>
              <radialGradient id="cg2"><stop offset="0%" stopColor="oklch(0.88 0.09 88)" /><stop offset="100%" stopColor="oklch(0.66 0.13 70)" /></radialGradient>
              <filter id="g2"><feGaussianBlur stdDeviation="0.5" /></filter>
            </defs>
            {r2.map((n, i) => (
              <line key={i} x1={r1[i % 8].x} y1={r1[i % 8].y} x2={n.x} y2={n.y} stroke="oklch(0.81 0.14 82 / 0.12)" strokeWidth="0.1" />
            ))}
            {r1.map((n, i) => (
              <motion.line
                key={i}
                x1={center.x} y1={center.y} x2={n.x} y2={n.y}
                stroke="oklch(0.81 0.14 82 / 0.5)" strokeWidth="0.2"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: i * 0.05 }}
              />
            ))}
            {r2.map((n, i) => (
              <motion.circle key={i} cx={n.x} cy={n.y} r="0.7"
                fill="oklch(0.62 0.1 200)" stroke="oklch(0.81 0.14 82 / 0.6)" strokeWidth="0.08"
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.02 }} />
            ))}
            {r1.map((n, i) => (
              <motion.g key={n.label} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }} style={{ transformOrigin: `${n.x}px ${n.y}px` }}>
                <circle cx={n.x} cy={n.y} r="2.4" fill="oklch(0.32 0.06 200)" stroke="oklch(0.81 0.14 82)" strokeWidth="0.25" filter="url(#g2)" />
                <text x={n.x} y={n.y + 4.8} textAnchor="middle" fontSize="1.5" fill="oklch(0.92 0.02 85 / 0.85)">{n.label}</text>
              </motion.g>
            ))}
            <motion.circle cx={center.x} cy={center.y} r="6" fill="url(#cg2)" animate={{ r: [6, 7, 6] }} transition={{ duration: 2.5, repeat: Infinity }} />
            <text x={center.x} y={center.y + 1.2} textAnchor="middle" fontSize="2.5" fontWeight="700" fill="oklch(0.18 0.035 210)">N</text>
          </svg>
        </div>

        <aside className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-widest text-gold mb-3">Selected node</div>
            <div className="font-display text-2xl text-warm">Forecast</div>
            <p className="text-xs text-foreground/60 mt-2">Capability hub — 12 projects, 47 datasets, 8 SMEs.</p>
            <div className="mt-4 space-y-2">
              {[["Direct links", "31"], ["Reusable insights", "108"], ["Avg confidence", "94%"]].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-border/50 pb-2 last:border-0">
                  <span className="text-xs text-foreground/60">{k}</span>
                  <span className="font-display text-base text-gradient-gold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="text-[10px] uppercase tracking-widest text-gold mb-3">Adjacent nodes</div>
            {["RWE Pipeline", "ARIMA-X Models", "Cohort Analysis", "Adherence KPI", "M. Reyes (SME)"].map((n) => (
              <div key={n} className="flex items-center gap-2 py-2 text-sm text-foreground/80 border-b border-border/50 last:border-0 hover:text-gold cursor-pointer">
                <span className="size-1.5 rounded-full bg-gold/60" /> {n}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
