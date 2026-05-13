import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { StatCard } from "../StatCard";
import { SectionCard } from "../SectionCard";
import { DonutScore } from "../DonutScore";
import { ProgressBar } from "../ProgressBar";

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 8px 24px -8px hsl(var(--foreground) / 0.15)",
};

function urgencyClass(urgency: string) {
  if (urgency === "critique") return "bg-rose-100 text-rose-700 border-rose-200";
  if (urgency === "haute") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function urgencyLabel(urgency: string) {
  if (urgency === "critique") return "Urgent";
  if (urgency === "haute") return "Important";
  return "A suivre";
}

function formatChange(change: number | null) {
  if (change === null || Number.isNaN(change)) return "0%";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change}%`;
}

function formatSla(value: number | null) {
  if (value === null || Number.isNaN(value)) return "0 j";
  return `${value} j`;
}

function heatCellStyle(value: number, maxValue: number) {
  const ratio = maxValue > 0 ? value / maxValue : 0;
  const alpha = 0.08 + ratio * 0.52;
  return {
    backgroundColor: `rgba(37, 99, 235, ${alpha})`,
    color: ratio > 0.55 ? "#ffffff" : "#1f2937",
  };
}

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

  const priorities = overview.priorities ?? {
    total: 0,
    overdue: 0,
    dueSoon: 0,
    inProgress: 0,
    docsValidationAged: 0,
    ncsOpenThisWeek: 0,
    validationThresholdDays: 7,
    list: [],
  };
  const prioritiesList = Array.isArray(priorities.list) ? priorities.list : [];

  const activity30d = overview.activity30d ?? { created: 0, completed: 0, trend: [], byModule: [], monthlyVariations: {} };
  const activity30dTrend = Array.isArray(activity30d.trend) ? activity30d.trend : [];
  const activity30dByModule = Array.isArray(activity30d.byModule) ? activity30d.byModule : [];
  const monthlyVariations = activity30d.monthlyVariations ?? {};

  const workloadByOwner = overview.workloadByOwner ?? { totalOwners: 0, items: [] };
  const workloadItems = Array.isArray(workloadByOwner.items) ? workloadByOwner.items : [];

  const sla = overview.sla ?? {
    incidentsClosureDays: null,
    ncTreatmentDays: null,
    documentationApprovalDays: null,
  };

  const blockersTop5 = Array.isArray(overview.blockersTop5) ? overview.blockersTop5 : [];
  const dataQuality = overview.dataQuality ?? {
    total: 0,
    missingOwnerPct: 0,
    missingDuePct: 0,
    incoherentStatusPct: 0,
  };

  const riskQuick = overview.riskQuick ?? { heatmap: [], residualCritical: 0 };
  const riskHeatmap = Array.isArray(riskQuick.heatmap) ? riskQuick.heatmap : [];
  const riskHeatmapMax = riskHeatmap.reduce((max: number, cell: any) => Math.max(max, Number(cell?.value ?? 0)), 0);

  const readiness = overview.readiness ?? { score: 0, components: {} };
  const readinessComponents = readiness.components ?? {};

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Incidents en cours"
          value={Number(incidents.open ?? 0)}
          hint={`${Number(incidents.resolved ?? 0)} resolus`}
          tone="destructive"
          index={0}
        />
        <StatCard
          label="Audits"
          value={Number(audits.planned ?? 0) + Number(audits.inProgress ?? 0) + Number(audits.done ?? 0)}
          hint={`${Number(audits.inProgress ?? 0)} en cours`}
          tone="warning"
          index={1}
        />
        <StatCard
          label="Formations"
          value={Number(trainings.total ?? 0)}
          hint={`${Number(trainings.inProgress ?? 0)} en cours`}
          tone="success"
          index={2}
        />
        <StatCard
          label="Actifs recenses"
          value={Number(assets.total ?? 0)}
          hint={`${Number(assets.toReview ?? 0)} a revoir`}
          tone="primary"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Conformite globale" description="Score consolide tous domaines" delay={0.1}>
          <div className="flex items-center justify-center py-2">
            <DonutScore value={Number(overview.conformityGlobal ?? 0)} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {conformityByDomain.map((domain: any, i: number) => (
              <div key={domain.name || i} className="rounded-xl bg-muted/50 px-3 py-2">
                <div className="text-[11px] text-muted-foreground">{domain.name}</div>
                <div className="font-display font-semibold" style={{ color: chartColors[i] }}>
                  {Number(domain.value ?? 0)}%
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Progression PDCA" description="Plan - Do - Check - Act" delay={0.15} className="lg:col-span-2">
          <div className="mt-2 grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Priorites du jour" description="Retards critiques et actions a traiter" delay={0.18} accent="amber">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
              <div className="text-[11px] text-rose-700">Retards critiques</div>
              <div className="text-lg font-bold text-rose-800">{Number(priorities.overdue ?? 0)}</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <div className="text-[11px] text-amber-700">Sous 7 jours</div>
              <div className="text-lg font-bold text-amber-800">{Number(priorities.dueSoon ?? 0)}</div>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2">
              <div className="text-[11px] text-indigo-700">Docs validation &gt; {Number(priorities.validationThresholdDays ?? 7)}j</div>
              <div className="text-lg font-bold text-indigo-800">{Number(priorities.docsValidationAged ?? 0)}</div>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2">
              <div className="text-[11px] text-cyan-700">NC a traiter semaine</div>
              <div className="text-lg font-bold text-cyan-800">{Number(priorities.ncsOpenThisWeek ?? 0)}</div>
            </div>
          </div>

          <div className="max-h-[280px] space-y-2.5 overflow-auto pr-1">
            {prioritiesList.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                Aucune priorite critique pour le moment.
              </div>
            ) : (
              prioritiesList.map((item: any, i: number) => (
                <div key={item.id || i} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {item.module || "Module"}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${urgencyClass(
                        String(item.urgency || "")
                      )}`}
                    >
                      {urgencyLabel(String(item.urgency || ""))}
                    </span>
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {item.owner || "Non assigne"} - {item.state || "A faire"} - {item.dueDate || "Sans echeance"}
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Evolution 30 jours" description="Dynamique et variations mensuelles" delay={0.2} className="lg:col-span-2" accent="blue">
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] text-slate-500">Conformite globale</div>
              <div className="text-lg font-bold text-slate-900">{formatChange(monthlyVariations?.globalConformity?.changePct ?? null)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] text-slate-500">Incidents</div>
              <div className="text-lg font-bold text-slate-900">{formatChange(monthlyVariations?.incidents?.changePct ?? null)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] text-slate-500">Audits termines</div>
              <div className="text-lg font-bold text-slate-900">{formatChange(monthlyVariations?.auditsCompleted?.changePct ?? null)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="text-[11px] text-slate-500">PDCA termine</div>
              <div className="text-lg font-bold text-slate-900">{formatChange(monthlyVariations?.pdcaCompleted?.changePct ?? null)}</div>
            </div>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity30dTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="activityCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="activityCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="d" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="created" name="Crees" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#activityCreated)" />
                <Area type="monotone" dataKey="completed" name="Clotures" stroke="hsl(var(--chart-3))" strokeWidth={2} fill="url(#activityCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Delais moyens (SLA)" description="Temps de traitement reel" delay={0.22} accent="emerald">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] text-slate-500">Fermeture incident</div>
              <div className="text-xl font-bold text-slate-900">{formatSla(sla.incidentsClosureDays)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] text-slate-500">Traitement NC</div>
              <div className="text-xl font-bold text-slate-900">{formatSla(sla.ncTreatmentDays)}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] text-slate-500">Approbation doc</div>
              <div className="text-xl font-bold text-slate-900">{formatSla(sla.documentationApprovalDays)}</div>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Les SLA s'affichent uniquement lorsque les dates de depart et de cloture existent dans les donnees.
          </p>
        </SectionCard>

        <SectionCard title="Top 5 points de blocage" description="Objets avec le plus de retards" delay={0.24} accent="amber">
          <div className="space-y-3">
            {blockersTop5.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                Aucun point de blocage detecte.
              </div>
            ) : (
              blockersTop5.map((blocker: any, index: number) => (
                <div key={blocker.name || index}>
                  <ProgressBar
                    label={String(blocker.name || "Blocage")}
                    value={Math.min(100, Number(blocker.count ?? 0) * 10)}
                    color="bg-chart-5"
                    delay={index * 0.05}
                  />
                  <div className="mt-1 text-right text-[11px] text-slate-500">{Number(blocker.count ?? 0)} element(s)</div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Charge par responsable" description="Ouvertes et en retard par utilisateur" delay={0.26} accent="emerald">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadItems} layout="vertical" margin={{ top: 4, right: 16, left: 20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="owner" type="category" width={120} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="open" name="Ouvertes" fill="hsl(var(--chart-2))" radius={[0, 6, 6, 0]} />
                <Bar dataKey="late" name="En retard" fill="hsl(var(--chart-5))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Qualite des donnees" description="Completeness et coherence des champs" delay={0.28} accent="violet">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] text-slate-500">% sans responsable</div>
              <div className="text-xl font-bold text-slate-900">{Number(dataQuality.missingOwnerPct ?? 0)}%</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] text-slate-500">% sans echeance</div>
              <div className="text-xl font-bold text-slate-900">{Number(dataQuality.missingDuePct ?? 0)}%</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="text-[11px] text-slate-500">% statut incoherent</div>
              <div className="text-xl font-bold text-slate-900">{Number(dataQuality.incoherentStatusPct ?? 0)}%</div>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">{Number(dataQuality.total ?? 0)} element(s) controles.</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Carte risques rapide" description="Heatmap gravite x vraisemblance" delay={0.3} accent="blue">
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
            <div className="text-[11px] text-rose-700">Risques critiques residuels</div>
            <div className="text-xl font-bold text-rose-800">{Number(riskQuick.residualCritical ?? 0)}</div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {riskHeatmap.map((cell: any, index: number) => (
              <div
                key={`${cell.gravity}-${cell.likelihood}-${index}`}
                className="rounded-lg border border-slate-200 px-2 py-2 text-center text-xs font-semibold"
                style={heatCellStyle(Number(cell.value ?? 0), riskHeatmapMax)}
              >
                G{cell.gravity}/V{cell.likelihood}
                <div className="text-base font-bold">{Number(cell.value ?? 0)}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Readiness certification" description="Pret pour audit ISO (score unique)" delay={0.32} accent="indigo">
          <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-2">
            <div className="flex items-center justify-center">
              <DonutScore value={Number(readiness.score ?? 0)} />
            </div>
            <div className="space-y-2">
              {[
                { name: "Clauses", value: readinessComponents.clauses, color: "bg-chart-1" },
                { name: "Controles", value: readinessComponents.controles, color: "bg-chart-2" },
                { name: "Documentation", value: readinessComponents.documentation, color: "bg-chart-3" },
                { name: "PDCA", value: readinessComponents.pdca, color: "bg-chart-4" },
                { name: "Risques", value: readinessComponents.risques, color: "bg-chart-5" },
              ].map((item, index) => (
                <ProgressBar
                  key={item.name}
                  label={item.name}
                  value={Number(item.value ?? 0)}
                  color={item.color}
                  delay={index * 0.04}
                />
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Actions en retard vs terminees" description="Clauses - Controles - PDCA - Audits" delay={0.34}>
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

        <SectionCard title="Repartition des formations" description="Statut des sessions" delay={0.36}>
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

      <SectionCard title="Activite par module (30 jours)" description="Volume d'actions detectees" delay={0.38} accent="violet">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activity30dByModule} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="module" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" name="Actions" fill="hsl(var(--chart-4))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}
