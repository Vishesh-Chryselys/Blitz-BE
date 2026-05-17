import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle2, Loader2, Sparkles, Layers, Database, Zap } from "lucide-react";

export const Route = createFileRoute("/dashboard/upload")({
  component: UploadPage,
});

const FILES = [
  { name: "Q3_Oncology_Forecast.pptx", size: "8.2 MB", stage: "Indexing", progress: 92 },
  { name: "Northwind_Lab_Outcomes.pdf", size: "4.1 MB", stage: "Embedding", progress: 71 },
  { name: "Adherence_Cohort_Analysis.xlsx", size: "2.4 MB", stage: "Chunking", progress: 48 },
  { name: "RWE_Pipeline_Brief.docx", size: "1.8 MB", stage: "Done", progress: 100 },
];

const PIPELINE = [
  { icon: FileText, label: "Parse", desc: "OCR + structure" },
  { icon: Layers, label: "Chunk", desc: "Semantic boundaries" },
  { icon: Database, label: "Embed", desc: "Vector indexing" },
  { icon: Sparkles, label: "Enrich", desc: "Metadata + entities" },
  { icon: Zap, label: "Serve", desc: "Live retrieval" },
];

function UploadPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <div className="text-[11px] tracking-[0.25em] text-gold uppercase mb-2">Upload Center</div>
        <h1 className="font-display text-4xl text-gradient-warm">Ingest enterprise knowledge</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-dashed border-gold/30 rounded-2xl p-12 text-center hover:border-gold/60 transition-all relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative">
          <div className="size-16 rounded-2xl bg-gradient-gold mx-auto flex items-center justify-center mb-4 shadow-gold">
            <Upload className="size-7 text-primary-foreground" />
          </div>
          <div className="font-display text-2xl text-warm mb-2">Drop files or paste a SharePoint URL</div>
          <p className="text-sm text-foreground/60 mb-5">PDF · PPTX · DOCX · XLSX · SharePoint · Confluence · Box</p>
          <div className="flex items-center justify-center gap-2">
            <button className="bg-gradient-gold text-primary-foreground rounded-full px-5 h-10 text-sm font-medium shadow-gold">Browse files</button>
            <button className="bg-glass rounded-full px-5 h-10 text-sm text-foreground/80 hover:text-gold">Connect a source</button>
          </div>
        </div>
      </motion.div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-display text-2xl text-warm mb-4">Ingestion Pipeline</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {PIPELINE.map((p, i) => (
            <div key={p.label} className="flex items-center gap-2 shrink-0 min-w-fit">
              <div className="bg-glass rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="size-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                  <p.icon className="size-4" />
                </div>
                <div>
                  <div className="text-sm text-warm">{p.label}</div>
                  <div className="text-[10px] text-foreground/55">{p.desc}</div>
                </div>
              </div>
              {i < PIPELINE.length - 1 && (
                <motion.div className="h-px w-8 bg-gradient-to-r from-gold/40 to-gold/20"
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.15 }} style={{ transformOrigin: "left" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-warm">Active ingestions</h2>
          <span className="text-xs text-foreground/55">4 in pipeline · 12,481 indexed total</span>
        </div>
        <div className="space-y-3">
          {FILES.map((f, i) => (
            <motion.div key={f.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-background/40 border border-border/60">
              <div className="size-10 rounded-lg bg-glass flex items-center justify-center text-gold shrink-0">
                <FileText className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4 mb-2">
                  <div>
                    <div className="text-warm text-sm truncate">{f.name}</div>
                    <div className="text-[11px] text-foreground/50">{f.size} · {f.stage}</div>
                  </div>
                  <div className="text-gold font-display text-lg shrink-0">{f.progress}%</div>
                </div>
                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-gold rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${f.progress}%` }} transition={{ duration: 1.2 }} />
                </div>
              </div>
              <div className="shrink-0">
                {f.stage === "Done" ? <CheckCircle2 className="size-5 text-gold" /> : <Loader2 className="size-5 text-gold animate-spin" />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
