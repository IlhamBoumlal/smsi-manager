import { G_LABELS, MITRE_TACTICS, V_LABELS, riskEntryStatusLabel, riskLevel } from "./riskModel";

const safe = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const TECHNIQUE_CODE_PATTERN = /\bT\d{4}(?:\.\d{3})?\b/i;
const TABLE_CHUNK_SPLIT = "<!--TABLE_CHUNK_SPLIT-->";

function extractTechniqueCode(value) {
  const match = String(value || "").toUpperCase().match(TECHNIQUE_CODE_PATTERN);
  return match ? match[0] : "";
}

function extractTechniqueName(value, code) {
  const text = String(value || "").trim();
  if (!text || !code || text.toUpperCase() === code) return "";

  const withoutTrailingCode = text.replace(/\(\s*T\d{4}(?:\.\d{3})?\s*\)/i, "").trim();
  if (withoutTrailingCode && withoutTrailingCode.toUpperCase() !== code) return withoutTrailingCode;

  return "";
}

const MITRE_TECHNIQUE_NAME_BY_CODE = (() => {
  const map = new Map();
  MITRE_TACTICS.forEach((tactic) => {
    (tactic.techniques || []).forEach((entry) => {
      const code = extractTechniqueCode(entry);
      if (!code) return;
      const name = extractTechniqueName(entry, code);
      if (name) map.set(code, name);
    });
  });
  return map;
})();

function formatTechniqueLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const code = extractTechniqueCode(raw);
  if (!code) return raw;

  const explicitName = extractTechniqueName(raw, code);
  const catalogName = MITRE_TECHNIQUE_NAME_BY_CODE.get(code);
  const name = explicitName || catalogName;

  return name ? `${code} (${name})` : code;
}

function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const HEADER_ABBREVIATIONS = new Map([
  ["vraisemblance residuelle", "Vraisemblance resid."],
  ["scenario operationnel", "Scenario op."],
  ["scenario strategique", "Scenario strat."],
  ["parties prenantes", "Parties prenantes"],
]);

const LONG_TEXT_HEADER_HINTS = ["justification", "notes", "description", "commentaire", "impact"];
const SHORT_COLUMN_HINTS = ["statut", "gravite", "niveau", "priorite", "applicable", "type", "vraisemblance"];

function getHeaderMeta(header) {
  const raw = String(header || "");
  const normalized = normalizeToken(raw);
  const abbreviated = HEADER_ABBREVIATIONS.get(normalized);
  const display = abbreviated || raw;
  const isLongText = LONG_TEXT_HEADER_HINTS.some((hint) => normalized.includes(hint));
  const isShortColumn = SHORT_COLUMN_HINTS.some((hint) => normalized.includes(hint));
  const isLongHeader = display.length > 20;

  return {
    raw,
    display,
    normalized,
    isLongText,
    isShortColumn,
    thClass: isLongHeader ? "th-wrap" : "th-nowrap",
    tdClass: isLongText ? "td-longtext" : "",
  };
}

function getBaseColumnWidths(columnCount) {
  if (columnCount === 2) return [40, 60];
  if (columnCount === 3) return [25, 40, 35];
  if (columnCount === 4) return [20, 35, 20, 25];
  if (columnCount === 5) return [20, 25, 15, 15, 25];
  if (columnCount === 6) return [14, 20, 10, 22, 14, 20];
  if (columnCount <= 0) return [];
  return Array.from({ length: columnCount }, () => 100 / columnCount);
}

function normalizeWidthsTo100(widths) {
  const sum = widths.reduce((acc, value) => acc + value, 0);
  if (!sum) return widths;
  const normalized = widths.map((value) => (value * 100) / sum);
  const rounded = normalized.map((value) => Number(value.toFixed(2)));
  const roundedSum = rounded.reduce((acc, value) => acc + value, 0);
  const drift = Number((100 - roundedSum).toFixed(2));
  if (rounded.length) rounded[rounded.length - 1] = Number((rounded[rounded.length - 1] + drift).toFixed(2));
  return rounded;
}

function computeColumnWidths(headersMeta) {
  const widths = getBaseColumnWidths(headersMeta.length);
  if (!widths.length) return widths;

  const shortIndexes = headersMeta
    .map((meta, index) => (meta.isShortColumn ? index : -1))
    .filter((index) => index >= 0);

  let overflow = 0;
  shortIndexes.forEach((index) => {
    if (widths[index] > 15) {
      overflow += widths[index] - 15;
      widths[index] = 15;
    }
  });

  if (overflow > 0) {
    const receivers = headersMeta
      .map((meta, index) => (!meta.isShortColumn ? index : -1))
      .filter((index) => index >= 0);
    const targetIndexes = receivers.length ? receivers : widths.map((_, index) => index);
    const extra = overflow / targetIndexes.length;
    targetIndexes.forEach((index) => {
      widths[index] += extra;
    });
  }

  return normalizeWidthsTo100(widths);
}

function chunkRows(rows, chunkSize) {
  if (!Array.isArray(rows) || !rows.length) return [];
  const safeSize = Math.max(1, Number(chunkSize) || 1);
  const chunks = [];
  for (let index = 0; index < rows.length; index += safeSize) {
    chunks.push(rows.slice(index, index + safeSize));
  }
  if (chunks.length >= 2) {
    const last = chunks[chunks.length - 1];
    const prev = chunks[chunks.length - 2];
    if (last.length > 0 && last.length < 3 && prev.length > 3) {
      while (last.length < 3 && prev.length > 3) {
        last.unshift(prev.pop());
      }
    }
  }
  return chunks;
}

function suggestRowsPerChunk(headersMeta) {
  const columns = headersMeta.length;
  const hasLongTextColumn = headersMeta.some((meta) => meta.isLongText);

  let size = 6;
  if (columns <= 3) size = 8;
  else if (columns === 4) size = 6;
  else if (columns === 5) size = 5;
  else if (columns >= 6) size = 4;

  if (hasLongTextColumn) size -= 1;
  return Math.max(3, size);
}

function normalizeFilePart(value, fallback = "etude") {
  const cleaned = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return cleaned || fallback;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportStudyAsJson(study) {
  if (!study) return;
  const name = normalizeFilePart(study.name || "etude");
  const datePart = study.updatedAt || new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(study, null, 2)], { type: "application/json" });
  triggerDownload(blob, `ebios_rm_${name}_${datePart}.json`);
}

export function printWorkshopLivrable(study, workshopNum) {
  if (!study) return;
  void downloadWorkshopLivrablePdf(study, workshopNum);
}

async function downloadWorkshopLivrablePdf(study, workshopNum) {
  const now = new Date();
  const studyPart = normalizeFilePart(study.name || "etude");
  const workshopPart = Number(workshopNum) || 0;
  const datePart = now.toISOString().slice(0, 10);
  const filename = `livrable_ebios_${studyPart}_atelier_${workshopPart}_${datePart}.pdf`;
  const dateLabel = now.toLocaleDateString("fr-FR");

  try {
    const [{ jsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const autoTable = autoTableModule.default || autoTableModule.autoTable;
    if (typeof autoTable !== "function") throw new Error("jspdf-autotable indisponible");

    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    const layout = createPdfLayout(doc);
    drawPdfCoverAndMeta(doc, autoTable, layout, study, workshopPart, dateLabel);

    const sections = buildWorkshopSectionsForPdf(study, workshopPart);
    sections.forEach((section) => {
      ensurePdfSpace(doc, layout, estimateSectionLeadHeight(section));
      drawPdfSectionTitle(doc, layout, section.title);
      if (section.type === "table") {
        drawPdfTable(doc, autoTable, layout, section.headers || [], section.rows || []);
      } else if (section.type === "kv") {
        const rows = (section.rows || []).map((item) => [String(item[0] || "-"), String(item[1] || "-")]);
        drawPdfTable(doc, autoTable, layout, ["Champ", "Valeur"], rows, {
          widths: [26, 74],
          compact: true,
        });
      } else if (section.type === "text") {
        drawPdfTextBlock(doc, layout, section.text || "-");
      }
      layout.y += 2;
    });

    drawPdfFooter(doc, study, dateLabel);
    doc.save(filename);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Echec generation PDF.", error);
    window.alert("Impossible de generer le PDF pour ce livrable. Verifie le contenu et reessaie.");
  }
}

function createPdfLayout(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;
  const topY = 12;
  const bottomY = pageHeight - 12;
  return {
    pageWidth,
    pageHeight,
    marginX,
    topY,
    bottomY,
    contentWidth: pageWidth - marginX * 2,
    y: topY,
  };
}

function ensurePdfSpace(doc, layout, neededHeight = 10) {
  if (layout.y + neededHeight <= layout.bottomY) return;
  doc.addPage();
  layout.y = layout.topY;
}

function estimateSectionLeadHeight(section) {
  if (!section) return 18;
  if (section.type === "table") return 30;
  if (section.type === "kv") return 24;
  if (section.type === "text") return 20;
  return 22;
}

function drawPdfCoverAndMeta(doc, autoTable, layout, study, workshopNum, dateLabel) {
  const names = {
    1: "Cadrage et socle de securite",
    2: "Sources de risque",
    3: "Scenarios strategiques",
    4: "Scenarios operationnels",
    5: "Traitement du risque",
  };

  const coverHeight = 30;
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, layout.pageWidth, coverHeight, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Atelier ${workshopNum} - Livrable`, layout.marginX, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(names[workshopNum] || "Atelier", layout.marginX, 20);

  layout.y = 36;
  const infoRows = [
    ["Etude", study?.name || "-"],
    ["Organisation", study?.organization || "-"],
    ["Auteur", study?.author || "-"],
    ["Perimetre", study?.perimeter || "-"],
    ["Date / Atelier", `${dateLabel} - A${workshopNum}`],
  ];

  drawPdfTable(doc, autoTable, layout, ["Champ", "Valeur"], infoRows, {
    widths: [26, 74],
    compact: true,
    headBg: [219, 234, 254],
    bodyBg: [248, 250, 252],
    bodyFontSize: 8.5,
    suppressSemantic: true,
  });
  layout.y += 2;
}

function drawPdfSectionTitle(doc, layout, title) {
  const h = 8;
  ensurePdfSpace(doc, layout, h + 12);
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(layout.marginX, layout.y, layout.contentWidth, h, 1.2, 1.2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(String(title || "-"), layout.marginX + 2.5, layout.y + 5.3);
  layout.y += h + 1.4;
}

function getColumnWidthPercents(headers) {
  const meta = headers.map(getHeaderMeta);
  return computeColumnWidths(meta);
}

function mapTableCell(value) {
  if (value === null || value === undefined) return "-";
  return String(value);
}

function semanticCellStyle(header, value) {
  const h = normalizeToken(header);
  const v = normalizeToken(value);
  if (!v) return null;

  // Statut
  if (h.includes("statut")) {
    if (v === "fait" || v === "applique") return { fillColor: [209, 250, 229], textColor: [6, 95, 70], halign: "center", fontStyle: "bold" };
    if (v === "en cours" || v === "partiel") return { fillColor: [254, 243, 199], textColor: [146, 64, 14], halign: "center", fontStyle: "bold" };
    if (v === "a faire" || v === "non applique") return { fillColor: [243, 244, 246], textColor: [55, 65, 81], halign: "center", fontStyle: "bold" };
  }

  // Priorite
  if (h.includes("priorite")) {
    if (v === "critique") return { fillColor: [254, 226, 226], textColor: [153, 27, 27], halign: "center", fontStyle: "bold" };
    if (v === "haute" || v === "elevee") return { fillColor: [254, 243, 199], textColor: [146, 64, 14], halign: "center", fontStyle: "bold" };
    if (v === "normale" || v === "moyenne") return { fillColor: [219, 234, 254], textColor: [30, 64, 175], halign: "center", fontStyle: "bold" };
  }

  // Niveau de risque
  if (h.includes("niveau")) {
    if (v.includes("critique")) return { fillColor: [254, 226, 226], textColor: [153, 27, 27], halign: "center", fontStyle: "bold" };
    if (v.includes("eleve") || v.includes("grave")) return { fillColor: [254, 243, 199], textColor: [146, 64, 14], halign: "center", fontStyle: "bold" };
    if (v.includes("moyen")) return { fillColor: [254, 249, 195], textColor: [133, 77, 14], halign: "center", fontStyle: "bold" };
    if (v.includes("faible")) return { fillColor: [209, 250, 229], textColor: [6, 95, 70], halign: "center", fontStyle: "bold" };
  }

  // Gravite / vraisemblance
  if (h.includes("gravite") || h.includes("vraisemblance")) {
    if (v.startsWith("g4") || v.startsWith("v4")) return { fillColor: [254, 226, 226], textColor: [153, 27, 27], halign: "center", fontStyle: "bold" };
    if (v.startsWith("g3") || v.startsWith("v3")) return { fillColor: [255, 237, 213], textColor: [154, 52, 18], halign: "center", fontStyle: "bold" };
    if (v.startsWith("g2") || v.startsWith("v2")) return { fillColor: [254, 243, 199], textColor: [146, 64, 14], halign: "center", fontStyle: "bold" };
    if (v.startsWith("g1") || v.startsWith("v1")) return { fillColor: [209, 250, 229], textColor: [6, 95, 70], halign: "center", fontStyle: "bold" };
  }

  return null;
}

function drawPdfTable(doc, autoTable, layout, headers, rows, options = {}) {
  if (typeof autoTable !== "function") {
    // fallback for header meta table call before autoTable injection
    // no-op protection
    return;
  }

  const cleanHeaders = Array.isArray(headers) ? headers : [];
  const cleanRows = Array.isArray(rows) ? rows : [];
  const widths = Array.isArray(options.widths) ? options.widths : getColumnWidthPercents(cleanHeaders);
  const headersMeta = cleanHeaders.map((header) => getHeaderMeta(header));
  const compact = Boolean(options.compact);

  const minimumLeadRows = Number(options.minimumLeadRows) || 2;
  const estimatedLeadHeight = (compact ? 5.8 : 6.8) * (minimumLeadRows + (options.hideHead ? 0 : 1)) + 2;
  ensurePdfSpace(doc, layout, estimatedLeadHeight);

  const colStyles = {};
  widths.forEach((w, index) => {
    colStyles[index] = { cellWidth: (layout.contentWidth * w) / 100 };
  });

  const headerCells = headersMeta.map((meta) => meta.display);
  const bodyRows = cleanRows.map((row) => cleanHeaders.map((_, index) => mapTableCell(row?.[index])));

  const shared = {
    startY: layout.y,
    margin: { left: layout.marginX, right: layout.marginX },
    tableWidth: layout.contentWidth,
    pageBreak: "auto",
    rowPageBreak: "avoid",
    styles: {
      font: "helvetica",
      fontSize: options.bodyFontSize || (compact ? 8.3 : 8.8),
      cellPadding: compact ? { top: 2, right: 2.2, bottom: 2, left: 2.2 } : { top: 2.5, right: 2.8, bottom: 2.5, left: 2.8 },
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
      textColor: [51, 65, 85],
      overflow: "linebreak",
      valign: "top",
      minCellHeight: compact ? 6.8 : 7.8,
    },
    headStyles: {
      fillColor: options.headBg || [226, 232, 240],
      textColor: [30, 41, 59],
      fontStyle: "bold",
      fontSize: compact ? 8.2 : 8.4,
      cellPadding: compact ? { top: 1.8, right: 2, bottom: 1.8, left: 2 } : { top: 2.2, right: 2.4, bottom: 2.2, left: 2.4 },
      minCellHeight: compact ? 7 : 7.6,
      valign: "middle",
    },
    alternateRowStyles: options.bodyBg ? undefined : { fillColor: [248, 250, 252] },
    bodyStyles: options.bodyBg
      ? { fillColor: options.bodyBg }
      : undefined,
    columnStyles: colStyles,
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const columnHeader = cleanHeaders[data.column.index] || "";
      const headerMeta = headersMeta[data.column.index];
      if (headerMeta?.isShortColumn) {
        data.cell.styles.halign = "center";
      }
      if (options.suppressSemantic) return;
      const style = semanticCellStyle(columnHeader, data.cell.raw);
      if (style) Object.assign(data.cell.styles, style);
    },
  };

  if (!bodyRows.length) {
    bodyRows.push([`Aucune donnee${cleanHeaders.length > 1 ? "" : "."}`].concat(Array.from({ length: Math.max(0, cleanHeaders.length - 1) }, () => "")));
  }

  if (options.hideHead) {
    autoTable(doc, {
      ...shared,
      body: bodyRows,
      showHead: "never",
    });
  } else {
    autoTable(doc, {
      ...shared,
      head: [headerCells],
      body: bodyRows,
      showHead: "everyPage",
    });
  }

  layout.y = (doc.lastAutoTable?.finalY || layout.y) + 3.2;
}

function drawPdfTextBlock(doc, layout, text) {
  const content = String(text || "-");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(content, layout.contentWidth - 4);
  const lineHeight = 4.2;
  const height = Math.max(10, lines.length * lineHeight + 4);
  ensurePdfSpace(doc, layout, height + 2);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(layout.marginX, layout.y, layout.contentWidth, height, 1, 1, "FD");
  doc.setTextColor(51, 65, 85);
  doc.text(lines, layout.marginX + 2, layout.y + 5);
  layout.y += height + 2.8;
}

function drawPdfFooter(doc, study, dateLabel) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const y = pageHeight - 4.2;

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(241, 245, 249);
    doc.line(8, pageHeight - 8.2, pageWidth - 8, pageHeight - 8.2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.4);
    doc.setTextColor(100, 116, 139);
    doc.text("SMSI Manager - EBIOS RM", 8, y);
    doc.text(`${study?.name || "Etude"} - ${dateLabel}`, pageWidth / 2, y, { align: "center" });
    doc.text(`Page ${page}/${totalPages}`, pageWidth - 8, y, { align: "right" });
  }
}

function riskLabelFromScore(gravity, likelihood) {
  const level = riskLevel(gravity, likelihood);
  return `${level.label} (${level.score})`;
}

function buildWorkshopSectionsForPdf(study, workshopNum) {
  const w1 = study?.workshop1 || {};
  const w2 = study?.workshop2 || {};
  const w3 = study?.workshop3 || {};
  const w4 = study?.workshop4 || {};
  const w5 = study?.workshop5 || {};

  const missionMap = new Map((w1.missions || []).map((item) => [item.id, item.name]));
  const businessValueMap = new Map((w1.businessValues || []).map((item) => [item.id, item.name]));
  const sourceMap = new Map((w2.riskSources || []).map((item) => [item.id, item.name]));
  const objectiveMap = new Map((w2.targetObjectives || []).map((item) => [item.id, item.name]));
  const pairMap = new Map((w2.sourceObjectivePairs || []).map((item) => [item.id, item]));
  const stakeholderMap = new Map((w3.stakeholders || []).map((item) => [item.id, item.name]));
  const strategicMap = new Map((w3.strategicScenarios || []).map((item) => [item.id, item.name]));
  const opModeMap = new Map((w4.operationalModes || []).map((item) => [item.id, item.name]));
  const opScenarioMap = new Map((w4.operationalScenarios || []).map((item) => [item.id, item.name]));
  const supportingAssetMap = new Map((w1.supportingAssets || []).map((item) => [item.id, item.name]));
  const measureMap = new Map((w5.measures || []).map((item) => [item.id, item.name]));

  if (workshopNum === 1) {
    return [
      {
        title: "Equipe et Responsabilites",
        type: "table",
        headers: ["Role", "Nom", "Responsabilite", "Contact"],
        rows: (w1.team || []).map((m) => [m.role, m.name, m.responsibility, m.contact]),
      },
      {
        title: "Contexte de l'etude",
        type: "kv",
        rows: [
          ["Description", w1.context?.description || w1.context?.general || "-"],
          ["Perimetre", w1.context?.perimeter || "-"],
          ["Environnement", w1.context?.environment || w1.context?.regulatory || "-"],
          ["Hypotheses / Contraintes", w1.context?.hypotheses || w1.context?.constraints || w1.context?.assumptions || "-"],
        ],
      },
      {
        title: "Missions et Valeurs Metier",
        type: "table",
        headers: ["Mission", "Valeur metier", "Type", "Description"],
        rows: (w1.businessValues || []).map((v) => [missionMap.get(v.missionId) || "-", v.name, v.type || "-", v.description || "-"]),
      },
      {
        title: "Biens supports",
        type: "table",
        headers: ["Valeur", "Bien support", "Type", "Localisation", "Criticite"],
        rows: (w1.supportingAssets || []).map((a) => [businessValueMap.get(a.businessValueId) || "-", a.name, a.type || "-", a.location || "-", a.criticality || "-"]),
      },
      {
        title: "Evenements redoutes",
        type: "table",
        headers: ["Valeur", "Evenement redoute", "Impact", "Gravite"],
        rows: (w1.fearedEvents || []).map((e) => [businessValueMap.get(e.businessValueId) || "-", e.description || "-", e.impact || "-", `G${e.gravity || "-"} - ${G_LABELS[e.gravity] || "-"}`]),
      },
      {
        title: "Controles ISO 27001:2022",
        type: "table",
        headers: ["Reference", "Controle", "Statut", "Commentaires"],
        rows: (w1.isoControls || []).map((c) => [c.reference || "-", c.name || "-", c.status || "-", c.comments || "-"]),
      },
    ];
  }

  if (workshopNum === 2) {
    const matrixHeaders = ["Source / Objectif", ...(w2.targetObjectives || []).map((t) => t.name || "-")];
    const matrixRows = (w2.riskSources || []).map((source) => {
      const row = [source.name || "-"];
      (w2.targetObjectives || []).forEach((target) => {
        const pair = (w2.sourceObjectivePairs || []).find((p) => p.riskSourceId === source.id && p.targetObjectiveId === target.id);
        row.push(pair?.retained ? "Oui" : "-");
      });
      return row;
    });

    return [
      {
        title: "Caracterisation des Sources de Risque",
        type: "table",
        headers: ["Nom", "Type", "Motivation", "Capacite"],
        rows: (w2.riskSources || []).map((s) => [s.name, s.type || "-", s.motivation || "-", `${s.capability || "-"}/4`]),
      },
      {
        title: "Objectifs vises",
        type: "table",
        headers: ["Objectif", "Description", "Evenements associes"],
        rows: (w2.targetObjectives || []).map((o) => [o.name, o.description || "-", String((o.fearedEventIds || []).length)]),
      },
      {
        title: "Identification des couples",
        type: "table",
        headers: ["Source de risque", "Objectif vise", "Pertinence", "Justification"],
        rows: (w2.sourceObjectivePairs || []).map((p) => [sourceMap.get(p.riskSourceId) || "-", objectiveMap.get(p.targetObjectiveId) || "-", p.retained ? "Pertinent" : "Non pertinent", p.justification || "-"]),
      },
      {
        title: "Tableau de Reference (Pertinence)",
        type: "table",
        headers: matrixHeaders,
        rows: matrixRows,
      },
    ];
  }

  if (workshopNum === 3) {
    return [
      {
        title: "Parties prenantes",
        type: "table",
        headers: ["Nom", "Type", "Acces"],
        rows: (w3.stakeholders || []).map((s) => [s.name, s.type || "-", s.access || "-"]),
      },
      {
        title: "Scenarios strategiques",
        type: "table",
        headers: ["Scenario", "Couple SR/OV", "Parties prenantes", "Gravite"],
        rows: (w3.strategicScenarios || []).map((s) => {
          const pair = pairMap.get(s.coupleId);
          const couple = pair ? `${sourceMap.get(pair.riskSourceId) || "-"} -> ${objectiveMap.get(pair.targetObjectiveId) || "-"}` : "-";
          const actors = (s.stakeholderIds || []).map((id) => stakeholderMap.get(id)).filter(Boolean).join(", ") || "-";
          return [s.name || "-", couple, actors, `G${s.gravity || "-"} - ${G_LABELS[s.gravity] || "-"}`];
        }),
      },
      {
        title: "Traitement des risques strategiques",
        type: "table",
        headers: ["Scenario", "Decision", "Justification"],
        rows: (w3.treatments || []).map((t) => [strategicMap.get(t.scenarioId) || "-", t.decision || "-", t.justification || "-"]),
      },
      {
        title: "Matrice de Criticite des Parties Prenantes",
        type: "table",
        headers: ["Partie prenante", "Type", "Exposition", "Fiabilite", "Zone"],
        rows: (w3.stakeholders || []).map((s) => {
          const score = Number(s.exposure || 1) * Number(s.reliability || 1);
          const zone = score >= 9 ? "Critique" : score >= 6 ? "Elevee" : score >= 3 ? "Moderee" : "Faible";
          return [s.name || "-", s.type || "-", String(s.exposure || "-"), String(s.reliability || "-"), zone];
        }),
      },
    ];
  }

  if (workshopNum === 4) {
    return [
      {
        title: "Echelle de calcul de vraisemblance",
        type: "table",
        headers: ["Niveau", "Libelle", "Description"],
        rows: [
          ["V1", "Minimal", "Attaque peu probable"],
          ["V2", "Significatif", "Attaque possible"],
          ["V3", "Fort", "Attaque probable"],
          ["V4", "Maximal", "Attaque tres probable"],
        ],
      },
      {
        title: "Modes operatoires",
        type: "table",
        headers: ["Mode operatoire", "Scenario strategique", "Techniques"],
        rows: (w4.operationalModes || []).map((m) => [m.name || "-", strategicMap.get(m.strategicScenarioId) || "-", (m.technics || []).map((t) => formatTechniqueLabel(t)).join(", ") || "-"]),
      },
      {
        title: "Scenarios operationnels",
        type: "table",
        headers: ["Scenario operationnel", "Scenario strategique", "Modes", "Biens", "Vraisemblance"],
        rows: (w4.operationalScenarios || []).map((s) => [
          s.name || "-",
          strategicMap.get(s.strategicScenarioId) || "-",
          (s.operationalModeIds || []).map((id) => opModeMap.get(id)).filter(Boolean).join(", ") || "-",
          (s.supportingAssetIds || []).map((id) => supportingAssetMap.get(id) || "-").filter((item) => item !== "-").join(", ") || "-",
          `V${s.likelihood || "-"} - ${V_LABELS[s.likelihood] || "-"}`,
        ]),
      },
    ];
  }

  if (workshopNum === 5) {
    const measuresByCategory = ["Gouvernance", "Protection", "Defense", "Resilience", "Conformite"].map((category) => ({
      title: category,
      rows: (w5.measures || [])
        .filter((m) => m.category === category)
        .map((m) => [m.name || "-", m.description || "-", m.priority || "-", m.status || "-"]),
    }));

    const sections = [
      {
        title: "Registre des Risques",
        type: "table",
        headers: ["Scenario", "Gravite", "Vraisemblance", "Niveau", "Statut", "Responsable", "Traitement"],
        rows: (w5.riskEntries || []).map((r) => [
          opScenarioMap.get(r.operationalScenarioId) || "-",
          `G${r.gravity || "-"} - ${G_LABELS[r.gravity] || "-"}`,
          `V${r.likelihood || "-"} - ${V_LABELS[r.likelihood] || "-"}`,
          riskLabelFromScore(r.gravity, r.likelihood),
          riskEntryStatusLabel(r.status),
          r.ownerName || r.ownerUserId || "-",
          r.treatment || "-",
        ]),
      },
      {
        title: "Tableau des Criteres de Traitement",
        type: "table",
        headers: ["Scenario", "Niveau initial", "Decision", "Notes"],
        rows: (w5.riskEntries || []).map((r) => [
          opScenarioMap.get(r.operationalScenarioId) || "-",
          riskLabelFromScore(r.gravity, r.likelihood),
          r.treatment || "-",
          r.notes || "-",
        ]),
      },
      {
        title: "Matrice des Risques Residuels",
        type: "table",
        headers: ["Risque", "Gravite residuelle", "Vraisemblance residuelle", "Niveau residuel", "Justification"],
        rows: (w5.residualRisks || []).map((r) => {
          const parent = (w5.riskEntries || []).find((entry) => entry.id === r.riskEntryId);
          const scenarioLabel = parent ? opScenarioMap.get(parent.operationalScenarioId) || "-" : "-";
          return [
            scenarioLabel,
            `G${r.residualGravity || "-"} - ${G_LABELS[r.residualGravity] || "-"}`,
            `V${r.residualLikelihood || "-"} - ${V_LABELS[r.residualLikelihood] || "-"}`,
            riskLabelFromScore(r.residualGravity, r.residualLikelihood),
            r.justification || "-",
          ];
        }),
      },
    ];

    measuresByCategory.forEach((entry) => {
      sections.push({
        title: entry.title,
        type: "table",
        headers: ["Mesure", "Description", "Priorite", "Statut"],
        rows: entry.rows,
      });
    });

    if ((w5.soa || []).length) {
      sections.push({
        title: "SoA minimal",
        type: "table",
        headers: ["Reference", "Objectif", "Applicable", "Justification", "Mise en oeuvre", "Mesures liees"],
        rows: (w5.soa || []).map((s) => [
          s.reference || "-",
          s.objective || "-",
          s.applicable === "oui" ? "Oui" : "Non",
          s.justification || "-",
          s.implementationStatus || "-",
          (s.linkedMeasureIds || []).map((id) => measureMap.get(id)).filter(Boolean).join(", ") || "-",
        ]),
      });
    }

    sections.push({
      title: "Gouvernance & Anticipation",
      type: "kv",
      rows: [
        ["Risques", String((w5.riskEntries || []).length)],
        ["Mesures", String((w5.measures || []).length)],
        ["Risques residuels", String((w5.residualRisks || []).length)],
        ["Mesures faites", String((w5.measures || []).filter((m) => normalizeToken(m.status) === "fait").length)],
      ],
    });

    return sections;
  }

  return [{ title: "Livrable", type: "text", text: "Aucune donnee disponible pour cet atelier." }];
}

function badgeClassByScore(score) {
  if (score >= 12) return "b-high";
  if (score >= 6) return "b-med";
  if (score >= 3) return "b-prog";
  return "b-low";
}

function badgeGravity(g) {
  const level = Number(g || 1);
  return `<span class="badge b-g${Math.max(1, Math.min(4, level))}">G${level} - ${safe(G_LABELS[level] || "-")}</span>`;
}

function badgeLikelihood(v) {
  const level = Number(v || 1);
  return `<span class="badge b-g${Math.max(1, Math.min(4, level))}">V${level} - ${safe(V_LABELS[level] || "-")}</span>`;
}

function badgeRisk(gravity, likelihood) {
  const level = riskLevel(gravity, likelihood);
  return `<span class="badge ${badgeClassByScore(level.score)}">${safe(level.label)} (${level.score})</span>`;
}

function badgeStatus(status) {
  const token = normalizeToken(status);
  if (token === "fait") return `<span class="badge b-status-done">${safe(status || "Fait")}</span>`;
  if (token === "en cours") return `<span class="badge b-status-progress">${safe(status || "En cours")}</span>`;
  if (token === "a faire") return `<span class="badge b-status-todo">${safe(status || "A faire")}</span>`;
  return `<span class="badge b-neutral">${safe(status || "-")}</span>`;
}

function badgePriority(priority) {
  const token = normalizeToken(priority);
  if (token === "critique") return `<span class="badge b-priority-critical">${safe(priority || "Critique")}</span>`;
  if (token === "haute") return `<span class="badge b-priority-high">${safe(priority || "Haute")}</span>`;
  if (token === "normale" || token === "moyenne") return `<span class="badge b-priority-normal">${safe(priority || "Normale")}</span>`;
  return `<span class="badge b-priority-normal">${safe(priority || "-")}</span>`;
}

function livrableCSS() {
  return `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Segoe UI,Roboto,Arial,sans-serif;font-size:12.5px;color:#1e293b;background:#fff}
    .page{width:100%;max-width:200mm;min-height:297mm;margin:0;background:#fff;padding-bottom:14mm}
    .cover{background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;padding:40px 28px 30px}
    .cover h1{font-size:26px;font-weight:800;margin-bottom:3px}
    .cover h2{font-size:14px;font-weight:500;opacity:.9}
    .info{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px 16px;margin:14px 16px;border:1px solid #dbeafe;border-radius:10px;background:#eff6ff}
    .info-item{display:flex;flex-direction:column;gap:2px}
    .info-item label{font-size:9.5px;color:#1d4ed8;text-transform:uppercase;font-weight:700;letter-spacing:.08em}
    .info-item span{font-size:11.5px;color:#1e293b;font-weight:600;overflow-wrap:break-word;word-break:break-word;max-width:100%}
    .info-perimeter-value{word-wrap:break-word;overflow-wrap:break-word;max-width:100%}
    .section{margin:0 16px 14px;break-inside:auto;page-break-inside:auto}
    .section-title{background:linear-gradient(90deg,#1d4ed8,#3b82f6);color:#fff;padding:9px 12px;border-radius:8px 8px 0 0;font-size:12.5px;font-weight:700;break-inside:avoid;break-inside:avoid-page;page-break-inside:avoid;break-after:avoid;break-after:avoid-page;page-break-after:avoid}
    .section-table{break-inside:auto;page-break-inside:auto}
    .section-body{border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;padding:12px;background:#fff;break-inside:auto;page-break-inside:auto}
    .section-table .section-body{break-inside:auto;page-break-inside:auto}
    .section-title+.section-body>.table-chunk:first-child{break-before:avoid-page;page-break-before:avoid}
    .table-chunk{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;page-break-inside:avoid;break-inside:avoid-page}
    .table-chunk+.table-chunk{margin-top:8px}
    .table-chunk thead{break-inside:avoid;break-inside:avoid-page;page-break-inside:avoid;break-after:avoid;break-after:avoid-page;page-break-after:avoid}
    .table-chunk tbody>tr{break-inside:avoid;break-inside:avoid-page;page-break-inside:avoid}
    table{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;page-break-inside:auto;break-inside:auto}
    thead{display:table-header-group}
    tbody{display:table-row-group}
    thead tr{height:40px}
    th{background:#f1f5f9;color:#334155;text-transform:uppercase;letter-spacing:.06em;font-size:9.5px;text-align:left;padding:8px;border-bottom:1px solid #cbd5e1;vertical-align:middle;line-height:1.25}
    th.th-nowrap{white-space:nowrap}
    th.th-wrap{white-space:normal;min-width:120px}
    td{padding:0;border-bottom:1px solid #e2e8f0;vertical-align:top;color:#334155;overflow-wrap:break-word;word-break:break-word}
    .td-cell{padding:10px 12px;line-height:1.5;min-height:0}
    .td-cell.td-longtext{min-height:48px}
    tr,th,td{break-inside:avoid;break-inside:avoid-page;page-break-inside:avoid}
    tr:last-child td{border-bottom:none}
    .badge{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:700}
    .b-g1{background:#dcfce7;color:#166534}.b-g2{background:#fef3c7;color:#a16207}.b-g3{background:#ffedd5;color:#c2410c}.b-g4{background:#fee2e2;color:#b91c1c}
    .b-low{background:#d1fae5;color:#065f46}.b-prog{background:#fef9c3;color:#854d0e}.b-med{background:#ffedd5;color:#9a3412}.b-high{background:#fee2e2;color:#991b1b}
    .b-status-done{background:#d1fae5;color:#065f46}
    .b-status-progress{background:#fef3c7;color:#92400e}
    .b-status-todo{background:#f3f4f6;color:#374151}
    .b-priority-critical{background:#fee2e2;color:#991b1b}
    .b-priority-high{background:#fef3c7;color:#92400e}
    .b-priority-normal{background:#dbeafe;color:#1e40af}
    .b-blue{background:#dbeafe;color:#1d4ed8}.b-neutral{background:#f1f5f9;color:#475569}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .mini{border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;padding:9px}
    .mini h4{font-size:10.5px;font-weight:700;color:#1d4ed8;margin-bottom:4px}
    .mini p{font-size:10.5px;line-height:1.45;color:#334155}
    .tag{display:inline-block;margin:2px 4px 2px 0;padding:3px 7px;border-radius:999px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-size:9.5px;font-weight:700}
    .no-break,.no-break .section-body{break-inside:avoid;break-inside:avoid-page;page-break-inside:avoid}
    @media (max-width:960px){.info{grid-template-columns:repeat(2,minmax(0,1fr))}.grid2{grid-template-columns:1fr}}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .section{break-inside:auto;page-break-inside:auto}
      .section-table{break-inside:auto;page-break-inside:auto}
      .section-title{break-after:avoid;break-after:avoid-page;page-break-after:avoid}
      .no-break,.no-break .section-body{break-inside:avoid;break-inside:avoid-page;page-break-inside:avoid}
      .keep-with-next{break-after:avoid;break-after:avoid-page;page-break-after:avoid}
      .section-title+.section-body>.table-chunk:first-child{break-before:avoid-page;page-break-before:avoid}
      .table-chunk{page-break-inside:avoid;break-inside:avoid-page}
      .table-chunk thead{display:table-header-group;break-inside:avoid;break-inside:avoid-page;page-break-inside:avoid;break-after:avoid;break-after:avoid-page;page-break-after:avoid}
      .table-chunk tbody>tr{break-inside:avoid;break-inside:avoid-page;page-break-inside:avoid}
    }
  `;
}

function infoBlock(study, today, workshopNum) {
  return `
    <div class="info">
      <div class="info-item"><label>Etude</label><span>${safe(study.name)}</span></div>
      <div class="info-item"><label>Organisation</label><span>${safe(study.organization)}</span></div>
      <div class="info-item"><label>Auteur</label><span>${safe(study.author)}</span></div>
      <div class="info-item"><label>Perimetre</label><span class="info-perimeter-value">${safe(study.perimeter)}</span></div>
      <div class="info-item"><label>Date / Atelier</label><span>${safe(today)} - A${workshopNum}</span></div>
    </div>
  `;
}

function section(title, body) {
  const isTableSection = /<table[\s>]/i.test(body);
  if (isTableSection && body.includes(TABLE_CHUNK_SPLIT)) {
    return body
      .split(TABLE_CHUNK_SPLIT)
      .filter((chunk) => chunk.trim().length > 0)
      .map((chunk, index) => {
        const sectionTitle = index === 0 ? safe(title) : `${safe(title)} (suite)`;
        return `<section class="section section-table"><div class="section-title keep-with-next">${sectionTitle}</div><div class="section-body">${chunk}</div></section>`;
      })
      .join("");
  }

  const sectionClass = isTableSection ? "section section-table" : "section no-break";
  return `<section class="${sectionClass}"><div class="section-title keep-with-next">${safe(title)}</div><div class="section-body">${body}</div></section>`;
}

function table(headers, rows, emptyText = "Aucune donnee") {
  const meta = headers.map(getHeaderMeta);
  const widths = computeColumnWidths(meta);
  const colgroupHtml = widths.length
    ? `<colgroup>${widths.map((width) => `<col style="width:${width}%">`).join("")}</colgroup>`
    : "";

  const headerHtml = meta
    .map((column) => `<th class="${column.thClass}" title="${safe(column.raw)}">${safe(column.display)}</th>`)
    .join("");

  const renderRow = (row) => {
    const cells = headers.map((_, index) => row[index] ?? "-");
    return `<tr>${cells
      .map((cell, index) => {
        const tdClass = meta[index]?.tdClass ? ` ${meta[index].tdClass}` : "";
        return `<td><div class="td-cell${tdClass}">${cell}</div></td>`;
      })
      .join("")}</tr>`;
  };

  if (!rows.length) {
    const emptyBody = `<tbody><tr><td colspan="${headers.length}"><div class="td-cell"><em>${safe(emptyText)}</em></div></td></tr></tbody>`;
    return `<table class="table-chunk">${colgroupHtml}<thead><tr>${headerHtml}</tr></thead>${emptyBody}</table>`;
  }

  const rowChunks = chunkRows(rows, suggestRowsPerChunk(meta));
  return rowChunks
    .map((chunk) => `<table class="table-chunk">${colgroupHtml}<thead><tr>${headerHtml}</tr></thead><tbody>${chunk.map(renderRow).join("")}</tbody></table>`)
    .join(TABLE_CHUNK_SPLIT);
}

function buildWorkshop1(study) {
  const w = study.workshop1;
  const team = table(
    ["Role", "Nom", "Responsabilite", "Contact"],
    (w.team || []).map((member) => [safe(member.role), safe(member.name), safe(member.responsibility), safe(member.contact)]),
  );

  const context = `<div class="grid2">
    <div class="mini"><h4>Description</h4><p>${safe(w.context?.description || w.context?.general || "-")}</p></div>
    <div class="mini"><h4>Perimetre</h4><p>${safe(w.context?.perimeter || "-")}</p></div>
    <div class="mini"><h4>Environnement</h4><p>${safe(w.context?.environment || w.context?.regulatory || "-")}</p></div>
    <div class="mini"><h4>Hypotheses / Contraintes</h4><p>${safe(w.context?.hypotheses || w.context?.constraints || w.context?.assumptions || "-")}</p></div>
  </div>`;

  const missionMap = Object.fromEntries((w.missions || []).map((mission) => [mission.id, mission.name]));

  const values = table(
    ["Mission", "Valeur metier", "Type", "Description"],
    (w.businessValues || []).map((value) => [
      safe(missionMap[value.missionId] || "-"),
      safe(value.name),
      `<span class="badge b-blue">${safe(value.type || "-")}</span>`,
      safe(value.description || "-"),
    ]),
  );

  const assetMap = Object.fromEntries((w.businessValues || []).map((value) => [value.id, value.name]));

  const assets = table(
    ["Valeur", "Bien support", "Type", "Localisation", "Criticite"],
    (w.supportingAssets || []).map((asset) => [
      safe(assetMap[asset.businessValueId] || "-"),
      safe(asset.name),
      safe(asset.type || "-"),
      safe(asset.location || "-"),
      `<span class="badge b-neutral">${safe(asset.criticality || "-")}</span>`,
    ]),
  );

  const feared = table(
    ["Valeur", "Evenement redoute", "Impact", "Gravite"],
    (w.fearedEvents || []).map((event) => [
      safe(assetMap[event.businessValueId] || "-"),
      safe(event.description),
      safe(event.impact || "-"),
      badgeGravity(event.gravity),
    ]),
  );

  const iso = table(
    ["Reference", "Controle", "Statut", "Commentaires"],
    (w.isoControls || []).map((control) => [
      safe(control.reference),
      safe(control.name),
      `<span class="badge b-neutral">${safe(control.status || "-")}</span>`,
      safe(control.comments || "-"),
    ]),
  );

  return [
    section("Equipe et Responsabilites", team),
    section("Contexte de l'etude", context),
    section("Missions et Valeurs Metier", values),
    section("Biens supports", assets),
    section("Evenements redoutes", feared),
    section("Controles ISO 27001:2022", iso),
  ].join("");
}

function buildWorkshop2(study) {
  const w = study.workshop2;
  const sources = Object.fromEntries((w.riskSources || []).map((source) => [source.id, source.name]));
  const objectives = Object.fromEntries((w.targetObjectives || []).map((objective) => [objective.id, objective.name]));

  const sourceTable = table(
    ["Nom", "Type", "Motivation", "Capacite"],
    (w.riskSources || []).map((source) => [
      safe(source.name),
      `<span class="badge b-blue">${safe(source.type || "-")}</span>`,
      safe(source.motivation || "-"),
      `<span class="badge ${badgeClassByScore((source.capability || 1) * 3)}">${safe(source.capability || "-")}/4</span>`,
    ]),
  );

  const objectiveTable = table(
    ["Objectif", "Description", "Evenements associes"],
    (w.targetObjectives || []).map((objective) => [
      safe(objective.name),
      safe(objective.description || "-"),
      safe((objective.fearedEventIds || []).length || 0),
    ]),
  );

  const pairs = table(
    ["Source de risque", "Objectif vise", "Pertinence", "Justification"],
    (w.sourceObjectivePairs || []).map((pair) => [
      safe(sources[pair.riskSourceId] || "-"),
      safe(objectives[pair.targetObjectiveId] || "-"),
      pair.retained ? `<span class="badge b-low">Pertinent</span>` : `<span class="badge b-neutral">Non pertinent</span>`,
      safe(pair.justification || "-"),
    ]),
  );

  const matrixHeaders = ["Source / Objectif", ...(w.targetObjectives || []).map((target) => target.name || "-")];
  const matrixRows = (w.riskSources || []).map((source) => {
    const cols = [safe(source.name)];
    (w.targetObjectives || []).forEach((target) => {
      const pair = (w.sourceObjectivePairs || []).find(
        (entry) => entry.riskSourceId === source.id && entry.targetObjectiveId === target.id,
      );
      cols.push(pair?.retained ? "<span class='badge b-low'>Oui</span>" : "<span class='badge b-neutral'>-</span>");
    });
    return cols;
  });

  return [
    section("Caracterisation des Sources de Risque", sourceTable),
    section("Objectifs vises", objectiveTable),
    section("Identification des couples", pairs),
    section("Tableau de Reference (Pertinence)", table(matrixHeaders, matrixRows)),
  ].join("");
}

function buildWorkshop3(study) {
  const w = study.workshop3;
  const w2 = study.workshop2;
  const pairMap = Object.fromEntries((w2.sourceObjectivePairs || []).map((pair) => [pair.id, pair]));
  const sourceMap = Object.fromEntries((w2.riskSources || []).map((source) => [source.id, source.name]));
  const objectiveMap = Object.fromEntries((w2.targetObjectives || []).map((objective) => [objective.id, objective.name]));
  const stakeholderMap = Object.fromEntries((w.stakeholders || []).map((stakeholder) => [stakeholder.id, stakeholder.name]));

  const matrix = table(
    ["Partie prenante", "Type", "Exposition", "Fiabilite", "Zone"],
    (w.stakeholders || []).map((stakeholder) => {
      const score = Number(stakeholder.exposure || 1) * Number(stakeholder.reliability || 1);
      const zone = score >= 9 ? "Critique" : score >= 6 ? "Elevee" : score >= 3 ? "Moderee" : "Faible";
      return [
        safe(stakeholder.name),
        safe(stakeholder.type || "-"),
        safe(stakeholder.exposure || "-"),
        safe(stakeholder.reliability || "-"),
        `<span class="badge ${badgeClassByScore(score)}">${zone}</span>`,
      ];
    }),
  );

  const zones = section(
    "Zones de menace des parties prenantes",
    `<div class="grid2">
      <div class="mini"><h4>Zone critique</h4><p>Score >= 9 : gouvernance immediate et suivi hebdomadaire.</p></div>
      <div class="mini"><h4>Zone elevee</h4><p>Score 6-8 : controles renforces et mesures de reduction prioritaires.</p></div>
      <div class="mini"><h4>Zone moderee</h4><p>Score 3-5 : controls standards avec verification periodique.</p></div>
      <div class="mini"><h4>Zone faible</h4><p>Score 1-2 : surveillance de base.</p></div>
    </div>`,
  );

  const stakeholders = table(
    ["Nom", "Type", "Acces"],
    (w.stakeholders || []).map((stakeholder) => [safe(stakeholder.name), safe(stakeholder.type || "-"), safe(stakeholder.access || "-")]),
  );

  const strategic = table(
    ["Scenario", "Couple SR/OV", "Parties prenantes", "Gravite"],
    (w.strategicScenarios || []).map((scenario) => {
      const pair = pairMap[scenario.coupleId];
      const source = pair ? sourceMap[pair.riskSourceId] : "-";
      const objective = pair ? objectiveMap[pair.targetObjectiveId] : "-";
      const actors = (scenario.stakeholderIds || []).map((id) => stakeholderMap[id]).filter(Boolean);
      return [
        safe(scenario.name),
        safe(`${source} -> ${objective}`),
        actors.length ? actors.map((actor) => `<span class="tag">${safe(actor)}</span>`).join("") : "-",
        badgeGravity(scenario.gravity),
      ];
    }),
  );

  const treatments = table(
    ["Scenario", "Decision", "Justification"],
    (w.treatments || []).map((treatment) => {
      const scenario = (w.strategicScenarios || []).find((item) => item.id === treatment.scenarioId);
      return [safe(scenario?.name || "-"), `<span class="badge b-blue">${safe(treatment.decision || "-")}</span>`, safe(treatment.justification || "-")];
    }),
  );

  return [
    section("Parties prenantes", stakeholders),
    section("Scenarios strategiques", strategic),
    section("Traitement des risques strategiques", treatments),
    section("Matrice de Criticite des Parties Prenantes", matrix),
    zones,
  ].join("");
}

function buildWorkshop4(study) {
  const w = study.workshop4;
  const strategicMap = Object.fromEntries((study.workshop3.strategicScenarios || []).map((item) => [item.id, item.name]));
  const modeMap = Object.fromEntries((w.operationalModes || []).map((item) => [item.id, item.name]));
  const assetMap = Object.fromEntries((study.workshop1.supportingAssets || []).map((item) => [item.id, item.name]));

  const scale = table(
    ["Niveau", "Libelle", "Description"],
    [
      ["V1", "Minimal", "Attaque peu probable"],
      ["V2", "Significatif", "Attaque possible"],
      ["V3", "Fort", "Attaque probable"],
      ["V4", "Maximal", "Attaque tres probable"],
    ],
  );

  const modes = table(
    ["Mode operatoire", "Scenario strategique", "Techniques"],
    (w.operationalModes || []).map((mode) => [
      safe(mode.name),
      safe(strategicMap[mode.strategicScenarioId] || "-"),
      (mode.technics || []).map((tech) => `<span class="tag">${safe(formatTechniqueLabel(tech))}</span>`).join("") || "-",
    ]),
  );

  const scenarios = table(
    ["Scenario operationnel", "Scenario strategique", "Modes", "Biens", "Vraisemblance"],
    (w.operationalScenarios || []).map((scenario) => [
      safe(scenario.name),
      safe(strategicMap[scenario.strategicScenarioId] || "-"),
      (scenario.operationalModeIds || []).map((id) => modeMap[id]).filter(Boolean).map((name) => `<span class="tag">${safe(name)}</span>`).join("") || "-",
      (scenario.supportingAssetIds || []).map((id) => assetMap[id]).filter(Boolean).map((name) => `<span class="tag">${safe(name)}</span>`).join("") || "-",
      badgeLikelihood(scenario.likelihood),
    ]),
  );

  return [
    section("Echelle de calcul de vraisemblance", scale),
    section("Modes operatoires", modes),
    section("Scenarios operationnels", scenarios),
  ].join("");
}

function buildWorkshop5(study) {
  const w = study.workshop5;
  const opScenarioMap = Object.fromEntries((study.workshop4.operationalScenarios || []).map((item) => [item.id, item.name]));
  const riskMap = Object.fromEntries((w.riskEntries || []).map((entry) => [entry.id, entry]));

  const register = table(
    ["Scenario", "Gravite", "Vraisemblance", "Niveau", "Statut", "Responsable", "Traitement"],
    (w.riskEntries || []).map((entry) => [
      safe(opScenarioMap[entry.operationalScenarioId] || "-"),
      badgeGravity(entry.gravity),
      badgeLikelihood(entry.likelihood),
      badgeRisk(entry.gravity, entry.likelihood),
      `<span class="badge b-status-progress">${safe(riskEntryStatusLabel(entry.status))}</span>`,
      safe(entry.ownerName || entry.ownerUserId || "-"),
      `<span class="badge b-blue">${safe(entry.treatment || "-")}</span>`,
    ]),
  );

  const criteria = table(
    ["Scenario", "Niveau initial", "Decision", "Notes"],
    (w.riskEntries || []).map((entry) => [
      safe(opScenarioMap[entry.operationalScenarioId] || "-"),
      badgeRisk(entry.gravity, entry.likelihood),
      `<span class="badge b-blue">${safe(entry.treatment || "-")}</span>`,
      safe(entry.notes || "-"),
    ]),
  );

  const residual = table(
    ["Risque", "Gravite residuelle", "Vraisemblance residuelle", "Niveau residuel", "Justification"],
    (w.residualRisks || []).map((entry) => {
      const parent = riskMap[entry.riskEntryId];
      return [
        safe(opScenarioMap[parent?.operationalScenarioId] || "-"),
        badgeGravity(entry.residualGravity),
        badgeLikelihood(entry.residualLikelihood),
        badgeRisk(entry.residualGravity, entry.residualLikelihood),
        safe(entry.justification || "-"),
      ];
    }),
  );

  const measuresByCategory = ["Gouvernance", "Protection", "Defense", "Resilience", "Conformite"]
    .map((category) => ({
      category,
      measures: (w.measures || []).filter((entry) => entry.category === category),
    }))
    .filter((entry) => entry.measures.length > 0)
    .map(({ category, measures }) => section(
      category,
      table(
        ["Mesure", "Description", "Priorite", "Statut"],
        measures.map((measure) => [
          safe(measure.name),
          safe(measure.description || "-"),
          badgePriority(measure.priority),
          badgeStatus(measure.status),
        ]),
      ),
    ))
    .join("");

  const measuresFallbackSection = !measuresByCategory
    ? section("Tableau des Mesures de Securite", table(["Mesure", "Description", "Priorite", "Statut"], []))
    : "";

  const soa = table(
    ["Reference", "Objectif", "Applicable", "Justification", "Mise en oeuvre", "Mesures liees"],
    (w.soa || []).map((entry) => {
      const linkedMeasures = (entry.linkedMeasureIds || [])
        .map((id) => (w.measures || []).find((measure) => measure.id === id)?.name)
        .filter(Boolean);

      return [
        safe(entry.reference || "-"),
        safe(entry.objective || "-"),
        entry.applicable === "oui" ? `<span class="badge b-low">Oui</span>` : `<span class="badge b-neutral">Non</span>`,
        safe(entry.justification || "-"),
        `<span class="badge b-blue">${safe(entry.implementationStatus || "-")}</span>`,
        linkedMeasures.length ? linkedMeasures.map((name) => `<span class="tag">${safe(name)}</span>`).join("") : "-",
      ];
    }),
  );

  const riskMapRows = [4, 3, 2, 1].map((g) => {
    const cols = [1, 2, 3, 4].map((v) => {
      const entries = (w.riskEntries || []).filter((entry) => Number(entry.gravity) === g && Number(entry.likelihood) === v);
      const score = g * v;
      const badge = `<span class="badge ${badgeClassByScore(score)}">${score}</span>`;
      const names = entries
        .map((entry) => opScenarioMap[entry.operationalScenarioId])
        .filter(Boolean)
        .map((name) => `<div style="font-size:9px;margin-top:2px">${safe(name)}</div>`)
        .join("");
      return `${badge}${names || ""}`;
    });
    return [badgeGravity(g), ...cols];
  });

  const riskMapGrid = section(
    "Matrice de Risque / Cartographie",
    table(["", "V1", "V2", "V3", "V4"], riskMapRows),
  );

  const governance = section(
    "Gouvernance & Anticipation",
    `<div class="grid2">
      <div class="mini"><h4>Vue globale</h4><p>Risques: <strong>${(w.riskEntries || []).length}</strong><br/>Mesures: <strong>${(w.measures || []).length}</strong><br/>Residuel: <strong>${(w.residualRisks || []).length}</strong></p></div>
      <div class="mini"><h4>Execution</h4><p>Mesures faites: <strong>${(w.measures || []).filter((entry) => entry.status === "Fait").length}</strong><br/>A finaliser: <strong>${(w.measures || []).filter((entry) => entry.status !== "Fait").length}</strong></p></div>
    </div>`,
  );

  const soaSection = (w.soa || []).length ? section("SoA minimal", soa) : "";

  return [
    section("Registre des Risques", register),
    riskMapGrid,
    section("Tableau des Criteres de Traitement", criteria),
    section("Matrice des Risques Residuels", residual),
    measuresByCategory,
    measuresFallbackSection,
    soaSection,
    governance,
  ].filter(Boolean).join("");
}

export function buildLivrableHtml(study, workshopNum, today) {
  const num = Number(workshopNum);
  const names = {
    1: "Cadrage et socle de securite",
    2: "Sources de risque",
    3: "Scenarios strategiques",
    4: "Scenarios operationnels",
    5: "Traitement du risque",
  };

  let body = "";
  if (num === 1) body = buildWorkshop1(study);
  if (num === 2) body = buildWorkshop2(study);
  if (num === 3) body = buildWorkshop3(study);
  if (num === 4) body = buildWorkshop4(study);
  if (num === 5) body = buildWorkshop5(study);

  return `<!doctype html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>EBIOS RM - Atelier ${num}</title>
      <style>${livrableCSS()}</style>
    </head>
    <body>
      <div class="page">
        <header class="cover">
          <h1>Atelier ${num} - Livrable</h1>
          <h2>${safe(names[num] || "Atelier")}</h2>
        </header>
        ${infoBlock(study, today, num)}
        ${body}
      </div>
    </body>
  </html>`;
}

