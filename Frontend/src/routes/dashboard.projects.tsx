import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FolderKanban, Users, Calendar } from "lucide-react";

export const Route = createFileRoute("/dashboard/projects")({
  component: Projects,
});

const PROJECTS = [
  { name: "Oncology Forecast 2026", client: "Northwind Pharma", status: "Active", progress: 78, team: 6, due: "Apr 12" },
  { name: "Adherence Benchmark v5", client: "Atlas Bio", status: "Active", progress: 54, team: 4, due: "Apr 28" },
  { name: "Lab Outcomes Engine", client: "Meridian", status: "Review", progress: 92, team: 5, due: "Mar 30" },
  { name: "RWE Pipeline 2.0", client: "Vantage", status: "Active", progress: 41, team: 8, due: "May 15" },
  { name: "Competitive Intelligence Service", client: "Obelisk", status: "Discovery", progress: 18, team: 3, due: "Jun 02" },
  { name: "Cohort Synthesis API", client: "Lattice AI", status: "Active", progress: 67, team: 4, due: "Apr 19" },
];

function Projects() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <div className="text-[11px] tracking-[0.25em] text-gold uppercase mb-2">Projects</div>
        <h1 className="font-display text-4xl text-gradient-warm">Active engagements</h1>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROJECTS.map((p, i) => (
          <motion.div key={p.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-5 hover:border-gold/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="size-10 rounded-lg bg-glass flex items-center justify-center text-gold">
                <FolderKanban className="size-4" />
              </div>
              <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${
                p.status === "Active" ? "border-gold/40 text-gold bg-gold/10"
                : p.status === "Review" ? "border-teal/60 text-foreground/80"
                : "border-border text-foreground/60"
              }`}>{p.status}</span>
            </div>
            <div className="text-warm font-medium text-lg leading-snug mb-1">{p.name}</div>
            <div className="text-xs text-foreground/55 mb-4">{p.client}</div>

            <div className="mb-4">
              <div className="flex justify-between text-[11px] text-foreground/55 mb-1.5">
                <span>Progress</span><span className="text-gold">{p.progress}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-gold rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ duration: 1 }} />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-foreground/55 pt-3 border-t border-border/60">
              <span className="flex items-center gap-1.5"><Users className="size-3" /> {p.team}</span>
              <span className="flex items-center gap-1.5"><Calendar className="size-3" /> {p.due}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
