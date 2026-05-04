import { GraduationCap, CalendarClock, Users, Activity } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { StatCard } from "../StatCard";
import { SectionCard } from "../SectionCard";
import { DonutScore } from "../DonutScore";

const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];
const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 };

export function TrainingsModule({ data }: { data?: any }) {
  const trainings = data?.trainings ?? {};
  const partRate = Number(trainings.tauxParticipation ?? 0);
  const breakdown = Array.isArray(trainings.breakdown) ? trainings.breakdown : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Taux de participation" value={`${partRate}%`} icon={Users} tone="primary" index={0} />
        <StatCard label="Formations totales" value={Number(trainings.total ?? 0)} icon={GraduationCap} tone="info" index={1} />
        <StatCard label="Planifiees" value={Number(trainings.planifiees ?? 0)} icon={CalendarClock} tone="warning" index={2} />
        <StatCard label="En cours" value={Number(trainings.enCours ?? 0)} icon={Activity} tone="success" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Repartition" description="Statut des sessions" delay={0.1}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {breakdown.map((_: any, i: number) => <Cell key={i} fill={colors[i]} stroke="hsl(var(--card))" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Taux de participation" description="Sensibilisation" delay={0.15}>
          <div className="flex flex-col items-center">
            <DonutScore value={partRate} label="Participation" color="hsl(var(--chart-3))" />
            <div className="grid grid-cols-2 gap-3 w-full mt-4">
              <div className="rounded-xl bg-muted/50 px-3 py-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-success" />
                <div>
                  <div className="text-[11px] text-muted-foreground">Participants</div>
                  <div className="font-display font-semibold">{Number(trainings.participants ?? 0)}</div>
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 px-3 py-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-[11px] text-muted-foreground">Invites</div>
                  <div className="font-display font-semibold">{Number(trainings.invites ?? 0)}</div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Sessions" description="Comparatif statuts" delay={0.2}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {breakdown.map((_: any, i: number) => <Cell key={i} fill={colors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

