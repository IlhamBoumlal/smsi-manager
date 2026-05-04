import { ShieldCheck, FileCheck2, AlertTriangle, Clock } from "lucide-react";
import { StatCard } from "../StatCard";
import { SectionCard } from "../SectionCard";
import { DonutScore } from "../DonutScore";
import { ProgressBar } from "../ProgressBar";

export function ControlesModule({ data }: { data?: any }) {
  const controls = data?.controls ?? {};
  const byDomain = Array.isArray(controls.byDomain) ? controls.byDomain : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Conformite globale" value={`${Number(controls.conformiteGlobale ?? 0)}%`} icon={ShieldCheck} tone="success" index={0} />
        <StatCard label="Controles conformes" value={Number(controls.conformes ?? 0)} icon={FileCheck2} tone="primary" index={1} />
        <StatCard label="NC Mineure" value={Number(controls.ncMineure ?? 0)} icon={AlertTriangle} tone="warning" index={2} />
        <StatCard
          label="Actions en retard"
          value={Number(controls.actionsRetard ?? 0)}
          hint={`${Number(controls.inProgressActions ?? 0)} en cours`}
          icon={Clock}
          tone="destructive"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Score consolide" delay={0.1}>
          <div className="flex justify-center py-2">
            <DonutScore value={Number(controls.conformiteGlobale ?? 0)} />
          </div>
        </SectionCard>

        <SectionCard title="Controles par domaine" delay={0.15} className="lg:col-span-2">
          <div className="space-y-4">
            {byDomain.map((domain: any, i: number) => (
              <ProgressBar
                key={domain.name || i}
                label={String(domain.name || `Domaine ${i + 1}`)}
                value={Number(domain.value ?? 0)}
                delay={i * 0.05}
                color={Number(domain.value ?? 0) > 80 ? "bg-success" : Number(domain.value ?? 0) > 60 ? "bg-primary" : "bg-warning"}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

