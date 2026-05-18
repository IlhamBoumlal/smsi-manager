import { useState, useEffect, useCallback, useRef } from "react";
import { Upload } from 'lucide-react';
import {
  getAllProcessus,
  createProcessus,
  updateProcessus,
  deleteProcessus,
  addDocument,
  deleteDocument,
  downloadFichier,
  getAllClausesForSelection,
  getAllControlesForSelection,
} from "../api/cartographie";
import { useAuth } from "../context/AuthContext";

/* ═══════════════════════════════════════════════════════════
   CHARGEMENT DES POLICES & ICONES (Sora + Font Awesome)
═══════════════════════════════════════════════════════════ */
function useSora() {
  useEffect(() => {
    if (!document.getElementById("sora-cdn")) {
      const soraLink = document.createElement("link");
      soraLink.id = "sora-cdn";
      soraLink.rel = "stylesheet";
      soraLink.href = "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap";
      document.head.appendChild(soraLink);
    }
    if (!document.getElementById("fa-cdn")) {
      const faLink = document.createElement("link");
      faLink.id = "fa-cdn";
      faLink.rel = "stylesheet";
      faLink.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
      document.head.appendChild(faLink);
    }
  }, []);
}

/* ═══════════════════════════════════════════════════════════
   ISO 27001 REFERENCES – OPTIONS CHARGÉES DEPUIS LE BACKEND
═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   COMPOSANT DE SÉLECTION MULTI GÉNÉRIQUE
═══════════════════════════════════════════════════════════ */
function IsoMultiSelect({ items, selected, onChange, placeholder, color }) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);

  const normalizedItems = items.map(item => {
    if (typeof item === "string") return { value: item, label: item };
    const value = String(item?.value ?? item?.label ?? "");
    const label = String(item?.label ?? item?.value ?? "");
    return { value, label };
  }).filter(item => item.value);

  const filteredItems = normalizedItems.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleItem = (itemValue) => {
    if (selected.includes(itemValue)) {
      onChange(selected.filter(v => v !== itemValue));
    } else {
      onChange([...selected, itemValue]);
    }
  };

  const removeItem = (itemValue) => {
    onChange(selected.filter(v => v !== itemValue));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="cx-iso-selector" ref={containerRef}>
      <div className="cx-iso-tags">
        {selected.length === 0 && (
          <span className="cx-iso-placeholder">{placeholder}</span>
        )}
        {selected.map(value => {
          const selectedItem = normalizedItems.find(item => item.value === value);
          const label = selectedItem?.label ?? value;
          return (
            <span key={value} className="cx-iso-tag" style={{ background: `${color}15`, borderColor: color }}>
              {label}
              <button type="button" onClick={() => removeItem(value)} className="cx-iso-tag-remove">
                <i className="fa-solid fa-xmark"/>
              </button>
            </span>
          );
        })}
        <button
          type="button"
          className="cx-iso-add-btn"
          onClick={() => setExpanded(!expanded)}
          style={{ borderColor: color, color: color }}
        >
          <i className="fa-solid fa-plus"/> Ajouter
        </button>
      </div>

      {expanded && (
        <div className="cx-iso-dropdown">
          <div className="cx-iso-search">
            <i className="fa-solid fa-search"/>
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="cx-iso-list">
            {filteredItems.length === 0 && (
              <div className="cx-iso-empty">Aucun élément trouvé</div>
            )}
            {filteredItems.map(item => {
              const isSelected = selected.includes(item.value);
              return (
                <label key={item.value} className={`cx-iso-item ${isSelected ? "selected" : ""}`}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleItem(item.value)}
                  />
                  <span className="cx-iso-item-value">{item.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTES METIER
═══════════════════════════════════════════════════════════ */
const DOC_TYPE_ICONS = {
  "procédure":  "fa-solid fa-clipboard-list",
  "instruction":"fa-solid fa-file-lines",
  "formulaire": "fa-solid fa-file-alt",
  "plan":       "fa-solid fa-chart-gantt",
  "politique":  "fa-solid fa-landmark",
  "rapport":    "fa-solid fa-chart-line",
  "autre":      "fa-solid fa-folder",
};

const STATUS_OPTIONS = [
  { value: "brouillon", label: "Brouillon" },
  { value: "en-validation", label: "En validation" },
  { value: "approuve", label: "Approuve" },
  { value: "a-revoir", label: "A revoir" },
];
const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map((option) => [option.value, option.label]));
const STATUS_CLASS = {
  brouillon: "s-brouillon",
  "en-validation": "s-validation",
  approuve: "s-approuve",
  "a-revoir": "s-revoir",
};
const normalizeStatusToken = (value) => String(value ?? "")
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");
const normalizeDocumentStatus = (value) => {
  const token = normalizeStatusToken(value);
  if (!token) return "brouillon";
  if (token === "brouillon") return "brouillon";
  if (token === "en-validation" || token === "en validation") return "en-validation";
  if (token === "approuve") return "approuve";
  if (token === "a-revoir" || token === "a revoir" || token === "a reviser") return "a-revoir";
  // Compatibilite avec les anciens statuts de cartographie.
  if (token === "en vigueur" || token === "envigueur") return "approuve";
  if (token === "en cours" || token === "encours" || token === "en cours de redaction") return "brouillon";
  if (token === "obsolete") return "a-revoir";
  return "brouillon";
};
const getStatusLabel = (value) => STATUS_LABEL[normalizeDocumentStatus(value)] ?? "Brouillon";

const CAT_META = {
  mgmt: { label: "Management",  color: "#0ea5e9", gradient: "linear-gradient(90deg,#0ea5e9,#38bdf8)" },
  real: { label: "Réalisation", color: "#8b5cf6", gradient: "linear-gradient(90deg,#8b5cf6,#a78bfa)" },
  supp: { label: "Support",     color: "#10b981", gradient: "linear-gradient(90deg,#10b981,#34d399)" },
};

const extractIsoKeyFromLabel = (label) => {
  if (!label) return "";
  const value = typeof label === "string" ? label.trim() : String(label).trim();
  const rawKey = value.split(" - ")[0].trim();
  const match = rawKey.match(/^(?:A\.[0-9]+(?:\.[0-9]+)*|[0-9]+(?:\.[0-9]+)*)/i);
  return match ? match[0].toUpperCase() : rawKey;
};

const splitIsoRefs = (refs) => {
  const normalized = (refs || []).map(extractIsoKeyFromLabel).filter(Boolean);
  return {
    clauses: normalized.filter(code => !/^A\./i.test(code)),
    controls: normalized.filter(code => /^A\./i.test(code)),
  };
};

const EMPTY_PROC = {
  cat: "mgmt",
  name: "",
  owner: "",
  desc: "",
  isoRefs: [],
  clauses: [],
  controls: []
};
const EMPTY_DOC = { name:"", type:"procédure", ref:"", status:"brouillon", fichier: null };

const getApiErrorMessage = (error, fallbackMessage) => {
  const data = error?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  if (typeof data?.title === "string" && data.title.trim()) {
    if (data?.errors && typeof data.errors === "object") {
      const validationMessages = Object.values(data.errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .map((value) => String(value).trim())
        .filter(Boolean);
      if (validationMessages.length > 0) {
        return `${data.title}: ${validationMessages.join(" | ")}`;
      }
    }
    return data.title;
  }
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.join(" | ");
  }
  if (typeof error?.message === "string" && error.message.trim()) return error.message;
  return fallbackMessage;
};

/* ═══════════════════════════════════════════════════════════
   HOOK — liaison backend
═══════════════════════════════════════════════════════════ */
const fromApi = (p) => ({
  id:    p.id,
  cat:   p.categorie,
  name:  p.nom,
  owner: p.responsable,
  desc:  p.description,
  isoRefs: p.isoReferences || [],
  docs: (p.documents ?? []).map(d => ({
    id:          d.id,
    name:        d.nom,
    type:        d.type,
    ref:         d.reference,
    status:      normalizeDocumentStatus(d.statut),
    fichierNom:  d.fichierNom  ?? null,
    fichierType: d.fichierType ?? null,
    aFichier:    d.aFichier    ?? false,
  })),
});

function useProcesses() {
  const [procs,   setProcs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllProcessus();
      setProcs(data.map(fromApi));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { procs, setProcs, loading, error, refresh };
}

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function CartographieProcessus() {
  useSora();
  const { canRead, canWrite, canEdit, canDelete } = useAuth();
  const moduleCode = "cartographie";
  const hasAccess = canRead(moduleCode);

  const { procs, setProcs, loading, error, refresh } = useProcesses();

  const [activeId,  setActiveId]  = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [procModal, setProcModal] = useState({ open:false, editId:null, form:EMPTY_PROC });
  const [docModal,  setDocModal]  = useState({ open:false, form:EMPTY_DOC, targetProcId: null });
  const [mounted,   setMounted]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [clauseOptions, setClauseOptions] = useState([]);
  const [controlOptions, setControlOptions] = useState([]);
  const [isoOptionsLoaded, setIsoOptionsLoaded] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const extractIsoKey = useCallback((value) => {
    if (!value) return "";
    if (typeof value !== "string") value = String(value);
    const trimmed = value.trim();
    const parts = trimmed.split(" - ")[0].trim();
    const match = parts.match(/^(?:A\.[0-9]+(?:\.[0-9]+)*|[0-9]+(?:\.[0-9]+)*)/i);
    return match ? match[0].toUpperCase() : parts;
  }, []);

  const normalizeClauseOption = useCallback((clause) => {
    const raw = typeof clause === "string" ? clause : clause?.number ?? clause?.numero ?? clause?.code ?? clause?.ref ?? clause?.identifiant ?? "";
    const title = typeof clause === "string" ? "" : clause?.title ?? clause?.titre ?? clause?.name ?? clause?.label ?? "";
    const value = extractIsoKey(raw);
    if (!value) return null;
    return { value, label: title ? `${value} — ${title}` : value };
  }, [extractIsoKey]);

  const normalizeControlOption = useCallback((controle) => {
    const raw = typeof controle === "string" ? controle : controle?.code ?? controle?.numero ?? controle?.identifiant ?? controle?.ref ?? "";
    const title = typeof controle === "string" ? "" : controle?.title ?? controle?.titre ?? controle?.name ?? controle?.label ?? "";
    const value = extractIsoKey(raw);
    if (!value) return null;
    return { value, label: title ? `${value} — ${title}` : value };
  }, [extractIsoKey]);

  useEffect(() => {
    const loadIsoOptions = async () => {
      try {
        const [clauses, controles] = await Promise.all([
          getAllClausesForSelection(),
          getAllControlesForSelection()
        ]);
        setClauseOptions(clauses.map(normalizeClauseOption).filter(Boolean));
        setControlOptions(controles.map(normalizeControlOption).filter(Boolean));
      } catch (e) {
        console.error("Impossible de charger les clauses ou contrôles depuis le backend", e);
      } finally {
        setIsoOptionsLoaded(true);
      }
    };
    loadIsoOptions();
  }, [normalizeClauseOption, normalizeControlOption]);

  useEffect(() => {
    const fn = (e) => {
      if (e.key !== "Escape") return;
      if (procModal.open) setProcModal(m => ({ ...m, open:false }));
      else if (docModal.open) setDocModal(m => ({ ...m, open:false }));
      else { setPanelOpen(false); setTimeout(() => setActiveId(null), 350); }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [procModal.open, docModal.open]);

  const selectProc   = (id)  => { setActiveId(id); setPanelOpen(true); };
  const closePanel   = ()    => { setPanelOpen(false); setTimeout(() => setActiveId(null), 350); };

  const openAddProc = (cat) => {
    setProcModal({
      open: true,
      editId: null,
      form: { ...EMPTY_PROC, cat, isoRefs: [], clauses: [], controls: [] }
    });
  };

  const openEditProc = (id) => {
    const p = procs.find(x => x.id === id);
    if (p) {
      const { clauses, controls } = splitIsoRefs(p.isoRefs);
      setProcModal({
        open: true,
        editId: id,
        form: {
          cat: p.cat,
          name: p.name,
          owner: p.owner,
          desc: p.desc,
          isoRefs: [...p.isoRefs],
          clauses,
          controls
        }
      });
    }
  };

  const openAddDocForProc = (procId) => {
    if (!canWrite(moduleCode)) {
      alert("Vous n'avez pas la permission d'ajouter des documents");
      return;
    }
    setActiveId(procId);
    setDocModal({ open: true, form: EMPTY_DOC, targetProcId: procId });
  };

  /* ── CRUD Processus ── */
  const saveProc = async () => {
    if (!canWrite(moduleCode)) {
      alert("Vous n'avez pas la permission d'ajouter ou modifier des processus");
      return;
    }
    const { editId, form } = procModal;
    if (!form.name.trim()) return;

    const combinedRefs = [...form.clauses, ...form.controls];

    setSaving(true);
    try {
      const body = {
        categorie: form.cat,
        nom: form.name,
        responsable: form.owner,
        description: form.desc,
        isoReferences: combinedRefs,
      };
      if (editId) await updateProcessus(editId, body);
      else        await createProcessus(body);
      await refresh();
      setProcModal({ open:false, editId:null, form:EMPTY_PROC });
    } catch (error) {
      console.error("Erreur saveProc:", error);
      alert(getApiErrorMessage(error, "Impossible d'enregistrer le processus."));
    } finally {
      setSaving(false);
    }
  };

  const deleteProc = async (id) => {
    if (!canDelete(moduleCode)) {
      alert("Vous n'avez pas la permission de supprimer des processus");
      return;
    }
    if (!window.confirm("Supprimer ce processus et tous ses documents ?")) return;
    try {
      await deleteProcessus(id);
      await refresh();
      if (activeId === id) closePanel();
    } catch (error) {
      console.error("Erreur deleteProc:", error);
      alert(getApiErrorMessage(error, "Impossible de supprimer le processus."));
    }
  };

  /* ── CRUD Documents ── */
  const saveDoc = async () => {
    if (!canWrite(moduleCode)) {
      alert("Vous n'avez pas la permission d'ajouter des documents");
      return;
    }
    const { form, targetProcId } = docModal;
    const pid = targetProcId || activeId;
    if (!form.name.trim() || !pid) return;
    setSaving(true);
    try {
      const body = { nom: form.name, type: form.type, reference: form.ref, statut: form.status };
      const newDoc = await addDocument(pid, body, form.fichier ?? null);
      setProcs(prev => prev.map(p =>
        p.id === pid
          ? { ...p, docs: [...p.docs, {
                id:          newDoc.id,
                name:        newDoc.nom,
                type:        newDoc.type,
                ref:         newDoc.reference,
                status:      normalizeDocumentStatus(newDoc.statut),
                fichierNom:  newDoc.fichierNom  ?? null,
                fichierType: newDoc.fichierType ?? null,
                aFichier:    newDoc.aFichier    ?? false,
              }]}
          : p
      ));
      setDocModal({ open:false, form:EMPTY_DOC, targetProcId: null });
    } catch (error) {
      console.error("Erreur saveDoc:", error);
      alert(getApiErrorMessage(error, "Impossible d'ajouter le document."));
    } finally {
      setSaving(false);
    }
  };

  const deleteDoc = async (pid, did) => {
    if (!canDelete(moduleCode)) {
      alert("Vous n'avez pas la permission de supprimer des documents");
      return;
    }
    try {
      await deleteDocument(pid, did);
      setProcs(prev => prev.map(p =>
        p.id === pid ? { ...p, docs: p.docs.filter(d => d.id !== did) } : p
      ));
    } catch (error) {
      console.error("Erreur deleteDoc:", error);
      alert(getApiErrorMessage(error, "Impossible de supprimer le document."));
    }
  };

  const activeProc = procs.find(p => p.id === activeId) || null;

  if (!hasAccess) {
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh", gap:12, flexDirection:"column" }}>
        <i className="fa-solid fa-ban" style={{ fontSize:48, color:"#e74c3c" }}/>
        <div style={{ fontSize:18, fontWeight:600, color:"#111827" }}>Accès non autorisé</div>
        <p style={{ fontSize:13, color:"#6B7280" }}>Vous n'avez pas les permissions nécessaires pour accéder à la cartographie.</p>
      </div>
    );
  }

  if (loading) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh", color:"#0ea5e9", fontFamily:"Sora,sans-serif", gap:12 }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ fontSize:22 }}/>
      Chargement de la cartographie…
    </div>
  );

  if (error) return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"60vh", color:"#EF4444", fontFamily:"Sora,sans-serif", gap:12 }}>
      <i className="fa-solid fa-triangle-exclamation" style={{ fontSize:22 }}/>
      Erreur de chargement. Veuillez réessayer.
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className={`cx-root ${mounted?"cx-in":""}`}>

        {/* BACKGROUND BLOBS */}
        <div className="cx-blob cx-b1"/><div className="cx-blob cx-b2"/><div className="cx-blob cx-b3"/>

        {/* HEADER AVEC TITRE PLUS PETIT (comme version simplifiée) */}
        <div className="cx-hero">
          <div className="cx-badge">
            <span className="cx-dot"/>ISO 27001 · Système de Management
          </div>
          <h1 className="cx-h1">
            Cartographie<br/>
            <span className="cx-h1-grad">des Processus</span>
          </h1>
          <p className="cx-lead">Visualisez et gérez l'ensemble de vos processus qualité et sécurité</p>
        </div>

        {/* FLOW LAYOUT */}
        <div className="cx-flow">
          <div className="cx-flow-wrapper">
            <div className="cx-side cx-side-l">
              <i className="fa-solid fa-arrow-right cx-side-arrow-icon"/>
              <span>Exigences des clients et autres parties intéressées</span>
            </div>

            <div className="cx-flow-center">
              {["mgmt","real","supp"].map((cat, li) => {
                const items  = procs.filter(p => p.cat === cat);
                const isReal = cat === "real";
                const ICONS  = {
                  mgmt: "fa-solid fa-building-columns",
                  real: "fa-solid fa-bolt",
                  supp: "fa-solid fa-screwdriver-wrench",
                };
                const TITLES = {
                  mgmt: "Processus de Management",
                  real: "Processus de Réalisation",
                  supp: "Processus de Support",
                };
                return (
                  <div key={cat}>
                    <div className={`cx-layer cx-layer-${cat}`} style={{ animationDelay:`${0.15+li*0.15}s` }}>
                      <div className="cx-layer-hd">
                        <div className={`cx-layer-ico cx-ico-${cat}`}>
                          <i className={ICONS[cat]}/>
                        </div>
                        <div className={`cx-layer-title cx-title-${cat}`}>{TITLES[cat]}</div>
                        <span className={`cx-layer-cnt cx-cnt-${cat}`}>{items.length} processus</span>
                        {canWrite(moduleCode) && (
                          <button className={`cx-add-proc cx-add-${cat}`} onClick={() => openAddProc(cat)}>
                            <i className="fa-solid fa-plus"/> Ajouter
                          </button>
                        )}
                      </div>
                      <div className="cx-proc-row">
                        {items.map((p, ci) => (
                          <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                            {isReal && ci > 0 && (
                              <div className="cx-flow-arr">
                                <i className="fa-solid fa-chevron-right"/>
                              </div>
                            )}
                            <ProcCard
                              proc={p} cat={cat}
                              index={procs.indexOf(p) + 1}
                              isActive={activeId === p.id}
                              onClick={() => selectProc(p.id)}
                              onEdit={() => openEditProc(p.id)}
                              onDelete={() => deleteProc(p.id)}
                              onAddDoc={() => openAddDocForProc(p.id)}
                              canEdit={canEdit(moduleCode)}
                              canDelete={canDelete(moduleCode)}
                              canWrite={canWrite(moduleCode)}
                            />
                          </div>
                        ))}
                        {items.length === 0 && (
                          <div className={`cx-empty-row cx-empty-${cat}`}>
                            <i className="fa-regular fa-circle-dashed" style={{marginRight:6}}/>
                            Aucun processus — cliquez sur Ajouter
                          </div>
                        )}
                      </div>
                    </div>
                    {li < 2 && (
                      <div className="cx-connector">
                        <div className="cx-conn-line"/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="cx-side cx-side-r">
              <span>Satisfaction clients et autres parties intéressées</span>
              <i className="fa-solid fa-arrow-right cx-side-arrow-icon"/>
            </div>
          </div>
        </div>

        {/* LÉGENDE */}
        <div className="cx-legend">
          {[
            ["#0ea5e9", "Management",   "fa-solid fa-building-columns"],
            ["#8b5cf6", "Réalisation",  "fa-solid fa-bolt"],
            ["#10b981", "Support",      "fa-solid fa-screwdriver-wrench"],
          ].map(([c, l, ico]) => (
            <div key={l} className="cx-leg-item">
              <i className={ico} style={{ color:c, fontSize:13 }}/>
              <span style={{ color:c }}>{l}</span>
            </div>
          ))}
          <span className="cx-leg-hint">
            <i className="fa-solid fa-hand-pointer" style={{ marginRight: 5 }}/>
            Cliquez sur un processus pour gérer ses documents et références ISO 27001
          </span>
        </div>
      </div>

      {/* PANNEAU DÉTAIL */}
      <div className={`cx-panel ${panelOpen?"cx-panel-open":""}`}>
        {activeProc && (() => {
          const meta = CAT_META[activeProc.cat];
          const CAT_ICONS = {
            mgmt: "fa-solid fa-building-columns",
            real: "fa-solid fa-bolt",
            supp: "fa-solid fa-screwdriver-wrench",
          };
          const { clauses, controls } = splitIsoRefs(activeProc.isoRefs);
          return (
            <>
              <div className="cx-ph">
                <div className="cx-ph-strip" style={{ background: meta.gradient }}/>
                <div className={`cx-ph-cat cx-ph-cat-${activeProc.cat}`}>
                  <i className={`${CAT_ICONS[activeProc.cat]} cx-ph-cat-ico`}/>
                  {meta.label}
                </div>
                <div className="cx-ph-title">{activeProc.name}</div>
                <div className="cx-ph-owner">
                  <i className="fa-solid fa-user-tie" style={{ color: meta.color }}/>
                  <span style={{ color: meta.color }}>{activeProc.owner}</span>
                </div>
                <button className="cx-ph-close" onClick={closePanel}>
                  <i className="fa-solid fa-xmark"/>
                </button>
              </div>
              <div className="cx-pb">
                <div className="cx-pb-desc">
                  <i className="fa-solid fa-circle-info cx-desc-ico"/>
                  {activeProc.desc || "Aucune description."}
                </div>

                <div className="cx-pb-sh">
                  <span className="cx-pb-stit">
                    <i className="fa-regular fa-file-lines cx-sh-ico"/>
                    Clauses ISO 27001
                  </span>
                  <span className="cx-pb-cnt" style={{ color: meta.color }}>{clauses.length}</span>
                </div>
                <div className="cx-iso-refs-list">
                  {clauses.length === 0 ? (
                    <div className="cx-no-iso">
                      <i className="fa-regular fa-circle-question"/>
                      Aucune clause associée
                    </div>
                  ) : (
                    <div className="cx-iso-refs-grid">
                      {clauses.map(ref => (
                        <div key={ref} className="cx-iso-ref-badge" style={{ borderLeftColor: meta.color }}>
                          <i className="fa-solid fa-gavel" style={{ color: meta.color }}/>
                          <span>{ref}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="cx-pb-sh" style={{ marginTop: 16 }}>
                  <span className="cx-pb-stit">
                    <i className="fa-solid fa-shield-halved cx-sh-ico"/>
                    Contrôles ISO 27001 (Annexe A)
                  </span>
                  <span className="cx-pb-cnt" style={{ color: meta.color }}>{controls.length}</span>
                </div>
                <div className="cx-iso-refs-list">
                  {controls.length === 0 ? (
                    <div className="cx-no-iso">
                      <i className="fa-regular fa-circle-question"/>
                      Aucun contrôle associé
                    </div>
                  ) : (
                    <div className="cx-iso-refs-grid">
                      {controls.map(ref => (
                        <div key={ref} className="cx-iso-ref-badge" style={{ borderLeftColor: meta.color }}>
                          <i className="fa-solid fa-check-double" style={{ color: meta.color }}/>
                          <span>{ref}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="cx-pb-sh">
                  <span className="cx-pb-stit">
                    <i className="fa-solid fa-file-invoice cx-sh-ico"/>
                    Documents associés
                  </span>
                  <span className="cx-pb-cnt" style={{ color: meta.color }}>
                    {activeProc.docs.length} doc{activeProc.docs.length!==1?"s":""}
                  </span>
                </div>
                <div className="cx-doc-list">
                  {activeProc.docs.length === 0
                    ? (
                      <div className="cx-no-doc">
                        <i className="fa-regular fa-folder-open cx-no-doc-ico"/>
                        <br/>Aucun document — ajoutez-en un ci-dessous
                      </div>
                    )
                    : activeProc.docs.map(d => (
                      <div key={d.id} className="cx-doc-item">
                        <i className={`${DOC_TYPE_ICONS[d.type]||"fa-solid fa-folder"} cx-doc-type-ico`}/>
                        <div className="cx-doc-info">
                          <div className="cx-doc-nm">{d.name}</div>
                          <div className="cx-doc-mt">
                            {d.ref||"—"} · {d.type}
                            {d.aFichier && (
                              <span className="cx-doc-fichier-badge">
                                <i className="fa-solid fa-paperclip"/> {d.fichierNom}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`cx-doc-st ${STATUS_CLASS[d.status]||""}`}>{getStatusLabel(d.status)}</div>
                        {d.aFichier && (
                          <button
                            className="cx-dl-btn"
                            title={`Télécharger ${d.fichierNom}`}
                            onClick={() => downloadFichier(d.id, d.fichierNom)}
                          >
                            <i className="fa-solid fa-download"/>
                          </button>
                        )}
                        {canDelete(moduleCode) && (
                          <button className="cx-del-btn" onClick={() => deleteDoc(activeProc.id, d.id)} title="Supprimer">
                            <i className="fa-solid fa-trash-can"/>
                          </button>
                        )}
                      </div>
                    ))
                  }
                </div>
                {canWrite(moduleCode) && (
                  <button
                    className="cx-add-doc-btn"
                    style={{ "--ac": meta.color }}
                    onClick={() => setDocModal({ open:true, form:EMPTY_DOC, targetProcId: activeProc.id })}
                  >
                    <Upload size={15} color={meta.color || '#0ea5e9'} style={{ marginRight: 8 }} /> Ajouter un document
                  </button>
                )}
              </div>
            </>
          );
        })()}
      </div>

      {/* MODAL PROCESSUS */}
      {procModal.open && (
        <div className="cx-overlay" onClick={e => { if(e.target.classList.contains("cx-overlay")) setProcModal(m=>({...m,open:false})); }}>
          <div className="cx-modal">
            <h3>
              <i className={procModal.editId ? "fa-solid fa-pen-to-square" : "fa-solid fa-plus-circle"} style={{marginRight:9}}/>
              {procModal.editId ? "Modifier le processus" : "Ajouter un processus"}
            </h3>
            <Fg label="Catégorie" icon="fa-solid fa-layer-group">
              <select value={procModal.form.cat} onChange={e=>setProcModal(m=>({...m,form:{...m.form,cat:e.target.value}}))}>
                <option value="mgmt">Management</option>
                <option value="real">Réalisation</option>
                <option value="supp">Support</option>
              </select>
            </Fg>
            <Fg label="Nom du processus" icon="fa-solid fa-tag">
              <input autoFocus placeholder="Ex: Gestion des audits internes" value={procModal.form.name} onChange={e=>setProcModal(m=>({...m,form:{...m.form,name:e.target.value}}))}/>
            </Fg>
            <Fg label="Responsable" icon="fa-solid fa-user-tie">
              <input placeholder="Ex: Responsable Qualité" value={procModal.form.owner} onChange={e=>setProcModal(m=>({...m,form:{...m.form,owner:e.target.value}}))}/>
            </Fg>
            <Fg label="Description" icon="fa-solid fa-align-left">
              <textarea placeholder="Brève description..." value={procModal.form.desc} onChange={e=>setProcModal(m=>({...m,form:{...m.form,desc:e.target.value}}))}/>
            </Fg>

            <div className="cx-fg">
              <label className="cx-flbl">
                <i className="fa-regular fa-file-lines cx-flbl-ico"/>
                Clauses ISO 27001
              </label>
              <IsoMultiSelect
                items={clauseOptions}
                selected={procModal.form.clauses}
                onChange={(newClauses) => setProcModal(m => ({
                  ...m,
                  form: { ...m.form, clauses: newClauses }
                }))}
                placeholder={isoOptionsLoaded ? "Aucune clause sélectionnée" : "Chargement des clauses..."}
                color={CAT_META[procModal.form.cat]?.color || "#0ea5e9"}
              />
            </div>

            <div className="cx-fg">
              <label className="cx-flbl">
                <i className="fa-solid fa-shield-halved cx-flbl-ico"/>
                Contrôles ISO 27001 (Annexe A)
              </label>
              <IsoMultiSelect
                items={controlOptions}
                selected={procModal.form.controls}
                onChange={(newControls) => setProcModal(m => ({
                  ...m,
                  form: { ...m.form, controls: newControls }
                }))}
                placeholder={isoOptionsLoaded ? "Aucun contrôle sélectionné" : "Chargement des contrôles..."}
                color={CAT_META[procModal.form.cat]?.color || "#0ea5e9"}
              />
            </div>

            <div className="cx-modal-ft">
              <button className="cx-btn-cancel" onClick={()=>setProcModal(m=>({...m,open:false}))}>
                <i className="fa-solid fa-xmark" style={{marginRight:6}}/>Annuler
              </button>
              {canWrite(moduleCode) && (
                <button
                  className="cx-btn-save"
                  style={{ background: CAT_META[procModal.form.cat].gradient }}
                  onClick={saveProc}
                  disabled={saving}
                >
                  <i className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`} style={{marginRight:6}}/>
                  {procModal.editId?"Modifier":"Ajouter"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DOCUMENT */}
      {docModal.open && (
        <div className="cx-overlay" onClick={e => { if(e.target.classList.contains("cx-overlay")) setDocModal(m=>({...m,open:false})); }}>
          <div className="cx-modal">
            <h3>
              <Upload size={16} color={CAT_META[procModal.form.cat]?.color || '#0ea5e9'} style={{ marginRight: 9 }} />
              Ajouter un document
            </h3>
            <Fg label="Nom du document" icon="fa-solid fa-file-signature">
              <input
                autoFocus
                placeholder="Ex: Procédure de non-conformités"
                value={docModal.form.name}
                onChange={e=>setDocModal(m=>({...m,form:{...m.form,name:e.target.value}}))}
              />
            </Fg>
            <Fg label="Type" icon="fa-solid fa-shapes">
              <select value={docModal.form.type} onChange={e=>setDocModal(m=>({...m,form:{...m.form,type:e.target.value}}))}>
                <option value="procédure">Procédure</option>
                <option value="instruction">Instruction de travail</option>
                <option value="formulaire">Formulaire / Enregistrement</option>
                <option value="plan">Plan / Programme</option>
                <option value="politique">Politique</option>
                <option value="rapport">Rapport</option>
                <option value="autre">Autre</option>
              </select>
            </Fg>
            <Fg label="Référence" icon="fa-solid fa-hashtag">
              <input
                placeholder="Ex: PROC-QUA-001"
                value={docModal.form.ref}
                onChange={e=>setDocModal(m=>({...m,form:{...m.form,ref:e.target.value}}))}
              />
            </Fg>
            <Fg label="Statut" icon="fa-solid fa-circle-check">
              <select value={docModal.form.status} onChange={e=>setDocModal(m=>({...m,form:{...m.form,status:e.target.value}}))}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Fg>

            <Fg label="Fichier (optionnel)" icon="fa-solid fa-paperclip">
              <div
                className="cx-file-zone"
                onClick={() => document.getElementById("cx-file-input").click()}
              >
                {docModal.form.fichier
                  ? (
                    <span className="cx-file-chosen">
                      <i className="fa-solid fa-file-check" style={{marginRight:7, color:"#0ea5e9"}}/>
                      {docModal.form.fichier.name}
                      <button
                        className="cx-file-clear"
                        onClick={e => {
                          e.stopPropagation();
                          setDocModal(m=>({...m,form:{...m.form,fichier:null}}));
                          document.getElementById("cx-file-input").value = "";
                        }}
                        title="Retirer le fichier"
                      >
                        <i className="fa-solid fa-xmark"/>
                      </button>
                    </span>
                  )
                  : (
                    <span className="cx-file-placeholder">
                      <i className="fa-solid fa-cloud-arrow-up" style={{marginRight:7}}/>
                      Cliquez pour choisir un fichier
                      <span className="cx-file-hint">PDF, Word, Excel, image…</span>
                    </span>
                  )
                }
              </div>
              <input
                id="cx-file-input"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.txt"
                style={{ display:"none" }}
                onChange={e => setDocModal(m=>({...m,form:{...m.form,fichier:e.target.files[0] ?? null}}))}
              />
            </Fg>

            <div className="cx-modal-ft">
              <button className="cx-btn-cancel" onClick={()=>setDocModal(m=>({...m,open:false}))}>
                <i className="fa-solid fa-xmark" style={{marginRight:6}}/>Annuler
              </button>
              {canWrite(moduleCode) && (
                <button className="cx-btn-save" onClick={saveDoc} disabled={saving}>
                  <i className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`} style={{marginRight:6}}/>
                  Ajouter
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SOUS-COMPOSANTS
═══════════════════════════════════════════════════════════ */
function ProcCard({ proc, cat, index, isActive, onClick, onEdit, onDelete, onAddDoc, canEdit, canDelete, canWrite }) {
  const CAT_ICONS = {
    mgmt: "fa-solid fa-building-columns",
    real: "fa-solid fa-bolt",
    supp: "fa-solid fa-screwdriver-wrench",
  };
  const meta = CAT_META[cat] || {};
  return (
    <div className={`cx-card cx-card-${cat} ${isActive?"cx-card-on":""}`} onClick={onClick}>
      <div className="cx-card-acts">
        {canWrite && (
          <button className="cx-act cx-act-doc" title="Ajouter un document" onClick={e=>{e.stopPropagation(); onAddDoc();}}>
            <Upload size={15} color={meta.color || '#10b981'} />
          </button>
        )}
        {canEdit && (
          <button className="cx-act cx-act-e" title="Modifier" onClick={e=>{e.stopPropagation(); onEdit();}}>
            <i className="fa-solid fa-pen text-blue-600"/>
          </button>
        )}
        {canDelete && (
          <button className="cx-act cx-act-d" title="Supprimer" onClick={e=>{e.stopPropagation(); onDelete();}}>
            <i className="fa-solid fa-trash-can text-red-500"/>
          </button>
        )}
      </div>
      <div className="cx-card-num">
        <i className={`${CAT_ICONS[cat]} cx-card-cat-ico`}/>P{index}
      </div>
      <div className="cx-card-nm">{proc.name}</div>
      <div className="cx-card-ft">
        <div className="cx-card-own">
          <i className="fa-solid fa-user cx-own-ico"/> {proc.owner}
        </div>
      </div>
    </div>
  );
}

function Fg({ label, icon, children }) {
  return (
    <div className="cx-fg">
      <label className="cx-flbl">
        {icon && <i className={`${icon} cx-flbl-ico`}/>}
        {label}
      </label>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CSS (fonds blancs pour cartes, titre plus petit)
═══════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.cx-root {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: #f0f7fb; color: #0d2b3e;
  min-height: 100vh; position: relative; overflow-x: hidden;
}

.cx-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; opacity: 0; transition: opacity 1.2s ease; }
.cx-in .cx-blob { opacity: 1; }
.cx-b1 { width:520px;height:520px;top:-130px;left:-80px; background:radial-gradient(ellipse,rgba(14,165,233,0.13),transparent 70%); }
.cx-b2 { width:440px;height:440px;top:35%;right:-100px; background:radial-gradient(ellipse,rgba(139,92,246,0.09),transparent 70%); }
.cx-b3 { width:380px;height:380px;bottom:-80px;left:32%; background:radial-gradient(ellipse,rgba(16,185,129,0.09),transparent 70%); }

/* HEADER - TITRE PLUS PETIT (comme version simplifiée) */
.cx-hero { position:relative;z-index:10;text-align:center;padding:60px 48px 48px;opacity:0;transform:translateY(22px);transition:opacity .65s ease,transform .65s ease; }
.cx-in .cx-hero { opacity:1;transform:none; }
.cx-badge { display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#0ea5e9;background:#e0f2fe;border:1px solid #bae6fd;padding:6px 16px;border-radius:99px;margin-bottom:24px; }
.cx-dot { width:7px;height:7px;border-radius:50%;background:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,0.25);animation:cxBlink 2s ease-in-out infinite;flex-shrink:0; }
@keyframes cxBlink { 0%,100%{box-shadow:0 0 0 3px rgba(14,165,233,0.25)}50%{box-shadow:0 0 0 7px rgba(14,165,233,0.1)} }
.cx-h1 { font-size:clamp(36px,5vw,62px);font-weight:800;letter-spacing:-.045em;color:#0d2b3e;line-height:1.05;margin-bottom:14px; }
.cx-h1-grad { background:linear-gradient(135deg,#0ea5e9 0%,#8b5cf6 50%,#10b981 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
.cx-lead { font-size:15px;color:#4a7a95;max-width:500px;margin:0 auto 40px;line-height:1.65; }

.cx-flow { position:relative;z-index:10;padding:0 40px 48px;max-width:1440px;margin:0 auto; }
.cx-flow-wrapper { display:grid;grid-template-columns:96px 1fr 96px;align-items:center; }
.cx-flow-center { display:flex;flex-direction:column;gap:0;padding:0 12px; }
.cx-side { writing-mode:vertical-rl;text-orientation:mixed;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:linear-gradient(180deg,#0ea5e9,#8b5cf6,#10b981);border-radius:14px;padding:28px 10px;text-align:center;box-shadow:0 6px 24px rgba(14,165,233,0.22);display:flex;align-items:center;justify-content:center;gap:14px;min-height:300px;font-family:'Outfit',sans-serif; }
.cx-side-l { transform:rotate(180deg); }
.cx-side-arrow-icon { font-size:13px;opacity:.75; }

.cx-layer { border-radius:20px;padding:22px 24px;margin:6px 0;border:1.5px solid transparent;opacity:0;transform:translateY(18px);animation:cxUp .55s ease forwards;box-shadow:0 2px 16px rgba(13,43,62,0.06); }
.cx-layer-mgmt { background:rgba(14,165,233,0.08);border-color:rgba(14,165,233,0.3); }
.cx-layer-real  { background:rgba(139,92,246,0.08);border-color:rgba(139,92,246,0.3); }
.cx-layer-supp  { background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.3); }
@keyframes cxUp { to { opacity:1;transform:none; } }
.cx-layer-hd { display:flex;align-items:center;gap:12px;margin-bottom:16px; }
.cx-layer-ico { width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;color:#fff;box-shadow:0 2px 8px rgba(13,43,62,0.12); }
.cx-ico-mgmt { background:#0ea5e9; } .cx-ico-real { background:#8b5cf6; } .cx-ico-supp { background:#10b981; }
.cx-layer-title { font-size:14px;font-weight:700;font-family:'Outfit',sans-serif; }
.cx-title-mgmt { color:#0284c7; } .cx-title-real { color:#7c3aed; } .cx-title-supp { color:#059669; }
.cx-layer-cnt { margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;padding:3px 10px;border-radius:20px; }
.cx-cnt-mgmt { background:rgba(14,165,233,0.12);color:#0284c7;border:1px solid rgba(14,165,233,0.25); }
.cx-cnt-real  { background:rgba(139,92,246,0.12);color:#7c3aed;border:1px solid rgba(139,92,246,0.25); }
.cx-cnt-supp  { background:rgba(16,185,129,0.12);color:#059669;border:1px solid rgba(16,185,129,0.25); }

.cx-add-proc { display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:9px;font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;border:1.5px solid transparent; }
.cx-add-mgmt { background:rgba(14,165,233,0.1);color:#0284c7;border-color:rgba(14,165,233,0.3); }
.cx-add-mgmt:hover { background:#0ea5e9;color:#fff;transform:translateY(-1px);box-shadow:0 4px 12px rgba(14,165,233,0.35); }
.cx-add-real  { background:rgba(139,92,246,0.1);color:#7c3aed;border-color:rgba(139,92,246,0.3); }
.cx-add-real:hover  { background:#8b5cf6;color:#fff;transform:translateY(-1px);box-shadow:0 4px 12px rgba(139,92,246,0.35); }
.cx-add-supp  { background:rgba(16,185,129,0.1);color:#059669;border-color:rgba(16,185,129,0.3); }
.cx-add-supp:hover  { background:#10b981;color:#fff;transform:translateY(-1px);box-shadow:0 4px 12px rgba(16,185,129,0.35); }

.cx-proc-row { display:flex;gap:10px;flex-wrap:wrap;align-items:stretch; }
.cx-flow-arr { color:#5dade2;font-size:16px;flex-shrink:0;opacity:.7; }
.cx-empty-row { font-size:12px;padding:14px;border-radius:10px;width:100%;text-align:center;border:1.5px dashed;opacity:.6;display:flex;align-items:center;justify-content:center;gap:7px; }
.cx-empty-mgmt { color:#0284c7;border-color:rgba(14,165,233,0.3); }
.cx-empty-real  { color:#7c3aed;border-color:rgba(139,92,246,0.3); }
.cx-empty-supp  { color:#059669;border-color:rgba(16,185,129,0.3); }

/* CARTES : fond blanc, bordures colorées */
.cx-card { flex:1;min-width:140px;background:#fff;border-radius:14px;padding:14px 14px 12px;cursor:pointer;position:relative;overflow:hidden;transition:all .22s cubic-bezier(.34,1.56,.64,1);border:1.5px solid transparent;box-shadow:0 2px 10px rgba(0,0,0,0.05); }
.cx-card::before { content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0; }
.cx-card-mgmt { border-color:rgba(14,165,233,0.25); }
.cx-card-real  { border-color:rgba(139,92,246,0.25); }
.cx-card-supp  { border-color:rgba(16,185,129,0.25); }
.cx-card-mgmt::before { background:linear-gradient(90deg,#0ea5e9,#38bdf8); }
.cx-card-real::before  { background:linear-gradient(90deg,#8b5cf6,#a78bfa); }
.cx-card-supp::before  { background:linear-gradient(90deg,#10b981,#34d399); }
.cx-card:hover { transform:translateY(-4px); }
.cx-card-mgmt:hover { border-color:#0ea5e9;box-shadow:0 8px 28px rgba(14,165,233,0.15); }
.cx-card-real:hover  { border-color:#8b5cf6;box-shadow:0 8px 28px rgba(139,92,246,0.15); }
.cx-card-supp:hover  { border-color:#10b981;box-shadow:0 8px 28px rgba(16,185,129,0.15); }
.cx-card-on { transform:translateY(-2px) !important; }
.cx-card-mgmt.cx-card-on { border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,0.15),0 8px 24px rgba(14,165,233,0.18) !important; }
.cx-card-real.cx-card-on  { border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,0.15),0 8px 24px rgba(139,92,246,0.18) !important; }
.cx-card-supp.cx-card-on  { border-color:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,0.15),0 8px 24px rgba(16,185,129,0.18) !important; }

/* Actions toujours visibles avec couleurs pastel (comme GestionActifs) */
.cx-card-acts {
  position: absolute; top: 8px; right: 8px;
  display: flex; gap: 6px;
  opacity: 1;
  transition: none;
  z-index: 2;
}
..cx-act {
  width: 28px; height: 28px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  background: transparent;
  box-shadow: none;
}
/* Ajouter document - vert */
.cx-act-doc {
  background: transparent;
  color: #059669;
}
.cx-act-doc:hover {
  background: transparent;
  color: #047857;
}
/* Modifier - bleu */
.cx-act-e {
  background: transparent;
  color: #1D4ED8;
}
.cx-act-e:hover {
  background: transparent;
  color: #2563EB;
}
/* Supprimer - rouge */
.cx-act-d {
  background: transparent;
  color: #DC2626;
}
.cx-act-d:hover {
  background: transparent;
  color: #B91C1C;
}

.cx-card-num { font-family:'JetBrains Mono',monospace;font-size:9px;color:#8fb8cc;margin-bottom:6px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;gap:5px; }
.cx-card-cat-ico { font-size:9px; }
.cx-card-nm  { font-size:13px;font-weight:600;color:#0d2b3e;line-height:1.35;margin-bottom:10px; }
.cx-card-ft  { display:flex;align-items:center;justify-content:space-between;gap:6px; }
.cx-card-own { font-size:10px;color:#4a7a95;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:4px; }
.cx-own-ico { font-size:9px;opacity:.7; }
.cx-card-bdg { font-family:'JetBrains Mono',monospace;font-size:10px;padding:2px 8px;border-radius:6px;font-weight:500;flex-shrink:0;display:flex;align-items:center;gap:4px; }
.cx-bdg-ico { font-size:9px; }
.cx-bdg-mgmt { background:rgba(14,165,233,0.1);color:#0284c7; }
.cx-bdg-real  { background:rgba(139,92,246,0.1);color:#7c3aed; }
.cx-bdg-supp  { background:rgba(16,185,129,0.1);color:#059669; }

.cx-connector { display:flex;align-items:center;justify-content:center;height:26px;position:relative; }
.cx-conn-line { width:2px;height:100%;background:linear-gradient(to bottom,#0ea5e9,#8b5cf6,#10b981);opacity:.3;border-radius:2px; }
.cx-legend { position:relative;z-index:10;display:flex;gap:24px;justify-content:center;align-items:center;padding:0 48px 52px;flex-wrap:wrap; }
.cx-leg-item { display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600; }
.cx-leg-hint { font-size:11px;color:#8fb8cc;font-family:'JetBrains Mono',monospace;display:flex;align-items:center;gap:5px; }

/* PANNEAU DÉTAIL (inchangé) */
.cx-panel { position:fixed;right:-430px;top:85px;width:410px;height:calc(100vh - 85px);background:#fff;border-left:2px solid #aed6f1;z-index:50;transition:right .38s cubic-bezier(.34,1.56,.64,1);overflow-y:auto;display:flex;flex-direction:column;box-shadow:-8px 0 40px rgba(14,96,115,0.1);font-family:'Outfit',sans-serif; }
.cx-panel-open { right:0; }
.cx-ph { padding:24px 22px 18px;border-bottom:1px solid #d6eaf8;position:sticky;top:0;background:#fff;z-index:5; }
.cx-ph-strip { height:4px;border-radius:4px;margin-bottom:15px; }
.cx-ph-cat { font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;margin-bottom:7px;display:flex;align-items:center;gap:6px; }
.cx-ph-cat-ico { font-size:11px; }
.cx-ph-cat-mgmt { color:#0ea5e9; }
.cx-ph-cat-real  { color:#8b5cf6; }
.cx-ph-cat-supp  { color:#10b981; }
.cx-ph-title { font-size:16px;font-weight:700;color:#0d2b3e;padding-right:38px;line-height:1.35; }
.cx-ph-owner { margin-top:8px;font-size:12px;color:#4a7a95;display:flex;align-items:center;gap:6px; }
.cx-ph-close { position:absolute;top:20px;right:16px;width:30px;height:30px;background:#eaf4fb;border:1px solid #aed6f1;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;color:#4a7a95;transition:all .15s; }
.cx-ph-close:hover { background:#fde8e8;border-color:#e74c3c;color:#e74c3c; }
.cx-pb { padding:20px 22px;flex:1; }
.cx-pb-desc { font-size:13px;color:#4a7a95;line-height:1.7;padding:13px 15px;background:#eaf4fb;border:1px solid #d6eaf8;border-radius:10px;margin-bottom:20px;display:flex;gap:9px;align-items:flex-start; }
.cx-desc-ico { font-size:13px;color:#0ea5e9;flex-shrink:0;margin-top:2px; }
.cx-pb-sh { display:flex;align-items:center;justify-content:space-between;margin-bottom:12px; }
.cx-pb-stit { font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#4a7a95;display:flex;align-items:center;gap:6px; }
.cx-sh-ico { font-size:11px; }
.cx-pb-cnt { font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700; }

/* ISO refs */
.cx-iso-refs-list { margin-bottom:16px; }
.cx-no-iso { text-align:center;padding:14px;color:#9CA3AF;font-size:12px;border:1.5px dashed #E5E7EB;border-radius:10px;background:#FAFAFA; }
.cx-iso-refs-grid { display:flex;flex-wrap:wrap;gap:6px; }
.cx-iso-ref-badge { display:inline-flex;align-items:center;gap:5px;padding:4px 9px;background:#F9FAFB;border-left:3px solid;border-radius:0 6px 6px 0;font-size:11px;font-weight:600;color:#111827; }
.cx-iso-ref-badge i { font-size:10px; }

/* ISO MultiSelect */
.cx-iso-selector { position:relative;width:100%; }
.cx-iso-tags { display:flex;flex-wrap:wrap;gap:8px;align-items:center;min-height:42px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:10px;padding:8px 12px;transition:border-color .15s; }
.cx-iso-tags:focus-within { border-color:#1D4ED8;background:#fff; }
.cx-iso-placeholder { font-size:12px;color:#9CA3AF; }
.cx-iso-tag { display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:20px;font-size:11px;color:#111827;max-width:100%;overflow-wrap:anywhere;border:1px solid transparent; }
.cx-iso-tag-remove { background:none;border:none;cursor:pointer;font-size:10px;color:#6B7280;display:inline-flex;align-items:center;padding:2px;border-radius:50%;transition:all .12s;flex-shrink:0; }
.cx-iso-tag-remove:hover { color:#EF4444;background:rgba(239,68,68,.1); }
.cx-iso-add-btn { display:inline-flex;align-items:center;gap:5px;background:transparent;border:1px solid;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;flex-shrink:0; }
.cx-iso-add-btn:hover { transform:translateY(-1px); }
.cx-iso-dropdown { position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border:.5px solid #E5E7EB;border-radius:12px;box-shadow:0 12px 28px rgba(0,0,0,.12);z-index:200;max-height:320px;display:flex;flex-direction:column;overflow:hidden; }
.cx-iso-search { padding:10px 12px;border-bottom:.5px solid #E5E7EB;display:flex;align-items:center;gap:8px;background:#FAFAFA;flex-shrink:0; }
.cx-iso-search i { color:#9CA3AF;font-size:12px;flex-shrink:0; }
.cx-iso-search input { flex:1;min-width:0;border:none;outline:none;background:transparent;font-size:12px;padding:6px 0;font-family:'Sora',sans-serif; }
.cx-iso-list { overflow-y:auto;flex:1;padding:8px; }
.cx-iso-item { display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:background .1s;font-size:12px;width:100%;min-width:0;box-sizing:border-box; }
.cx-iso-item:hover { background:#EFF6FF; }
.cx-iso-item.selected { background:#DBEAFE; }
.cx-iso-item input[type="checkbox"] { margin:0;flex-shrink:0;width:15px;height:15px;cursor:pointer;accent-color:#1D4ED8; }
.cx-iso-item-value { flex:1;min-width:0;color:#111827;font-size:12px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.cx-iso-empty { padding:20px;text-align:center;color:#9CA3AF;font-size:12px; }

/* Documents */
.cx-doc-list { display:flex;flex-direction:column;gap:8px; }
.cx-no-doc { text-align:center;padding:22px;color:#8fb8cc;font-size:12px;border:1.5px dashed #d6eaf8;border-radius:10px;line-height:1.9; }
.cx-no-doc-ico { font-size:26px;display:block;margin-bottom:4px;opacity:.5; }
.cx-doc-item { display:flex;align-items:center;gap:10px;padding:10px 12px;background:#eaf4fb;border:1px solid #d6eaf8;border-radius:10px;transition:border-color .15s; }
.cx-doc-item:hover { border-color:#aed6f1; }
.cx-doc-type-ico { font-size:15px;color:#0ea5e9;flex-shrink:0;width:18px;text-align:center; }
.cx-doc-info { flex:1;min-width:0; }
.cx-doc-nm { font-size:12px;font-weight:600;color:#0d2b3e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.cx-doc-mt { font-size:10px;color:#8fb8cc;font-family:'JetBrains Mono',monospace;margin-top:2px;display:flex;flex-wrap:wrap;gap:6px;align-items:center; }
.cx-doc-fichier-badge { display:inline-flex;align-items:center;gap:3px;background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;border-radius:4px;padding:1px 6px;font-size:9px;font-weight:600;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.cx-doc-st { font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;flex-shrink:0;white-space:nowrap; }
.s-approuve { background:#d1fae5;color:#065f46;border:1px solid #6ee7b7; }
.s-validation{ background:#fef3c7;color:#92400e;border:1px solid #fcd34d; }
.s-brouillon { background:#f1f5f9;color:#334155;border:1px solid #cbd5e1; }
.s-revoir   { background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5; }
.cx-dl-btn { background:none;border:none;cursor:pointer;color:#0284c7;font-size:13px;padding:5px;border-radius:6px;transition:color .15s,background .15s;flex-shrink:0;display:flex;align-items:center;justify-content:center; }
.cx-dl-btn:hover { color:#0e6073;background:#e0f2fe; }
.cx-del-btn { background:none;border:none;cursor:pointer;color:#8fb8cc;font-size:13px;padding:5px;border-radius:6px;transition:color .15s,background .15s;flex-shrink:0;display:flex;align-items:center;justify-content:center; }
.cx-del-btn:hover { color:#e74c3c;background:#fde8e8; }
.cx-add-doc-btn { width:100%;margin-top:12px;padding:11px;background:transparent;border:1.5px dashed #aed6f1;border-radius:10px;color:var(--ac,#0ea5e9);font-family:'Outfit',sans-serif;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:8px; }
.cx-add-doc-btn:hover { border-color:#0ea5e9;background:#eaf4fb; }

/* MODALS */
.cx-overlay { position:fixed;inset:0;background:rgba(13,43,62,0.45);backdrop-filter:blur(6px);z-index:100;display:flex;align-items:center;justify-content:center; }
.cx-modal { background:#fff;border:1.5px solid #aed6f1;border-radius:20px;width:520px;max-width:92vw;padding:28px;box-shadow:0 32px 80px rgba(13,43,62,0.22);animation:cxPop .22s cubic-bezier(.34,1.56,.64,1);font-family:'Outfit',sans-serif;max-height:90vh;overflow-y:auto; }
@keyframes cxPop { from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none} }
.cx-modal h3 { font-size:17px;font-weight:700;color:#0ea5e9;margin-bottom:20px;display:flex;align-items:center; }
.cx-fg { margin-bottom:14px; }
.cx-flbl { display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#4a7a95;margin-bottom:6px; }
.cx-flbl-ico { font-size:10px; }
.cx-fg input, .cx-fg select, .cx-fg textarea { width:100%;background:#eaf4fb;border:1.5px solid #d6eaf8;border-radius:10px;padding:9px 13px;color:#0d2b3e;font-family:'Outfit',sans-serif;font-size:13px;outline:none;transition:border-color .15s,box-shadow .15s; }
.cx-fg input:focus,.cx-fg select:focus,.cx-fg textarea:focus { border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,0.1);background:#fff; }
.cx-fg textarea { resize:vertical;min-height:72px; }

/* Zone fichier */
.cx-file-zone { width:100%;min-height:54px;background:#eaf4fb;border:1.5px dashed #aed6f1;border-radius:10px;padding:10px 14px;cursor:pointer;transition:border-color .15s,background .15s;display:flex;align-items:center; }
.cx-file-zone:hover { border-color:#0ea5e9;background:#dff0f9; }
.cx-file-placeholder { display:flex;align-items:center;font-size:12px;color:#4a7a95;flex-wrap:wrap;font-family:'Outfit',sans-serif; }
.cx-file-hint { font-size:10px;color:#8fb8cc;font-family:'JetBrains Mono',monospace;margin-left:8px; }
.cx-file-chosen { display:flex;align-items:center;gap:4px;font-size:12px;color:#0d2b3e;font-weight:600;font-family:'Outfit',sans-serif;word-break:break-all;flex:1; }
.cx-file-clear { background:none;border:none;cursor:pointer;color:#8fb8cc;font-size:12px;padding:2px 5px;border-radius:4px;margin-left:auto;flex-shrink:0;transition:color .15s,background .15s; }
.cx-file-clear:hover { color:#e74c3c;background:#fde8e8; }

.cx-modal-ft { display:flex;justify-content:flex-end;gap:10px;margin-top:22px; }
.cx-btn-cancel { display:inline-flex;align-items:center;padding:9px 18px;background:transparent;border:1.5px solid #aed6f1;border-radius:10px;color:#4a7a95;font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s; }
.cx-btn-cancel:hover { border-color:#e74c3c;color:#e74c3c; }
.cx-btn-save { display:inline-flex;align-items:center;padding:9px 22px;border:none;border-radius:10px;color:#fff;font-family:'Outfit',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;background:linear-gradient(135deg,#0ea5e9,#0284c7);box-shadow:0 4px 14px rgba(14,165,233,0.3); }
.cx-btn-save:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(14,165,233,0.4); }
.cx-btn-save:disabled { opacity:.65;cursor:not-allowed;transform:none; }

::-webkit-scrollbar { width:5px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:#aed6f1;border-radius:99px; }
`;

