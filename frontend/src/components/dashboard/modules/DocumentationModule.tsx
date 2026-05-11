import { FileCheck2, FileClock, FileWarning, ShieldCheck } from "lucide-react";
import { StatCard } from "../StatCard";
import { SectionCard } from "../SectionCard";
import { DonutScore } from "../DonutScore";
import { ProgressBar } from "../ProgressBar";

export function DocumentationModule({ data }: { data?: any }) {
  const docs = data?.documentation ?? {};
  const approuves = Number(docs.approuves ?? 0);
  const enValidation = Number(docs.enValidation ?? 0);
  const aRevoir = Number(docs.aRevoir ?? 0);
  const total = approuves + enValidation + aRevoir;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Taux de conformite documentaire" value={`${Number(docs.conformiteGlobale ?? 0)}%`} icon={ShieldCheck} tone="success" index={0} />
        <StatCard label="Documents approuves" value={approuves} icon={FileCheck2} tone="primary" index={1} />
        <StatCard label="En validation" value={enValidation} icon={FileClock} tone="warning" index={2} />
        <StatCard label="A revoir" value={aRevoir} icon={FileWarning} tone="destructive" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Score documentaire" delay={0.1}>
          <div className="flex justify-center py-2">
            <DonutScore value={Number(docs.conformiteGlobale ?? 0)} color="hsl(var(--chart-3))" />
          </div>
        </SectionCard>

        <SectionCard title="Cycle de vie documentaire" delay={0.15} className="lg:col-span-2">
          <div className="space-y-5">
            <ProgressBar label="Approuves" value={Math.round((approuves / Math.max(total, 1)) * 100)} color="bg-success" />
            <ProgressBar label="En validation" value={Math.round((enValidation / Math.max(total, 1)) * 100)} color="bg-warning" delay={0.1} />
            <ProgressBar label="A revoir" value={Math.round((aRevoir / Math.max(total, 1)) * 100)} color="bg-destructive" delay={0.2} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

