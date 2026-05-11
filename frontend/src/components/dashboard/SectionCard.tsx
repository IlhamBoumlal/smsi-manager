import { motion } from "framer-motion";
import { cn } from "./utils";

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  delay?: number;
  accent?: "indigo" | "blue" | "emerald" | "amber" | "violet";
}

const accentMap = {
  indigo: "before:bg-gradient-to-r before:from-indigo-500 before:to-violet-500",
  blue: "before:bg-gradient-to-r before:from-blue-500 before:to-indigo-500",
  emerald: "before:bg-gradient-to-r before:from-emerald-500 before:to-teal-500",
  amber: "before:bg-gradient-to-r before:from-amber-500 before:to-orange-500",
  violet: "before:bg-gradient-to-r before:from-violet-500 before:to-fuchsia-500",
};

export function SectionCard({ title, description, children, className, action, delay = 0, accent }: SectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300",
        accent && "before:absolute before:top-0 before:left-6 before:right-6 before:h-0.5 before:rounded-full",
        accent && accentMap[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Sora', 'Inter', sans-serif" }}>{title}</h3>
          {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}
