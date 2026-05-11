import assert from "node:assert/strict";
import {
  buildSmsiReferenceNotes,
  detectConversationMethodFromMessage,
  normalizeConversationMethod,
} from "../src/services/chatbotService.js";

const clauseQuestion = "quelles sont les clauses ISO 27001 ?";
const clauseNotes = buildSmsiReferenceNotes(clauseQuestion);

assert.ok(clauseNotes.length >= 3, "Les rappels clauses ISO 27001 doivent etre injectes.");
assert.ok(
  clauseNotes.some((note) => note.includes("clauses 4 a 10")),
  "La reponse doit rappeler les clauses 4 a 10."
);
assert.ok(
  clauseNotes.some((note) => note.includes("Annexe A n'est pas la liste des clauses")),
  "La reponse doit distinguer clauses et Annexe A."
);

const smsiQuestion = "c'est quoi un SMSI ?";
const smsiNotes = buildSmsiReferenceNotes(smsiQuestion);
assert.equal(smsiNotes.length, 0, "Une definition SMSI simple ne doit pas etre surchargee.");

const annexQuestion = "quels controles de l'annexe A ?";
const annexNotes = buildSmsiReferenceNotes(annexQuestion);
assert.ok(
  annexNotes.some((note) => note.includes("93 mesures de securite")),
  "La question Annexe A doit rappeler les 93 mesures."
);

const ebiosQuestion = "j'utilise la methode EBIOS RM";
const ebiosNotes = buildSmsiReferenceNotes(ebiosQuestion);
assert.ok(
  ebiosNotes.some((note) => note.includes("methode de reference de l'ANSSI")),
  "La question EBIOS doit inclure la definition correcte."
);
assert.ok(
  ebiosNotes.some((note) => note.includes("5 ateliers")),
  "La question EBIOS doit rappeler les 5 ateliers."
);
assert.ok(
  ebiosNotes.some((note) => note.includes("interdire le plan generique actif/menace/vulnerabilite")),
  "La question EBIOS doit interdire le schema generique actif/menace/vulnerabilite."
);

const persistedMethodNotes = buildSmsiReferenceNotes("continue", { forceEbios: true });
assert.ok(
  persistedMethodNotes.some((note) => note.includes("methode de reference de l'ANSSI")),
  "Le contexte LastMethod=EBIOS_RM doit injecter les rappels EBIOS meme sans mot-cle explicite."
);
assert.ok(
  persistedMethodNotes.some((note) => note.includes("5 ateliers")),
  "Le contexte LastMethod=EBIOS_RM doit forcer la structure des 5 ateliers."
);

assert.equal(
  detectConversationMethodFromMessage("On applique ebios rm"),
  "EBIOS_RM",
  "Un message contenant EBIOS doit activer LastMethod=EBIOS_RM."
);
assert.equal(
  normalizeConversationMethod("ebios rm"),
  "EBIOS_RM",
  "La normalisation du LastMethod doit supporter les variantes usuelles."
);

console.log("SMSI reference notes tests passed (5 scenarios).");
