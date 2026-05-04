import { ShieldCheck, ListChecks, ClipboardList, Clock } from "lucide-react";
import { StatCard } from "../StatCard";
import { SectionCard } from "../SectionCard";
import { StatusBadge } from "../StatusBadge";

export function ClausesModule({ data }: { data?: any }) {
  const clauses = data?.clauses ?? {};
  const table = Array.isArray(clauses.table) ? clauses.table : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Conformite globale"
          value={`${Number(clauses.conformiteGlobale ?? 0)}%`}
          icon={ShieldCheck}
          tone="success"
          index={0}
        />
        <StatCard
          label="Clauses conformes"
          value={Number(clauses.clausesConformes ?? 0)}
          hint={`${Number(clauses.nonConformeClauses ?? 0)} non conformes`}
          icon={ListChecks}
          tone="primary"
          index={1}
        />
        <StatCard
          label="Plans d'action"
          value={Number(clauses.plansAction ?? 0)}
          icon={ClipboardList}
          tone="info"
          index={2}
        />
        <StatCard
          label="Actions en retard"
          value={Number(clauses.actionsRetard ?? 0)}
          hint={`${Number(clauses.inProgressActions ?? 0)} en cours`}
          icon={Clock}
          tone="destructive"
          index={3}
        />
      </div>

      <SectionCard title="Detail des clauses ISO 27001" description="Vue synthetique" delay={0.1}>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="font-medium py-2 pr-3">Clause</th>
                <th className="font-medium py-2 pr-3">Titre</th>
                <th className="font-medium py-2 pr-3">Sous-clauses</th>
                <th className="font-medium py-2 pr-3">Plans</th>
                <th className="font-medium py-2 pr-3">Termines</th>
                <th className="font-medium py-2 pr-3">En cours</th>
                <th className="font-medium py-2 pr-3">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {table.map((c: any) => (
                <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 pr-3 font-mono text-xs">{c.id}</td>
                  <td className="py-3 pr-3 font-medium">{c.titre}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{Number(c.sousClauses ?? 0)}</td>
                  <td className="py-3 pr-3 text-muted-foreground">{Number(c.plans ?? 0)}</td>
                  <td className="py-3 pr-3"><StatusBadge tone="success">{Number(c.termines ?? 0)}</StatusBadge></td>
                  <td className="py-3 pr-3"><StatusBadge tone="info">{Number(c.enCours ?? 0)}</StatusBadge></td>
                  <td className="py-3 pr-3 font-semibold tabular-nums">{Number(c.score ?? 0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

