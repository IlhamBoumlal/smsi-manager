import { isValidElement, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { statusClass, statusLabel } from "../riskModel";
import { appConfirm } from "../../../utils/appDialogs";

export function RiskPageHeader({ title, subtitle, badge, actions, variant = "default" }) {
  const headerClass = `risk-page-header${variant === "hero" ? " risk-page-header-hero" : ""}`;

  return (
    <header className={headerClass}>
      <div className="risk-page-header-grid">
        <div className="risk-page-header-copy">
          {badge ? (
            <p className="risk-page-header-badge">
              {badge}
            </p>
          ) : null}
          <h1 className="risk-title-main mt-2 text-slate-900">
            {title}
          </h1>
          {subtitle ? <p className="risk-subtitle mt-2 max-w-[1000px]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="risk-page-header-actions">{actions}</div> : null}
      </div>
    </header>
  );
}

export function RiskStatusBadge({ status }) {
  return (
    <span className={`risk-status-badge inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusClass(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {statusLabel(status)}
    </span>
  );
}

export function RiskCard({ children, className = "", ...props }) {
  return (
    <div className={`risk-card risk-panel rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

export function RiskSectionHeader({ title, subtitle, right }) {
  return (
    <div className="risk-section-header flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
      <div>
        <h3 className="text-lg font-black tracking-tight text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm leading-relaxed text-slate-500">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function RiskKpiTile({ label, value, tone = "default", helper, primary = false, progress }) {
  const valueClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "info"
        ? "text-blue-700"
        : tone === "warning"
          ? "text-amber-700"
          : "text-slate-900";
  const numericFromValue = Number.parseInt(String(value || "").replace(/[^\d]/g, ""), 10);
  const progressValue = Number.isFinite(Number(progress)) ? Number(progress) : (Number.isFinite(numericFromValue) ? numericFromValue : 0);
  const safeProgress = Math.max(0, Math.min(100, progressValue));

  return (
    <div className={`risk-kpi-tile p-5 ${primary ? "risk-kpi-tile-primary" : ""}`}>
      <div className={`text-[12.5px] font-semibold ${primary ? "text-white/95" : "text-slate-700"}`}>{label}</div>
      <div className={`risk-kpi-value mt-2 leading-none ${primary ? "text-white" : valueClass}`}>{value}</div>
      {helper ? <div className={`mt-1 text-[11.5px] ${primary ? "text-white/75" : "text-slate-400"}`}>{helper}</div> : null}
      {primary ? (
        <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-white/25">
          <div className="h-[5px] rounded-full bg-white/90 transition-all duration-500" style={{ width: `${safeProgress}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export function RiskProgressBar({ value = 0, label, rightLabel, size = 92, stroke = 10, centerLabel }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (safe / 100) * circumference;
  const centerText = centerLabel || `${safe}%`;
  const detailText = rightLabel && rightLabel !== `${safe}%` ? rightLabel : null;

  return (
    <div className="risk-progress-circle-block">
      {label ? <div className="mb-2 text-xs font-semibold text-slate-500">{label}</div> : null}
      <div className="risk-progress-circle-shell">
        <div className="risk-progress-circle-wrap" style={{ width: `${size}px`, height: `${size}px` }}>
          <svg className="risk-progress-circle-svg" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
            <circle className="risk-progress-circle-bg" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
            <circle
              className="risk-progress-circle-value"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="risk-progress-circle-center">{centerText}</div>
        </div>
        {detailText ? <div className="risk-progress-circle-meta">{detailText}</div> : null}
      </div>
    </div>
  );
}

export function RiskModal({ open, title, onClose, children, size = "max-w-3xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`risk-modal-panel w-full ${size} rounded-2xl border border-slate-200 bg-white shadow-2xl`} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50" type="button">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function MultiSelectField({ field, value, onChange, inputClassName }) {
  const [query, setQuery] = useState("");
  const options = useMemo(() => (Array.isArray(field.options) ? field.options : []), [field.options]);
  const current = useMemo(() => (Array.isArray(value) ? value.map((entry) => String(entry)) : []), [value]);
  const selectedSet = useMemo(() => new Set(current), [current]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeToken(query);
    if (!normalizedQuery) return options;

    return options.filter((option) => {
      const label = normalizeToken(option.label);
      const rawValue = normalizeToken(option.value);
      return label.includes(normalizedQuery) || rawValue.includes(normalizedQuery);
    });
  }, [options, query]);

  const setSelectedValues = (nextValues) => {
    const unique = [];
    const seen = new Set();
    nextValues.forEach((entry) => {
      const token = String(entry);
      if (seen.has(token)) return;
      seen.add(token);
      unique.push(token);
    });
    onChange(unique);
  };

  const toggleValue = (optionValue) => {
    const nextValue = String(optionValue);
    if (selectedSet.has(nextValue)) {
      setSelectedValues(current.filter((entry) => entry !== nextValue));
      return;
    }
    setSelectedValues([...current, nextValue]);
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={field.searchPlaceholder || "Rechercher une option..."}
        className={inputClassName}
      />
      <div className="max-h-56 overflow-auto rounded-xl border border-slate-300 bg-white shadow-sm">
        {filteredOptions.length ? (
          filteredOptions.map((option) => {
            const key = String(option.value);
            const checked = selectedSet.has(key);
            return (
              <label key={key} className="flex cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 last:border-b-0">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleValue(option.value)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="leading-tight">{option.label}</span>
              </label>
            );
          })
        ) : (
          <div className="px-3 py-4 text-sm text-slate-500">Aucun resultat.</div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>{current.length} selection(s)</span>
        <button type="button" onClick={() => onChange([])} className="text-blue-600 hover:text-blue-700">
          Vider
        </button>
      </div>
    </div>
  );
}

function resolveFieldOptions(field, draft) {
  if (typeof field.options === "function") {
    const dynamic = field.options(draft);
    return Array.isArray(dynamic) ? dynamic : [];
  }
  return Array.isArray(field.options) ? field.options : [];
}

function renderField(field, value, onChange, draft) {
  const commonClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";

  if (field.type === "textarea") {
    return (
      <textarea
        className={`min-h-[92px] ${commonClass}`}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.type === "select") {
    const options = resolveFieldOptions(field, draft);
    return (
      <select className={commonClass} value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">Selectionner...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "multiselect") {
    const options = resolveFieldOptions(field, draft);
    return (
      <MultiSelectField
        field={{ ...field, options }}
        value={value}
        onChange={onChange}
        inputClassName={commonClass}
      />
    );
  }

  return (
    <input
      type={field.type || "text"}
      className={commonClass}
      value={value ?? ""}
      onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)}
      placeholder={field.placeholder}
      min={field.min}
      max={field.max}
      step={field.step}
    />
  );
}

function isFieldRequired(field, draft) {
  if (typeof field.requiredWhen === "function") return field.requiredWhen(draft);
  return Boolean(field.required);
}

function valueHasContent(value) {
  if (Array.isArray(value)) return value.length > 0;
  return `${value ?? ""}`.trim() !== "";
}

function optionSet(field, draft) {
  const options = resolveFieldOptions(field, draft);
  return new Set(options.map((option) => String(option.value)));
}

function validateDraftField(field, draft) {
  const value = draft[field.key];
  const required = isFieldRequired(field, draft);

  if (required && !valueHasContent(value)) {
    return field.requiredMessage || "Champ obligatoire.";
  }

  if (!valueHasContent(value)) return "";

  if (field.type === "select") {
    const options = optionSet(field, draft);
    if (options.size > 0 && !options.has(String(value))) {
      return "Valeur non autorisee.";
    }
  }

  if (field.type === "multiselect") {
    if (!Array.isArray(value)) return "Format invalide.";
    const options = optionSet(field, draft);
    if (options.size > 0 && value.some((entry) => !options.has(String(entry)))) {
      return "Une ou plusieurs valeurs sont non autorisees.";
    }
  }

  if (field.type === "number") {
    const num = Number(value);
    if (!Number.isFinite(num)) return "Nombre invalide.";
    if (Number.isFinite(field.min) && num < Number(field.min)) return `Valeur minimale: ${field.min}.`;
    if (Number.isFinite(field.max) && num > Number(field.max)) return `Valeur maximale: ${field.max}.`;
  }

  if (typeof field.validate === "function") {
    const customError = field.validate(value, draft);
    if (customError) return customError;
  }

  return "";
}

function collectDraftErrors(fields, draft) {
  const nextErrors = {};
  fields.forEach((field) => {
    const error = validateDraftField(field, draft);
    if (error) nextErrors[field.key] = error;
  });
  return nextErrors;
}

function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function pickToneFromNumeric(value) {
  if (!Number.isFinite(value)) return null;
  if (value >= 4) return "danger";
  if (value >= 3) return "orange";
  if (value >= 2) return "warning";
  return "success";
}

function pickStatusTone(normalizedText) {
  if (!normalizedText) return "neutral";
  if (normalizedText.includes("termine") || normalizedText.includes("fait") || normalizedText.includes("applique") || normalizedText.includes("approuve") || normalizedText.includes("conforme")) return "success";
  if (normalizedText.includes("a valider") || normalizedText.includes("a_valider")) return "warning";
  if (normalizedText.includes("en cours")) return "info";
  if (normalizedText.includes("bloque") || normalizedText.includes("non conforme") || normalizedText.includes("retard")) return "danger";
  if (normalizedText.includes("non evalue") || normalizedText.includes("a faire")) return "neutral";
  return "neutral";
}

function pickScaleTone(normalizedText, numericScore) {
  if (normalizedText.includes("critique") || normalizedText.includes("g4") || normalizedText.includes("v4")) return "danger";
  if (normalizedText.includes("grave") || normalizedText.includes("elevee") || normalizedText.includes("eleve") || normalizedText.includes("fort") || normalizedText.includes("g3") || normalizedText.includes("v3")) return "orange";
  if (normalizedText.includes("significative") || normalizedText.includes("moderee") || normalizedText.includes("moyenne") || normalizedText.includes("g2") || normalizedText.includes("v2")) return "warning";
  if (normalizedText.includes("mineure") || normalizedText.includes("faible") || normalizedText.includes("minimal") || normalizedText.includes("g1") || normalizedText.includes("v1")) return "success";
  return pickToneFromNumeric(numericScore) || "neutral";
}

function pickPriorityTone(normalizedText) {
  if (normalizedText.includes("haute") || normalizedText.includes("urgent") || normalizedText.includes("p1")) return "danger";
  if (normalizedText.includes("moyenne") || normalizedText.includes("p2")) return "orange";
  if (normalizedText.includes("faible") || normalizedText.includes("basse") || normalizedText.includes("p3")) return "success";
  return "neutral";
}

function pickYesNoTone(normalizedText) {
  if (!normalizedText) return "neutral";
  if (["oui", "yes", "true", "pertinent"].some((token) => normalizedText === token || normalizedText.includes(token))) return "success";
  if (["non", "no", "false", "non pertinent"].some((token) => normalizedText === token || normalizedText.includes(token))) return "neutral";
  return "neutral";
}

function pickCapacityTone(numericScore, normalizedText) {
  if (Number.isFinite(numericScore)) {
    if (numericScore >= 4) return "danger";
    if (numericScore >= 2) return "orange";
    if (numericScore >= 1) return "warning";
  }
  return pickScaleTone(normalizedText, numericScore);
}

function getCellBadgeTone(columnKey, rawValue, displayText) {
  const normalizedKey = normalizeToken(columnKey);
  const normalizedText = normalizeToken(displayText);

  const numericScore =
    typeof rawValue === "number"
      ? rawValue
      : Number.parseFloat((String(displayText || "").match(/\d+(?:\.\d+)?/) || [])[0]);

  if (normalizedKey.includes("status") || normalizedKey.includes("statut")) {
    return pickStatusTone(normalizedText);
  }

  if (normalizedKey.includes("priority") || normalizedKey.includes("priorite")) {
    return pickPriorityTone(normalizedText);
  }

  if (normalizedKey.includes("type") || normalizedKey.includes("categorie") || normalizedKey.includes("category")) {
    return "info";
  }

  if (normalizedKey.includes("retained") || normalizedKey.includes("pertinent") || normalizedKey.includes("pertinence")) {
    return pickYesNoTone(normalizedText);
  }

  if (normalizedKey.includes("zone")) {
    return pickScaleTone(normalizedText, numericScore);
  }

  if (normalizedKey.includes("libelle")) {
    return pickScaleTone(normalizedText, numericScore);
  }

  if (normalizedKey.includes("capability") || normalizedKey.includes("capacite")) {
    return pickCapacityTone(numericScore, normalizedText);
  }

  if (
    normalizedKey.includes("gravity") ||
    normalizedKey.includes("gravite") ||
    normalizedKey.includes("criticality") ||
    normalizedKey.includes("criticite") ||
    normalizedKey.includes("likelihood") ||
    normalizedKey.includes("vraisemblance") ||
    normalizedKey.includes("exposure") ||
    normalizedKey.includes("exposition") ||
    normalizedKey.includes("reliability") ||
    normalizedKey.includes("fiabilite") ||
    normalizedKey.includes("level") ||
    normalizedKey.includes("niveau") ||
    normalizedKey.includes("residual")
  ) {
    return pickScaleTone(normalizedText, numericScore);
  }

  return null;
}

function renderTechniqueTags(rawValue, displayText) {
  const items = Array.isArray(rawValue)
    ? rawValue.filter(Boolean).map((item) => String(item).trim())
    : String(displayText || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  if (!items.length) return "-";
  return (
    <div className="risk-cell-tag-list">
      {items.map((item) => (
        <span key={item} className="risk-cell-tag">{item}</span>
      ))}
    </div>
  );
}

function renderTableCell(column, row) {
  const rawValue = column.render ? column.render(row) : row[column.key];
  if (rawValue === undefined || rawValue === null || rawValue === "") return "-";
  if (isValidElement(rawValue)) return rawValue;

  const displayText = Array.isArray(rawValue) ? rawValue.join(", ") : String(rawValue);
  const normalizedKey = normalizeToken(column.key);

  if (normalizedKey.includes("technic") || normalizedKey.includes("technique")) {
    return renderTechniqueTags(rawValue, displayText);
  }

  const tone = getCellBadgeTone(column.key, row[column.key], displayText);

  if (!tone) return displayText;
  return <span className={`risk-cell-badge risk-cell-badge-${tone}`}>{displayText}</span>;
}

export function RiskCrudTable({
  title,
  subtitle,
  rows,
  columns,
  fields,
  onSave,
  onDelete,
  addLabel = "Ajouter",
  emptyText = "Aucune donnee",
  compact = false,
  readOnly = false,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  deleteConfirmMessage,
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({}));
  const [errors, setErrors] = useState(() => ({}));

  const canCreate = !readOnly && allowCreate;
  const canEdit = !readOnly && allowEdit;
  const canDelete = !readOnly && allowDelete;
  const isEditing = Boolean(draft?.id);
  const canSubmit = isEditing ? canEdit : canCreate;

  const rowCount = rows?.length || 0;
  const canSave = useMemo(
    () => canSubmit && fields.every((field) => !isFieldRequired(field, draft) || valueHasContent(draft[field.key])),
    [canSubmit, draft, fields],
  );

  const startCreate = () => {
    if (!canCreate) return;
    const next = {};
    fields.forEach((field) => {
      next[field.key] = field.defaultValue ?? (field.type === "multiselect" ? [] : "");
    });
    setDraft(next);
    setErrors({});
    setEditorOpen(true);
  };

  const startEdit = (row) => {
    if (!canEdit) return;
    const next = { ...row };
    fields.forEach((field) => {
      if (field.type === "multiselect" && !Array.isArray(next[field.key])) next[field.key] = [];
    });
    setDraft(next);
    setErrors({});
    setEditorOpen(true);
  };

  const save = () => {
    if (!canSave) return;
    const nextErrors = collectDraftErrors(fields, draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(draft);
    setErrors({});
    setEditorOpen(false);
  };

  const askDelete = async (row) => {
    if (!canDelete) return;
    const message = typeof deleteConfirmMessage === "function" ? deleteConfirmMessage(row) : deleteConfirmMessage;
    const confirmed = await appConfirm(message || "Confirmer la suppression de cet element ?", {
      title: "Confirmer la suppression",
      confirmText: "Supprimer",
    });
    if (!confirmed) return;
    onDelete(row.id);
  };

  return (
    <RiskCard>
      <RiskSectionHeader
        title={title}
        subtitle={subtitle}
        right={
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{rowCount} element(s)</span>
            {canCreate && (
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white enabled:hover:bg-blue-700"
              >
                <Plus size={14} /> {addLabel}
              </button>
            )}
          </div>
        }
      />
      <div className={`${compact ? "p-4" : "p-5"}`}>
        {!rowCount ? (
          <div className="risk-empty-state rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">{emptyText}</div>
        ) : (
          <div className="risk-data-table overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      {column.label}
                    </th>
                  ))}
                  {(canEdit || canDelete) && (
                    <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-200 transition-colors">
                    {columns.map((column) => (
                      <td key={`${row.id}-${column.key}`} className="px-3 py-2 text-slate-700">
                        {renderTableCell(column, row)}
                      </td>
                    ))}
                    {(canEdit || canDelete) && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button type="button" onClick={() => startEdit(row)} className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50">
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button type="button" onClick={() => askDelete(row)} className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RiskModal open={editorOpen} onClose={() => { setEditorOpen(false); setErrors({}); }} title={draft?.id ? "Modifier" : "Ajouter"}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className={field.full ? "md:col-span-2" : ""}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">{field.label}</label>
              {renderField(field, draft[field.key], (value) => {
                setDraft((prev) => ({ ...prev, [field.key]: value }));
                setErrors((prev) => {
                  if (!prev[field.key]) return prev;
                  const next = { ...prev };
                  delete next[field.key];
                  return next;
                });
              }, draft)}
              {errors[field.key] ? <p className="mt-1 text-xs font-semibold text-red-600">{errors[field.key]}</p> : null}
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => { setEditorOpen(false); setErrors({}); }} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Annuler
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      </RiskModal>
    </RiskCard>
  );
}

export function RiskCallout({ tone = "info", title, children }) {
  const toneClass =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div className={`risk-callout rounded-xl border px-4 py-3 ${toneClass}`}>
      {title ? <div className="text-xs font-black uppercase tracking-wide">{title}</div> : null}
      <div className={`${title ? "mt-1" : ""} text-sm leading-relaxed`}>{children}</div>
    </div>
  );
}
