import { Activity, TrendingUp, ListTodo, CheckCircle2, FolderOpen } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { StatCard } from "../StatCard";
import { SectionCard } from "../SectionCard";
import { ProgressBar } from "../ProgressBar";

const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 };

export function RisksModule({ data }: { data?: any }) {
  const risks = data?.risks ?? {};
  const workshopStatus = Array.isArray(risks.workshopStatus) ? risks.workshopStatus : [];
  const studies = Array.isArray(risks.studies) ? risks.studies : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Progression moyenne" value={`${Number(risks.progressionMoyenne ?? 0)}%`} icon={TrendingUp} tone="primary" index={0} />
        <StatCard label="Etudes" value={Number(risks.etudes ?? 0)} icon={FolderOpen} tone="info" index={1} />
        <StatCard label="En cours" value={Number(risks.enCours ?? 0)} icon={Activity} tone="warning" index={2} />
        <StatCard label="Ateliers a valider" value={Number(risks.ateliersAValider ?? 0)} icon={ListTodo} tone="violet" index={3} />
        <StatCard label="Etudes terminees" value={Number(risks.etudesTerminees ?? 0)} icon={CheckCircle2} tone="success" index={4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Statut des ateliers" description="Workshop 1 à 5" delay={0.1}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workshopStatus} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="done" name="Termines" stackId="a" fill="hsl(var(--chart-3))" />
                <Bar dataKey="validate" name="A valider" stackId="a" fill="hsl(var(--chart-4))" />
                <Bar dataKey="blocked" name="Bloques" stackId="a" fill="hsl(var(--chart-5))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Progression des etudes de risques" description="Avancement par atelier" delay={0.15}>
          <div className="space-y-5">
            {studies.map((s: any, i: number) => {
              const avg = Math.round((Number(s.w1 ?? 0) + Number(s.w2 ?? 0) + Number(s.w3 ?? 0) + Number(s.w4 ?? 0) + Number(s.w5 ?? 0)) / 5);
              return (
                <div key={s.name || i}>
                  <ProgressBar
                    label={String(s.name || `Etude ${i + 1}`)}
                    value={avg}
                    delay={i * 0.05}
                    color={avg > 75 ? "bg-success" : avg > 40 ? "bg-primary" : "bg-warning"}
                  />
                  <div className="grid grid-cols-5 gap-1 mt-2">
                    {[s.w1, s.w2, s.w3, s.w4, s.w5].map((v: any, idx: number) => (
                      <div key={idx} className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-foreground/70 transition-all" style={{ width: `${Number(v ?? 0)}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

