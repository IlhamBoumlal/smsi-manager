import axiosInstance from "../../../api/axiosInstance";
import { createEmptyStudy, normalizeLegacyStudy, nowDate, uid } from "../riskModel";

function pick(source, ...keys) {
  for (const key of keys) {
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      return source[key];
    }
  }
  return undefined;
}

function parsePayloadJson(rawPayload) {
  if (typeof rawPayload !== "string" || !rawPayload.trim()) return {};
  try {
    const parsed = JSON.parse(rawPayload);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeDateValue(value, fallback) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString().slice(0, 10);
}

export function hydrateRiskStudy(dto) {
  const payload = parsePayloadJson(pick(dto, "payloadJson", "PayloadJson"));

  const base = createEmptyStudy({
    name: pick(dto, "name", "Name") || payload.name,
    organization: pick(dto, "organization", "Organization") || payload.organization,
    description: pick(dto, "description", "Description") || payload.description,
    perimeter: pick(dto, "perimeter", "Perimeter") || payload.perimeter,
    author: pick(dto, "author", "Author") || payload.author,
  });

  const merged = normalizeLegacyStudy({
    ...base,
    ...payload,
    id: String(pick(dto, "id", "Id") || payload.id || uid()),
    name: pick(dto, "name", "Name") || payload.name || base.name,
    organization: pick(dto, "organization", "Organization") || payload.organization || "",
    description: pick(dto, "description", "Description") || payload.description || "",
    perimeter: pick(dto, "perimeter", "Perimeter") || payload.perimeter || "",
    author: pick(dto, "author", "Author") || payload.author || "",
    createdAt: normalizeDateValue(pick(dto, "createdAt", "CreatedAt"), payload.createdAt || nowDate()),
    updatedAt: normalizeDateValue(pick(dto, "updatedAt", "UpdatedAt"), payload.updatedAt || nowDate()),
    societeId: pick(dto, "societeId", "SocieteId"),
  });

  return merged;
}

export function serializeRiskStudyPayload(study) {
  const payload = {
    workshopStatuses: study?.workshopStatuses || { 1: null, 2: null, 3: null, 4: null, 5: null },
    workshop1: study?.workshop1 || {},
    workshop2: study?.workshop2 || {},
    workshop3: study?.workshop3 || {},
    workshop4: study?.workshop4 || {},
    workshop5: study?.workshop5 || {},
  };

  return JSON.stringify(payload);
}

export function toRiskStudyRequest(study) {
  return {
    name: String(study?.name || "").trim(),
    organization: String(study?.organization || "").trim(),
    description: String(study?.description || "").trim(),
    perimeter: String(study?.perimeter || "").trim(),
    author: String(study?.author || "").trim(),
    payloadJson: serializeRiskStudyPayload(study),
  };
}

export async function getRiskStudies(search = "") {
  const params = search ? { search } : undefined;
  const response = await axiosInstance.get("/api/risques/studies", { params });
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map(hydrateRiskStudy);
}

export async function getRiskStudyById(studyId) {
  const response = await axiosInstance.get(`/api/risques/studies/${studyId}`);
  return hydrateRiskStudy(response.data);
}

export async function createRiskStudy(study) {
  const response = await axiosInstance.post("/api/risques/studies", toRiskStudyRequest(study));
  return hydrateRiskStudy(response.data);
}

export async function updateRiskStudy(studyId, study) {
  const response = await axiosInstance.put(`/api/risques/studies/${studyId}`, toRiskStudyRequest(study));
  return hydrateRiskStudy(response.data);
}

export async function duplicateRiskStudy(studyId) {
  const response = await axiosInstance.post(`/api/risques/studies/${studyId}/duplicate`);
  return hydrateRiskStudy(response.data);
}

export async function deleteRiskStudy(studyId) {
  await axiosInstance.delete(`/api/risques/studies/${studyId}`);
}

export async function getRiskOwners() {
  const response = await axiosInstance.get("/api/risques/studies/owners");
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map((item) => ({
    id: String(pick(item, "id", "Id") || ""),
    name: String(pick(item, "nomComplet", "NomComplet") || "").trim(),
    email: String(pick(item, "email", "Email") || "").trim(),
  })).filter((item) => item.id);
}
