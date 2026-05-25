import { ShieldAlert, ShieldCheck, Clock } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { StatCard } from "../StatCard";
import { SectionCard } from "../SectionCard";
import { StatusBadge } from "../StatusBadge";

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
};

export function IncidentsModule({ data }: { data?: any }) {
  const incidents = data?.incidents ?? {};
  const trend = Array.isArray(incidents.trend) ? incidents.trend : [];
  const incidentsList = Array.isArray(incidents.list) ? incidents.list : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Total incidents" value={Number(incidents.total ?? 0)} icon={ShieldAlert} tone="primary" index={0} />
        <StatCard label="En cours" value={Number(incidents.enCours ?? 0)} icon={Clock} tone="warning" index={1} />
        <StatCard label="Resolus" value={Number(incidents.resolus ?? 0)} icon={ShieldCheck} tone="success" index={2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Tendance incidents" description="6 derniers mois" className="lg:col-span-2" delay={0.1}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="i1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="i2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="open" name="Ouverts" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#i1)" />
                <Area type="monotone" dataKey="resolved" name="Resolus" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#i2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Incidents recents" description="Derniers signalements" delay={0.15}>
          <div className="space-y-3">
            {incidentsList.map((incident: any) => (
              <div
                key={incident.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{incident.titre}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {incident.date} - {incident.statut}
                  </div>
                </div>
                <StatusBadge
                  tone={
                    String(incident.statut ?? "").toLowerCase().includes("resol")
                      ? "success"
                      : incident.priorite === "Critique"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {incident.priorite}
                </StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
