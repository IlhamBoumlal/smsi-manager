import assert from "node:assert/strict";
import { generateAssistantReply } from "../src/services/chatbotService.js";

const payloads = {
  incidents: [
    {
      id: "inc-1",
      titre: "Incident phishing",
      statut: "Open",
      priorite: "Haute",
      date: "2026-05-21T09:00:00Z",
    },
    {
      id: "inc-2",
      titre: "Incident VPN",
      statut: "Resolved",
      priorite: "Moyenne",
      date: "2026-05-20T08:00:00Z",
    },
  ],
  risques: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Etude SI Interne",
      organization: "Societe A",
      author: "Alice",
      perimeter: "SI Interne",
      payloadJson: JSON.stringify({
        workshop5: { riskEntries: [{ name: "Ransomware", gravity: 4, likelihood: 3 }] },
      }),
      createdAt: "2026-05-01T09:00:00Z",
      updatedAt: "2026-05-22T09:00:00Z",
    },
  ],
  actifs: [
    {
      id: "asset-1",
      nom: "Serveur AD",
      classification: "TopSecret",
      proprietaire: "RSSI",
      criticite: "Critique",
    },
  ],
  documentation: [
    {
      id: "doc-1",
      name: "Politique SMSI",
      status: "Approuve",
      version: "2.0",
      updatedAt: "2026-05-23T10:00:00Z",
    },
    {
      id: "doc-2",
      name: "Procedure IR",
      status: "EnValidation",
      version: "1.1",
      updatedAt: "2026-05-24T10:00:00Z",
    },
  ],
  formations: [
    {
      id: "form-1",
      title: "Sensibilisation phishing",
      status: "Planned",
      date: "2026-06-01T10:00:00Z",
    },
    {
      id: "form-2",
      title: "Atelier SOC",
      status: "Completed",
      date: "2026-05-10T10:00:00Z",
    },
  ],
  formationsDashboard: {
    total: 2,
    planifiees: 1,
    enCours: 0,
    terminees: 1,
    tauxMoyen: 88,
  },
  clausesStats: {
    totalClauses: 2,
    averageConformity: 84,
    conformeClauses: 1,
    partialClauses: 1,
    nonConformeClauses: 0,
    totalActions: 3,
    delayedActions: 1,
  },
  clausesDashboard: [
    {
      clause: { id: "cl-4", number: "4", title: "Contexte" },
      computedScore: 100,
      isFullyCompliant: true,
      actionCount: 0,
    },
    {
      clause: { id: "cl-6", number: "6", title: "Planification" },
      computedScore: 68,
      isFullyCompliant: false,
      actionCount: 2,
    },
  ],
  controles: [
    {
      id: "ctrl-1",
      code: "A.5.1",
      titre: "Politique SSI",
      domaine: "Organisationnel",
      applicable: true,
      statut: "Conforme",
      priorite: "Haute",
      statutPlan: "Done",
    },
    {
      id: "ctrl-2",
      code: "A.8.12",
      titre: "Gestion des vulnerabilites",
      domaine: "Technologique",
      applicable: true,
      statut: "NC_Majeure",
      priorite: "Haute",
      statutPlan: "InProgress",
    },
  ],
  audits: [
    {
      id: "audit-1",
      title: "Audit interne Q2",
      status: "InProgress",
      date: "2026-05-18T08:00:00Z",
      auditor: "Equipe Audit",
    },
  ],
  auditsNc: [
    {
      id: "nc-1",
      title: "NC MFA",
      status: "Open",
      correctiveActions: [
        {
          description: "Activer MFA admins",
          responsible: "Equipe IAM",
          deadline: "2026-05-20T00:00:00Z",
          status: "InProgress",
        },
      ],
    },
  ],
  pdcaCycles: [{ id: "cycle-1", name: "Cycle 2026", isActive: true }],
  pdcaCycleDetail: {
    id: "cycle-1",
    name: "Cycle 2026",
    phases: [
      {
        key: "Plan",
        sections: [{ items: [{ status: "Done" }, { status: "InProgress" }] }],
      },
      {
        key: "Do",
        sections: [{ items: [{ status: "Todo" }] }],
      },
    ],
  },
  dashboard: {
    tauxGlobalConformite: 81,
    totalActifs: 1,
    totalControles: 2,
    controlesParStatut: [{ statut: "Conforme", count: 1 }, { statut: "NC", count: 1 }],
    controlesParDomaine: [{ domaine: "Organisationnel", count: 1 }, { domaine: "Technologique", count: 1 }],
  },
};

function createJsonResponse(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function runScenario(message) {
  const originalFetch = global.fetch;
  let ollamaCalled = false;

  global.fetch = async (url) => {
    const normalizedUrl = String(url);
    if (normalizedUrl.includes("/api/incidents")) return createJsonResponse(payloads.incidents);
    if (normalizedUrl.includes("/api/risques/studies")) return createJsonResponse(payloads.risques);
    if (normalizedUrl.includes("/api/actifs")) return createJsonResponse(payloads.actifs);
    if (normalizedUrl.includes("/api/documentation")) return createJsonResponse(payloads.documentation);
    if (normalizedUrl.includes("/api/sensibilisation/dashboard")) {
      return createJsonResponse(payloads.formationsDashboard);
    }
    if (normalizedUrl.includes("/api/sensibilisation")) return createJsonResponse(payloads.formations);
    if (normalizedUrl.includes("/api/clauses/stats")) return createJsonResponse(payloads.clausesStats);
    if (normalizedUrl.includes("/api/clauses/dashboard")) return createJsonResponse(payloads.clausesDashboard);
    if (normalizedUrl.includes("/api/controles")) return createJsonResponse(payloads.controles);
    if (normalizedUrl.includes("/api/audits/ncs")) return createJsonResponse(payloads.auditsNc);
    if (normalizedUrl.includes("/api/audits")) return createJsonResponse(payloads.audits);
    if (normalizedUrl.includes("/api/pdca/cycles/cycle-1")) return createJsonResponse(payloads.pdcaCycleDetail);
    if (normalizedUrl.includes("/api/pdca/cycles")) return createJsonResponse(payloads.pdcaCycles);
    if (normalizedUrl.includes("/api/dashboard/global")) return createJsonResponse(payloads.dashboard);
    if (normalizedUrl.includes("/api/chat")) {
      ollamaCalled = true;
      return new Response("", { status: 503 });
    }
    return createJsonResponse([]);
  };

  try {
    const reply = await generateAssistantReply({
      message,
      history: [],
      token: "test-token",
      permissionScope: { can: () => true },
      lastMethod: null,
    });
    return { answer: reply.answer, ollamaCalled };
  } finally {
    global.fetch = originalFetch;
  }
}

const scenarios = [
  { message: "affiche les incidents", expect: "Voici la liste des incidents disponibles" },
  { message: "affiche les risques", expect: "Voici la liste des etudes de risque disponibles" },
  { message: "affiche les actifs", expect: "Voici la liste des actifs disponibles" },
  { message: "affiche la documentation", expect: "Voici la liste des documents disponibles" },
  { message: "affiche les formations", expect: "Voici la liste des formations disponibles" },
  { message: "affiche les clauses", expect: "Voici la liste des clauses disponibles" },
  { message: "affiche les controles", expect: "Voici la liste des controles disponibles" },
  { message: "affiche les controles non conformes", expect: "Voici la liste des controles non conformes / non mis en oeuvre" },
  { message: "affiche les audits", expect: "Voici la liste des audits disponibles" },
  { message: "affiche les actions correctives", expect: "Voici la liste des actions correctives en retard" },
  { message: "affiche le dashboard", expect: "Voici le resume du dashboard SMSI" },
  { message: "affiche le pdca", expect: "Voici la liste de progression PDCA par phase" },
];

for (const scenario of scenarios) {
  const result = await runScenario(scenario.message);
  assert.equal(
    result.ollamaCalled,
    false,
    `Le scenario "${scenario.message}" ne doit pas appeler l'LLM.`
  );
  assert.ok(
    result.answer.includes(scenario.expect),
    `Le scenario "${scenario.message}" doit retourner une reponse directe du module.`
  );
}

console.log("Direct modules list tests passed (12 scenarios).");
