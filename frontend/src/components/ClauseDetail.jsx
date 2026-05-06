import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLandmark, faCrown, faBullseye, faCog, faWrench, faChartBar, faArrowsRotate,
  faChevronLeft, faChevronDown, faChevronRight,
  faPen, faTrash, faPlus, faCircleCheck, faListCheck,
  faMagnifyingGlass, faShieldHalved, faFloppyDisk, faTriangleExclamation,
  faCircleInfo, faPaperclip, faUser, faCalendar, faHashtag,
  faCheckCircle, faCircleXmark, faCircleMinus,
  faArrowLeft, faSpinner, faLightbulb, faClipboardList,
  faRotateRight, faFlag, faChevronUp, faExclamationTriangle,
  faLock, faShield, faFire,
  faUpload, faFileAlt, faDownload, faFilePdf, faFileWord,
  faFileExcel, faFileImage, faFileArchive, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import {
  getClause, getConformity, upsertConformity,
  getActionPlans, createActionPlan, updateActionPlan, deleteActionPlan,
  getConformityProofs, upsertConformityProof,
  uploadConformityProofFile, deleteConformityProofFile,
  uploadActionPlanFile, deleteActionPlanFile, downloadFile,
} from "../api/clauses";

/* ════════════════════════════════════════════════════════════
   DESIGN TOKENS
════════════════════════════════════════════════════════════ */
const ACCENT  = "#1D4ED8";
const BG_PAGE = "#F4F6FA";
const BORDER  = "#E2E5EA";
const TEXT1   = "#0D1117";
const TEXT3   = "#9CA3AF";

/* ════════════════════════════════════════════════════════════
   CLAUSE META
════════════════════════════════════════════════════════════ */
const CLAUSE_META = {
  4:  { faIcon: faLandmark,     color: ACCENT, bg:"#EFF6FF", border:"#BFDBFE", grad:[ACCENT,"#1E40AF"], label:"Contexte de l'organisation" },
  5:  { faIcon: faCrown,        color: ACCENT, bg:"#EFF6FF", border:"#BFDBFE", grad:[ACCENT,"#1E40AF"], label:"Leadership"                 },
  6:  { faIcon: faBullseye,     color: ACCENT, bg:"#EFF6FF", border:"#BFDBFE", grad:[ACCENT,"#1E40AF"], label:"Planification"              },
  7:  { faIcon: faCog,          color: ACCENT, bg:"#EFF6FF", border:"#BFDBFE", grad:[ACCENT,"#1E40AF"], label:"Support"                    },
  8:  { faIcon: faWrench,       color: ACCENT, bg:"#EFF6FF", border:"#BFDBFE", grad:[ACCENT,"#1E40AF"], label:"Fonctionnement"             },
  9:  { faIcon: faChartBar,     color: ACCENT, bg:"#EFF6FF", border:"#BFDBFE", grad:[ACCENT,"#1E40AF"], label:"Évaluation des performances"},
  10: { faIcon: faArrowsRotate, color: ACCENT, bg:"#EFF6FF", border:"#BFDBFE", grad:[ACCENT,"#1E40AF"], label:"Amélioration"               },
};
const PDCA_MAP        = { 4:"P", 5:"P", 6:"P", 7:"D", 8:"D", 9:"C", 10:"A" };
const PDCA_LABEL_FULL = { P:"Plan", D:"Do", C:"Check", A:"Act" };

const CONFORMITY_OPTIONS = [
  { value:"non-conforme", label:"Non conforme", color:"#DC2626", bg:"#FEE2E2", faIcon:faCircleXmark },
  { value:"conforme",     label:"Conforme",     color:"#16A34A", bg:"#DCFCE7", faIcon:faCheckCircle },
];
const STATUT_OPTIONS = [
  { value:"ouverte",    label:"Ouverte",    color:"#64748B" },
  { value:"en-cours",   label:"En cours",   color:"#0369A1" },
  { value:"en-attente", label:"En attente", color:"#D97706" },
  { value:"terminee",   label:"Terminée",   color:"#16A34A" },
];
const GRAVITE_OPTIONS = [
  { value:"mineure", label:"NC Mineure", color:"#CA8A04", bg:"#FEF9C3" },
  { value:"majeure", label:"NC Majeure", color:"#DC2626", bg:"#FEE2E2" },
];
const IMPACT_OPTIONS = ["faible","moyen","élevé","critique"];
const IMPACT_COLOR   = { faible:"#16A34A", moyen:"#CA8A04", "élevé":"#EA580C", critique:"#DC2626" };

const CLAUSE_SPECIFIC_FIELDS = {
  4: { title:"Analyse de Contexte Organisationnel", hasEnjeuxTables:true, fields:[
    {key:"etatAnalyseContexte",label:"État de l'analyse de contexte existante",type:"textarea",placeholder:"Dernière analyse datant de..., points obsolètes..."},
    {key:"changementsMajeurs",label:"Changements majeurs non pris en compte",type:"textarea",placeholder:"Fusion, nouveaux marchés, changements réglementaires..."},
    {key:"frequenceMiseAJour",label:"Fréquence de mise à jour requise",type:"text",placeholder:"Ex: Annuelle + événements majeurs"},
    {key:"methodeAnalyse",label:"Méthode d'analyse à utiliser",type:"text",placeholder:"Ex: PESTEL + SWOT + Parties intéressées"},
  ]},
  5: { title:"Leadership et Gouvernance SMSI", hasEnjeuxTables:false, fields:[
    {key:"etatPolitique",label:"État de la politique SMSI existante",type:"textarea",placeholder:"Version actuelle, date de validation..."},
    {key:"engagementDirection",label:"Niveau d'engagement de la direction",type:"textarea",placeholder:"Réunions SMSI, budget alloué, sponsors..."},
    {key:"rolesDefinis",label:"Rôles et responsabilités définis",type:"textarea",placeholder:"RSSI, DPO, responsables métier..."},
  ]},
  6: { title:"Gestion des Risques SSI", hasEnjeuxTables:false, fields:[
    {key:"etatAppreciationRisques",label:"État de l'appréciation des risques",type:"textarea",placeholder:"Dernière analyse, périmètre couvert..."},
    {key:"methodologieRisques",label:"Méthodologie d'analyse des risques",type:"text",placeholder:"Ex: EBIOS Risk Manager, ISO 27005..."},
    {key:"planTraitementRisques",label:"Plan de traitement des risques",type:"textarea",placeholder:"Risques prioritaires, mesures planifiées..."},
  ]},
  7: { title:"Ressources et Compétences", hasEnjeuxTables:false, fields:[
    {key:"ressourcesAllouees",label:"Ressources allouées au SMSI",type:"textarea",placeholder:"Budget, équipes, outils disponibles..."},
    {key:"competencesIdentifiees",label:"Compétences identifiées et manquantes",type:"textarea",placeholder:"Formations requises, certifications..."},
    {key:"planSensibilisation",label:"Plan de sensibilisation existant",type:"textarea",placeholder:"État du programme, fréquence, taux couverture..."},
  ]},
  8: { title:"Contrôles Opérationnels", hasEnjeuxTables:false, fields:[
    {key:"processusOperationnels",label:"Processus opérationnels documentés",type:"textarea",placeholder:"Procédures existantes, lacunes identifiées..."},
    {key:"controlesImplementes",label:"Contrôles de sécurité implémentés",type:"textarea",placeholder:"Contrôles d'accès, chiffrement, journalisation..."},
    {key:"planificationOperationnelle",label:"Planification opérationnelle",type:"textarea",placeholder:"Calendrier des contrôles, tests, revues..."},
  ]},
  9: { title:"Surveillance et Audit", hasEnjeuxTables:false, fields:[
    {key:"indicateursPerformance",label:"Indicateurs de performance définis",type:"textarea",placeholder:"KPIs SSI, tableaux de bord..."},
    {key:"planAuditInterne",label:"Programme d'audit interne",type:"textarea",placeholder:"Fréquence, périmètre, auditeurs désignés..."},
    {key:"frequenceRevueDirection",label:"Fréquence de revue de direction",type:"text",placeholder:"Ex: Semestrielle, annuelle..."},
  ]},
  10: { title:"Amélioration Continue", hasEnjeuxTables:false, fields:[
    {key:"nonConformitesIdentifiees",label:"Non-conformités identifiées",type:"textarea",placeholder:"Liste des NC, sources de détection..."},
    {key:"actionsCorrectivesEnCours",label:"Actions correctives en cours",type:"textarea",placeholder:"État d'avancement, blocages..."},
    {key:"opportunitesAmelioration",label:"Opportunités d'amélioration identifiées",type:"textarea",placeholder:"Quick wins, améliorations systémiques..."},
  ]},
};

/* ════════════════════════════════════════════════════════════
   FILE HELPERS
════════════════════════════════════════════════════════════ */
function formatBytes(b) {
  if (b < 1024)          return `${b} o`;
  if (b < 1048576)       return `${(b/1024).toFixed(1)} Ko`;
  return `${(b/1048576).toFixed(1)} Mo`;
}
function fileIconInfo(ct="", name="") {
  const e = (name.split(".").pop()||"").toLowerCase();
  if (ct.includes("pdf")   || e==="pdf")                        return { icon:faFilePdf,     color:"#DC2626" };
  if (ct.includes("word")  || ["doc","docx"].includes(e))       return { icon:faFileWord,    color:"#1D4ED8" };
  if (ct.includes("excel") || ct.includes("spreadsheet") || ["xls","xlsx"].includes(e)) return { icon:faFileExcel, color:"#16A34A" };
  if (ct.includes("image") || ["png","jpg","jpeg","gif","webp"].includes(e)) return { icon:faFileImage, color:"#8B5CF6" };
  if (["zip","rar","7z"].includes(e))                            return { icon:faFileArchive, color:"#D97706" };
  return { icon:faFileAlt, color:"#64748B" };
}

/* ════════════════════════════════════════════════════════════
   HYBRID ITEM HELPERS
════════════════════════════════════════════════════════════ */
function toHybridItems(arr) {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map(item => {
    if (!item) return null;
    if (typeof item === "string") return { type:"text", value:item };
    if (item.type === "text" || item.type === "file") return item;
    if (item.nom) return { type:"text", value:item.nom };
    return { type:"text", value:String(item) };
  }).filter(Boolean);
}
function fromHybridItems(items=[]) {
  return items
    .filter(i => !i.uploading)
    .map(i => i.value);
}
function emptyPlan(clauseId, clauseNumber, subClauseId=null) {
  return {
    isoClauseId:clauseId, subClauseId,
    reference:"", version:"1.0",
    dateDetection:new Date().toISOString().split("T")[0],
    sourceDetection:"", clauseIso:clauseNumber, gravite:"mineure", descriptionNc:"",
    specificFields:{}, responsableImmediat:"", mesureImmediate:"",
    preuvesImmediates:[],
    analyseCausesRacines:"", causePrincipale:"", causesSecondaires:[],
    documentAProduire:{ ref:"" },
    periodiciteRevision:"",
    enjeuxInternes:[], enjeuxExternes:[], etapesPlanAction:[],
    dateEcheanceGlobale:"", responsablePlan:"", ressourcesNecessaires:"",
    methodesVerification:[], dateVerification:"", resultatsObtenus:"",
    piecesJointes:[],
    statut:"ouverte", planCloture:false, dateCloture:"", validateur:"",
  };
}
function planToFormState(plan) {
  if (!plan) return null;
  return {
    ...plan,
    preuvesImmediates:    toHybridItems(plan.preuvesImmediates),
    methodesVerification: toHybridItems(plan.methodesVerification),
    piecesJointes:        toHybridItems(plan.piecesJointes),
    causesSecondaires:    Array.isArray(plan.causesSecondaires)  ? plan.causesSecondaires  : [],
    etapesPlanAction:     Array.isArray(plan.etapesPlanAction)   ? plan.etapesPlanAction   : [],
    enjeuxInternes:       Array.isArray(plan.enjeuxInternes)     ? plan.enjeuxInternes     : [],
    enjeuxExternes:       Array.isArray(plan.enjeuxExternes)     ? plan.enjeuxExternes     : [],
    documentAProduire:    typeof plan.documentAProduire === "string"
      ? { ref: plan.documentAProduire }
      : (plan.documentAProduire || { ref:"" }),
  };
}
function formToApiDto(form) {
  return {
    ...form,
    preuvesImmediates:    fromHybridItems(form.preuvesImmediates),
    methodesVerification: fromHybridItems(form.methodesVerification),
    piecesJointes:        fromHybridItems(form.piecesJointes),
    documentAProduire:    form.documentAProduire?.ref || "",
  };
}
async function flushPendingFiles(planId, form, setForm) {
  const listKeys = [
    { key:"preuvesImmediates",    label:"Preuve action immédiate" },
    { key:"methodesVerification", label:"Méthode de vérification" },
    { key:"piecesJointes",        label:"Pièce jointe" },
  ];
  const patch = {};
  for (const {key, label} of listKeys) {
    const items = [...(form[key]||[])];
    for (let i=0; i<items.length; i++) {
      if (items[i].pendingFile) {
        try {
          const saved = await uploadActionPlanFile(planId, items[i].pendingFile, label);
          items[i] = { type:"file", value:saved.originalName, fileId:saved.id, downloadUrl:saved.downloadUrl, contentType:saved.contentType, fileSize:saved.fileSize };
        } catch { /* keep as text */ }
      }
    }
    patch[key] = items;
  }
  if (form.documentAProduire?.file?.pendingFile) {
    try {
      const saved = await uploadActionPlanFile(planId, form.documentAProduire.file.pendingFile, "Document à produire");
      patch.documentAProduire = { ...form.documentAProduire, file:{ fileId:saved.id, downloadUrl:saved.downloadUrl, originalName:saved.originalName, contentType:saved.contentType, fileSize:saved.fileSize } };
    } catch { /* keep ref only */ }
  }
  return patch;
}

/* ════════════════════════════════════════════════════════════
   HYBRID LIST FIELD
════════════════════════════════════════════════════════════ */
function HybridListField({ items: itemsProp, onChange, onFileAdd, placeholder, accentColor, label, labelStyle }) {
  const items = Array.isArray(itemsProp) ? itemsProp : [];

  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const [text, setText]         = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef                 = useRef(null);

  const addText = () => {
    if (!text.trim()) return;
    onChange([...itemsRef.current, { type:"text", value:text.trim() }]);
    setText("");
  };

  const handleFile = async (file) => {
    const tempId = `tmp-${Date.now()}`;

    const withPlaceholder = [...itemsRef.current, {
      type:"file", value:file.name, tempId,
      uploading:true, progress:0,
      contentType:file.type, fileSize:file.size,
    }];
    onChange(withPlaceholder);

    try {
      if (onFileAdd) {
        const saved = await onFileAdd(file, (pct) => {
          const updated = itemsRef.current.map(i =>
            i.tempId === tempId ? { ...i, progress: pct } : i
          );
          onChange(updated);
        });
        const withSaved = itemsRef.current.map(i =>
          i.tempId === tempId
            ? { type:"file", value:saved.originalName, fileId:saved.id,
                downloadUrl:saved.downloadUrl, contentType:saved.contentType,
                fileSize:saved.fileSize }
            : i
        );
        onChange(withSaved);
      } else {
        const withPending = itemsRef.current.map(i =>
          i.tempId === tempId
            ? { type:"file", value:file.name, pendingFile:file,
                contentType:file.type, fileSize:file.size, uploading:false }
            : i
        );
        onChange(withPending);
      }
    } catch {
      onChange(itemsRef.current.filter(i => i.tempId !== tempId));
    }
  };

  const remove = (idx) => {
    const item = items[idx];
    onChange(items.filter((_,i) => i!==idx), item);
  };

  return (
    <div>
      {label && <label style={labelStyle||{fontSize:11,fontWeight:700,color:"#64748B",marginBottom:6,display:"block",letterSpacing:".2px"}}>{label}</label>}

      {items.length > 0 && (
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
          {items.map((item,idx) => {
            const fi = item.type==="file" ? fileIconInfo(item.contentType||"", item.value) : null;
            return (
              <div key={idx} style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"8px 12px", borderRadius:8,
                background: item.type==="file" ? "#F8FAFC" : "#FAFBFC",
                border:`1px solid ${item.type==="file" ? accentColor+"33" : "#E4E8F0"}`,
              }}>
                {item.type==="file" ? (
                  <>
                    {item.uploading
                      ? <FontAwesomeIcon icon={faSpinner} spin style={{fontSize:14,color:accentColor,flexShrink:0}}/>
                      : <FontAwesomeIcon icon={fi.icon} style={{fontSize:14,color:fi.color,flexShrink:0}}/>
                    }
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:600,color:"#0D1117",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.value}</div>
                      {item.uploading
                        ? <div style={{marginTop:4,height:3,borderRadius:99,background:"#E4E8F0",overflow:"hidden",width:120}}>
                            <div style={{height:"100%",width:`${item.progress||0}%`,background:accentColor,transition:"width .2s",borderRadius:99}}/>
                          </div>
                        : <div style={{fontSize:10,color:"#94A3B8",marginTop:1}}>
                            {formatBytes(item.fileSize||0)}
                            {item.pendingFile && <span style={{color:"#D97706",marginLeft:6}}>· Enregistré avec le plan</span>}
                          </div>
                      }
                    </div>
                    {!item.uploading && item.fileId && (
                      <button onClick={()=>downloadFile(item.fileId, item.value)}
                        style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${accentColor}33`,background:`${accentColor}0d`,color:accentColor,fontSize:10,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0,transition:"all .15s",outline:"none"}}
                        onMouseEnter={e=>{e.currentTarget.style.background=accentColor;e.currentTarget.style.color="#fff";}}
                        onMouseLeave={e=>{e.currentTarget.style.background=`${accentColor}0d`;e.currentTarget.style.color=accentColor;}}
                      >
                        <FontAwesomeIcon icon={faDownload} style={{fontSize:8}}/> DL
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperclip} style={{fontSize:10,color:accentColor,flexShrink:0}}/>
                    <span style={{flex:1,fontSize:11,color:"#374151"}}>{item.value}</span>
                  </>
                )}
                <button onClick={()=>remove(idx)} style={{background:"none",border:"none",cursor:"pointer",color:"#CBD5E1",fontSize:13,padding:0,flexShrink:0,transition:"color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.color="#F87171"}
                  onMouseLeave={e=>e.currentTarget.style.color="#CBD5E1"}
                ><FontAwesomeIcon icon={faXmark}/></button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        display:"flex", gap:6, alignItems:"center",
        padding:"5px 8px", borderRadius:9,
        border:`1.5px dashed ${dragOver ? accentColor : "#CBD5E1"}`,
        background: dragOver ? `${accentColor}06` : "#FAFBFC",
        transition:"all .2s",
      }}
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)handleFile(f);}}
      >
        <input
          value={text}
          onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addText();}}}
          placeholder={dragOver ? "Déposez le fichier ici…" : placeholder}
          style={{flex:1,border:"none",background:"transparent",fontSize:11,outline:"none",color:"#374151",fontFamily:"inherit",minWidth:0,padding:"4px 2px"}}
        />
        <button onClick={addText} title="Ajouter référence texte (Entrée)"
          style={{padding:"4px 10px",borderRadius:7,border:"none",background:text.trim()?accentColor:"#E4E8F0",color:text.trim()?"#fff":"#94A3B8",fontWeight:700,fontSize:11,cursor:text.trim()?"pointer":"default",display:"flex",alignItems:"center",gap:3,flexShrink:0,transition:"all .15s"}}>
          <FontAwesomeIcon icon={faPlus} style={{fontSize:9}}/>
        </button>
        <button onClick={()=>fileRef.current?.click()} title="Importer un fichier"
          style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${accentColor}44`,background:`${accentColor}0d`,color:accentColor,fontWeight:600,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0,transition:"all .15s",whiteSpace:"nowrap"}}
          onMouseEnter={e=>{e.currentTarget.style.background=accentColor;e.currentTarget.style.color="#fff";}}
          onMouseLeave={e=>{e.currentTarget.style.background=`${accentColor}0d`;e.currentTarget.style.color=accentColor;}}
        >
          <FontAwesomeIcon icon={faUpload} style={{fontSize:9}}/> Fichier
        </button>
        <input ref={fileRef} type="file" style={{display:"none"}}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip"
          onChange={e=>{const f=e.target.files?.[0];if(f){handleFile(f);e.target.value="";}}}
        />
      </div>
      <p style={{fontSize:9,color:"#94A3B8",margin:"4px 0 0 2px"}}>
        Tapez puis Entrée pour ajouter une référence, ou cliquez sur <strong>Fichier</strong> / glissez un document.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   DOCUMENT FIELD
════════════════════════════════════════════════════════════ */
function DocumentField({ value={}, onChange, onFileAdd, onFileRemove, accentColor, placeholder, inputStyle }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    setUploading(true); setProgress(0);
    try {
      if (onFileAdd) {
        const saved = await onFileAdd(file, setProgress);
        onChange({ ...value, file:{ fileId:saved.id, downloadUrl:saved.downloadUrl, originalName:saved.originalName, contentType:saved.contentType, fileSize:saved.fileSize } });
      } else {
        onChange({ ...value, file:{ pendingFile:file, originalName:file.name, contentType:file.type, fileSize:file.size } });
      }
    } catch { /* noop */ }
    finally { setUploading(false); setProgress(0); }
  };

  const removeFile = () => {
    if (value.file?.fileId && onFileRemove) onFileRemove(value.file.fileId);
    onChange({ ...value, file:null });
  };

  const fi = value.file ? fileIconInfo(value.file.contentType||"", value.file.originalName||"") : null;
  const IS = inputStyle || {width:"100%",padding:"9px 12px",borderRadius:9,border:"1px solid #E4E8F0",fontSize:12,outline:"none",color:"#374151",background:"#fff",fontFamily:"inherit",transition:"border-color .15s, box-shadow .15s"};

  return (
    <div>
      <div style={{display:"flex",gap:6}}>
        <input
          value={value.ref||""}
          onChange={e=>onChange({...value,ref:e.target.value})}
          placeholder={placeholder||"Référence du document (ex: SMSI-CTX-001 v2.0)"}
          style={{...IS,flex:1}}
          onFocus={e=>{e.target.style.borderColor=accentColor;e.target.style.boxShadow=`0 0 0 3px ${accentColor}18`;}}
          onBlur={e=>{e.target.style.borderColor="#E4E8F0";e.target.style.boxShadow="none";}}
        />
        {!value.file && !uploading && (
          <button onClick={()=>fileRef.current?.click()}
            style={{padding:"0 14px",borderRadius:9,border:`1.5px solid ${accentColor}44`,background:`${accentColor}0d`,color:accentColor,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,flexShrink:0,transition:"all .15s",whiteSpace:"nowrap"}}
            onMouseEnter={e=>{e.currentTarget.style.background=accentColor;e.currentTarget.style.color="#fff";}}
            onMouseLeave={e=>{e.currentTarget.style.background=`${accentColor}0d`;e.currentTarget.style.color=accentColor;}}
          >
            <FontAwesomeIcon icon={faPaperclip} style={{fontSize:11}}/> Joindre
          </button>
        )}
        <input ref={fileRef} type="file" style={{display:"none"}}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip"
          onChange={e=>{const f=e.target.files?.[0];if(f){handleFile(f);e.target.value="";}}}
        />
      </div>

      {uploading && (
        <div style={{marginTop:6,padding:"8px 12px",borderRadius:8,background:`${accentColor}0d`,border:`1px solid ${accentColor}33`,display:"flex",alignItems:"center",gap:10}}>
          <FontAwesomeIcon icon={faSpinner} spin style={{color:accentColor,fontSize:12,flexShrink:0}}/>
          <div style={{flex:1,height:3,borderRadius:99,background:`${accentColor}22`,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${progress}%`,background:accentColor,transition:"width .2s",borderRadius:99}}/>
          </div>
          <span style={{fontSize:10,color:accentColor,fontWeight:700}}>{progress}%</span>
        </div>
      )}

      {value.file && !uploading && (
        <div style={{marginTop:6,display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:"#F8FAFC",border:`1px solid ${accentColor}33`}}>
          <FontAwesomeIcon icon={fi.icon} style={{fontSize:15,color:fi.color,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:600,color:"#0D1117",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value.file.originalName}</div>
            <div style={{fontSize:10,color:"#94A3B8",marginTop:1}}>
              {formatBytes(value.file.fileSize||0)}
              {value.file.pendingFile && <span style={{color:"#D97706",marginLeft:6}}>· Enregistré avec le plan</span>}
            </div>
          </div>
          {value.file.fileId && (
            <button onClick={()=>downloadFile(value.file.fileId, value.file.originalName)}
              style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${accentColor}33`,background:`${accentColor}0d`,color:accentColor,fontSize:10,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0,outline:"none"}}
              onMouseEnter={e=>{e.currentTarget.style.background=accentColor;e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background=`${accentColor}0d`;e.currentTarget.style.color=accentColor;}}
            >
              <FontAwesomeIcon icon={faDownload} style={{fontSize:8}}/> DL
            </button>
          )}
          <button onClick={removeFile} style={{background:"none",border:"none",cursor:"pointer",color:"#CBD5E1",fontSize:13,padding:0,flexShrink:0,transition:"color .15s"}}
            onMouseEnter={e=>e.currentTarget.style.color="#F87171"}
            onMouseLeave={e=>e.currentTarget.style.color="#CBD5E1"}
          ><FontAwesomeIcon icon={faXmark}/></button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CONFORMITY PROOF PANEL
════════════════════════════════════════════════════════════ */
function ConformityProofPanel({ sub, meta, proofs, onProofUploaded, onProofFileDeleted }) {
  const [uploading, setUploading]           = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [desc, setDesc]                     = useState("");
  const fileRef                             = useRef(null);
  const [dragOver, setDragOver]             = useState(false);

  const allFiles = proofs.flatMap(p => p.files||[]);

  const handleUpload = async (file) => {
    setUploading(true); setUploadProgress(0);
    try {
      const proof = proofs[0] || await upsertConformityProof(sub.id, desc);
      const f = await uploadConformityProofFile(proof.id, file, desc||undefined, setUploadProgress);
      onProofUploaded(proof, f);
    } catch(e){ console.error(e); }
    finally { setUploading(false); setUploadProgress(null); }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Supprimer cette preuve ?")) return;
    await deleteConformityProofFile(fileId);
    onProofFileDeleted(fileId);
  };

  return (
    <div style={{padding:"16px 18px 18px",background:"#F0FDF4",borderTop:"1px solid #BBF7D0"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <div style={{width:26,height:26,borderRadius:7,background:"#16A34A",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <FontAwesomeIcon icon={faPaperclip} style={{color:"#fff",fontSize:11}}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:800,color:"#15803D"}}>Preuves de conformité</div>
          <div style={{fontSize:10,color:"#16A34A"}}>{allFiles.length>0?`${allFiles.length} fichier${allFiles.length>1?"s":""} importé${allFiles.length>1?"s":""}`:"Importez les documents justifiant la conformité"}</div>
        </div>
      </div>

      {allFiles.length > 0 && (
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {allFiles.map(f => {
            const fi = fileIconInfo(f.contentType||"", f.originalName||"");
            return (
              <div key={f.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:8,background:"#fff",border:"1px solid #BBF7D0"}}>
                <FontAwesomeIcon icon={fi.icon} style={{fontSize:14,color:fi.color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#0D1117",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.originalName}</div>
                  <div style={{fontSize:10,color:"#94A3B8",marginTop:1}}>{formatBytes(f.fileSize||0)} · {f.uploadedAt}</div>
                </div>
                <button onClick={()=>downloadFile(f.id, f.originalName)}
                  style={{padding:"3px 8px",borderRadius:5,border:"1px solid #BBF7D0",background:"#DCFCE7",color:"#16A34A",fontSize:10,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0,transition:"all .15s",outline:"none"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#16A34A";e.currentTarget.style.color="#fff";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#DCFCE7";e.currentTarget.style.color="#16A34A";}}
                >
                  <FontAwesomeIcon icon={faDownload} style={{fontSize:8}}/> DL
                </button>
                <button onClick={()=>handleDelete(f.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#CBD5E1",fontSize:13,padding:0,transition:"color .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.color="#F87171"}
                  onMouseLeave={e=>e.currentTarget.style.color="#CBD5E1"}
                ><FontAwesomeIcon icon={faXmark}/></button>
              </div>
            );
          })}
        </div>
      )}

      {uploading && uploadProgress !== null && (
        <div style={{marginBottom:10,padding:"8px 12px",background:"#DCFCE7",borderRadius:8,border:"1px solid #BBF7D0",display:"flex",alignItems:"center",gap:10}}>
          <FontAwesomeIcon icon={faSpinner} spin style={{color:"#16A34A",fontSize:12,flexShrink:0}}/>
          <div style={{flex:1,height:3,borderRadius:99,background:"#BBF7D0",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${uploadProgress}%`,background:"#16A34A",transition:"width .2s",borderRadius:99}}/>
          </div>
          <span style={{fontSize:10,color:"#16A34A",fontWeight:700}}>{uploadProgress}%</span>
        </div>
      )}

      <div style={{marginBottom:8}}>
        <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Description de la preuve (optionnel)…"
          style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid #BBF7D0",fontSize:11,outline:"none",color:"#374151",background:"#fff",fontFamily:"inherit",boxSizing:"border-box"}}
          onFocus={e=>{e.target.style.borderColor="#16A34A";e.target.style.boxShadow="0 0 0 3px #16A34A18";}}
          onBlur={e=>{e.target.style.borderColor="#BBF7D0";e.target.style.boxShadow="none";}}
        />
      </div>

      <div
        onClick={()=>fileRef.current?.click()}
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)handleUpload(f);}}
        style={{border:`2px dashed ${dragOver?"#16A34A":"#BBF7D0"}`,borderRadius:10,padding:"14px",textAlign:"center",cursor:"pointer",background:dragOver?"#DCFCE7":"#fff",transition:"all .2s"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor="#16A34A";e.currentTarget.style.background="#F0FDF4";}}
        onMouseLeave={e=>{if(!dragOver){e.currentTarget.style.borderColor="#BBF7D0";e.currentTarget.style.background="#fff";}}}
      >
        <FontAwesomeIcon icon={faUpload} style={{fontSize:18,color:dragOver?"#16A34A":"#86EFAC",display:"block",margin:"0 auto 6px"}}/>
        <div style={{fontSize:11,fontWeight:600,color:dragOver?"#16A34A":"#64748B"}}>
          {dragOver ? "Déposez le fichier ici" : "Glisser-déposer ou cliquer pour importer"}
        </div>
        <div style={{fontSize:10,color:"#86EFAC",marginTop:3}}>PDF, Word, Excel, images — max 20 Mo</div>
        <input ref={fileRef} type="file" style={{display:"none"}}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip"
          onChange={e=>{const f=e.target.files?.[0];if(f){handleUpload(f);e.target.value="";}}}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PDCA WHEEL
════════════════════════════════════════════════════════════ */
function PdcaWheel({ activePhase, size=32, onWhite=false }) {
  const cx=size/2, cy=size/2, r=size/2-3;
  const toRad=d=>d*Math.PI/180;
  return (
    <svg width={size} height={size}>
      {["P","D","C","A"].map((p,i)=>{
        const s=-90+i*90, e=s+88;
        const x1=cx+r*Math.cos(toRad(s)), y1=cy+r*Math.sin(toRad(s));
        const x2=cx+r*Math.cos(toRad(e)), y2=cy+r*Math.sin(toRad(e));
        const active=p===activePhase;
        return <path key={p} d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none"
          stroke={active?(onWhite?"#fff":ACCENT):(onWhite?"rgba(255,255,255,.3)":BORDER)}
          strokeWidth={active?3:1.5} strokeLinecap="round"/>;
      })}
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════
   SCORE RING
════════════════════════════════════════════════════════════ */
function ScoreRing({ value, total, score, size=100 }) {
  const [animated, setAnimated] = useState(0);
  useEffect(()=>{ const t=setTimeout(()=>setAnimated(score),300); return()=>clearTimeout(t); },[score]);
  const r=(size-10)/2, circ=2*Math.PI*r, fill=(animated/100)*circ;
  const color=score===100?"#10B981":score>=50?"#F59E0B":"#EF4444";
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth={6}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{transition:"stroke-dasharray 1.4s cubic-bezier(.4,0,.2,1)",filter:`drop-shadow(0 0 8px ${color}aa)`}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:22,fontWeight:800,color:"#fff",fontFamily:"'Sora',sans-serif",lineHeight:1,letterSpacing:"-1px"}}>{animated}%</span>
        <span style={{fontSize:10,color:"rgba(255,255,255,.6)",marginTop:2}}>{value}/{total}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   TOAST
════════════════════════════════════════════════════════════ */
function Toast({ msg, visible, type="success" }) {
  const cfg={success:{bg:"#0D9488",icon:faCheckCircle},error:{bg:"#EF4444",icon:faCircleXmark},info:{bg:"#6366F1",icon:faCircleInfo}}[type]||{bg:"#0D9488",icon:faCheckCircle};
  return (
    <div style={{position:"fixed",bottom:32,left:"50%",transform:`translateX(-50%) translateY(${visible?0:16}px)`,background:cfg.bg,color:"#fff",borderRadius:12,overflow:"hidden",opacity:visible?1:0,pointerEvents:"none",transition:"all 0.4s cubic-bezier(.34,1.3,.64,1)",boxShadow:`0 12px 40px ${cfg.bg}66`,zIndex:9999,minWidth:220}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 18px"}}>
        <FontAwesomeIcon icon={cfg.icon} style={{fontSize:15}}/>
        <span style={{fontSize:13,fontWeight:700,letterSpacing:"-.1px"}}>{msg}</span>
      </div>
      {visible&&<div style={{height:2,background:"rgba(255,255,255,.25)"}}><div style={{height:"100%",background:"rgba(255,255,255,.6)",animation:"toastProgress 2.5s linear forwards"}}/></div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   STEP ROW
════════════════════════════════════════════════════════════ */
function StepRow({ step, index, meta, onStatusChange, onDelete }) {
  const [flash,setFlash]=useState(false);
  const sColors={"non-demarree":{c:"#94A3B8",bg:"#F1F5F9",label:"Non démarrée"},"en-cours":{c:"#0369A1",bg:"#E0F2FE",label:"En cours"},"terminee":{c:"#16A34A",bg:"#DCFCE7",label:"Terminée"}};
  const sc=sColors[step.statut]||sColors["non-demarree"];
  const next=step.statut==="non-demarree"?"en-cours":step.statut==="en-cours"?"terminee":"non-demarree";
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 14px",borderRadius:10,border:`1px solid ${flash?"#10B981":step.statut==="terminee"?"#BBF7D0":"#E4E8F0"}`,background:flash?"#ECFDF5":step.statut==="terminee"?"#F0FDF4":"#FAFBFC",transition:"all .3s",animation:flash?"completionFlash .6s ease":"none"}}>
      <button onClick={()=>{if(next==="terminee"){setFlash(true);setTimeout(()=>setFlash(false),600);}onStatusChange(index,next);}}
        style={{width:26,height:26,borderRadius:7,border:`2px solid ${sc.c}`,background:sc.bg,color:sc.c,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .2s",boxShadow:flash?`0 0 0 4px #10B98133`:"none"}}>
        {step.statut==="terminee"?<FontAwesomeIcon icon={faCheckCircle}/>:step.statut==="en-cours"?<FontAwesomeIcon icon={faRotateRight}/>:<FontAwesomeIcon icon={faCircleMinus} style={{opacity:.4}}/>}
      </button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:600,color:step.statut==="terminee"?"#94A3B8":"#0D1117",textDecoration:step.statut==="terminee"?"line-through":"none",marginBottom:4,lineHeight:1.4}}>
          <span style={{color:sc.c,fontFamily:"'Sora',sans-serif",fontSize:9,fontWeight:800,marginRight:6,background:sc.bg,padding:"1px 5px",borderRadius:4}}>#{String(index+1).padStart(2,"0")}</span>{step.description}
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:10,color:"#64748B",display:"flex",alignItems:"center",gap:4}}><FontAwesomeIcon icon={faUser} style={{fontSize:9,color:meta.color}}/>{step.responsable}</span>
          <span style={{fontSize:10,color:"#64748B",display:"flex",alignItems:"center",gap:4}}><FontAwesomeIcon icon={faCalendar} style={{fontSize:9,color:meta.color}}/>{step.echeance}</span>
          <span style={{fontSize:10,fontWeight:700,color:sc.c,background:sc.bg,padding:"2px 7px",borderRadius:4}}>{sc.label}</span>
        </div>
      </div>
      <button onClick={()=>onDelete(index)} style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#CBD5E1",padding:0,lineHeight:1,transition:"color .15s",flexShrink:0}}
        onMouseEnter={e=>e.currentTarget.style.color="#F87171"} onMouseLeave={e=>e.currentTarget.style.color="#CBD5E1"}
      ><FontAwesomeIcon icon={faCircleXmark}/></button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ENJEUX TABLE
════════════════════════════════════════════════════════════ */
function EnjeuxTable({ title, data, onChange, meta }) {
  const [nr, setNr]=useState({domaine:"",enjeu:"",niveauImpact:"moyen",mesureAssociee:""});
  const IS={padding:"6px 10px",borderRadius:7,border:"1px solid #E4E8F0",fontSize:11,outline:"none",color:"#374151",background:"#fff",width:"100%"};
  return (
    <div>
      <div style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:6,height:6,borderRadius:99,background:meta.color}}/>{title}
      </div>
      {data.length>0&&(
        <div style={{border:"1px solid #E4E8F0",borderRadius:10,overflow:"hidden",marginBottom:10}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{background:"#F8FAFC"}}>
              {["Domaine","Enjeu","Impact","Mesure associée",""].map(h=>(
                <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:700,color:"#64748B",fontSize:10,borderBottom:"1px solid #E4E8F0"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{data.map((row,i)=>(
              <tr key={i} style={{borderBottom:"1px solid #F1F5F9",background:i%2===0?"#fff":"#FAFBFC"}}>
                <td style={{padding:"8px 10px",fontWeight:600,color:"#374151"}}>{row.domaine}</td>
                <td style={{padding:"8px 10px",color:"#374151",maxWidth:200}}>{row.enjeu}</td>
                <td style={{padding:"8px 10px"}}><span style={{fontSize:10,fontWeight:700,color:IMPACT_COLOR[row.niveauImpact]||"#64748B",background:(IMPACT_COLOR[row.niveauImpact]||"#64748B")+"20",padding:"2px 8px",borderRadius:4}}>{row.niveauImpact}</span></td>
                <td style={{padding:"8px 10px",color:"#64748B",maxWidth:180}}>{row.mesureAssociee}</td>
                <td style={{padding:"8px 10px"}}><button onClick={()=>onChange(data.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#FDA4AF",fontSize:12}}><FontAwesomeIcon icon={faTrash}/></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 2fr auto 2fr auto",gap:6,alignItems:"center"}}>
        {[{key:"domaine",placeholder:"Domaine"},{key:"enjeu",placeholder:"Enjeu identifié"}].map(f=>(
          <input key={f.key} value={nr[f.key]} onChange={e=>setNr({...nr,[f.key]:e.target.value})} placeholder={f.placeholder} style={IS}/>
        ))}
        <select value={nr.niveauImpact} onChange={e=>setNr({...nr,niveauImpact:e.target.value})} style={IS}>
          {IMPACT_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
        <input value={nr.mesureAssociee} onChange={e=>setNr({...nr,mesureAssociee:e.target.value})} placeholder="Mesure associée" style={IS}/>
        <button onClick={()=>{if(nr.domaine&&nr.enjeu){onChange([...data,{...nr}]);setNr({domaine:"",enjeu:"",niveauImpact:"moyen",mesureAssociee:""});}}} style={{padding:"6px 12px",borderRadius:7,border:"none",background:meta.color,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center"}}>
          <FontAwesomeIcon icon={faPlus}/>
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SLIDING TABS
════════════════════════════════════════════════════════════ */
function SlidingTabs({ tabs, active, onChange }) {
  const [ind,setInd]=useState({});
  const refs=useRef([]);
  useEffect(()=>{const idx=tabs.findIndex(t=>t.id===active);const el=refs.current[idx];if(el)setInd({left:el.offsetLeft,width:el.offsetWidth});},[active,tabs]);
  return (
    <div style={{display:"flex",gap:0,position:"relative",background:"#F1F5F9",borderRadius:10,padding:4,width:"fit-content"}}>
      <div style={{position:"absolute",top:4,bottom:4,background:"#fff",borderRadius:8,boxShadow:"0 2px 8px rgba(0,0,0,.1)",transition:"left .25s cubic-bezier(.4,0,.2,1),width .25s cubic-bezier(.4,0,.2,1)",pointerEvents:"none",...ind}}/>
      {tabs.map((t,i)=>(
        <button key={t.id} ref={el=>refs.current[i]=el} onClick={()=>onChange(t.id)} style={{position:"relative",zIndex:1,padding:"8px 18px",border:"none",borderRadius:8,background:"transparent",color:active===t.id?ACCENT:TEXT3,fontSize:12,fontWeight:active===t.id?700:500,cursor:"pointer",transition:"color .2s",display:"flex",alignItems:"center",gap:7,whiteSpace:"nowrap"}}>
          <FontAwesomeIcon icon={t.faIcon} style={{fontSize:11}}/>{t.label}
          <span style={{fontSize:10,fontWeight:700,fontFamily:"'Sora',sans-serif",background:active===t.id?`${ACCENT}18`:"#E2E8F0",color:active===t.id?ACCENT:TEXT3,padding:"1px 7px",borderRadius:99,transition:"all .2s"}}>{t.count}</span>
        </button>
      ))}
    </div>
  );
}

function calcProgress(plan) {
  const s=plan.etapesPlanAction||[];
  if(!s.length)return 0;
  return Math.round(s.filter(x=>x.statut==="terminee").length/s.length*100);
}

/* ════════════════════════════════════════════════════════════
   ACTION PLAN FORM
════════════════════════════════════════════════════════════ */
function ActionPlanForm({ plan, clauseId, clauseNumber, subClauses, subConformities, meta, onSave, onCancel, defaultSubClauseId }) {
  const initForm = plan ? planToFormState(plan) : emptyPlan(clauseId, clauseNumber, defaultSubClauseId);
  const [form,     setForm]    = useState(initForm);
  const [tab,      setTab]     = useState(0);
  const [newStep,  setNewStep] = useState({description:"",responsable:"",echeance:""});
  const [newCause, setNewCause]= useState("");

  const isExisting   = !!plan?.id;
  const makeFileAdder = isExisting
    ? (fieldLabel) => async (file, onProgress) => {
        const saved = await uploadActionPlanFile(plan.id, file, fieldLabel, onProgress);
        return saved;
      }
    : null;
  const handleRemoveFile = async (fileId) => {
    if (fileId) { try { await deleteActionPlanFile(fileId); } catch {} }
  };

  const clauseNum = parseInt(clauseNumber);
  const specifics = CLAUSE_SPECIFIC_FIELDS[clauseNum] || CLAUSE_SPECIFIC_FIELDS[4];
  const ncSubClauses = (subClauses||[]).filter(s=>subConformities?.[s.id]?.status==="non-conforme");
  const isSubLocked  = !!defaultSubClauseId;
  const lockedSub    = isSubLocked ? subClauses.find(s=>s.id===defaultSubClauseId) : null;

  const upd         = (k,v) => setForm(f=>({...f,[k]:v}));
  const updSpecific = (k,v) => setForm(f=>({...f,specificFields:{...f.specificFields,[k]:v}}));
  const addStep     = ()=>{
    if(newStep.description&&newStep.responsable&&newStep.echeance){
      upd("etapesPlanAction",[...form.etapesPlanAction,{ordre:form.etapesPlanAction.length+1,...newStep,statut:"non-demarree"}]);
      setNewStep({description:"",responsable:"",echeance:""});
    }
  };
  const stepStatusChange=(i,s)=>{const st=[...form.etapesPlanAction];st[i]={...st[i],statut:s};upd("etapesPlanAction",st);};
  const progress=Math.round(form.etapesPlanAction.length?(form.etapesPlanAction.filter(s=>s.statut==="terminee").length/form.etapesPlanAction.length)*100:0);

  const FORM_TABS=[
    {label:"Identification",   faIcon:faClipboardList,   short:"1"},
    {label:"Action immédiate", faIcon:faFlag,             short:"2"},
    {label:"Causes racines",   faIcon:faMagnifyingGlass,  short:"3"},
    {label:"Plan correctif",   faIcon:faListCheck,        short:"4"},
    {label:"Vérification",     faIcon:faCheckCircle,      short:"5"},
    {label:"Clôture",          faIcon:faCircleCheck,      short:"6"},
  ];

  const IS={width:"100%",padding:"9px 12px",borderRadius:9,border:"1px solid #E4E8F0",fontSize:12,outline:"none",color:"#374151",background:"#fff",fontFamily:"inherit",transition:"border-color .15s, box-shadow .15s"};
  const LS={fontSize:11,fontWeight:700,color:"#64748B",marginBottom:5,display:"block",letterSpacing:".2px"};
  const focusStyle=(e)=>{e.target.style.borderColor=meta.color;e.target.style.boxShadow=`0 0 0 3px ${meta.color}18`;};
  const blurStyle =(e)=>{e.target.style.borderColor="#E4E8F0";e.target.style.boxShadow="none";};

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",background:"rgba(10,15,25,.7)",backdropFilter:"blur(8px)"}}
      onClick={e=>{if(e.target===e.currentTarget)onCancel();}}>
      <div style={{marginLeft:"auto",width:"min(820px,96vw)",background:"#F8FAFC",display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",boxShadow:"-32px 0 80px rgba(0,0,0,.25)",animation:"panelSlideIn .35s cubic-bezier(.34,1.05,.64,1)"}}>

        {/* HEADER */}
        <div style={{padding:"22px 28px 0",background:`linear-gradient(135deg,${meta.grad[0]},${meta.grad[1]})`,flexShrink:0,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,opacity:.06,backgroundImage:`url("data:image/svg+xml,%3Csvg width='40' height='46' viewBox='0 0 40 46' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 1L38.66 11.5V32.5L20 43L1.34 32.5V11.5L20 1Z' stroke='white' stroke-width='1'/%3E%3C/svg%3E")`,backgroundSize:"40px 46px"}}/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:44,height:44,borderRadius:13,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,.3)",backdropFilter:"blur(4px)"}}>
                <FontAwesomeIcon icon={meta.faIcon} style={{color:"#fff",fontSize:18}}/>
              </div>
              <div>
                <div style={{fontSize:10,color:"rgba(255,255,255,.7)",fontWeight:600,textTransform:"uppercase",letterSpacing:"1.2px",marginBottom:2}}>ISO 27001 · Clause {clauseNumber}</div>
                <div style={{fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-.3px",fontFamily:"'Sora',sans-serif"}}>{plan?"Modifier le plan d'action":"Nouveau plan d'action"}</div>
              </div>
            </div>
            <button onClick={onCancel} style={{width:34,height:34,borderRadius:10,border:"1.5px solid rgba(255,255,255,.3)",background:"rgba(255,255,255,.15)",color:"#fff",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.25)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.15)"}
            ><FontAwesomeIcon icon={faCircleXmark}/></button>
          </div>
          <div style={{display:"flex",gap:1,position:"relative",overflowX:"auto"}}>
            {FORM_TABS.map((t,i)=>(
              <button key={i} onClick={()=>setTab(i)} style={{padding:"8px 14px 12px",border:"none",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0,background:tab===i?"#F8FAFC":"rgba(255,255,255,.15)",color:tab===i?meta.color:"rgba(255,255,255,.85)",borderRadius:"8px 8px 0 0",transition:"all .2s",display:"flex",alignItems:"center",gap:5}}>
                <span style={{width:17,height:17,borderRadius:5,background:tab===i?meta.color+"22":"rgba(255,255,255,.25)",color:tab===i?meta.color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Sora',sans-serif",border:tab===i?`1px solid ${meta.color}44`:"none",transition:"all .2s"}}>{t.short}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {form.etapesPlanAction.length>0&&(
          <div style={{height:3,background:"#E4E8F0",flexShrink:0}}>
            <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${meta.grad[0]},${meta.grad[1]})`,transition:"width .6s cubic-bezier(.4,0,.2,1)",boxShadow:`0 0 8px ${meta.color}66`}}/>
          </div>
        )}

        {/* BODY */}
        <div style={{flex:1,overflowY:"auto",padding:"22px 28px",scrollbarWidth:"thin",scrollbarColor:"#D1D5DB transparent"}}>

          {/* ── TAB 1 : IDENTIFICATION ── */}
          {tab===0&&(
            <div style={{display:"flex",flexDirection:"column",gap:18,animation:"tabFadeIn .2s ease"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[{k:"reference",l:"Référence PA *",ph:"Ex: PA-4.1-2026-001"},{k:"version",l:"Version",ph:"1.0"},{k:"dateDetection",l:"Date de détection *",type:"date"}].map(f=>(
                  <div key={f.k}><label style={LS}>{f.l}</label>
                    <input type={f.type||"text"} value={form[f.k]||""} onChange={e=>upd(f.k,e.target.value)} placeholder={f.ph||""} style={IS} onFocus={focusStyle} onBlur={blurStyle}/>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={LS}>Sous-clause concernée *</label>
                  {isSubLocked?(
                    <div style={{...IS,display:"flex",alignItems:"center",gap:8,background:"#F1F5F9",cursor:"default"}}>
                      <span style={{fontSize:10,fontWeight:700,color:meta.color,background:meta.bg,border:`1px solid ${meta.border}`,padding:"2px 7px",borderRadius:5,fontFamily:"'Sora',sans-serif",flexShrink:0}}>{lockedSub?.number}</span>
                      <span style={{fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lockedSub?.title}</span>
                      <FontAwesomeIcon icon={faLock} style={{fontSize:10,color:"#94A3B8",marginLeft:"auto",flexShrink:0}}/>
                    </div>
                  ):ncSubClauses.length>0?(
                    <select value={form.subClauseId??""} onChange={e=>upd("subClauseId",e.target.value?+e.target.value:null)} style={{...IS,cursor:"pointer",color:form.subClauseId?"#0D1117":"#94A3B8"}} onFocus={focusStyle} onBlur={blurStyle}>
                      <option value="">— Sélectionner une sous-clause —</option>
                      {ncSubClauses.map(s=><option key={s.id} value={s.id}>{s.number} — {s.title}</option>)}
                    </select>
                  ):(
                    <div style={{...IS,background:"#FFFBEB",color:"#92400E",border:"1px solid #FCD34D",display:"flex",alignItems:"center",gap:8,cursor:"default"}}>
                      <FontAwesomeIcon icon={faTriangleExclamation} style={{color:"#D97706",fontSize:12,flexShrink:0}}/>
                      <span style={{fontSize:11,lineHeight:1.4}}>Aucune sous-clause non conforme. Évaluez d'abord une sous-clause dans l'onglet <strong>Exigences</strong>.</span>
                    </div>
                  )}
                </div>
                <div><label style={LS}>Source de détection</label>
                  <input value={form.sourceDetection||""} onChange={e=>upd("sourceDetection",e.target.value)} placeholder="Ex: Audit interne Q1 2026..." style={IS} onFocus={focusStyle} onBlur={blurStyle}/>
                </div>
              </div>
              <div>
                <label style={LS}>Gravité de la non-conformité *</label>
                <div style={{display:"flex",gap:10,marginTop:2}}>
                  {GRAVITE_OPTIONS.map(g=>(
                    <label key={g.value} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px",borderRadius:10,cursor:"pointer",border:`2px solid ${form.gravite===g.value?g.color:"#E4E8F0"}`,background:form.gravite===g.value?g.bg:"#fff",transition:"all .15s",boxShadow:form.gravite===g.value?`0 0 0 4px ${g.color}18`:"none"}}>
                      <input type="radio" name="gravite" value={g.value} checked={form.gravite===g.value} onChange={()=>upd("gravite",g.value)} style={{display:"none"}}/>
                      <FontAwesomeIcon icon={g.value==="majeure"?faFire:faExclamationTriangle} style={{fontSize:13,color:form.gravite===g.value?g.color:"#CBD5E1"}}/>
                      <span style={{fontSize:12,fontWeight:700,color:form.gravite===g.value?g.color:"#64748B"}}>{g.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{background:meta.bg,border:`1.5px solid ${meta.border}`,borderRadius:14,padding:"18px 20px"}}>
                <div style={{fontSize:11,fontWeight:800,color:meta.color,textTransform:"uppercase",letterSpacing:".8px",marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
                  <FontAwesomeIcon icon={meta.faIcon}/> {specifics.title}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {specifics.fields.map(f=>(
                    <div key={f.key}><label style={{...LS,color:meta.color}}>{f.label}</label>
                      {f.type==="textarea"
                        ?<textarea value={form.specificFields?.[f.key]||""} onChange={e=>updSpecific(f.key,e.target.value)} placeholder={f.placeholder} rows={3} style={{...IS,resize:"vertical",lineHeight:1.6}} onFocus={focusStyle} onBlur={blurStyle}/>
                        :<input value={form.specificFields?.[f.key]||""} onChange={e=>updSpecific(f.key,e.target.value)} placeholder={f.placeholder} style={IS} onFocus={focusStyle} onBlur={blurStyle}/>
                      }
                    </div>
                  ))}
                </div>
              </div>
              <div><label style={LS}>Description détaillée de la non-conformité *</label>
                <textarea value={form.descriptionNc||""} onChange={e=>upd("descriptionNc",e.target.value)} placeholder="Décrire précisément la non-conformité, son impact et les preuves constatées..." rows={5} style={{...IS,resize:"vertical",lineHeight:1.6}} onFocus={focusStyle} onBlur={blurStyle}/>
              </div>
            </div>
          )}

          {/* ── TAB 2 : ACTION IMMÉDIATE ── */}
          {tab===1&&(
            <div style={{display:"flex",flexDirection:"column",gap:16,animation:"tabFadeIn .2s ease"}}>
              <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:12,padding:"14px 18px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <FontAwesomeIcon icon={faLightbulb} style={{color:"#1D4ED8",marginTop:2,fontSize:15,flexShrink:0}}/>
                <div>
                  <div style={{fontSize:12,color:"#1D4ED8",fontWeight:700,marginBottom:3}}>Action immédiate de confinement</div>
                  <div style={{fontSize:11,color:"#1E40AF",lineHeight:1.6}}>Mesures à prendre dans les 24–72h pour contenir la non-conformité avant la correction définitive.</div>
                </div>
              </div>
              <div><label style={LS}>Responsable de l'action immédiate *</label>
                <input value={form.responsableImmediat||""} onChange={e=>upd("responsableImmediat",e.target.value)} placeholder="Nom — Fonction" style={IS} onFocus={focusStyle} onBlur={blurStyle}/>
              </div>
              <div><label style={LS}>Mesure immédiate *</label>
                <textarea value={form.mesureImmediate||""} onChange={e=>upd("mesureImmediate",e.target.value)} placeholder="Ex: Organisation d'un atelier d'urgence, notification des parties prenantes..." rows={4} style={{...IS,resize:"vertical",lineHeight:1.6}} onFocus={focusStyle} onBlur={blurStyle}/>
              </div>

              <HybridListField
                label="Preuves de l'action immédiate"
                labelStyle={LS}
                items={form.preuvesImmediates}
                placeholder="Référence texte (ex: Email 15/02/2026) ou importez un fichier…"
                accentColor={meta.color}
                onFileAdd={makeFileAdder?.("Preuve action immédiate")}
                onChange={(newItems, removed) => {
                  if (removed?.type==="file" && removed.fileId) handleRemoveFile(removed.fileId);
                  upd("preuvesImmediates", newItems);
                }}
              />
            </div>
          )}

          {/* ── TAB 3 : CAUSES ── */}
          {tab===2&&(
            <div style={{display:"flex",flexDirection:"column",gap:16,animation:"tabFadeIn .2s ease"}}>
              {[{k:"analyseCausesRacines",l:"Analyse des causes racines",ph:"Méthode utilisée (5 Pourquoi, Ishikawa...), date et participants...",rows:3},{k:"causePrincipale",l:"Cause principale identifiée *",ph:"La cause fondamentale qui a engendré la non-conformité...",rows:3}].map(f=>(
                <div key={f.k}><label style={LS}>{f.l}</label>
                  <textarea value={form[f.k]||""} onChange={e=>upd(f.k,e.target.value)} placeholder={f.ph} rows={f.rows} style={{...IS,resize:"vertical",lineHeight:1.6}} onFocus={focusStyle} onBlur={blurStyle}/>
                </div>
              ))}
              <div>
                <label style={LS}>Causes secondaires</label>
                {form.causesSecondaires.map((c,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
                    <span style={{flex:1,fontSize:11,background:"#FAFBFC",padding:"8px 12px",borderRadius:8,border:"1px solid #E4E8F0",color:"#374151",lineHeight:1.4}}>
                      <span style={{color:meta.color,fontWeight:700,marginRight:6}}>{i+1}.</span>{c}
                    </span>
                    <button onClick={()=>upd("causesSecondaires",form.causesSecondaires.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#FDA4AF",fontSize:13}}><FontAwesomeIcon icon={faCircleXmark}/></button>
                  </div>
                ))}
                <div style={{display:"flex",gap:6}}>
                  <input value={newCause} onChange={e=>setNewCause(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&newCause.trim()){upd("causesSecondaires",[...form.causesSecondaires,newCause.trim()]);setNewCause("");}}}
                    placeholder="Ajouter une cause secondaire..." style={IS} onFocus={focusStyle} onBlur={blurStyle}/>
                  <button onClick={()=>{if(newCause.trim()){upd("causesSecondaires",[...form.causesSecondaires,newCause.trim()]);setNewCause("");}}} style={{padding:"0 16px",borderRadius:9,border:"none",background:meta.color,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center"}}><FontAwesomeIcon icon={faPlus}/></button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 4 : PLAN CORRECTIF ── */}
          {tab===3&&(
            <div style={{display:"flex",flexDirection:"column",gap:18,animation:"tabFadeIn .2s ease"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={LS}>Document à produire *</label>
                  <DocumentField
                    value={form.documentAProduire}
                    placeholder="Référence (ex: SMSI-CTX-001 v2.0)"
                    accentColor={meta.color}
                    inputStyle={IS}
                    onFileAdd={makeFileAdder?.("Document à produire")}
                    onFileRemove={handleRemoveFile}
                    onChange={v=>upd("documentAProduire",v)}
                  />
                </div>
                <div><label style={LS}>Périodicité de révision *</label>
                  <input value={form.periodiciteRevision||""} onChange={e=>upd("periodiciteRevision",e.target.value)} placeholder="Ex: Annuelle + événements majeurs" style={IS} onFocus={focusStyle} onBlur={blurStyle}/>
                </div>
              </div>

              {specifics.hasEnjeuxTables&&(
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  <EnjeuxTable title="Enjeux internes" data={form.enjeuxInternes} meta={meta} onChange={v=>upd("enjeuxInternes",v)}/>
                  <EnjeuxTable title="Enjeux externes" data={form.enjeuxExternes} meta={meta} onChange={v=>upd("enjeuxExternes",v)}/>
                </div>
              )}

              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <label style={{...LS,marginBottom:0}}>Plan d'action étape par étape *</label>
                  {form.etapesPlanAction.length>0&&(
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:60,height:4,borderRadius:99,background:"#E4E8F0",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${meta.grad[0]},${meta.grad[1]})`,transition:"width .5s"}}/>
                      </div>
                      <span style={{fontSize:11,fontWeight:700,color:meta.color,fontFamily:"'Sora',sans-serif"}}>{progress}%</span>
                    </div>
                  )}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
                  {form.etapesPlanAction.map((step,i)=>(
                    <StepRow key={i} step={step} index={i} meta={meta} onStatusChange={stepStatusChange}
                      onDelete={i=>upd("etapesPlanAction",form.etapesPlanAction.filter((_,j)=>j!==i))}/>
                  ))}
                </div>
                <div style={{background:meta.bg,border:`1.5px dashed ${meta.border}`,borderRadius:12,padding:"14px 16px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:meta.color,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                    <FontAwesomeIcon icon={faPlus}/> Nouvelle étape
                  </div>
                  <input value={newStep.description} onChange={e=>setNewStep({...newStep,description:e.target.value})} placeholder="Description de l'action à mener..." style={{...IS,marginBottom:8}} onFocus={focusStyle} onBlur={blurStyle}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8}}>
                    <input value={newStep.responsable} onChange={e=>setNewStep({...newStep,responsable:e.target.value})} placeholder="Responsable (Nom — Fonction)" style={IS} onFocus={focusStyle} onBlur={blurStyle}/>
                    <input type="date" value={newStep.echeance} onChange={e=>setNewStep({...newStep,echeance:e.target.value})} style={IS} onFocus={focusStyle} onBlur={blurStyle}/>
                    <button onClick={addStep} style={{padding:"0 20px",borderRadius:9,border:"none",background:meta.color,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",transition:"transform .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}>
                      <FontAwesomeIcon icon={faPlus}/> Ajouter
                    </button>
                  </div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[{k:"dateEcheanceGlobale",l:"Échéance globale *",type:"date"},{k:"responsablePlan",l:"Responsable du plan *",ph:"Nom — Fonction"},{k:"ressourcesNecessaires",l:"Ressources nécessaires",ph:"Budget, temps, outils..."}].map(f=>(
                  <div key={f.k}><label style={LS}>{f.l}</label>
                    <input type={f.type||"text"} value={form[f.k]||""} onChange={e=>upd(f.k,e.target.value)} placeholder={f.ph||""} style={IS} onFocus={focusStyle} onBlur={blurStyle}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 5 : VÉRIFICATION ── */}
          {tab===4&&(
            <div style={{display:"flex",flexDirection:"column",gap:16,animation:"tabFadeIn .2s ease"}}>
              <HybridListField
                label="Critères de vérification de l'efficacité *"
                labelStyle={LS}
                items={form.methodesVerification}
                placeholder="Référence (ex: Rapport d'audit) ou importez un fichier…"
                accentColor="#10B981"
                onFileAdd={makeFileAdder?.("Méthode de vérification")}
                onChange={(newItems, removed) => {
                  if (removed?.type==="file" && removed.fileId) handleRemoveFile(removed.fileId);
                  upd("methodesVerification", newItems);
                }}
              />

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={LS}>Date de vérification prévue</label>
                  <input type="date" value={form.dateVerification||""} onChange={e=>upd("dateVerification",e.target.value)} style={IS} onFocus={focusStyle} onBlur={blurStyle}/>
                </div>
              </div>

              <div><label style={LS}>Résultats obtenus (post-vérification)</label>
                <textarea value={form.resultatsObtenus||""} onChange={e=>upd("resultatsObtenus",e.target.value)} placeholder="À remplir après la vérification : constats, preuves d'efficacité..." rows={4} style={{...IS,resize:"vertical",lineHeight:1.6}} onFocus={focusStyle} onBlur={blurStyle}/>
              </div>

              <HybridListField
                label="Pièces jointes"
                labelStyle={LS}
                items={form.piecesJointes}
                placeholder="Référence (ex: Attestation RSSI) ou importez un fichier…"
                accentColor={meta.color}
                onFileAdd={makeFileAdder?.("Pièce jointe")}
                onChange={(newItems, removed) => {
                  if (removed?.type==="file" && removed.fileId) handleRemoveFile(removed.fileId);
                  upd("piecesJointes", newItems);
                }}
              />
            </div>
          )}

          {/* ── TAB 6 : CLÔTURE ── */}
          {tab===5&&(
            <div style={{display:"flex",flexDirection:"column",gap:16,animation:"tabFadeIn .2s ease"}}>
              <div>
                <label style={LS}>Statut du plan *</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:4}}>
                  {STATUT_OPTIONS.map(s=>(
                    <label key={s.value} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 8px",borderRadius:11,cursor:"pointer",border:`2px solid ${form.statut===s.value?s.color:"#E4E8F0"}`,background:form.statut===s.value?s.color+"15":"#fff",transition:"all .15s",boxShadow:form.statut===s.value?`0 0 0 4px ${s.color}18`:"none"}}>
                      <input type="radio" name="statut" value={s.value} checked={form.statut===s.value} onChange={()=>upd("statut",s.value)} style={{display:"none"}}/>
                      <span style={{fontSize:12,fontWeight:700,color:form.statut===s.value?s.color:"#64748B"}}>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"14px 16px",borderRadius:11,border:`1.5px solid ${form.planCloture?"#16A34A":"#E4E8F0"}`,background:form.planCloture?"#F0FDF4":"#fff",transition:"all .2s",boxShadow:form.planCloture?"0 0 0 4px #16A34A18":"none"}}>
                <div style={{width:22,height:22,borderRadius:7,flexShrink:0,border:`2px solid ${form.planCloture?"#16A34A":"#CBD5E1"}`,background:form.planCloture?"#16A34A":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}} onClick={()=>upd("planCloture",!form.planCloture)}>
                  {form.planCloture&&<FontAwesomeIcon icon={faCheckCircle} style={{color:"#fff",fontSize:11}}/>}
                </div>
                <div>
                  <span style={{fontWeight:700,color:form.planCloture?"#15803D":"#374151",fontSize:13,display:"block"}}>Plan clôturé</span>
                  <span style={{fontSize:11,color:form.planCloture?"#16A34A":"#94A3B8"}}>{form.planCloture?"La non-conformité a été traitée et validée.":"Cocher pour marquer ce plan comme clôturé."}</span>
                </div>
              </label>
              {form.planCloture&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,background:"#F0FDF4",padding:"16px",borderRadius:12,border:"1px solid #BBF7D0"}}>
                  <div><label style={{...LS,color:"#15803D"}}>Date de clôture</label><input type="date" value={form.dateCloture||""} onChange={e=>upd("dateCloture",e.target.value)} style={IS}/></div>
                  <div><label style={{...LS,color:"#15803D"}}>Validateur</label><input value={form.validateur||""} onChange={e=>upd("validateur",e.target.value)} placeholder="Nom — Fonction" style={IS}/></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{padding:"16px 28px",borderTop:"1px solid #E4E8F0",background:"#fff",display:"flex",gap:8,justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <button onClick={onCancel} style={{padding:"10px 20px",borderRadius:10,border:"1px solid #E4E8F0",background:"#fff",color:"#64748B",fontSize:12,fontWeight:600,cursor:"pointer",transition:"background .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}
          >Annuler</button>
          <div style={{display:"flex",gap:8}}>
            {tab>0&&<button onClick={()=>setTab(t=>t-1)} style={{padding:"10px 18px",borderRadius:10,border:"1px solid #E4E8F0",background:"#F8FAFC",color:"#374151",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><FontAwesomeIcon icon={faChevronLeft}/> Précédent</button>}
            {tab<5
              ?<button onClick={()=>setTab(t=>t+1)} style={{padding:"10px 22px",borderRadius:10,border:"none",background:meta.color,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:`0 4px 16px ${meta.color}44`,transition:"transform .15s,box-shadow .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 6px 20px ${meta.color}55`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=`0 4px 16px ${meta.color}44`;}}>
                  Suivant <FontAwesomeIcon icon={faChevronRight}/>
                </button>
              :<button onClick={()=>onSave(form)} style={{padding:"10px 22px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${meta.grad[0]},${meta.grad[1]})`,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 16px ${meta.color}44`,display:"flex",alignItems:"center",gap:7,transition:"transform .15s,box-shadow .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 6px 22px ${meta.color}55`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=`0 4px 16px ${meta.color}44`;}}>
                  <FontAwesomeIcon icon={plan?faFloppyDisk:faCircleCheck}/>
                  {plan?"Mettre à jour":"Créer le plan d'action"}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PLAN CARD
════════════════════════════════════════════════════════════ */
function PlanCard({ plan, meta, subClauses, onEdit, onDelete, canEdit, canDelete }) {
  const pct=calcProgress(plan);
  const sc={"ouverte":{l:"Ouverte",c:"#64748B",bg:"#F1F5F9"},"en-cours":{l:"En cours",c:"#0369A1",bg:"#E0F2FE"},"en-attente":{l:"En attente",c:"#D97706",bg:"#FEF9C3"},"terminee":{l:"Terminée",c:"#16A34A",bg:"#DCFCE7"}}[plan.statut]||{l:plan.statut,c:"#64748B",bg:"#F1F5F9"};
  const gc={"mineure":{l:"Mineure",c:"#CA8A04",bg:"#FEF9C3"},"majeure":{l:"Majeure",c:"#DC2626",bg:"#FEE2E2"}}[plan.gravite];
  const subClause=subClauses?.find(s=>s.id===plan.subClauseId);
  return (
    <div style={{background:"#fff",border:"1px solid #E8ECF4",borderRadius:14,padding:"16px 18px",transition:"all .25s",position:"relative",overflow:"hidden"}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 8px 28px ${meta.color}1A`;e.currentTarget.style.borderColor=meta.border;e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor="#E8ECF4";e.currentTarget.style.transform="";}}
    >
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:`linear-gradient(180deg,${meta.grad[0]},${meta.grad[1]})`,borderRadius:"14px 0 0 14px"}}/>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
        <span style={{fontSize:10,fontWeight:700,fontFamily:"'Sora',sans-serif",color:"#64748B",background:"#F1F5F9",padding:"2px 9px",borderRadius:5,display:"flex",alignItems:"center",gap:4}}><FontAwesomeIcon icon={faHashtag} style={{fontSize:8}}/>{plan.reference}</span>
        <span style={{fontSize:10,fontWeight:700,color:sc.c,background:sc.bg,padding:"2px 9px",borderRadius:5}}>{sc.l}</span>
        {gc&&<span style={{fontSize:10,fontWeight:700,color:gc.c,background:gc.bg,padding:"2px 9px",borderRadius:5}}>NC {gc.l}</span>}
        {subClause&&<span style={{fontSize:10,fontWeight:700,color:meta.color,background:meta.bg,padding:"2px 9px",borderRadius:5,border:`1px solid ${meta.border}`}}>{subClause.number}</span>}
        {plan.planCloture&&<span style={{fontSize:10,fontWeight:700,color:"#16A34A",background:"#DCFCE7",padding:"2px 9px",borderRadius:5,display:"flex",alignItems:"center",gap:4}}><FontAwesomeIcon icon={faCheckCircle} style={{fontSize:8}}/> Clôturé</span>}
      </div>
      <div style={{fontSize:12,color:"#374151",marginBottom:12,lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{plan.descriptionNc||"Aucune description"}</div>
      {plan.etapesPlanAction?.length>0&&(
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
            <span style={{fontSize:10,color:"#64748B",fontWeight:600,display:"flex",alignItems:"center",gap:4}}><FontAwesomeIcon icon={faListCheck} style={{fontSize:9,color:meta.color}}/>{plan.etapesPlanAction.filter(s=>s.statut==="terminee").length}/{plan.etapesPlanAction.length} étapes</span>
            <span style={{fontSize:10,fontWeight:700,fontFamily:"'Sora',sans-serif",color:meta.color}}>{pct}%</span>
          </div>
          <div style={{height:5,borderRadius:99,background:"#F1F5F9",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${meta.grad[0]},${meta.grad[1]})`,borderRadius:99,transition:"width .8s",boxShadow:`0 0 6px ${meta.color}80`}}/>
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:11,color:"#94A3B8",marginBottom:12}}>
        {plan.responsablePlan&&<span style={{display:"flex",alignItems:"center",gap:4}}><FontAwesomeIcon icon={faUser} style={{fontSize:9,color:meta.color}}/>{plan.responsablePlan}</span>}
        {plan.dateEcheanceGlobale&&<span style={{display:"flex",alignItems:"center",gap:4}}><FontAwesomeIcon icon={faCalendar} style={{fontSize:9,color:meta.color}}/>{plan.dateEcheanceGlobale}</span>}
      </div>
      <div style={{display:"flex",gap:8,paddingTop:10,borderTop:"1px solid #F1F5F9"}}>
        {canEdit && (
          <button onClick={()=>onEdit(plan)} style={{flex:1,padding:"7px",borderRadius:8,border:`1px solid ${meta.border}`,background:meta.bg,color:meta.color,fontSize:11,fontWeight:700,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}
            onMouseEnter={e=>{e.currentTarget.style.background=meta.color;e.currentTarget.style.color="#fff";}}
            onMouseLeave={e=>{e.currentTarget.style.background=meta.bg;e.currentTarget.style.color=meta.color;}}
          ><FontAwesomeIcon icon={faPen}/> Modifier</button>
        )}
        {canDelete && (
          <button onClick={()=>onDelete(plan.id)} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #FECACA",background:"#FEF2F2",color:"#DC2626",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all .15s"}}
            onMouseEnter={e=>e.currentTarget.style.background="#FEE2E2"} onMouseLeave={e=>e.currentTarget.style.background="#FEF2F2"}
          ><FontAwesomeIcon icon={faTrash}/> Supprimer</button>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SUB-CLAUSE CARD
════════════════════════════════════════════════════════════ */
function SubClauseCard({ sub, meta, plans, conformity, onConformitySaved, onCreatePlan, onEditPlan, onDeletePlan, index, canWrite, canEdit, canDelete }) {
  const [expanded, setExpanded]       = useState(false);
  const [evalOpen, setEvalOpen]       = useState(false);
  const [form,     setForm]           = useState({status:"non-conforme",score:0,lastAudit:"",nextAudit:"",comments:""});
  const [saving,   setSaving]         = useState(false);
  const [proofs,   setProofs]         = useState([]);
  const [proofsLoaded, setPL]         = useState(false);
  const [pendingProofFiles, setPendingProofFiles] = useState([]);
  const [uploadingProof,    setUploadingProof]    = useState(false);
  const [uploadProofPct,    setUploadProofPct]    = useState(0);
  const proofFileRef = useRef(null);

  useEffect(()=>{ if(conformity) setForm({status:conformity.status,score:conformity.score||0,lastAudit:conformity.lastAudit||"",nextAudit:conformity.nextAudit||"",comments:conformity.comments||""}); },[conformity]);
  useEffect(()=>{
    if(expanded && conformity?.status==="conforme" && !proofsLoaded){
      setPL(true);
      getConformityProofs(sub.id).then(setProofs).catch(()=>{});
    }
  },[expanded, conformity?.status, sub.id, proofsLoaded]);

  const subPlans=plans.filter(p=>p.subClauseId===sub.id);
  const isConforme=conformity?.status==="conforme";
  const isNC=conformity?.status==="non-conforme";
  const evaluated=!!conformity;
  const cfg=conformity?CONFORMITY_OPTIONS.find(o=>o.value===conformity.status):null;
  const allProofFiles=proofs.flatMap(p=>p.files||[]);

  const saveConformity = async () => {
    setSaving(true);
    try {
      const saved = await upsertConformity(sub.id, form);
      onConformitySaved(saved);

      if (form.status === "conforme" && pendingProofFiles.length > 0) {
        const proof = await upsertConformityProof(sub.id, "");
        for (const file of pendingProofFiles) {
          try {
            const f = await uploadConformityProofFile(proof.id, file, undefined);
            setProofs(prev => {
              const idx = prev.findIndex(p => p.id === proof.id);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...proof, files: [...(prev[idx].files || []), f] };
                return updated;
              }
              return [{ ...proof, files: [f] }, ...prev];
            });
          } catch { /* continue */ }
        }
        setPendingProofFiles([]);
        setPL(false);
      }

      setEvalOpen(false);
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleEvalProofFile = async (file) => {
    setPendingProofFiles(prev => [...prev, file]);
  };

  const removeEvalProofFile = (idx) => {
    setPendingProofFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const canSave = form.status !== "conforme" || pendingProofFiles.length > 0 || allProofFiles.length > 0;

  const inputS={width:"100%",padding:"7px 10px",borderRadius:6,border:"1px solid #E2E8F0",fontSize:11,outline:"none",fontFamily:"inherit",color:"#0D1117",transition:"border-color .15s,box-shadow .15s"};

  return (
    <div style={{background:"#fff",border:`1px solid ${isConforme?"#BBF7D0":isNC?"#FECACA":"#E8ECF4"}`,borderLeft:`4px solid ${isConforme?"#16A34A":isNC?"#DC2626":"#CBD5E1"}`,borderRadius:12,overflow:"hidden",transition:"all .25s",boxShadow:expanded?`0 6px 24px rgba(0,0,0,.06)`:"none",animation:`subCardIn .4s cubic-bezier(.4,0,.2,1) ${index*60}ms both`}}>
      <div style={{padding:"13px 18px",display:"flex",alignItems:"center",gap:12,background:isConforme?"#F0FDF4":isNC?"#FFF5F5":"#fff",borderBottom:expanded?"1px solid #F1F5F9":"none",transition:"background .2s"}}>
        <span style={{fontSize:10,fontWeight:800,fontFamily:"'Sora',sans-serif",color:isConforme?"#16A34A":isNC?"#DC2626":meta.color,background:isConforme?"#DCFCE7":isNC?"#FEE2E2":meta.bg,padding:"3px 9px",borderRadius:6,border:`1px solid ${isConforme?"#BBF7D0":isNC?"#FECACA":meta.border}`,flexShrink:0}}>{sub.number}</span>
        <span onClick={()=>setExpanded(e=>!e)} style={{fontSize:13,fontWeight:600,color:"#0D1117",flex:1,lineHeight:1.3,cursor:"pointer"}}>{sub.title}</span>
        {cfg?<span style={{fontSize:10,fontWeight:700,color:cfg.color,background:cfg.bg,padding:"2px 9px",borderRadius:99,border:`1px solid ${cfg.color}33`,display:"flex",alignItems:"center",gap:5,flexShrink:0}}><FontAwesomeIcon icon={cfg.faIcon} style={{fontSize:9}}/>{cfg.label}</span>
           :<span style={{fontSize:10,fontWeight:600,color:"#94A3B8",background:"#F8FAFC",border:"1px solid #E2E8F0",padding:"2px 9px",borderRadius:99,flexShrink:0}}>Non évalué</span>}
        {isConforme && allProofFiles.length>0 && (
          <span style={{fontSize:10,fontWeight:700,color:"#16A34A",background:"#DCFCE7",border:"1px solid #BBF7D0",padding:"2px 8px",borderRadius:99,display:"flex",alignItems:"center",gap:4,flexShrink:0}}><FontAwesomeIcon icon={faPaperclip} style={{fontSize:8}}/>{allProofFiles.length}</span>
        )}
        <button onClick={e=>{e.stopPropagation();setEvalOpen(v=>!v);if(!expanded)setExpanded(true);}} style={{padding:"4px 11px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",border:`1.5px solid ${evalOpen?meta.color:"#CBD5E1"}`,background:evalOpen?meta.bg:"#F8FAFC",color:evalOpen?meta.color:"#64748B",display:"flex",alignItems:"center",gap:5,flexShrink:0,transition:"all .15s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=meta.color;e.currentTarget.style.color=meta.color;e.currentTarget.style.background=meta.bg;}}
          onMouseLeave={e=>{if(!evalOpen){e.currentTarget.style.borderColor="#CBD5E1";e.currentTarget.style.color="#64748B";e.currentTarget.style.background="#F8FAFC";}}}
        ><FontAwesomeIcon icon={faPen} style={{fontSize:9}}/>{evaluated?"Modifier":"Évaluer"}</button>
        {isNC&&subPlans.length>0&&<span style={{fontSize:10,fontWeight:700,color:"#64748B",background:"#F1F5F9",padding:"2px 8px",borderRadius:99,display:"flex",alignItems:"center",gap:4,flexShrink:0}}><FontAwesomeIcon icon={faListCheck} style={{fontSize:8}}/>{subPlans.length}</span>}
        <FontAwesomeIcon icon={expanded?faChevronUp:faChevronDown} onClick={()=>setExpanded(e=>!e)} style={{fontSize:10,color:"#CBD5E1",cursor:"pointer",flexShrink:0}}/>
      </div>

      {expanded&&evalOpen&&(
        <div style={{margin:"0 16px",borderRadius:"0 0 10px 10px",border:`1px solid ${meta.border}`,borderTop:"none",background:meta.bg+"66",padding:"16px",animation:"evalIn .2s ease"}}>
          <div style={{fontSize:11,fontWeight:700,color:meta.color,marginBottom:12,display:"flex",alignItems:"center",gap:6,textTransform:"uppercase",letterSpacing:".5px"}}><FontAwesomeIcon icon={faShield}/> Évaluation — {sub.number}</div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {CONFORMITY_OPTIONS.map(o=>(
              <label key={o.value} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:8,cursor:"pointer",border:`2px solid ${form.status===o.value?o.color:"#E2E8F0"}`,background:form.status===o.value?o.bg:"#fff",transition:"all .12s",boxShadow:form.status===o.value?`0 0 0 4px ${o.color}18`:"none"}}>
                <input type="radio" name={`status-${sub.id}`} value={o.value} checked={form.status===o.value} onChange={()=>setForm(f=>({...f,status:o.value}))} style={{display:"none"}}/>
                <FontAwesomeIcon icon={o.faIcon} style={{fontSize:15,color:form.status===o.value?o.color:"#CBD5E1"}}/>
                <span style={{fontSize:12,fontWeight:700,color:form.status===o.value?o.color:"#64748B"}}>{o.label}</span>
              </label>
            ))}
          </div>

          {form.status==="conforme" && (
            <div style={{marginBottom:14,padding:"12px 14px",borderRadius:10,border:"1.5px solid #BBF7D0",background:"#F0FDF4"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#15803D",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                <FontAwesomeIcon icon={faPaperclip} style={{fontSize:11}}/>
                Preuves de conformité <span style={{color:"#DC2626",marginLeft:2}}>*</span>
                <span style={{fontSize:10,fontWeight:500,color:"#16A34A",marginLeft:4}}>— obligatoire avant d'enregistrer</span>
              </div>

              {allProofFiles.length > 0 && (
                <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:8}}>
                  {allProofFiles.map(f=>{
                    const fi=fileIconInfo(f.contentType||"",f.originalName||"");
                    return (
                      <div key={f.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,background:"#fff",border:"1px solid #BBF7D0"}}>
                        <FontAwesomeIcon icon={fi.icon} style={{fontSize:13,color:fi.color,flexShrink:0}}/>
                        <span style={{flex:1,fontSize:11,fontWeight:600,color:"#0D1117",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.originalName}</span>
                        <span style={{fontSize:10,color:"#94A3B8"}}>{formatBytes(f.fileSize||0)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {pendingProofFiles.length > 0 && (
                <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:8}}>
                  {pendingProofFiles.map((file,idx)=>{
                    const fi=fileIconInfo(file.type||"",file.name||"");
                    return (
                      <div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,background:"#fff",border:"1px solid #86EFAC"}}>
                        <FontAwesomeIcon icon={fi.icon} style={{fontSize:13,color:fi.color,flexShrink:0}}/>
                        <span style={{flex:1,fontSize:11,fontWeight:600,color:"#0D1117",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.name}</span>
                        <span style={{fontSize:10,color:"#D97706",fontWeight:600}}>En attente</span>
                        <button onClick={()=>removeEvalProofFile(idx)} style={{background:"none",border:"none",cursor:"pointer",color:"#CBD5E1",fontSize:12,padding:0,flexShrink:0,transition:"color .15s"}}
                          onMouseEnter={e=>e.currentTarget.style.color="#F87171"}
                          onMouseLeave={e=>e.currentTarget.style.color="#CBD5E1"}
                        ><FontAwesomeIcon icon={faXmark}/></button>
                      </div>
                    );
                  })}
                </div>
              )}

              <button onClick={()=>proofFileRef.current?.click()}
                style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px dashed #86EFAC",background:"transparent",color:"#16A34A",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#DCFCE7";e.currentTarget.style.borderStyle="solid";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderStyle="dashed";}}
              >
                <FontAwesomeIcon icon={faUpload} style={{fontSize:10}}/> Ajouter un fichier preuve
              </button>
              <input ref={proofFileRef} type="file" style={{display:"none"}}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip"
                onChange={e=>{const f=e.target.files?.[0];if(f){handleEvalProofFile(f);e.target.value="";}}}
              />

              {pendingProofFiles.length===0 && allProofFiles.length===0 && (
                <p style={{fontSize:10,color:"#DC2626",margin:"6px 0 0",display:"flex",alignItems:"center",gap:4}}>
                  <FontAwesomeIcon icon={faTriangleExclamation} style={{fontSize:10}}/> Ajoutez au moins une preuve pour pouvoir enregistrer.
                </p>
              )}
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {[{l:"Dernier audit",k:"lastAudit"},{l:"Prochain audit",k:"nextAudit"}].map(f=>(
              <div key={f.k}><label style={{fontSize:10,fontWeight:600,color:"#64748B",display:"block",marginBottom:4}}>{f.l}</label>
                <input type="date" value={form[f.k]} onChange={e=>setForm(f2=>({...f2,[f.k]:e.target.value}))} style={inputS}
                  onFocus={e=>{e.target.style.borderColor=meta.color;e.target.style.boxShadow=`0 0 0 3px ${meta.color}18`;}}
                  onBlur={e=>{e.target.style.borderColor="#E2E8F0";e.target.style.boxShadow="none";}}/>
              </div>
            ))}
          </div>
          <textarea value={form.comments} onChange={e=>setForm(f=>({...f,comments:e.target.value}))} placeholder="Observations, preuves d'audit…" rows={2}
            style={{...inputS,resize:"none",marginBottom:12,width:"100%"}}
            onFocus={e=>{e.target.style.borderColor=meta.color;e.target.style.boxShadow=`0 0 0 3px ${meta.color}18`;}}
            onBlur={e=>{e.target.style.borderColor="#E2E8F0";e.target.style.boxShadow="none";}}/>

          <div style={{display:"flex",gap:8,justifyContent:"flex-end",alignItems:"center"}}>
            <button onClick={()=>{setEvalOpen(false);setPendingProofFiles([]);}} style={{padding:"6px 14px",borderRadius:6,border:"1px solid #E2E8F0",background:"#fff",color:"#64748B",fontSize:11,cursor:"pointer",fontWeight:500}}>Annuler</button>
            <button onClick={saveConformity} disabled={saving || !canSave}
              title={!canSave ? "Ajoutez au moins une preuve de conformité" : ""}
              style={{padding:"6px 14px",borderRadius:6,border:"none",background:canSave?meta.color:"#D1D5DB",color:"#fff",fontSize:11,fontWeight:700,cursor:canSave&&!saving?"pointer":"not-allowed",display:"flex",alignItems:"center",gap:6,opacity:saving?.7:1,transition:"all .15s"}}
              onMouseEnter={e=>{if(canSave&&!saving)e.currentTarget.style.transform="translateY(-1px)";}}
              onMouseLeave={e=>e.currentTarget.style.transform=""}
            >
              {saving?<FontAwesomeIcon icon={faSpinner} spin/>:<FontAwesomeIcon icon={faFloppyDisk}/>}
              {saving ? "Enregistrement…" : !canSave ? "Preuve requise" : "Enregistrer"}
            </button>
          </div>
        </div>
      )}

      {expanded&&(
        <div style={{animation:"bodyIn .2s ease"}}>
          <div style={{padding:"16px 18px"}}>
            <p style={{fontSize:12,color:"#475569",lineHeight:1.75,margin:"0 0 16px"}}>{sub.description}</p>
            {!evaluated&&!evalOpen&&(
              <div style={{border:"1.5px dashed #CBD5E1",borderRadius:10,padding:"24px",textAlign:"center",background:"#F8FAFC"}}>
                <FontAwesomeIcon icon={faShield} style={{fontSize:24,color:"#CBD5E1",marginBottom:10,display:"block"}}/>
                <div style={{fontSize:13,fontWeight:600,color:"#64748B",marginBottom:4}}>Sous-clause non évaluée</div>
                <div style={{fontSize:11,color:"#94A3B8",marginBottom:16}}>Évaluez la conformité avant de créer un plan d'action.</div>
                <button onClick={()=>setEvalOpen(true)} style={{padding:"8px 20px",borderRadius:8,border:`1.5px solid ${meta.color}`,background:meta.bg,color:meta.color,fontSize:12,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:7,transition:"transform .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.transform="translateY(-1px)"} onMouseLeave={e=>e.currentTarget.style.transform=""}>
                  <FontAwesomeIcon icon={faPen}/> Évaluer maintenant
                </button>
              </div>
            )}
            {isNC&&!evalOpen&&(
              <div>
                {subPlans.length>0&&(
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:10,display:"flex",alignItems:"center",gap:7,textTransform:"uppercase",letterSpacing:".5px"}}>
                      <div style={{width:5,height:5,borderRadius:99,background:"#DC2626"}}/>Plans d'action correctifs
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
                      {subPlans.map(plan=><PlanCard key={plan.id} plan={plan} meta={meta} subClauses={[sub]} onEdit={onEditPlan} onDelete={onDeletePlan} canEdit={canEdit} canDelete={canDelete}/>)}
                    </div>
                  </div>
                )}
                {canWrite && (
                  <button onClick={e=>{e.stopPropagation();onCreatePlan(sub.id);}} style={{padding:"10px 20px",borderRadius:10,border:"1.5px dashed #DC2626",background:"transparent",color:"#DC2626",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,width:"100%",justifyContent:"center",transition:"all .2s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background="#FEF2F2";e.currentTarget.style.borderStyle="solid";}}
                    onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderStyle="dashed";}}>
                    <div style={{width:22,height:22,borderRadius:6,background:"#DC2626",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}><FontAwesomeIcon icon={faPlus}/></div>
                    Ajouter un plan d'action pour {sub.number}
                  </button>
                )}
              </div>
            )}
            {isConforme&&!evalOpen&&(
              <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",gap:10}}>
                <FontAwesomeIcon icon={faCircleCheck} style={{color:"#16A34A",fontSize:20,flexShrink:0}}/>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#15803D"}}>Sous-clause conforme</div>
                  <div style={{fontSize:11,color:"#16A34A"}}>Importez des preuves ci-dessous ou modifiez l'évaluation si nécessaire.</div>
                </div>
              </div>
            )}
          </div>
          {isConforme&&!evalOpen&&(
            <ConformityProofPanel sub={sub} meta={meta} proofs={proofs}
              onProofUploaded={(proof,f)=>setProofs(prev=>{const idx=prev.findIndex(p=>p.id===proof.id);if(idx>=0){const u=[...prev];u[idx]={...proof,files:[f,...(proof.files||[])]};return u;}return[{...proof,files:[f]},...prev];})}
              onProofFileDeleted={fid=>setProofs(prev=>prev.map(p=>({...p,files:(p.files||[]).filter(f=>f.id!==fid)})))}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   LOADING SKELETON
════════════════════════════════════════════════════════════ */
function LoadingSkeleton() {
  return (
    <div style={{minHeight:"100vh",background:BG_PAGE,fontFamily:"'Sora','Segoe UI',sans-serif"}}>
      <div style={{maxWidth:1120,margin:"24px auto",padding:"0 32px",display:"flex",flexDirection:"column",gap:12}}>
        {[1,2,3].map(i=>(
          <div key={i} style={{background:"#fff",borderRadius:12,padding:18,border:"1px solid #E8ECF4",animation:`skeletonPulse 1.4s ease ${i*.1}s infinite`}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:60,height:20,background:"#F1F5F9",borderRadius:6}}/>
              <div style={{flex:1,height:16,background:"#F1F5F9",borderRadius:6}}/>
              <div style={{width:80,height:24,background:"#F1F5F9",borderRadius:99}}/>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes skeletonPulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function ClauseDetail() {
  const { id }           = useParams();
  const { logout }       = useAuth();
  const { canRead, canWrite, canEdit, canDelete, canExport } = useAuth();
  const moduleCode = "clauses";
  const navigate         = useNavigate();

  const [clause,             setClause]            = useState(null);
  const [subConformities,    setSubConformities]    = useState({});
  const [plans,              setPlans]              = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);
  const [tab,                setTab]                = useState("exigences");
  const [showForm,           setShowForm]           = useState(false);
  const [editingPlan,        setEditingPlan]        = useState(null);
  const [defaultSubClauseId, setDefaultSubClauseId] = useState(null);
  const [toast,              setToast]              = useState({msg:"",visible:false,type:"success"});
  const toastRef = useRef(null);

  const showToast = useCallback((msg,type="success")=>{
    setToast({msg,visible:true,type});
    clearTimeout(toastRef.current);
    toastRef.current=setTimeout(()=>setToast(t=>({...t,visible:false})),2800);
  },[]);

  const load = useCallback(async()=>{
    if(!id) return;
    setError(null);
    try {
      setLoading(true);
      const [cl,ap]=await Promise.all([getClause(+id),getActionPlans(+id)]);
      setClause(cl); setPlans(ap||[]);
      if(cl?.subClauses?.length){
        const confs=await Promise.all(cl.subClauses.map(s=>getConformity(s.id).catch(()=>null)));
        const map={};
        cl.subClauses.forEach((s,i)=>{if(confs[i])map[s.id]=confs[i];});
        setSubConformities(map);
      }
    } catch(e){ setError(e.message||"Erreur de chargement"); }
    finally { setLoading(false); }
  },[id]);

  useEffect(()=>{ load(); },[load]);

  const handleSavePlan = async(formData) => {
    try {
      const dto = formToApiDto(formData);
      if(editingPlan){
        const r=await updateActionPlan(editingPlan.id,{...dto,isoClauseId:+id});
        setPlans(p=>p.map(x=>x.id===r.id?r:x));
        showToast("Plan mis à jour avec succès");
      } else {
        const r=await createActionPlan({...dto,isoClauseId:+id});
        await flushPendingFiles(r.id, formData);
        setPlans(p=>[r,...p]);
        showToast("Plan d'action créé avec succès");
      }
      setShowForm(false); setEditingPlan(null); setDefaultSubClauseId(null);
    } catch(e){ showToast(e.message,"error"); }
  };

  const handleDelete = async(planId)=>{
    if(!window.confirm("Supprimer définitivement ce plan d'action ?")) return;
    try { await deleteActionPlan(planId); setPlans(p=>p.filter(x=>x.id!==planId)); showToast("Plan supprimé","info"); }
    catch(e){ showToast(e.message,"error"); }
  };

  const hasAccess = canRead(moduleCode);

  if(loading) return <LoadingSkeleton/>;
  
  if(!hasAccess) {
    return (
      <div style={{minHeight:"100vh",background:BG_PAGE,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,fontFamily:"'Sora',sans-serif"}}>
        <FontAwesomeIcon icon={faTriangleExclamation} style={{fontSize:48,color:"#EF4444"}}/>
        <div style={{fontSize:18,fontWeight:700,color:"#374151"}}>Accès non autorisé</div>
        <p style={{fontSize:13,color:"#64748B"}}>Vous n'avez pas les permissions nécessaires pour accéder à cette clause.</p>
        <button onClick={()=>navigate("/clauses")} style={{padding:"9px 22px",borderRadius:10,border:"none",background:ACCENT,color:"#fff",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          <FontAwesomeIcon icon={faArrowLeft}/> Retour aux clauses
        </button>
      </div>
    );
  }

  if(error) return (
    <div style={{minHeight:"100vh",background:BG_PAGE,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,fontFamily:"'Sora',sans-serif"}}>
      <FontAwesomeIcon icon={faTriangleExclamation} style={{fontSize:40,color:"#EF4444"}}/>
      <div style={{fontSize:16,fontWeight:700,color:"#374151"}}>{error}</div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={load} style={{padding:"9px 22px",borderRadius:10,border:"1px solid #E2E8F0",background:"#fff",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><FontAwesomeIcon icon={faRotateRight}/> Réessayer</button>
        <button onClick={()=>navigate("/clauses")} style={{padding:"9px 22px",borderRadius:10,border:"none",background:ACCENT,color:"#fff",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><FontAwesomeIcon icon={faArrowLeft}/> Retour</button>
      </div>
    </div>
  );
  if(!clause) return (
    <div style={{minHeight:"100vh",background:BG_PAGE,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,fontFamily:"'Sora',sans-serif"}}>
      <div style={{fontSize:16,fontWeight:700,color:"#374151"}}>Clause introuvable</div>
      <button onClick={()=>navigate("/clauses")} style={{padding:"9px 22px",borderRadius:10,border:"none",background:ACCENT,color:"#fff",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><FontAwesomeIcon icon={faArrowLeft}/> Retour</button>
    </div>
  );

  const num=parseInt(clause.number);
  const meta=CLAUSE_META[num]||CLAUSE_META[4];
  const phase=PDCA_MAP[num];
  const done=plans.filter(p=>p.statut==="terminee").length;
  const ip=plans.filter(p=>p.statut==="en-cours").length;
  const unassignedPlans=plans.filter(p=>!p.subClauseId);
  const subClauses=clause.subClauses||[];
  const subCount=subClauses.length;
  const conformeCount=subClauses.filter(s=>subConformities[s.id]?.status==="conforme").length;
  const computedScore=subCount>0?Math.round(conformeCount/subCount*100):0;
  const isFullyCompliant=subCount>0&&conformeCount===subCount;

  const mainTabs=[
    {id:"exigences",faIcon:faClipboardList,label:"Exigences & Sous-clauses",count:subCount,show:true},
    {id:"plans",    faIcon:faListCheck,    label:"Plans d'action",           count:plans.length,show:true},
  ].filter(t=>t.show);

  return (
    <div style={{minHeight:"100vh",background:BG_PAGE,fontFamily:"'Sora','Segoe UI',sans-serif"}}>
      <div style={{maxWidth:1120,margin:"0 auto",padding:"24px 32px 60px"}}>

        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:22,fontSize:12,animation:"fadeDown .4s ease"}}>
          <button onClick={()=>navigate("/clauses")} style={{background:"none",border:"none",cursor:"pointer",color:meta.color,fontWeight:700,fontSize:12,padding:0,display:"flex",alignItems:"center",gap:5,transition:"opacity .15s"}}
            onMouseEnter={e=>e.currentTarget.style.opacity=".7"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}
          ><FontAwesomeIcon icon={faArrowLeft}/> Clauses ISO 27001</button>
          <FontAwesomeIcon icon={faChevronRight} style={{fontSize:8,color:"#CBD5E1"}}/>
          <span style={{color:"#64748B",fontWeight:500}}>Clause {clause.number}</span>
          <FontAwesomeIcon icon={faChevronRight} style={{fontSize:8,color:"#CBD5E1"}}/>
          <span style={{color:"#374151",fontWeight:700}}>{clause.title}</span>
        </div>

        <div style={{borderRadius:14,marginBottom:28,overflow:"hidden",boxShadow:`0 16px 48px ${meta.color}30`,animation:"heroIn .5s cubic-bezier(.4,0,.2,1)"}}>
          <div style={{height:3,background:`linear-gradient(90deg,${meta.grad[0]},#60A5FA,${meta.grad[1]})`}}/>
          <div style={{background:`linear-gradient(135deg,${meta.grad[0]} 0%,${meta.grad[1]} 100%)`,padding:"28px 32px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,opacity:.07,backgroundImage:`url("data:image/svg+xml,%3Csvg width='52' height='60' viewBox='0 0 52 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M26 2L50 16v28L26 58 2 44V16z' stroke='white' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,backgroundSize:"52px 60px"}}/>
            <div style={{display:"flex",alignItems:"flex-start",gap:22,position:"relative"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                  <div style={{width:50,height:50,borderRadius:13,background:"rgba(255,255,255,.18)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,.3)",backdropFilter:"blur(4px)",flexShrink:0}}>
                    <FontAwesomeIcon icon={meta.faIcon} style={{color:"#fff",fontSize:20}}/>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,.85)",background:"rgba(255,255,255,.2)",padding:"3px 10px",borderRadius:5,fontFamily:"'Sora',sans-serif",letterSpacing:".5px"}}>§ {clause.number}</span>
                    <span style={{fontSize:10,color:"rgba(255,255,255,.75)",background:"rgba(255,255,255,.12)",padding:"3px 10px",borderRadius:5}}>{meta.label}</span>
                    {phase&&<span style={{display:"flex",alignItems:"center",gap:5,fontSize:10,fontWeight:600,color:"rgba(255,255,255,.9)",background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",padding:"3px 10px",borderRadius:5}}><PdcaWheel activePhase={phase} size={14} onWhite/>PDCA · {phase} — {PDCA_LABEL_FULL[phase]}</span>}
                    {isFullyCompliant&&<span style={{fontSize:10,fontWeight:700,color:"#86EFAC",background:"rgba(134,239,172,.18)",border:"1px solid rgba(134,239,172,.4)",padding:"3px 10px",borderRadius:99,display:"flex",alignItems:"center",gap:5}}><FontAwesomeIcon icon={faCircleCheck}/> Clause conforme</span>}
                  </div>
                </div>
                <h1 style={{fontSize:22,fontWeight:800,color:"#fff",margin:"0 0 8px",letterSpacing:"-.4px",lineHeight:1.2,fontFamily:"'Sora',sans-serif"}}>{clause.title}</h1>
                <p style={{fontSize:12.5,color:"rgba(255,255,255,.75)",margin:"0 0 20px",lineHeight:1.7,maxWidth:520}}>{clause.description}</p>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  {[{l:"Sous-clauses",v:subCount,icon:faClipboardList},{l:"Plans d'action",v:plans.length,icon:faBullseye},{l:"Terminés",v:done,icon:faCircleCheck},{l:"En cours",v:ip,icon:faRotateRight}].map((s,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,.15)",borderRadius:10,padding:"10px 16px",border:"1px solid rgba(255,255,255,.2)",display:"flex",alignItems:"center",gap:8,backdropFilter:"blur(4px)",animation:`statsIn .4s cubic-bezier(.4,0,.2,1) ${.2+i*.07}s both`}}>
                      <FontAwesomeIcon icon={s.icon} style={{color:"rgba(255,255,255,.65)",fontSize:12}}/>
                      <div>
                        <div style={{fontSize:16,fontWeight:800,color:"#fff",fontFamily:"'Sora',sans-serif",lineHeight:1}}>{s.v}</div>
                        <div style={{fontSize:9,color:"rgba(255,255,255,.6)",fontWeight:500,marginTop:2,textTransform:"uppercase",letterSpacing:".5px"}}>{s.l}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{flexShrink:0,animation:"ringIn .6s cubic-bezier(.34,1.1,.64,1) .3s both"}}>
                <ScoreRing value={conformeCount} total={subCount} score={computedScore} size={110}/>
                <div style={{textAlign:"center",marginTop:6,fontSize:10,color:"rgba(255,255,255,.6)",fontWeight:500}}>conformité globale</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22,flexWrap:"wrap",gap:12}}>
          <SlidingTabs tabs={mainTabs} active={tab} onChange={setTab}/>
          {canWrite(moduleCode) && (
            <button onClick={()=>{setDefaultSubClauseId(null);setEditingPlan(null);setShowForm(true);}}
              style={{padding:"10px 20px",borderRadius:10,border:"none",background:`linear-gradient(135deg,${meta.grad[0]},${meta.grad[1]})`,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 16px ${meta.color}44`,display:"flex",alignItems:"center",gap:7,transition:"transform .15s,box-shadow .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 6px 22px ${meta.color}55`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=`0 4px 16px ${meta.color}44`;}}
            ><FontAwesomeIcon icon={faPlus}/> Nouveau plan d'action</button>
          )}
        </div>

        {tab==="exigences"&&(
          <div>
            <div style={{marginBottom:18}}>
              <h2 style={{fontSize:15,fontWeight:800,color:TEXT1,margin:"0 0 4px",fontFamily:"'Sora',sans-serif"}}>Sous-clauses & Exigences</h2>
              <p style={{fontSize:12,color:TEXT3,margin:0}}>Évaluez chaque sous-clause, créez des plans correctifs et importez vos preuves de conformité.</p>
            </div>
            {subClauses.length===0
              ?<div style={{background:"#fff",border:"2px dashed #E4E8F0",borderRadius:16,padding:"48px",textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:"#374151"}}>Aucune sous-clause</div></div>
              :<div style={{display:"flex",flexDirection:"column",gap:10}}>
                {subClauses.map((sub,i)=>(
                  <SubClauseCard key={sub.id} sub={sub} meta={meta} plans={plans} index={i}
                    conformity={subConformities[sub.id]||null}
                    onConformitySaved={saved=>setSubConformities(prev=>({...prev,[sub.id]:saved}))}
                    onCreatePlan={(sid)=>{setDefaultSubClauseId(sid);setEditingPlan(null);setShowForm(true);setTab("plans");}}
                    onEditPlan={p=>{setEditingPlan(p);setShowForm(true);}}
                    onDeletePlan={handleDelete}
                    canWrite={canWrite(moduleCode)}
                    canEdit={canEdit(moduleCode)}
                    canDelete={canDelete(moduleCode)}
                  />
                ))}
              </div>
            }
          </div>
        )}

        {tab==="plans"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <h2 style={{fontSize:15,fontWeight:800,color:TEXT1,margin:"0 0 3px",fontFamily:"'Sora',sans-serif"}}>Plans d'action correctifs</h2>
                <div style={{fontSize:12,color:TEXT3}}>{plans.length} plan{plans.length!==1?"s":""} · {done} terminé{done!==1?"s":""} · {ip} en cours</div>
              </div>
            </div>
            {plans.length===0
              ?<div style={{background:"#fff",border:"2px dashed #E4E8F0",borderRadius:18,padding:"56px",textAlign:"center"}}>
                <div style={{width:64,height:64,borderRadius:18,background:meta.bg,border:`2px solid ${meta.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><FontAwesomeIcon icon={meta.faIcon} style={{fontSize:28,color:meta.color}}/></div>
                <div style={{fontSize:15,fontWeight:700,color:"#374151",marginBottom:8}}>Aucun plan d'action</div>
                {canWrite(moduleCode) && (
                  <button onClick={()=>{setDefaultSubClauseId(null);setEditingPlan(null);setShowForm(true);}} style={{padding:"11px 28px",borderRadius:11,border:"none",background:`linear-gradient(135deg,${meta.grad[0]},${meta.grad[1]})`,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:7,boxShadow:`0 4px 16px ${meta.color}44`}}>
                    <FontAwesomeIcon icon={faPlus}/> Créer le premier plan
                  </button>
                )}
              </div>
              :<div style={{display:"flex",flexDirection:"column",gap:28}}>
                {subClauses.map(sub=>{
                  const sp=plans.filter(p=>p.subClauseId===sub.id);
                  if(!sp.length) return null;
                  return (
                    <div key={sub.id} style={{animation:"fadeUp .4s ease"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:10,borderBottom:`2px solid ${meta.border}`}}>
                        <span style={{fontSize:10,fontWeight:800,fontFamily:"'Sora',sans-serif",color:meta.color,background:meta.bg,padding:"3px 11px",borderRadius:7,border:`1px solid ${meta.border}`}}>{sub.number}</span>
                        <span style={{fontSize:13,fontWeight:700,color:TEXT1}}>{sub.title}</span>
                        <span style={{marginLeft:"auto",fontSize:10,fontWeight:700,color:meta.color,background:meta.bg,padding:"2px 9px",borderRadius:99}}>{sp.length} plan{sp.length!==1?"s":""}</span>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}}>
                        {sp.map(plan=><PlanCard key={plan.id} plan={plan} meta={meta} subClauses={subClauses} onEdit={p=>{setEditingPlan(p);setShowForm(true);}} onDelete={handleDelete} canEdit={canEdit(moduleCode)} canDelete={canDelete(moduleCode)}/>)}
                      </div>
                    </div>
                  );
                })}
                {unassignedPlans.length>0&&(
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,paddingBottom:10,borderBottom:"2px solid #E4E8F0"}}>
                      <span style={{fontSize:10,fontWeight:800,color:"#64748B",background:"#F1F5F9",padding:"3px 11px",borderRadius:7,border:"1px solid #E4E8F0"}}>Non classés</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:14}}>
                      {unassignedPlans.map(plan=><PlanCard key={plan.id} plan={plan} meta={meta} subClauses={subClauses} onEdit={p=>{setEditingPlan(p);setShowForm(true);}} onDelete={handleDelete} canEdit={canEdit(moduleCode)} canDelete={canDelete(moduleCode)}/>)}
                    </div>
                  </div>
                )}
              </div>
            }
          </div>
        )}
      </div>

      {showForm&&(
        <ActionPlanForm plan={editingPlan} clauseId={+id} clauseNumber={clause.number}
          subClauses={subClauses} subConformities={subConformities} meta={meta}
          defaultSubClauseId={defaultSubClauseId} onSave={handleSavePlan}
          onCancel={()=>{setShowForm(false);setEditingPlan(null);setDefaultSubClauseId(null);}}
        />
      )}
      <Toast msg={toast.msg} visible={toast.visible} type={toast.type}/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
        @keyframes heroIn       {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes fadeDown     {from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
        @keyframes statsIn      {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes ringIn       {from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
        @keyframes subCardIn    {from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
        @keyframes evalIn       {from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
        @keyframes bodyIn       {from{opacity:0}to{opacity:1}}
        @keyframes tabFadeIn    {from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
        @keyframes fadeUp       {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes panelSlideIn {from{transform:translateX(60px);opacity:0}to{transform:none;opacity:1}}
        @keyframes completionFlash{0%{background:#ECFDF5;border-color:#10B981}40%{background:#D1FAE5;border-color:#059669;box-shadow:0 0 0 4px #10B98130}100%{background:#F0FDF4;border-color:#BBF7D0;box-shadow:none}}
        @keyframes toastProgress{from{width:100%}to{width:0}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:99px}
        input[type="date"]::-webkit-calendar-picker-indicator{opacity:.4;cursor:pointer}
        button{outline:none}
      `}</style>
    </div>
  );
}