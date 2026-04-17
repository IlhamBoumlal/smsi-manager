import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  buildRiskStorageKey,
  getCurrentRiskStorageKey,
  loadInitialStudies,
  nowDate,
  createEmptyStudy,
  normalizeLegacyStudy,
  isWorkshopBlocked,
  uid,
} from "./riskModel";

const RiskStudiesContext = createContext(null);

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function RiskStudiesProvider({ children }) {
  const { user } = useAuth();
  const storageKey = useMemo(() => (user ? buildRiskStorageKey(user) : getCurrentRiskStorageKey()), [user]);
  const [studies, setStudies] = useState(() => loadInitialStudies(storageKey));
  const hydratedStorageKeyRef = useRef(storageKey);

  useEffect(() => {
    hydratedStorageKeyRef.current = storageKey;
    setStudies(loadInitialStudies(storageKey));
  }, [storageKey]);

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    if (hydratedStorageKeyRef.current !== storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(studies));
  }, [storageKey, studies]);

  const mutateStudy = (studyId, mutator) => {
    setStudies((prev) =>
      prev.map((study) => {
        if (study.id !== studyId) return study;
        const draft = clone(study);
        mutator(draft);
        draft.updatedAt = nowDate();
        return normalizeLegacyStudy(draft);
      }),
    );
  };

  const createStudy = (meta) => {
    const created = createEmptyStudy(meta);
    setStudies((prev) => [created, ...prev]);
    return created;
  };

  const duplicateStudy = (studyId) => {
    const source = studies.find((study) => study.id === studyId);
    if (!source) return null;

    const duplicated = normalizeLegacyStudy({
      ...clone(source),
      id: uid(),
      name: `${source.name || "Etude"} (copie)`,
      createdAt: nowDate(),
      updatedAt: nowDate(),
    });

    setStudies((prev) => [duplicated, ...prev]);
    return duplicated;
  };

  const deleteStudy = (studyId) => {
    setStudies((prev) => prev.filter((study) => study.id !== studyId));
  };

  const updateStudyMeta = (studyId, patch) => {
    mutateStudy(studyId, (draft) => {
      Object.assign(draft, patch);
    });
  };

  const setWorkshopStatus = (studyId, workshopId, status) => {
    mutateStudy(studyId, (draft) => {
      if (!draft.workshopStatuses) draft.workshopStatuses = { 1: null, 2: null, 3: null, 4: null, 5: null };
      draft.workshopStatuses[workshopId] = status || null;
    });
  };

  const updateWorkshopContext = (studyId, workshopId, contextPatch) => {
    const key = `workshop${workshopId}`;
    mutateStudy(studyId, (draft) => {
      if (!draft[key]) return;
      if (isWorkshopBlocked(draft, workshopId)) return;
      draft[key].context = {
        ...(draft[key].context || {}),
        ...contextPatch,
      };
    });
  };

  const upsertWorkshopItem = (studyId, workshopId, collectionKey, item) => {
    const key = `workshop${workshopId}`;
    mutateStudy(studyId, (draft) => {
      if (!draft[key]) return;
      if (isWorkshopBlocked(draft, workshopId)) return;
      if (!Array.isArray(draft[key][collectionKey])) draft[key][collectionKey] = [];
      const list = draft[key][collectionKey];
      const payload = { ...item };
      if (!payload.id) payload.id = uid();
      const index = list.findIndex((entry) => entry.id === payload.id);
      if (index >= 0) list[index] = payload;
      else list.push(payload);
    });
  };

  const deleteWorkshopItem = (studyId, workshopId, collectionKey, itemId) => {
    const key = `workshop${workshopId}`;
    mutateStudy(studyId, (draft) => {
      if (!draft[key]) return;
      if (isWorkshopBlocked(draft, workshopId)) return;
      const list = Array.isArray(draft[key][collectionKey]) ? draft[key][collectionKey] : [];
      draft[key][collectionKey] = list.filter((entry) => entry.id !== itemId);
    });
  };

  const touchStudy = (studyId) => {
    mutateStudy(studyId, () => {});
  };

  const refreshStudies = () => {
    setStudies(loadInitialStudies(storageKey));
  };

  const value = {
    studies,
    setStudies,
    createStudy,
    duplicateStudy,
    deleteStudy,
    updateStudyMeta,
    setWorkshopStatus,
    updateWorkshopContext,
    upsertWorkshopItem,
    deleteWorkshopItem,
    touchStudy,
    refreshStudies,
    getStudyById: (studyId) => studies.find((study) => study.id === studyId) || null,
  };

  return <RiskStudiesContext.Provider value={value}>{children}</RiskStudiesContext.Provider>;
}

export function useRiskStudies() {
  const ctx = useContext(RiskStudiesContext);
  if (!ctx) throw new Error("useRiskStudies must be used within RiskStudiesProvider");
  return ctx;
}


