import { cn } from "./utils";

type Tone = "default" | "success" | "warning" | "destructive" | "info" | "muted";

const tones: Record<Tone, string> = {
  default: "bg-primary-soft text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  muted: "bg-muted text-muted-foreground",
};

export function StatusBadge({ children, tone = "default", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}
