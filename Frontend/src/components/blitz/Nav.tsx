import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export function Nav() {
  const items = [
    { label: "Platform", to: "/" },
    { label: "Intelligence", to: "/" },
    { label: "Knowledge Graph", to: "/dashboard/graph" },
    { label: "Pricing", to: "/" },
    { label: "Docs", to: "/" },
  ];
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto mt-4 max-w-7xl px-4">
        <div className="bg-glass shadow-elegant rounded-full px-3 pl-5 py-2 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-1 text-[13px] text-foreground/75">
            {items.map((i) => (
              <Link
                key={i.label}
                to={i.to}
                className="px-3.5 py-1.5 rounded-full hover:text-warm hover:bg-white/5 transition-colors"
              >
                {i.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="text-[13px] text-foreground/70 hover:text-warm hidden sm:inline px-3">
              Sign in
            </Link>
            <Button asChild variant="hero" size="sm" className="rounded-full">
              <Link to="/dashboard">
                Launch Workspace <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
