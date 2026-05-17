import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileText, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/case-studies")({
  component: CaseStudies,
});

const CASES = [
  { title: "Northwind reduced oncology forecast variance by 41%", client: "Northwind Pharma", capability: "Forecasting", date: "Mar 2026", impact: "41% variance ↓", featured: true },
  { title: "Adherence cohort segmentation drives 22pt lift", client: "Atlas Bio", capability: "RWE", date: "Feb 2026", impact: "22pt ↑" },
  { title: "Lab outcomes synthesis cuts cycle time 60%", client: "Meridian", capability: "Lab Analytics", date: "Feb 2026", impact: "60% faster" },
  { title: "Real-world evidence pipeline at scale", client: "Vantage", capability: "RWE", date: "Jan 2026", impact: "3.2× reuse" },
  { title: "Competitive intelligence as a continuous service", client: "Obelisk", capability: "Strategy", date: "Jan 2026", impact: "12 wins" },
  { title: "Patient adherence benchmarking framework", client: "Lattice AI", capability: "Commercial", date: "Dec 2025", impact: "+18% NPS" },
];

function CaseStudies() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[11px] tracking-[0.25em] text-gold uppercase mb-2">Case Studies</div>
          <h1 className="font-display text-4xl text-gradient-warm">Investor-grade synthesis</h1>
          <p className="text-foreground/60 mt-2">AI-generated, SME-verified, proposal-ready.</p>
        </div>
        <Button asChild variant="hero"><Link to="/dashboard/workspace"><Sparkles className="size-4" /> Generate New</Link></Button>
      </div>

      {/* Featured */}
      {CASES.filter((c) => c.featured).map((c) => (
        <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-teal border border-gold/30 rounded-2xl p-8 overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-[10px] tracking-widest text-gold uppercase mb-3">Featured Case</div>
              <h2 className="font-display text-3xl text-gradient-warm leading-tight mb-4">{c.title}</h2>
              <p className="text-sm text-foreground/70 leading-relaxed mb-5">
                Auto-synthesized from 8 decks, 14 datasets, and 3 SME interviews — every claim provenance-linked.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="text-xs px-3 py-1 rounded-full bg-black/5 border border-black/10 text-foreground/80">{c.client}</span>
                <span className="text-xs px-3 py-1 rounded-full bg-black/5 border border-black/10 text-foreground/80">{c.capability}</span>
                <span className="text-xs px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center gap-1"><ShieldCheck className="size-3" /> Verified</span>
              </div>
              <Button variant="hero">Open <ArrowRight /></Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[["Variance ↓", "41%"], ["Cycle ↓", "60%"], ["Reuse ↑", "3.2×"], ["NPS", "+18"], ["Sources", "25"], ["SMEs", "3"]].map(([k, v]) => (
                <div key={k} className="bg-background/40 backdrop-blur rounded-lg p-3 border border-border/60">
                  <div className="text-[10px] uppercase tracking-widest text-foreground/50">{k}</div>
                  <div className="font-display text-xl text-gradient-gold mt-1">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CASES.filter((c) => !c.featured).map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-5 hover:border-gold/40 hover:shadow-glow transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="size-10 rounded-lg bg-glass flex items-center justify-center text-gold">
                <FileText className="size-4" />
              </div>
              <span className="text-[10px] tracking-widest text-gold/80 uppercase">{c.capability}</span>
            </div>
            <div className="text-warm font-medium leading-snug mb-3">{c.title}</div>
            <div className="text-xs text-foreground/55 mb-4">{c.client} · {c.date}</div>
            <div className="flex items-center justify-between pt-3 border-t border-border/60">
              <span className="text-[10px] tracking-widest text-foreground/50 uppercase">Impact</span>
              <span className="font-display text-lg text-gradient-gold">{c.impact}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
