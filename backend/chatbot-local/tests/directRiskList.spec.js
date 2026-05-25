import assert from "node:assert/strict";
import { generateAssistantReply } from "../src/services/chatbotService.js";

const studies = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Etude CRM",
    organization: "Org A",
    author: "Alice",
    perimeter: "CRM",
    payloadJson: JSON.stringify({ workshop5: { riskEntries: [] }, workshop4: { operationalScenarios: [] } }),
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-20T12:00:00Z",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Etude ERP",
    organization: "Org A",
    author: "Bob",
    perimeter: "ERP",
    payloadJson: "{}",
    createdAt: "2026-05-02T10:00:00Z",
    updatedAt: "2026-05-21T12:00:00Z",
  },
];

const dashboard = {
  tauxGlobalConformite: 78,
  totalActifs: 5,
  totalControles: 12,
};

async function runScenario(message) {
  const originalFetch = global.fetch;
  let ollamaCalled = false;

  global.fetch = async (url) => {
    const normalizedUrl = String(url);
    if (normalizedUrl.includes("/api/risques/studies")) {
      return new Response(JSON.stringify(studies), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (normalizedUrl.includes("/api/dashboard/global")) {
      return new Response(JSON.stringify(dashboard), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (normalizedUrl.includes("/api/chat")) {
      ollamaCalled = true;
      return new Response("", { status: 503 });
    }

    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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

const detailed = await runScenario("affiche les risques");
assert.equal(detailed.ollamaCalled, false, "La reponse liste risques doit eviter l'appel LLM.");
assert.ok(
  detailed.answer.includes("Voici la liste des etudes de risque disponibles"),
  "La reponse doit lister les etudes de risque."
);
assert.ok(
  detailed.answer.includes("1. Etude ERP"),
  "Les etudes doivent etre triees par date de mise a jour (plus recente en premier)."
);
assert.ok(
  detailed.answer.includes("Total etudes de risque: 2."),
  "La reponse doit inclure le total d'etudes."
);

const shortPrompt = await runScenario("risques");
assert.equal(shortPrompt.ollamaCalled, false, "Un prompt court module doit aussi eviter l'appel LLM.");
assert.ok(
  shortPrompt.answer.includes("Etude ERP"),
  "Le prompt court doit retourner la liste des etudes de risque."
);

const withIds = await runScenario("affiche les risques avec id");
assert.ok(
  withIds.answer.includes("id=22222222-2222-2222-2222-222222222222"),
  "La reponse doit inclure les IDs techniques sur demande explicite."
);

console.log("Direct risk list tests passed (3 scenarios).");
