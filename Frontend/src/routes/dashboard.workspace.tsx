import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, FileText, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/workspace")({
  component: Workspace,
});

type Msg = { role: "user" | "ai"; content: string; cards?: any[] };

const seed: Msg[] = [
  { role: "user", content: "Generate a case study from our Northwind oncology forecasting work." },
  {
    role: "ai",
    content: "Synthesizing across 8 decks, 14 datasets and 3 SME interviews. Confidence high — primary sources verified.",
    cards: [
      { title: "Oncology Demand Forecast Model — Northwind", dept: "Forecasting", owner: "M. Reyes", conf: 98, tags: ["ARIMA-X", "Oncology"] },
      { title: "Outcomes Synthesis — Patient Cohort 2024", dept: "RWE", owner: "J. Khoury", conf: 93, tags: ["RWE", "Cohort"] },
    ],
  },
];

function Workspace() {
  const [msgs, setMsgs] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMsgs((m) => [...m, { role: "user", content: input }]);
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [...m, {
        role: "ai",
        content: "Retrieving across enterprise repositories…",
        cards: [
          { title: "Competitive Intelligence — Adherence Q2", dept: "Strategy", owner: "A. Singh", conf: 96, tags: ["CI", "Adherence"] },
        ],
      }]);
    }, 600);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 max-w-[1500px] h-[calc(100vh-9rem)]">
      <div className="bg-card border border-border rounded-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[0.25em] text-gold uppercase">Conversational Retrieval</div>
            <div className="text-warm font-display text-xl">AI Workspace</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground/60">
            <Zap className="size-3.5 text-gold" /> 240ms · 12 sources live
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {msgs.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "ai" && (
                <div className="size-8 rounded-full bg-gradient-gold flex items-center justify-center shrink-0">
                  <Sparkles className="size-3.5 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-2xl space-y-3 ${m.role === "user" ? "" : "flex-1"}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-gradient-gold text-primary-foreground"
                    : "bg-glass text-warm"
                }`}>
                  {m.content}
                </div>
                {m.cards?.map((c) => (
                  <div key={c.title} className="bg-card border border-border rounded-xl p-4 hover:border-gold/40 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-[10px] tracking-widest text-gold/80 uppercase">{c.dept}</div>
                        <div className="text-warm font-medium mt-0.5">{c.title}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-gold font-display text-2xl leading-none">{c.conf}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground/55 mb-3">
                      {c.owner} · <span className="flex items-center gap-1 text-gold/90"><ShieldCheck className="size-3" /> Verified</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {c.tags.map((t: string) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-foreground/70">{t}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {["Open", "Preview", "Generate Summary", "One-Slider", "Cite Sources"].map((a) => (
                        <button key={a} className="text-[11px] px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-gold/10 hover:text-gold border border-border text-foreground/75 transition-colors">
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <div className="bg-glass rounded-2xl p-2 flex items-center gap-2">
            <Sparkles className="size-4 text-gold ml-2" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask BLITZ anything across your enterprise…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-foreground/40"
            />
            <Button variant="hero" size="sm" onClick={send}><Send className="size-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* Insight panel */}
      <div className="space-y-4 overflow-y-auto">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-[10px] tracking-widest text-gold uppercase mb-3">Executive Summary</div>
          <p className="text-sm text-warm leading-relaxed">
            Northwind reduced oncology forecast variance by <span className="text-gradient-gold font-semibold">41%</span> by
            integrating ARIMA-X with real-world adherence data over a 9-month engagement.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-[10px] tracking-widest text-gold uppercase mb-3">Key KPIs</div>
          {[
            ["Variance reduction", "41%"],
            ["Forecast accuracy", "+22pts"],
            ["Cycle time", "-60%"],
            ["Reuse multiplier", "3.2×"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between border-b border-border/50 py-2 last:border-0">
              <span className="text-xs text-foreground/65">{k}</span>
              <span className="font-display text-lg text-gradient-gold">{v}</span>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="text-[10px] tracking-widest text-gold uppercase mb-3">Reusable Insights</div>
          {["ARIMA-X + RWE blend pattern", "Adherence cohort segmentation", "Forecast governance template"].map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs text-foreground/80 py-1.5 border-b border-border/50 last:border-0">
              <FileText className="size-3 text-gold" /> {s}
            </div>
          ))}
        </div>

        <Button variant="hero" className="w-full">
          Generate One-Slider <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
