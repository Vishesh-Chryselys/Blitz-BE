import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Database,
  FileText,
  Network,
  Play,
  Search,
  ShieldCheck,
  UploadCloud,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/blitz/Footer";
import { HeroVisual } from "@/components/blitz/HeroVisual";
import { Nav } from "@/components/blitz/Nav";
import { SectionHeading } from "@/components/blitz/SectionHeading";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden font-sans">
      <AmbientBackdrop />
      <Nav />

      <main className="relative z-10">
        <section className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 pb-16 pt-32 lg:grid-cols-[0.95fr_1.05fr] lg:pt-24">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-glass px-3 py-1 text-xs text-foreground/75"
            >
              <span className="size-2 rounded-full bg-gold pulse-gold" />
              v2.0 Semantic Retrieval Engine is Live
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display text-5xl font-semibold leading-tight text-warm md:text-7xl"
            >
              From content chaos to <span className="text-gradient-gold">instant access.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg lg:mx-0"
            >
              BLITZ turns siloed decks, documents, SharePoint libraries, and project intelligence into a conversational sales enablement workspace with verified citations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-10 flex flex-wrap justify-center gap-4 lg:justify-start"
            >
              <Button asChild size="lg" variant="hero" className="h-12 px-8">
                <Link to="/dashboard">Launch Workspace <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outlineGold" className="h-12 px-8 bg-glass">
                <Link to="/dashboard/workspace"><Play className="mr-2 size-4" /> Try the RAG Chat</Link>
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="min-w-0"
          >
            <HeroVisual />
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-24">
          <SectionHeading
            eyebrow="Platform"
            title={<>One workspace for retrieval, synthesis, and reusable collateral.</>}
            description="Each workflow is built around the way delivery and sales teams actually search: by client, objective, use case, data source, and prior project outcome."
            align="center"
          />

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon={<Search className="size-5" />}
              title="Intent-Based Retrieval"
              desc="Ask natural questions and retrieve relevant slides, case studies, datasets, and proposal assets without brittle keyword searching."
            />
            <FeatureCard
              icon={<UploadCloud className="size-5" />}
              title="SOW Context Upload"
              desc="Attach a client brief or SOW and BLITZ uses it as live context to find matching internal capabilities."
            />
            <FeatureCard
              icon={<FileText className="size-5" />}
              title="Instant PPT Generation"
              desc="Convert a cited RAG synthesis into a client-ready deck draft for faster proposal and enablement cycles."
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <SectionHeading
              eyebrow="Why BLITZ"
              title={<>Designed for enterprise knowledge that keeps moving.</>}
              description="The landing page now renders the Lovable component system instead of leaving those components unused in the tree."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard icon={<Database />} label="Indexed Sources" value="SharePoint, decks, PDFs, XLSX" />
              <MetricCard icon={<Network />} label="Provenance" value="Citations with source metadata" />
              <MetricCard icon={<ShieldCheck />} label="Trust Layer" value="Confidence and POC visibility" />
              <MetricCard icon={<Zap />} label="Output" value="RAG answers and deck drafts" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      className="rounded-xl border border-border bg-glass p-6 shadow-elegant transition-colors hover:bg-secondary/40"
    >
      <div className="size-10 rounded-lg bg-secondary flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      className="rounded-xl border border-border bg-card p-5 shadow-elegant"
    >
      <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
        {icon}
      </div>
      <div className="text-[11px] uppercase tracking-[0.22em] text-gold/80">{label}</div>
      <div className="mt-2 text-sm font-semibold text-warm">{value}</div>
    </motion.div>
  );
}

function AmbientBackdrop() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 grid-pattern opacity-[0.15]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
    </div>
  );
}
