import { useEffect, useMemo, useState } from "react";
import { Activity, TrendingUp, ListTodo, CheckCircle2, FolderOpen } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { StatCard } from "../StatCard";
import { SectionCard } from "../SectionCard";
import { ProgressBar } from "../ProgressBar";

const tooltipStyle = { background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 };

export function RisksModule({ data }: { data?: any }) {
  const risks = data?.risks ?? {};
  const workshopStatus = useMemo(
    () => (Array.isArray(risks.workshopStatus) ? risks.workshopStatus : []),
    [risks.workshopStatus]
  );
  const studies = useMemo(() => (Array.isArray(risks.studies) ? risks.studies : []), [risks.studies]);
  const studiesStatus = useMemo(
    () => (Array.isArray(risks.studiesStatus) ? risks.studiesStatus : []),
    [risks.studiesStatus]
  );

  const [selectedStudyId, setSelectedStudyId] = useState("all");

  useEffect(() => {
    if (selectedStudyId === "all") return;
    const exists = studiesStatus.some((study: any) => String(study?.id) === selectedStudyId);
    if (!exists) setSelectedStudyId("all");
  }, [selectedStudyId, studiesStatus]);

  const selectedStudy = useMemo(
    () => studiesStatus.find((study: any) => String(study?.id) === selectedStudyId),
    [selectedStudyId, studiesStatus]
  );

  const workshopChartData =
    selectedStudy && Array.isArray(selectedStudy?.workshopStatus) ? selectedStudy.workshopStatus : workshopStatus;
  const workshopDescription = selectedStudy
    ? `Workshop 1 a 5 - ${String(selectedStudy?.name || "Etude")}`
    : "Workshop 1 a 5";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Progression moyenne" value={`${Number(risks.progressionMoyenne ?? 0)}%`} icon={TrendingUp} tone="primary" index={0} />
        <StatCard label="Etudes" value={Number(risks.etudes ?? 0)} icon={FolderOpen} tone="info" index={1} />
        <StatCard label="En cours" value={Number(risks.enCours ?? 0)} icon={Activity} tone="warning" index={2} />
        <StatCard label="Ateliers a valider" value={Number(risks.ateliersAValider ?? 0)} icon={ListTodo} tone="violet" index={3} />
        <StatCard label="Etudes terminees" value={Number(risks.etudesTerminees ?? 0)} icon={CheckCircle2} tone="success" index={4} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Statut des ateliers"
          description={workshopDescription}
          delay={0.1}
          action={
            <select
              value={selectedStudyId}
              onChange={(event) => setSelectedStudyId(event.target.value)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              aria-label="Filtrer le statut des ateliers par etude"
            >
              <option value="all">Toutes les etudes</option>
              {studiesStatus.map((study: any, index: number) => (
                <option key={`${String(study?.id || index)}-${index}`} value={String(study?.id || index)}>
                  {String(study?.name || `Etude ${index + 1}`)}
                </option>
              ))}
            </select>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workshopChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                  <div className="mt-2 grid grid-cols-5 gap-1">
                    {[s.w1, s.w2, s.w3, s.w4, s.w5].map((v: any, idx: number) => (
                      <div key={idx} className="h-1.5 overflow-hidden rounded-full bg-muted">
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
