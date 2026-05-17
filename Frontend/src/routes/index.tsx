import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, FileText, ArrowRight, UploadCloud, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <AmbientBackdrop />
      
      {/* Simple Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="font-display text-xl tracking-tight font-bold">KNOWLEDGE ENGINE</div>
        <Button asChild variant="outline" className="border-border text-foreground hover:bg-secondary">
          <Link to="/dashboard">Go to Platform</Link>
        </Button>
      </header>

      {/* Hero Section */}
      <main className="relative pt-40 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs mb-8"
        >
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          <span>v2.0 Semantic Retrieval Engine is Live</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl font-display font-semibold tracking-tighter leading-tight max-w-4xl"
        >
          From content chaos to <span className="text-gradient">instant access.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl"
        >
          An AI-Powered Knowledge Engine for Sales Enablement. Stop searching across siloed decks and drives. Use conversational intent to instantly retrieve, summarize, and generate verified collateral.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8">
            <Link to="/dashboard">Launch Workspace <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-8 border-border bg-glass hover:bg-secondary">
            <Link to="/dashboard"><Play className="mr-2 size-4" /> Watch Demo</Link>
          </Button>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-32 w-full grid md:grid-cols-3 gap-6 text-left"
        >
          <FeatureCard 
            icon={<Search className="size-5" />}
            title="Intent-Based Retrieval"
            desc="Conversational AI understands what you need, bypassing keyword limitations to find the exact slide or dataset."
          />
          <FeatureCard 
            icon={<UploadCloud className="size-5" />}
            title="SOW Context Upload"
            desc="Upload a Statement of Work or Client Email. The engine automatically synthesizes requirements and fetches matching collateral."
          />
          <FeatureCard 
            icon={<FileText className="size-5" />}
            title="Instant PPT Generation"
            desc="Transform synthesized answers into clean, investor-grade presentation slides with a single click."
          />
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="bg-glass border border-border p-6 rounded-xl hover:bg-secondary/40 transition-colors">
      <div className="size-10 rounded-lg bg-secondary flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function AmbientBackdrop() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 grid-pattern opacity-[0.15]" />
    </div>
  );
}
