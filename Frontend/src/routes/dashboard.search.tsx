import { createFileRoute } from "@tanstack/react-router";
import { Search, Filter, ShieldCheck, Star } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/dashboard/search")({
  component: SearchPage,
});

const RESULTS = [
  { title: "Oncology Demand Forecasting Q3 2025", dept: "Forecasting", owner: "M. Reyes", conf: 98, updated: "2d", tags: ["ARIMA-X", "Oncology", "Forecast"], badge: "Highly Referenced" },
  { title: "Patient Adherence Benchmarking v4", dept: "Commercial", owner: "A. Singh", conf: 94, updated: "1w", tags: ["Adherence", "RWE"], badge: "Latest Version" },
  { title: "Lab Analytics Outcomes — Northwind", dept: "Life Sciences", owner: "J. Khoury", conf: 91, updated: "3d", tags: ["Lab", "Outcomes"], badge: "Recommended" },
  { title: "Real-World Evidence Pipeline Brief", dept: "RWE", owner: "L. Park", conf: 88, updated: "5d", tags: ["RWE", "Pipeline"], badge: "Verified" },
  { title: "Competitive Intelligence — Q2 Pharma", dept: "Strategy", owner: "K. Vega", conf: 86, updated: "2w", tags: ["CI", "Strategy"], badge: "Verified" },
];

const FILTERS = ["Department", "Owner", "Document Type", "Confidence", "Date Range", "Verified Only"];

function SearchPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <div className="text-[11px] tracking-[0.25em] text-gold uppercase mb-2">Knowledge Search</div>
        <h1 className="font-display text-4xl text-gradient-warm">Semantic enterprise search</h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-2 flex items-center gap-2">
        <Search className="size-4 text-gold ml-2" />
        <input
          defaultValue="oncology forecasting projects"
          className="flex-1 bg-transparent outline-none text-sm h-10 text-warm"
        />
        <button className="px-3 h-9 rounded-lg bg-glass text-xs text-foreground/75 flex items-center gap-1.5 hover:text-gold">
          <Filter className="size-3" /> Filters
        </button>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <aside className="bg-card border border-border rounded-2xl p-5 h-fit space-y-4">
          <div className="text-[10px] uppercase tracking-widest text-gold">Refine</div>
          {FILTERS.map((f) => (
            <div key={f}>
              <div className="text-xs text-warm mb-2">{f}</div>
              <div className="space-y-1.5">
                {["Pharma Analytics", "Commercial", "Strategy"].slice(0, 3).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-[11px] text-foreground/65 cursor-pointer hover:text-warm">
                    <input type="checkbox" className="accent-gold" /> {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <div className="space-y-3">
          <div className="text-xs text-foreground/55 px-1">{RESULTS.length} results · 240ms · semantic + lexical</div>
          {RESULTS.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-5 hover:border-gold/40 hover:shadow-glow transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-[10px] tracking-widest text-gold/80 uppercase mb-1">{r.dept}</div>
                  <div className="text-warm font-medium text-lg">{r.title}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-foreground/50 tracking-widest">CONFIDENCE</div>
                  <div className="text-gold font-display text-2xl">{r.conf}%</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60 mb-3">
                <span>{r.owner}</span>
                <span className="size-1 rounded-full bg-foreground/30" />
                <span>Updated {r.updated} ago</span>
                <span className="size-1 rounded-full bg-foreground/30" />
                <span className="flex items-center gap-1 text-gold/90"><ShieldCheck className="size-3" /> Verified</span>
                <span className="flex items-center gap-1 text-gold/80"><Star className="size-3" /> 24 references</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {r.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-foreground/70">{t}</span>
                  ))}
                </div>
                <span className="text-[10px] tracking-widest text-gold uppercase border border-gold/30 rounded-full px-2 py-0.5">{r.badge}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
