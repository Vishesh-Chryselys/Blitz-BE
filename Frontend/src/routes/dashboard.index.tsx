import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles, Search, FileText, ArrowRight, Database, Share2, Shield, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const userName = localStorage.getItem("chryselys_name") || "Marcus";

  const CAPABILITIES = [
    {
      icon: Sparkles,
      title: "Interactive Conversational RAG",
      desc: "Query vast institutional silos using semantic search. Get real-time answers complete with confidence scores and slide metadata references.",
      link: "/dashboard/workspace",
      action: "Open Chatbot"
    },
    {
      icon: FileText,
      title: "PowerPoint Slide Deck Generator",
      desc: "Instantly draft investor-grade presentations directly from RAG synthesis. Refines and exports raw .pptx slides for immediate browser download.",
      link: "/dashboard/workspace",
      action: "Create Presentation"
    },
    {
      icon: Database,
      title: "Multi-Source Document Parser",
      desc: "Deep OCR extraction across complex PDFs, PowerPoint decks, Excel sheets, and Word docs. Formulates semantic chunks for vector database upserts.",
      link: "/dashboard/upload",
      action: "View Ingestion Portal"
    },
    {
      icon: Share2,
      title: "SharePoint & Directory Connector",
      desc: "Production-ready pipelines designed to bind directly to corporate SharePoint drives and server directories for automated overnight indexing.",
      link: "/dashboard/upload",
      action: "Manage Data Streams"
    }
  ];

  return (
    <div className="space-y-12 max-w-[1200px] mx-auto py-4">
      {/* Hero Greeting */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 max-w-3xl mx-auto"
      >
        <div className="text-[11px] tracking-[0.25em] text-gold uppercase font-bold mb-2">Chryselys AI Intelligence Suite</div>
        <h1 className="font-display text-5xl text-gradient-warm leading-tight">
          Welcome to BLITZ, {userName}.
        </h1>
        <p className="text-base text-foreground/60 leading-relaxed max-w-2xl mx-auto">
          Simplify complex data workflows. Our advanced RAG capability indexes structured and unstructured data, drafts client-ready collateral, and establishes deep metadata provenance.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <Button asChild variant="hero" className="px-6 h-11 rounded-xl">
            <Link to="/dashboard/workspace">Launch Chat Session <Sparkles className="size-4 ml-1.5" /></Link>
          </Button>
          <Button asChild variant="outlineGold" className="px-6 h-11 rounded-xl">
            <Link to="/dashboard/upload">Setup Ingestion Sources</Link>
          </Button>
        </div>
      </motion.div>

      {/* Capabilities Grid */}
      <div className="space-y-6 pt-6">
        <div className="flex items-baseline justify-between border-b border-border/60 pb-3">
          <h2 className="font-display text-2xl text-warm">Platform Capabilities</h2>
          <span className="text-xs text-foreground/50">4 capabilities integrated</span>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-2xl p-6 hover:border-gold/40 hover:shadow-elegant transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="size-11 rounded-xl bg-gold/10 text-gold flex items-center justify-center mb-4">
                  <cap.icon className="size-5" />
                </div>
                <h3 className="font-display text-xl text-warm mb-2 font-medium">{cap.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed mb-6">{cap.desc}</p>
              </div>
              <Link 
                to={cap.link} 
                className="text-xs text-gold font-medium tracking-wide flex items-center gap-1 group-hover:gap-2 transition-all mt-auto"
              >
                {cap.action} <ArrowRight className="size-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security & Provenance Banner */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-secondary/40 border border-border/80 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6"
      >
        <div className="size-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center shrink-0">
          <Shield className="size-6" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h4 className="font-display text-lg text-warm font-medium">Enterprise Security & SLA Compliance</h4>
          <p className="text-xs text-foreground/50 leading-relaxed mt-1">
            Data indexed inside Blitz is stored exclusively in private tenant vector indices. Answers feature high confidence matching scores with comprehensive point of contact logging to maintain structural visibility.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
