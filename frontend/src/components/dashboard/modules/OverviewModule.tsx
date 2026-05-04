import { ShieldAlert, ClipboardCheck, GraduationCap, Boxes } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";
import { StatCard } from "../StatCard";
import { SectionCard } from "../SectionCard";
import { DonutScore } from "../DonutScore";
import { ProgressBar } from "../ProgressBar";

const chartColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-6))"];

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 8px 24px -8px hsl(var(--foreground) / 0.15)",
};

export function OverviewModule({ data }: { data?: any }) {
  const overview = data?.overview ?? {};
  const incidents = overview.incidents ?? { total: 0, open: 0, resolved: 0 };
  const audits = overview.audits ?? { planned: 0, inProgress: 0, done: 0 };
  const trainings = overview.trainings ?? { total: 0, planned: 0, inProgress: 0, done: 0 };
  const assets = overview.assets ?? { total: 0, toReview: 0 };

  const conformityByDomain = Array.isArray(overview.conformityByDomain) ? overview.conformityByDomain : [];
  const pdcaProgress = overview.pdcaProgress ?? { plan: 0, do: 0, check: 0, act: 0 };
  const incidentsTrend = Array.isArray(overview.incidentsTrend) ? overview.incidentsTrend : [];
  const actionsLateVsDone = Array.isArray(overview.actionsLateVsDone) ? overview.actionsLateVsDone : [];
  const trainingsBreakdown = Array.isArray(overview.trainingsBreakdown) ? overview.trainingsBreakdown : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Incidents en cours" value={Number(incidents.open ?? 0)} icon={ShieldAlert} hint={`${Number(incidents.resolved ?? 0)} resolus`} tone="destructive" index={0} />
        <StatCard label="Audits" value={Number(audits.planned ?? 0) + Number(audits.inProgress ?? 0) + Number(audits.done ?? 0)} icon={ClipboardCheck} hint={`${Number(audits.inProgress ?? 0)} en cours`} tone="warning" index={1} />
        <StatCard label="Formations" value={Number(trainings.total ?? 0)} icon={GraduationCap} hint={`${Number(trainings.inProgress ?? 0)} en cours`} tone="success" index={2} />
        <StatCard label="Actifs recenses" value={Number(assets.total ?? 0)} icon={Boxes} hint={`${Number(assets.toReview ?? 0)} a revoir`} tone="primary" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Conformite globale" description="Score consolide tous domaines" delay={0.1}>
          <div className="flex items-center justify-center py-2">
            <DonutScore value={Number(overview.conformityGlobal ?? 0)} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {conformityByDomain.map((d: any, i: number) => (
              <div key={d.name || i} className="rounded-xl bg-muted/50 px-3 py-2">
                <div className="text-[11px] text-muted-foreground">{d.name}</div>
                <div className="font-display font-semibold" style={{ color: chartColors[i] }}>{Number(d.value ?? 0)}%</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Progression PDCA" description="Plan · Do · Check · Act" delay={0.15} className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mt-2">
            <ProgressBar label="Plan" value={Number(pdcaProgress.plan ?? 0)} color="bg-chart-1" />
            <ProgressBar label="Do" value={Number(pdcaProgress.do ?? 0)} color="bg-chart-2" delay={0.1} />
            <ProgressBar label="Check" value={Number(pdcaProgress.check ?? 0)} color="bg-chart-4" delay={0.2} />
            <ProgressBar label="Act" value={Number(pdcaProgress.act ?? 0)} color="bg-chart-5" delay={0.3} />
          </div>
          <div className="mt-6 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={incidentsTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="m" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="open" name="Ouverts" stroke="hsl(var(--chart-1))" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="resolved" name="Resolus" stroke="hsl(var(--chart-3))" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Actions en retard vs terminees" description="Clauses · Controles · PDCA · Audits" delay={0.2}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={actionsLateVsDone} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="done" name="Terminees" fill="hsl(var(--chart-3))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="late" name="En retard" fill="hsl(var(--chart-5))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Repartition des formations" description="Statut des sessions" delay={0.25}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={trainingsBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {trainingsBreakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={chartColors[i]} stroke="hsl(var(--card))" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

