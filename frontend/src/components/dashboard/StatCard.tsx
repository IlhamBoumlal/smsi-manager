import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "./utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  hint?: string;
  trend?: number;
  tone?: "primary" | "success" | "warning" | "info" | "destructive" | "violet";
  index?: number;
}

export function StatCard({ label, value, hint, trend, index = 0 }: StatCardProps) {
  const primaryCard = index === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
        primaryCard
          ? "text-white shadow-[0_8px_24px_rgba(29,78,216,.35)]"
          : "border border-slate-200 bg-white text-slate-900 shadow-sm hover:-translate-y-0.5"
      )}
      style={primaryCard ? { background: "linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)" } : undefined}
    >
      <div className="relative">
        <div className="flex items-start justify-end">
          {typeof trend === "number" && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                primaryCard
                  ? "bg-white/15 text-white"
                  : trend >= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
              )}
            >
              {trend >= 0 ? "+" : "-"}{Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="mt-5">
          <div className={cn("text-3xl font-bold tracking-tight tabular-nums", primaryCard ? "text-white" : "text-slate-900")} style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}>
            {value}
          </div>
          <div className={cn("mt-1 text-sm font-semibold", primaryCard ? "text-white/95" : "text-slate-700")}>{label}</div>
          {hint && <div className={cn("mt-0.5 text-xs", primaryCard ? "text-white/70" : "text-slate-400")}>{hint}</div>}
          {primaryCard ? (
            <div className="mt-3 h-1 rounded-full bg-white/25">
              <div className="h-full w-2/3 rounded-full bg-white/80" />
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
