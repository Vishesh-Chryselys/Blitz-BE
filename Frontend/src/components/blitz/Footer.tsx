import { Logo } from "./Logo";

export function Footer() {
  const cols = [
    { title: "Platform", links: ["Intelligence Engine", "Knowledge Graph", "Workspace", "Analytics", "Integrations"] },
    { title: "Solutions", links: ["Sales Enablement", "Delivery Teams", "Proposal Intelligence", "Case Studies", "Executive Insights"] },
    { title: "Company", links: ["About", "Customers", "Security", "Careers", "Press"] },
    { title: "Resources", links: ["Documentation", "API", "Changelog", "Trust Center", "Contact"] },
  ];
  return (
    <footer className="relative border-t border-border/50 mt-32 pt-20 pb-10 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 hairline" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-16">
          <div className="col-span-2">
            <Logo />
            <p className="mt-6 text-sm text-muted-foreground max-w-xs leading-relaxed">
              The semantic intelligence layer for modern enterprises. Turn organizational knowledge into competitive advantage.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs text-gold/80">
              <span className="size-1.5 rounded-full bg-gold pulse-gold" /> All systems operational
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-[11px] uppercase tracking-[0.2em] text-gold/80 mb-4">{c.title}</h4>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a className="text-sm text-foreground/70 hover:text-warm transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="hairline mb-8" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>© 2026 Blitz Intelligence, Inc. — A Chryselys company.</div>
          <div className="flex items-center gap-6">
            <a className="hover:text-warm">Privacy</a>
            <a className="hover:text-warm">Terms</a>
            <a className="hover:text-warm">SOC 2 Type II</a>
            <a className="hover:text-warm">HIPAA</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
