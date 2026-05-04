import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface DonutScoreProps {
  value: number; // 0-100
  label?: string;
  size?: number;
  thickness?: number;
  color?: string; // CSS color
}

export function DonutScore({ value, label = "Conformité", size = 180, thickness = 14, color = "hsl(var(--primary))" }: DonutScoreProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setShown(value), 100);
    return () => clearTimeout(t);
  }, [value]);

  const offset = circumference - (shown / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--muted))" strokeWidth={thickness} fill="none" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-display font-semibold tracking-tight"
          >
            {Math.round(shown)}%
          </motion.span>
          <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
        </div>
      </div>
    </div>
  );
}
