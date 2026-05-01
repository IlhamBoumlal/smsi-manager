import { motion } from "framer-motion";
import { cn } from "./utils";

interface ProgressBarProps {
  label: string;
  value: number; // 0-100
  color?: string; // tailwind class for bar bg
  delay?: number;
}

export function ProgressBar({ label, value, color = "bg-primary", delay = 0 }: ProgressBarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <span className="font-medium text-foreground/90">{label}</span>
        <span className="text-muted-foreground tabular-nums">{value}%</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}
