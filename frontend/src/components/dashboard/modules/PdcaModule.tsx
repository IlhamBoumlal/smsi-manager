import { Target, CheckCircle2, RefreshCw, Activity } from "lucide-react";
import { ResponsiveContainer, RadialBarChart, RadialBar, Tooltip, Legend, PolarAngleAxis } from "recharts";
import { StatCard } from "../StatCard";
import { SectionCard } from "../SectionCard";
import { DonutScore } from "../DonutScore";

const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 };

export function PdcaModule({ data }: { data?: any }) {
  const pdca = data?.pdca ?? {};
  const plan = pdca.plan ?? { value: 0, done: 0, total: 0 };
  const doPhase = pdca.do ?? { value: 0, done: 0, total: 0 };
  const check = pdca.check ?? { value: 0, done: 0, total: 0 };
  const act = pdca.act ?? { value: 0, done: 0, total: 0 };

  const SafePolarAngleAxis: any = PolarAngleAxis;

  const phases = [
    { name: "Plan", value: Number(plan.value ?? 0), fill: "hsl(var(--chart-1))" },
    { name: "Do", value: Number(doPhase.value ?? 0), fill: "hsl(var(--chart-2))" },
    { name: "Check", value: Number(check.value ?? 0), fill: "hsl(var(--chart-4))" },
    { name: "Act", value: Number(act.value ?? 0), fill: "hsl(var(--chart-5))" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Conformite PDCA" value={`${Number(pdca.conformitePdca ?? 0)}%`} icon={RefreshCw} tone="primary" index={0} />
        <StatCard label="Actions terminees" value={Number(pdca.actionsTerminees ?? 0)} icon={CheckCircle2} tone="success" index={1} />
        <StatCard
          label="Plan (Phase P)"
          value={`${Number(plan.value ?? 0)}%`}
          hint={`${Number(plan.done ?? 0)}/${Number(plan.total ?? 0)} actions`}
          icon={Target}
          tone="info"
          index={2}
        />
        <StatCard
          label="Do (Phase D)"
          value={`${Number(doPhase.value ?? 0)}%`}
          hint={`${Number(doPhase.done ?? 0)}/${Number(doPhase.total ?? 0)} actions`}
          icon={Activity}
          tone="primary"
          index={3}
        />
        <StatCard
          label="Check (Phase C)"
          value={`${Number(check.value ?? 0)}%`}
          hint={`${Number(check.done ?? 0)}/${Number(check.total ?? 0)} actions`}
          icon={RefreshCw}
          tone="warning"
          index={4}
        />
        <StatCard
          label="Act (Phase A)"
          value={`${Number(act.value ?? 0)}%`}
          hint={`${Number(act.done ?? 0)}/${Number(act.total ?? 0)} actions`}
          icon={CheckCircle2}
          tone="success"
          index={5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Score PDCA" delay={0.1}>
          <div className="flex justify-center py-2">
            <DonutScore value={Number(pdca.conformitePdca ?? 0)} color="hsl(var(--chart-2))" />
          </div>
        </SectionCard>

        <SectionCard title="Progression par phase" description="Plan · Do · Check · Act" delay={0.15} className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="20%" outerRadius="100%" data={phases} startAngle={90} endAngle={-270}>
                <SafePolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={8} />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

