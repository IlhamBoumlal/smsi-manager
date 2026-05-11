import { Boxes, ShieldAlert, Star, Layers } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { StatCard } from "../StatCard";
import { SectionCard } from "../SectionCard";
import { DonutScore } from "../DonutScore";

const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-5))"];
const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
};

export function AssetsModule({ data }: { data?: any }) {
  const assets = data?.assets ?? {};

  const totalActifs = Number(assets.recenses ?? 0);
  const primaires = Number(assets.primaires ?? 0);
  const support = Number(assets.supports ?? Math.max(0, totalActifs - primaires));
  const secret = Number(assets.secret ?? 0);
  const topSecret = Number(assets.topSecret ?? 0);
  const conformiteGlobale = Number(assets.conformiteGlobale ?? 0);
  const aRevoir = Number(assets.aRevoir ?? Math.max(0, totalActifs - primaires - support));

  const primairesPct = totalActifs > 0 ? Math.round((primaires / totalActifs) * 100) : 0;
  const supportPct = totalActifs > 0 ? Math.round((support / totalActifs) * 100) : 0;

  const breakdown = [
    { name: "Primaires", value: primaires },
    { name: "Support", value: support },
    { name: "A revoir", value: aRevoir },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Total actifs"
          value={totalActifs}
          hint={`${totalActifs} actifs inventories`}
          icon={Boxes}
          tone="primary"
          index={0}
        />
        <StatCard
          label="Secret / Top Secret"
          value={secret + topSecret}
          hint={`${secret} Secret · ${topSecret} Top Secret`}
          icon={ShieldAlert}
          tone="destructive"
          index={1}
        />
        <StatCard
          label="Actifs Primaires"
          value={primaires}
          hint={`${primairesPct}% du total`}
          icon={Star}
          tone="info"
          index={2}
        />
        <StatCard
          label="Actifs Support"
          value={support}
          hint={`${supportPct}% du total`}
          icon={Layers}
          tone="success"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Score conformite actifs" delay={0.1}>
          <div className="flex justify-center py-2">
            <DonutScore value={conformiteGlobale} />
          </div>
        </SectionCard>

        <SectionCard title="Repartition des actifs" delay={0.15}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {breakdown.map((_, i) => (
                    <Cell key={i} fill={colors[i]} stroke="hsl(var(--card))" strokeWidth={2} />
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

