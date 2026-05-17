import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 bg-gradient-gold rounded-md rotate-45 group-hover:rotate-[225deg] transition-transform duration-700" />
        <div className="absolute inset-[3px] bg-background rounded-sm rotate-45" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 0L8.5 5.5L14 7L8.5 8.5L7 14L5.5 8.5L0 7L5.5 5.5L7 0Z" fill="url(#g)" />
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="14" y2="14">
                <stop stopColor="oklch(0.88 0.09 88)" />
                <stop offset="1" stopColor="oklch(0.66 0.13 70)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[15px] font-semibold tracking-[0.2em] text-warm">BLITZ</span>
        <span className="text-[9px] tracking-[0.25em] text-gold/70 mt-0.5">INTELLIGENCE</span>
      </div>
    </Link>
  );
}
