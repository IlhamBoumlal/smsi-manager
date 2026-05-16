import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import {
  createRiskStudy,
  deleteRiskStudy,
  duplicateRiskStudy,
  getRiskOwners,
  getRiskStudies,
  updateRiskStudy,
} from "../services/risques";
import { createEmptyStudy, isWorkshopBlocked, normalizeLegacyStudy, nowDate, uid } from "../riskModel";

const RiskStudiesContext = createContext(null);

function clone(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function toErrorMessage(error, fallback) {
  const message = error?.response?.data || error?.message;
  if (typeof message === "string" && message.trim()) return message.trim();
  return fallback;
}

export function RiskStudiesProvider({ children }) {
  const { user } = useAuth();
  const [studies, setStudies] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshStudies = useCallback(async () => {
    if (!user) {
      setStudies([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await getRiskStudies();
      setStudies(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur chargement etudes risques:", e);
      setError(toErrorMessage(e, "Impossible de charger les etudes de risques."));
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshOwners = useCallback(async () => {
    if (!user) {
      setOwners([]);
      return;
    }

    try {
      const data = await getRiskOwners();
      setOwners(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Erreur chargement responsables risques:", e);
      setOwners([]);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user) {
        setStudies([]);
        setOwners([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [studyList, ownersList] = await Promise.all([getRiskStudies(), getRiskOwners()]);
        if (cancelled) return;
        setStudies(Array.isArray(studyList) ? studyList : []);
        setOwners(Array.isArray(ownersList) ? ownersList : []);
      } catch (e) {
        if (cancelled) return;
        console.error("Erreur initialisation module risques:", e);
        setError(toErrorMessage(e, "Impossible de charger le module risques."));
        setStudies([]);
        setOwners([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const persistUpdatedStudy = useCallback(async (study) => {
    try {
      const saved = await updateRiskStudy(study.id, study);
      setStudies((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
      return saved;
    } catch (e) {
      console.error("Erreur sauvegarde etude:", e);
      setError(toErrorMessage(e, "La sauvegarde de l'etude a echoue."));
      await refreshStudies();
      return null;
    }
  }, [refreshStudies]);

  const mutateStudy = useCallback((studyId, mutator) => {
    let nextStudy = null;

    setStudies((prev) =>
      prev.map((study) => {
        if (study.id !== studyId) return study;
        const draft = clone(study);
        mutator(draft);
        draft.updatedAt = nowDate();
        nextStudy = normalizeLegacyStudy(draft);
        return nextStudy;
      }),
    );

    if (nextStudy) {
      void persistUpdatedStudy(nextStudy);
    }
  }, [persistUpdatedStudy]);

  const createStudyHandler = useCallback(async (meta) => {
    const draft = createEmptyStudy(meta);
    try {
      const created = await createRiskStudy(draft);
      setStudies((prev) => [created, ...prev]);
      return created;
    } catch (e) {
      console.error("Erreur creation etude:", e);
      setError(toErrorMessage(e, "La creation de l'etude a echoue."));
      return null;
    }
  }, []);

  const duplicateStudyHandler = useCallback(async (studyId) => {
    try {
      const duplicated = await duplicateRiskStudy(studyId);
      setStudies((prev) => [duplicated, ...prev]);
      return duplicated;
    } catch (e) {
      console.error("Erreur duplication etude:", e);
      setError(toErrorMessage(e, "La duplication de l'etude a echoue."));
      return null;
    }
  }, []);

  const deleteStudyHandler = useCallback(async (studyId) => {
    try {
      await deleteRiskStudy(studyId);
      setStudies((prev) => prev.filter((study) => study.id !== studyId));
      return true;
    } catch (e) {
      console.error("Erreur suppression etude:", e);
      setError(toErrorMessage(e, "La suppression de l'etude a echoue."));
      return false;
    }
  }, []);

  const updateStudyMeta = useCallback((studyId, patch) => {
    mutateStudy(studyId, (draft) => {
      Object.assign(draft, patch);
    });
  }, [mutateStudy]);

  const setWorkshopStatus = useCallback((studyId, workshopId, status) => {
    mutateStudy(studyId, (draft) => {
      if (!draft.workshopStatuses) draft.workshopStatuses = { 1: null, 2: null, 3: null, 4: null, 5: null };
      draft.workshopStatuses[workshopId] = status || null;
    });
  }, [mutateStudy]);

  const updateWorkshopContext = useCallback((studyId, workshopId, contextPatch) => {
    const key = `workshop${workshopId}`;
    mutateStudy(studyId, (draft) => {
      if (!draft[key]) return;
      if (isWorkshopBlocked(draft, workshopId)) return;
      draft[key].context = {
        ...(draft[key].context || {}),
        ...contextPatch,
      };
    });
  }, [mutateStudy]);

  const upsertWorkshopItem = useCallback((studyId, workshopId, collectionKey, item) => {
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
  }, [mutateStudy]);

  const deleteWorkshopItem = useCallback((studyId, workshopId, collectionKey, itemId) => {
    const key = `workshop${workshopId}`;
    mutateStudy(studyId, (draft) => {
      if (!draft[key]) return;
      if (isWorkshopBlocked(draft, workshopId)) return;
      const list = Array.isArray(draft[key][collectionKey]) ? draft[key][collectionKey] : [];
      draft[key][collectionKey] = list.filter((entry) => entry.id !== itemId);
    });
  }, [mutateStudy]);

  const touchStudy = useCallback((studyId) => {
    mutateStudy(studyId, () => {});
  }, [mutateStudy]);

  const value = useMemo(() => ({
    studies,
    owners,
    loading,
    error,
    setStudies,
    createStudy: createStudyHandler,
    duplicateStudy: duplicateStudyHandler,
    deleteStudy: deleteStudyHandler,
    updateStudyMeta,
    setWorkshopStatus,
    updateWorkshopContext,
    upsertWorkshopItem,
    deleteWorkshopItem,
    touchStudy,
    refreshStudies,
    refreshOwners,
    clearError: () => setError(""),
    getStudyById: (studyId) => studies.find((study) => study.id === studyId) || null,
  }), [
    studies,
    owners,
    loading,
    error,
    createStudyHandler,
    duplicateStudyHandler,
    deleteStudyHandler,
    updateStudyMeta,
    setWorkshopStatus,
    updateWorkshopContext,
    upsertWorkshopItem,
    deleteWorkshopItem,
    touchStudy,
    refreshStudies,
    refreshOwners,
  ]);

  return <RiskStudiesContext.Provider value={value}>{children}</RiskStudiesContext.Provider>;
}

export function useRiskStudies() {
  const ctx = useContext(RiskStudiesContext);
  if (!ctx) throw new Error("useRiskStudies must be used within RiskStudiesProvider");
  return ctx;
}
