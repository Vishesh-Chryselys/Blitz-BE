import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Home, Search, Sparkles, FileText, FolderKanban, Network, BarChart3,
  Upload, Settings, Bell, Plus, ChevronDown, Activity,
} from "lucide-react";
import { Logo } from "@/components/blitz/Logo";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "BLITZ Workspace — Enterprise Intelligence" },
      { name: "description", content: "BLITZ enterprise AI dashboard for semantic retrieval, knowledge graphs, and proposal intelligence." },
    ],
  }),
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home, exact: true },
  { to: "/dashboard/search", label: "Knowledge Search", icon: Search },
  { to: "/dashboard/workspace", label: "AI Workspace", icon: Sparkles },
  { to: "/dashboard/case-studies", label: "Case Studies", icon: FileText },
  { to: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { to: "/dashboard/graph", label: "Knowledge Graph", icon: Network },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/upload", label: "Upload Center", icon: Upload },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function DashboardLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-sidebar-border">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <div className="text-[10px] tracking-[0.25em] text-gold/70 uppercase px-3 py-2">Workspace</div>
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all relative ${
                  active
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 border border-transparent"
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-gold rounded-r-full" />}
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="bg-glass rounded-lg p-3">
            <div className="flex items-center gap-2 text-[10px] text-gold uppercase tracking-widest mb-2">
              <Activity className="size-3" /> AI Sync
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/70">12,481 docs</span>
              <span className="size-1.5 rounded-full bg-gold pulse-gold" />
            </div>
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-[78%] bg-gradient-gold" />
            </div>
            <div className="text-[10px] text-foreground/50 mt-1.5">Indexed 2m ago</div>
          </div>
          <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
            <div className="size-8 rounded-full bg-gradient-gold shrink-0" />
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs text-warm truncate">M. Chen</div>
              <div className="text-[10px] text-foreground/50 truncate">Chryselys · Pharma</div>
            </div>
            <ChevronDown className="size-3.5 text-foreground/50" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-4 px-8 h-16">
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gold" />
              <input
                type="text"
                placeholder="Ask BLITZ anything…"
                className="w-full bg-glass rounded-full pl-10 pr-4 h-10 text-sm placeholder:text-foreground/40 focus:outline-none focus:border-gold/40"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-foreground/40 tracking-widest">⌘ K</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className="size-10 rounded-full bg-glass hover:bg-white/10 flex items-center justify-center text-foreground/70">
                <Plus className="size-4" />
              </button>
              <button className="size-10 rounded-full bg-glass hover:bg-white/10 flex items-center justify-center text-foreground/70 relative">
                <Bell className="size-4" />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-gold" />
              </button>
              <div className="bg-glass rounded-full px-3 h-10 flex items-center gap-2 text-xs">
                <span className="size-1.5 rounded-full bg-gold pulse-gold" />
                <span className="text-foreground/70">Indexing live</span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
