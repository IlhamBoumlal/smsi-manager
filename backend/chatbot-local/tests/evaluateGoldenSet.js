import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { generateAssistantReply } from "../src/services/chatbotService.js";

const MOCK_PAYLOADS = {
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
      status: "Actif",
    },
    {
      id: "asset-2",
      nom: "Poste SOC",
      classification: "Secret",
      proprietaire: "SOC",
      criticite: "Moyenne",
      status: "Actif",
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
      date: "2026-05-01T10:00:00Z",
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
    nonConformeClauses: 1,
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
      dateEcheance: "2026-05-20T00:00:00Z",
      responsablePlan: "Equipe SOC",
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
    totalActifs: 2,
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

function installMockFetch() {
  const originalFetch = global.fetch;
  let ollamaCalled = false;

  global.fetch = async (url) => {
    const normalizedUrl = String(url);
    if (normalizedUrl.includes("/api/incidents")) return createJsonResponse(MOCK_PAYLOADS.incidents);
    if (normalizedUrl.includes("/api/risques/studies")) return createJsonResponse(MOCK_PAYLOADS.risques);
    if (normalizedUrl.includes("/api/actifs")) return createJsonResponse(MOCK_PAYLOADS.actifs);
    if (normalizedUrl.includes("/api/documentation")) return createJsonResponse(MOCK_PAYLOADS.documentation);
    if (normalizedUrl.includes("/api/sensibilisation/dashboard")) {
      return createJsonResponse(MOCK_PAYLOADS.formationsDashboard);
    }
    if (normalizedUrl.includes("/api/sensibilisation")) return createJsonResponse(MOCK_PAYLOADS.formations);
    if (normalizedUrl.includes("/api/clauses/stats")) return createJsonResponse(MOCK_PAYLOADS.clausesStats);
    if (normalizedUrl.includes("/api/clauses/dashboard")) return createJsonResponse(MOCK_PAYLOADS.clausesDashboard);
    if (normalizedUrl.includes("/api/controles")) return createJsonResponse(MOCK_PAYLOADS.controles);
    if (normalizedUrl.includes("/api/audits/ncs")) return createJsonResponse(MOCK_PAYLOADS.auditsNc);
    if (normalizedUrl.includes("/api/audits")) return createJsonResponse(MOCK_PAYLOADS.audits);
    if (normalizedUrl.includes("/api/pdca/cycles/cycle-1")) return createJsonResponse(MOCK_PAYLOADS.pdcaCycleDetail);
    if (normalizedUrl.includes("/api/pdca/cycles")) return createJsonResponse(MOCK_PAYLOADS.pdcaCycles);
    if (normalizedUrl.includes("/api/dashboard/global")) return createJsonResponse(MOCK_PAYLOADS.dashboard);
    if (normalizedUrl.includes("/api/chat")) {
      ollamaCalled = true;
      return new Response("", { status: 503 });
    }
    return createJsonResponse([]);
  };

  return {
    getOllamaCalled: () => ollamaCalled,
    restore: () => {
      global.fetch = originalFetch;
    },
  };
}

function loadDataset(datasetPath) {
  const absolutePath = path.isAbsolute(datasetPath)
    ? datasetPath
    : path.resolve(process.cwd(), datasetPath);
  const raw = readFileSync(absolutePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed?.scenarios)) {
    throw new Error(`Dataset invalide: scenarios absent (${absolutePath})`);
  }
  return { absolutePath, parsed };
}

function evaluateScenario(scenario, answer, ollamaCalled) {
  const failures = [];
  const expected = Array.isArray(scenario.expectedIncludes) ? scenario.expectedIncludes : [];
  const forbidden = Array.isArray(scenario.forbiddenIncludes) ? scenario.forbiddenIncludes : [];

  for (const expectedText of expected) {
    if (!String(answer).includes(String(expectedText))) {
      failures.push(`expected_missing="${expectedText}"`);
    }
  }

  for (const forbiddenText of forbidden) {
    if (String(answer).includes(String(forbiddenText))) {
      failures.push(`forbidden_present="${forbiddenText}"`);
    }
  }

  if (scenario.expectDirectAnswer === true && ollamaCalled) {
    failures.push("llm_called_unexpectedly");
  }

  return {
    pass: failures.length === 0,
    failures,
  };
}

function parseCliArgs(argv) {
  let datasetPath = "tests/goldenSet.v1.json";
  let outDir = "tests/reports/golden";
  let reportPrefix = "golden-eval";
  let writeReports = true;
  let datasetProvided = false;

  for (const arg of argv) {
    const token = String(arg || "").trim();
    if (!token) continue;

    if (token === "--no-report") {
      writeReports = false;
      continue;
    }
    if (token.startsWith("--dataset=")) {
      datasetPath = token.slice("--dataset=".length) || datasetPath;
      datasetProvided = true;
      continue;
    }
    if (token.startsWith("--out-dir=")) {
      outDir = token.slice("--out-dir=".length) || outDir;
      continue;
    }
    if (token.startsWith("--report-prefix=")) {
      reportPrefix = token.slice("--report-prefix=".length) || reportPrefix;
      continue;
    }

    if (!token.startsWith("--")) {
      if (!datasetProvided) {
        datasetPath = token;
        datasetProvided = true;
      } else {
        outDir = token;
      }
    }
  }

  return { datasetPath, outDir, reportPrefix, writeReports };
}

function formatTimestampForFile(date = new Date()) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}${second}`;
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function toCsv(rows, headers) {
  const headerLine = headers.map((column) => csvCell(column)).join(",");
  const dataLines = rows.map((row) =>
    headers.map((column) => csvCell(row[column])).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

function writeEvaluationReports({
  outDir,
  reportPrefix,
  datasetPath,
  version,
  generatedAt,
  passed,
  total,
  score,
  byModule,
  scenarioResults,
  failures,
}) {
  const absoluteOutDir = path.isAbsolute(outDir)
    ? outDir
    : path.resolve(process.cwd(), outDir);
  mkdirSync(absoluteOutDir, { recursive: true });

  const timestamp = formatTimestampForFile(new Date(generatedAt));
  const markdownRows = [];
  for (const [moduleKey, stats] of byModule.entries()) {
    const moduleScore =
      stats.total > 0
        ? Math.round((stats.passed / stats.total) * 10000) / 100
        : 0;
    markdownRows.push(
      `| ${moduleKey} | ${stats.passed} | ${stats.total} | ${moduleScore}% |`
    );
  }

  const failureLines =
    failures.length === 0
      ? ["Aucun echec."]
      : failures.flatMap((failure) => [
          `- ${failure.id} | ${failure.module} | "${failure.message}"`,
          `  causes: ${failure.failures.join(", ")}`,
          `  answer: ${String(failure.answer || "").replace(/\r?\n/g, " ")}`,
        ]);

  const markdown = [
    `# Rapport Golden Set (${reportPrefix})`,
    "",
    `- Dataset: ${datasetPath}`,
    `- Version: ${version}`,
    `- Genere le: ${generatedAt}`,
    `- Score global: ${passed}/${total} (${score}%)`,
    "",
    "## Score par module",
    "",
    "| Module | Passed | Total | Score |",
    "|---|---:|---:|---:|",
    ...markdownRows,
    "",
    "## Echecs",
    "",
    ...failureLines,
    "",
  ].join("\n");

  const csvHeaders = [
    "id",
    "module",
    "message",
    "pass",
    "expectDirectAnswer",
    "ollamaCalled",
    "failures",
    "expectedIncludes",
    "answer",
  ];
  const csvRows = scenarioResults.map((result) => ({
    id: result.id,
    module: result.module,
    message: result.message,
    pass: result.pass ? "true" : "false",
    expectDirectAnswer: result.expectDirectAnswer ? "true" : "false",
    ollamaCalled: result.ollamaCalled ? "true" : "false",
    failures: result.failures.join(" | "),
    expectedIncludes: result.expectedIncludes.join(" | "),
    answer: String(result.answer || "").replace(/\r?\n/g, " "),
  }));
  const csv = toCsv(csvRows, csvHeaders);

  const latestMarkdownPath = path.join(absoluteOutDir, `${reportPrefix}-latest.md`);
  const latestCsvPath = path.join(absoluteOutDir, `${reportPrefix}-latest.csv`);
  const timestampedMarkdownPath = path.join(
    absoluteOutDir,
    `${reportPrefix}-${timestamp}.md`
  );
  const timestampedCsvPath = path.join(
    absoluteOutDir,
    `${reportPrefix}-${timestamp}.csv`
  );

  writeFileSync(latestMarkdownPath, markdown, "utf8");
  writeFileSync(latestCsvPath, csv, "utf8");
  writeFileSync(timestampedMarkdownPath, markdown, "utf8");
  writeFileSync(timestampedCsvPath, csv, "utf8");

  return {
    absoluteOutDir,
    latestMarkdownPath,
    latestCsvPath,
    timestampedMarkdownPath,
    timestampedCsvPath,
  };
}

async function run() {
  const cli = parseCliArgs(process.argv.slice(2));
  const datasetPath = cli.datasetPath;
  const { absolutePath, parsed } = loadDataset(datasetPath);
  const scenarios = parsed.scenarios;
  const generatedAt = new Date().toISOString();

  const byModule = new Map();
  const failures = [];
  const scenarioResults = [];
  let passed = 0;

  for (const scenario of scenarios) {
    const harness = installMockFetch();
    let answer = "";
    let evaluation = { pass: false, failures: ["runtime_error"] };
    let ollamaCalled = false;

    try {
      const reply = await generateAssistantReply({
        message: String(scenario.message || ""),
        history: [],
        token: "golden-set-token",
        permissionScope: { can: () => true },
        lastMethod: null,
      });
      answer = String(reply?.answer || "");
      ollamaCalled = harness.getOllamaCalled();
      evaluation = evaluateScenario(scenario, answer, ollamaCalled);
    } catch (error) {
      evaluation = {
        pass: false,
        failures: [`runtime_error="${String(error?.message || error)}"`],
      };
      ollamaCalled = harness.getOllamaCalled();
    } finally {
      harness.restore();
    }

    const moduleKey = String(scenario.module || "unknown");
    if (!byModule.has(moduleKey)) {
      byModule.set(moduleKey, { total: 0, passed: 0 });
    }
    const moduleStats = byModule.get(moduleKey);
    moduleStats.total += 1;

    const scenarioResult = {
      id: String(scenario.id || "n/a"),
      module: moduleKey,
      message: String(scenario.message || ""),
      pass: Boolean(evaluation.pass),
      failures: Array.isArray(evaluation.failures) ? evaluation.failures : [],
      answer,
      expectedIncludes: Array.isArray(scenario.expectedIncludes)
        ? scenario.expectedIncludes.map((value) => String(value))
        : [],
      expectDirectAnswer: Boolean(scenario.expectDirectAnswer),
      ollamaCalled: Boolean(ollamaCalled),
    };
    scenarioResults.push(scenarioResult);

    if (evaluation.pass) {
      passed += 1;
      moduleStats.passed += 1;
      console.log(`[PASS] ${scenario.id} | ${moduleKey} | "${scenario.message}"`);
    } else {
      failures.push({
        id: scenario.id,
        module: moduleKey,
        message: scenario.message,
        failures: evaluation.failures,
        answer,
      });
      console.log(`[FAIL] ${scenario.id} | ${moduleKey} | "${scenario.message}" -> ${evaluation.failures.join(", ")}`);
    }
  }

  const total = scenarios.length;
  const score = total > 0 ? Math.round((passed / total) * 10000) / 100 : 0;

  console.log("");
  console.log(`Dataset: ${absolutePath}`);
  console.log(`Version: ${String(parsed.version || "n/a")}`);
  console.log(`Score global: ${passed}/${total} (${score}%)`);
  console.log("Score par module:");
  for (const [moduleKey, stats] of byModule.entries()) {
    const moduleScore = stats.total > 0 ? Math.round((stats.passed / stats.total) * 10000) / 100 : 0;
    console.log(`- ${moduleKey}: ${stats.passed}/${stats.total} (${moduleScore}%)`);
  }

  if (cli.writeReports) {
    const reportPaths = writeEvaluationReports({
      outDir: cli.outDir,
      reportPrefix: cli.reportPrefix,
      datasetPath: absolutePath,
      version: String(parsed.version || "n/a"),
      generatedAt,
      passed,
      total,
      score,
      byModule,
      scenarioResults,
      failures,
    });

    console.log("");
    console.log("Rapports generes:");
    console.log(`- Markdown latest: ${reportPaths.latestMarkdownPath}`);
    console.log(`- CSV latest: ${reportPaths.latestCsvPath}`);
    console.log(`- Markdown timestamp: ${reportPaths.timestampedMarkdownPath}`);
    console.log(`- CSV timestamp: ${reportPaths.timestampedCsvPath}`);
  }

  if (failures.length > 0) {
    console.log("");
    console.log("Echecs detailles:");
    for (const failure of failures) {
      console.log(`- ${failure.id} | ${failure.module} | "${failure.message}"`);
      console.log(`  causes: ${failure.failures.join(", ")}`);
      console.log(`  answer: ${failure.answer}`);
    }
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error(`Erreur evaluateGoldenSet: ${String(error?.stack || error?.message || error)}`);
  process.exitCode = 1;
});
