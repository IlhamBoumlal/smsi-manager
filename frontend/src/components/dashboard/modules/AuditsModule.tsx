import { ClipboardCheck, ClipboardList, ClipboardCopy, AlertTriangle, FlaskConical, CalendarDays } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { StatCard } from "../StatCard";
import { SectionCard } from "../SectionCard";
import { ProgressBar } from "../ProgressBar";
import { StatusBadge } from "../StatusBadge";

const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 };

export function AuditsModule({ data }: { data?: any }) {
  const audits = data?.audits ?? {};
  const actionsLateVsDone = Array.isArray(audits.actionsLateVsDone) ? audits.actionsLateVsDone : [];
  const actionPlans = Array.isArray(audits.actionPlans) ? audits.actionPlans : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Audits planifies" value={Number(audits.total ?? 0)} hint={`${Number(audits.termines ?? 0)} termines`} icon={CalendarDays} tone="primary" index={0} />
        <StatCard label="Planifies" value={Number(audits.planifies ?? 0)} hint="A venir" icon={ClipboardList} tone="info" index={1} />
        <StatCard label="En cours" value={Number(audits.enCours ?? 0)} icon={ClipboardCopy} tone="warning" index={2} />
        <StatCard label="Termines" value={Number(audits.termines ?? 0)} icon={ClipboardCheck} tone="success" index={3} />
        <StatCard label="NC ouvertes" value={Number(audits.ncOuvertes ?? 0)} icon={AlertTriangle} tone="destructive" index={4} />
        <StatCard label="Simulations" value={Number(audits.simulations ?? 0)} icon={FlaskConical} tone="violet" index={5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Actions en retard vs terminees" delay={0.1}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionsLateVsDone} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="done" name="Terminees" stackId="a" fill="hsl(var(--chart-3))" radius={[0, 0, 0, 0]} />
                <Bar dataKey="late" name="Retard" stackId="a" fill="hsl(var(--chart-5))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Plans d'action" description="Suivi des responsables" delay={0.15}>
          <div className="space-y-4">
            {actionPlans.map((ap: any, i: number) => (
              <div key={ap.id || i} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground font-mono">{ap.id}</div>
                    <div className="text-sm font-medium truncate">{ap.titre}</div>
                  </div>
                  <StatusBadge tone={String(ap.statut ?? "").toLowerCase().includes("termin") ? "success" : "info"}>{ap.statut}</StatusBadge>
                </div>
                <ProgressBar
                  label={String(ap.responsable || "Responsable")}
                  value={Number(ap.progression ?? 0)}
                  color={Number(ap.progression ?? 0) === 100 ? "bg-success" : "bg-primary"}
                  delay={i * 0.05}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

