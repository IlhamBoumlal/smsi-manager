import assert from "node:assert/strict";
import { CHAT_MODE, getIntentExecutionProfile, routeIntent } from "../src/services/intentRouterService.js";

const scenarios = [
  {
    name: "c'est quoi ISO 27001 ? -> pas de constats/impacts app",
    message: "c'est quoi ISO 27001 ?",
    expectedMode: CHAT_MODE.SMSI_EXPLANATION,
    assertProfile(profile) {
      assert.equal(profile.appDataUsed, false);
      assert.equal(profile.structuredAnalysis, false);
    },
  },
  {
    name: "c'est quoi un SMSI ? -> pas de donnees app",
    message: "c'est quoi un SMSI ?",
    expectedMode: CHAT_MODE.SMSI_EXPLANATION,
    assertProfile(profile) {
      assert.equal(profile.appDataUsed, false);
      assert.equal(profile.documentUsed, false);
    },
  },
  {
    name: "donne-moi un exemple d'etude de risque -> reponse SMSI complete",
    message: "donne-moi un exemple d'etude de risque",
    expectedMode: CHAT_MODE.SMSI_EXPLANATION,
    assertProfile(profile) {
      assert.equal(profile.appDataUsed, false);
      assert.equal(profile.llmCalled, true);
    },
  },
  {
    name: "analyse mes audits -> utilise les donnees application",
    message: "analyse mes audits",
    expectedMode: CHAT_MODE.APP_DATA_ANALYSIS,
    assertProfile(profile) {
      assert.equal(profile.appDataUsed, true);
      assert.equal(profile.structuredAnalysis, true);
    },
  },
  {
    name: "resume ce PDF -> utilise document/RAG",
    message: "resume ce PDF",
    expectedMode: CHAT_MODE.DOCUMENT_CHAT,
    assertProfile(profile) {
      assert.equal(profile.documentUsed, true);
      assert.equal(profile.ragUsed, true);
    },
  },
  {
    name: "comment je peux ajouter une etude de risque ? -> explication SMSI (pas action agent)",
    message: "comment je peux ajouter une etude de risque ?",
    expectedMode: CHAT_MODE.SMSI_EXPLANATION,
    assertProfile(profile) {
      assert.equal(profile.appDataUsed, false);
      assert.equal(profile.structuredAnalysis, false);
    },
  },
  {
    name: "ajoute un audit pour mon application -> action agent",
    message: "ajoute un audit pour mon application",
    expectedMode: CHAT_MODE.AGENT_ACTION,
    assertProfile(profile) {
      assert.equal(profile.appDataUsed, false);
      assert.equal(profile.llmCalled, true);
    },
  },
  {
    name: "donne moi le detail de l'atelier 4 ebios -> question SMSI (pas follow-up implicite)",
    message: "donne moi le detail de l'atelier 4 ebios",
    expectedMode: CHAT_MODE.SMSI_EXPLANATION,
    assertProfile(profile) {
      assert.equal(profile.appDataUsed, false);
      assert.equal(profile.documentUsed, false);
    },
  },
  {
    name: "comment appliquer EBIOS RM ? -> explication SMSI directe",
    message: "comment appliquer EBIOS RM ?",
    expectedMode: CHAT_MODE.SMSI_EXPLANATION,
    assertProfile(profile) {
      assert.equal(profile.appDataUsed, false);
      assert.equal(profile.structuredAnalysis, false);
    },
  },
];

const followUpHistory = [
  { role: "user", content: "quelles sont les clauses ISO 27001 ?" },
  { role: "assistant", content: "Les clauses d'exigences sont de 4 a 10..." },
];

const continueIntent = routeIntent("continue", followUpHistory);
assert.equal(
  continueIntent.mode,
  CHAT_MODE.SMSI_EXPLANATION,
  "Le follow-up 'continue' doit reutiliser le mode du contexte precedent."
);
assert.equal(continueIntent.followUp, true);
assert.equal(continueIntent.followUpType, "continue");

const detailIntent = routeIntent("explique plus", followUpHistory);
assert.equal(
  detailIntent.mode,
  CHAT_MODE.SMSI_EXPLANATION,
  "Le follow-up 'explique plus' doit reutiliser le mode du contexte precedent."
);
assert.equal(detailIntent.followUp, true);
assert.equal(detailIntent.followUpType, "detail");

const detailAltIntent = routeIntent("donne moi le detail", followUpHistory);
assert.equal(
  detailAltIntent.mode,
  CHAT_MODE.SMSI_EXPLANATION,
  "Le follow-up 'donne moi le detail' doit reutiliser le mode du contexte precedent."
);
assert.equal(detailAltIntent.followUp, true);
assert.equal(detailAltIntent.followUpType, "detail");

const appHistory = [
  { role: "user", content: "analyse mes audits" },
  { role: "assistant", content: "Voici les constats..." },
];
const appContinueIntent = routeIntent("continue", appHistory);
assert.equal(
  appContinueIntent.mode,
  CHAT_MODE.APP_DATA_ANALYSIS,
  "Le follow-up doit conserver le mode app_data_analysis quand le message precedent est une analyse app."
);

for (const scenario of scenarios) {
  const intent = routeIntent(scenario.message);
  assert.equal(intent.mode, scenario.expectedMode, `Mode invalide pour: ${scenario.name}`);

  const profile = getIntentExecutionProfile(intent.mode);
  scenario.assertProfile(profile);
}

console.log(`Intent router tests passed (${scenarios.length} scenarios).`);
