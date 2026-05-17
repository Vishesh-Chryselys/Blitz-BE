import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home, Sparkles, Upload, ChevronDown, Activity, Bell, Plus, Search, ArrowRight
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
  { to: "/dashboard", label: "Capabilities Overview", icon: Home, exact: true },
  { to: "/dashboard/workspace", label: "AI Chat Workspace", icon: Sparkles },
  { to: "/dashboard/upload", label: "Managed Data Sources", icon: Upload },
];

function DashboardLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Onboarding state
  const [userName, setUserName] = useState(() => localStorage.getItem("chryselys_name") || "");
  const [userChryselysId, setUserChryselysId] = useState(() => localStorage.getItem("chryselys_id") || "");
  const [showOnboarding, setShowOnboarding] = useState(!userName || !userChryselysId);
  
  const [nameInput, setNameInput] = useState("");
  const [idInput, setIdInput] = useState("");

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !idInput.trim()) return;

    localStorage.setItem("chryselys_name", nameInput.trim());
    localStorage.setItem("chryselys_id", idInput.trim());
    
    setUserName(nameInput.trim());
    setUserChryselysId(idInput.trim());
    setShowOnboarding(false);

    // Refresh pages to ensure sub-routes fetch correct details instantly
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex bg-background relative">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-sidebar-border">
          <Logo />
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <div className="text-[10px] tracking-[0.25em] text-gold/70 uppercase px-3 py-2">Enterprise Engine</div>
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative ${
                  active
                    ? "bg-gold/10 text-gold border border-gold/20 font-medium"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 border border-transparent"
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 bg-gold rounded-r-full" />}
                <item.icon className="size-4 shrink-0 text-gold" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="bg-glass rounded-lg p-3">
            <div className="flex items-center gap-2 text-[10px] text-gold uppercase tracking-widest mb-2 font-semibold">
              <Activity className="size-3" /> Active Index
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground/70">12,481 docs live</span>
              <span className="size-1.5 rounded-full bg-gold pulse-gold" />
            </div>
            <div className="mt-2 h-1 bg-black/10 rounded-full overflow-hidden">
              <div className="h-full w-[78%] bg-gradient-gold" />
            </div>
          </div>
          
          <button 
            onClick={() => {
              if (confirm("Would you like to reset your Chryselys identity?")) {
                localStorage.removeItem("chryselys_name");
                localStorage.removeItem("chryselys_id");
                window.location.reload();
              }
            }}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors cursor-pointer group"
            title="Reset identity"
          >
            <div className="size-8 rounded-full bg-gradient-gold shrink-0 flex items-center justify-center font-display text-[10px] text-primary-foreground font-semibold">
              {(userName || "MC").split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-xs text-warm truncate font-medium group-hover:text-gold transition-colors">{userName || "M. Chen"}</div>
              <div className="text-[9px] text-foreground/50 truncate">ID: {userChryselysId || "C-12481"} · Chryselys</div>
            </div>
            <ChevronDown className="size-3.5 text-foreground/50" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-4 px-8 h-16">
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gold" />
              <input
                type="text"
                placeholder="Search resources, documents, index logs..."
                className="w-full bg-glass rounded-full pl-10 pr-4 h-10 text-sm placeholder:text-foreground/45 focus:outline-none focus:border-gold/40 text-warm"
              />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="bg-glass rounded-full px-3.5 h-10 flex items-center gap-2 text-xs font-medium">
                <span className="size-1.5 rounded-full bg-gold pulse-gold" />
                <span className="text-foreground/75">Enterprise Sync Active</span>
              </div>
            </div>
          </div>
        </header>
        <main className="p-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Onboarding Modal Overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-gold/40 rounded-3xl p-8 max-w-md w-full mx-4 shadow-elegant text-center relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-gold" />
            <div className="size-16 rounded-2xl bg-gradient-gold mx-auto flex items-center justify-center mb-6 shadow-gold">
              <Sparkles className="size-8 text-primary-foreground" />
            </div>
            
            <h2 className="font-display text-3xl text-gradient-warm leading-tight mb-2">Welcome to BLITZ</h2>
            <p className="text-sm text-foreground/60 mb-6">Enter your Chryselys credentials to initialize your secure AI Knowledge Engine session.</p>

            <form onSubmit={handleOnboardingSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs uppercase tracking-widest text-foreground/50 mb-1.5 font-medium">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Chen"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-warm outline-none focus:border-gold/50 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-foreground/50 mb-1.5 font-medium">Chryselys Employee ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C-12841"
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-warm outline-none focus:border-gold/50 transition-colors"
                />
              </div>

              <button 
                type="submit"
                className="w-full h-11 rounded-xl bg-gradient-gold text-primary-foreground font-medium tracking-wide mt-6 hover:shadow-glow hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Initialize Workspace <ArrowRight className="size-4" />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
