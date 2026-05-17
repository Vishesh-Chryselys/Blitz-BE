import { motion } from "framer-motion";

const NODES = [
  { x: 50, y: 50, r: 6, label: "BLITZ", core: true },
  { x: 22, y: 28, r: 3.5, label: "Oncology" },
  { x: 78, y: 24, r: 3.5, label: "Pharma" },
  { x: 14, y: 62, r: 3, label: "CRM" },
  { x: 86, y: 70, r: 4, label: "SharePoint" },
  { x: 34, y: 82, r: 3, label: "Decks" },
  { x: 66, y: 84, r: 3, label: "Datasets" },
  { x: 30, y: 18, r: 2.5, label: "KPI" },
  { x: 70, y: 14, r: 2.5, label: "SME" },
  { x: 8, y: 44, r: 2.5, label: "Cases" },
  { x: 92, y: 46, r: 2.5, label: "Forecast" },
  { x: 50, y: 8, r: 2.5, label: "Insights" },
  { x: 50, y: 92, r: 2.5, label: "Proposals" },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
  [0, 7], [0, 8], [0, 9], [0, 10], [0, 11], [0, 12],
  [1, 7], [2, 8], [3, 9], [4, 10], [1, 5], [2, 6],
];

export function HeroVisual() {
  return (
    <div className="relative w-full aspect-[16/10] max-w-5xl mx-auto">
      {/* Glow halo */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal/30 via-transparent to-gold/20 blur-3xl rounded-full" />

      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="coreG" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="oklch(0.88 0.09 88)" />
            <stop offset="60%" stopColor="oklch(0.78 0.14 82)" />
            <stop offset="100%" stopColor="oklch(0.5 0.1 70)" />
          </radialGradient>
          <linearGradient id="lineG" x1="0" x2="1">
            <stop offset="0%" stopColor="oklch(0.81 0.14 82 / 0.6)" />
            <stop offset="100%" stopColor="oklch(0.62 0.1 200 / 0.4)" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="0.6" /></filter>
        </defs>

        {/* Concentric rings */}
        {[18, 30, 42].map((r, i) => (
          <motion.circle
            key={r}
            cx="50" cy="50" r={r}
            fill="none"
            stroke="oklch(0.81 0.14 82 / 0.12)"
            strokeWidth="0.15"
            strokeDasharray="0.8 1.2"
            initial={{ rotate: 0 }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: 60 + i * 20, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "50px 50px" }}
          />
        ))}

        {/* Edges */}
        {EDGES.map(([a, b], i) => {
          const A = NODES[a], B = NODES[b];
          return (
            <motion.line
              key={i}
              x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              stroke="url(#lineG)"
              strokeWidth="0.18"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.1 + i * 0.04, ease: "easeOut" }}
            />
          );
        })}

        {/* Pulses traveling */}
        {EDGES.slice(0, 6).map(([a, b], i) => {
          const A = NODES[a], B = NODES[b];
          return (
            <motion.circle
              key={`p-${i}`}
              r="0.4"
              fill="oklch(0.92 0.08 88)"
              filter="url(#glow)"
              initial={{ cx: A.x, cy: A.y, opacity: 0 }}
              animate={{ cx: [A.x, B.x, A.x], cy: [A.y, B.y, A.y], opacity: [0, 1, 0] }}
              transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map((n, i) => (
          <motion.g
            key={n.label}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.05, type: "spring", stiffness: 120 }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}
          >
            {n.core && (
              <motion.circle
                cx={n.x} cy={n.y} r={n.r + 4}
                fill="oklch(0.81 0.14 82 / 0.08)"
                animate={{ r: [n.r + 4, n.r + 7, n.r + 4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <circle
              cx={n.x} cy={n.y} r={n.r}
              fill={n.core ? "url(#coreG)" : "oklch(0.32 0.06 200)"}
              stroke={n.core ? "oklch(0.95 0.08 88)" : "oklch(0.81 0.14 82 / 0.6)"}
              strokeWidth="0.2"
              filter="url(#glow)"
            />
            <text
              x={n.x} y={n.y + n.r + 2.5}
              textAnchor="middle"
              fontSize="1.6"
              fill={n.core ? "oklch(0.95 0.08 88)" : "oklch(0.85 0.02 85 / 0.8)"}
              fontFamily="Inter, sans-serif"
              letterSpacing="0.05em"
            >{n.label}</text>
          </motion.g>
        ))}
      </svg>

      {/* Floating UI cards */}
      <FloatCard className="left-[6%] top-[14%]" delay={0.8}>
        <div className="text-[10px] text-gold/80 tracking-widest mb-1">RETRIEVAL</div>
        <div className="text-xs text-warm font-medium">Oncology Forecast 2025.pptx</div>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-foreground/60">
          <span className="size-1.5 rounded-full bg-gold" /> 98% confidence
        </div>
      </FloatCard>

      <FloatCard className="right-[4%] top-[8%]" delay={1.2}>
        <div className="text-[10px] text-gold/80 tracking-widest mb-1">SYNTHESIS</div>
        <div className="text-xs text-warm font-medium">Patient Adherence Case</div>
        <div className="mt-2 h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <motion.div className="h-full bg-gradient-gold" initial={{ width: 0 }} animate={{ width: "82%" }} transition={{ duration: 2, delay: 1.5 }} />
        </div>
      </FloatCard>

      <FloatCard className="left-[8%] bottom-[12%]" delay={1.6}>
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-gradient-gold" />
          <div>
            <div className="text-[10px] text-foreground/60">Knowledge Graph</div>
            <div className="text-xs text-warm font-medium">2,481 nodes linked</div>
          </div>
        </div>
      </FloatCard>

      <FloatCard className="right-[6%] bottom-[14%]" delay={2}>
        <div className="text-[10px] text-gold/80 tracking-widest mb-1">AI ASSISTANT</div>
        <div className="text-xs text-warm">"Generate exec summary…"</div>
        <div className="flex gap-1 mt-2">
          <motion.span className="size-1 rounded-full bg-gold" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity }} />
          <motion.span className="size-1 rounded-full bg-gold" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
          <motion.span className="size-1 rounded-full bg-gold" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
        </div>
      </FloatCard>
    </div>
  );
}

function FloatCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute bg-glass shadow-elegant rounded-xl px-3.5 py-3 min-w-[180px] animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </motion.div>
  );
}
