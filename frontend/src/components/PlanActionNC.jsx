import React from "react";

const cardStyle = {
  border: "1px solid #fecaca",
  background: "#fff7f7",
  borderRadius: 14,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const titleStyle = {
  fontSize: 15,
  fontWeight: 800,
  color: "#991b1b",
  marginBottom: 4,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "#475569",
  marginBottom: 6,
  display: "block",
};

const inputStyle = {
  width: "100%",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
  background: "#ffffff",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: 78,
  resize: "vertical",
};

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function PlanActionNC({ ctrl = {}, statut, onChange }) {
  const update = (key, value) => {
    if (typeof onChange === "function") onChange({ [key]: value });
  };

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>Plan d'action NC ({statut === "NCMajeure" ? "Majeure" : "Mineure"})</div>

      <Field label="Description de la non-conformite">
        <textarea
          style={textareaStyle}
          value={ctrl.NcDescription || ""}
          onChange={(e) => update("NcDescription", e.target.value)}
          placeholder="Decrire la non-conformite constatee..."
        />
      </Field>

      <Field label="Impact">
        <textarea
          style={textareaStyle}
          value={ctrl.Impact || ""}
          onChange={(e) => update("Impact", e.target.value)}
          placeholder="Impact operationnel, securite, conformite..."
        />
      </Field>

      <div style={gridStyle}>
        <Field label="Action immediate">
          <input
            style={inputStyle}
            value={ctrl.ActionImmediate || ""}
            onChange={(e) => update("ActionImmediate", e.target.value)}
            placeholder="Action de confinement rapide"
          />
        </Field>
        <Field label="Responsable action immediate">
          <input
            style={inputStyle}
            value={ctrl.ResponsableImm || ""}
            onChange={(e) => update("ResponsableImm", e.target.value)}
            placeholder="Nom responsable"
          />
        </Field>
        <Field label="Delai action immediate">
          <input
            style={inputStyle}
            type="date"
            value={ctrl.DelaiActionImm || ""}
            onChange={(e) => update("DelaiActionImm", e.target.value)}
          />
        </Field>
      </div>

      <div style={gridStyle}>
        <Field label="Causes racines">
          <textarea
            style={textareaStyle}
            value={ctrl.CausesRacines || ""}
            onChange={(e) => update("CausesRacines", e.target.value)}
            placeholder="Causes racines identifiees..."
          />
        </Field>
        <Field label="Methode d'analyse">
          <select
            style={inputStyle}
            value={ctrl.MethodeAnalyse || "5-pourquoi"}
            onChange={(e) => update("MethodeAnalyse", e.target.value)}
          >
            <option value="5-pourquoi">5 pourquoi</option>
            <option value="Ishikawa">Ishikawa</option>
            <option value="AMDEC">AMDEC</option>
            <option value="Autre">Autre</option>
          </select>
        </Field>
      </div>

      <Field label="Plan correctif">
        <textarea
          style={textareaStyle}
          value={ctrl.PlanCorrectif || ""}
          onChange={(e) => update("PlanCorrectif", e.target.value)}
          placeholder="Plan d'action detaille..."
        />
      </Field>

      <div style={gridStyle}>
        <Field label="Responsable plan">
          <input
            style={inputStyle}
            value={ctrl.ResponsablePlan || ""}
            onChange={(e) => update("ResponsablePlan", e.target.value)}
            placeholder="Nom responsable"
          />
        </Field>
        <Field label="Date echeance">
          <input
            style={inputStyle}
            type="date"
            value={ctrl.DateEcheance || ""}
            onChange={(e) => update("DateEcheance", e.target.value)}
          />
        </Field>
        <Field label="Statut plan">
          <select
            style={inputStyle}
            value={ctrl.StatutPlan || "En cours"}
            onChange={(e) => update("StatutPlan", e.target.value)}
          >
            <option value="En cours">En cours</option>
            <option value="A verifier">A verifier</option>
            <option value="Cloture">Cloture</option>
          </select>
        </Field>
      </div>

      <Field label="Indicateurs de suivi">
        <textarea
          style={textareaStyle}
          value={ctrl.Indicateurs || ""}
          onChange={(e) => update("Indicateurs", e.target.value)}
          placeholder="KPI / criteres de verification..."
        />
      </Field>

      <Field label="Preuves">
        <textarea
          style={textareaStyle}
          value={ctrl.Preuves || ""}
          onChange={(e) => update("Preuves", e.target.value)}
          placeholder="Liens / references de preuves..."
        />
      </Field>

      <div style={gridStyle}>
        <Field label="Date verification">
          <input
            style={inputStyle}
            type="date"
            value={ctrl.DateVerification || ""}
            onChange={(e) => update("DateVerification", e.target.value)}
          />
        </Field>
        <Field label="Cloture par">
          <input
            style={inputStyle}
            value={ctrl.CloturePar || ""}
            onChange={(e) => update("CloturePar", e.target.value)}
            placeholder="Nom validateur"
          />
        </Field>
        <Field label="Date cloture">
          <input
            style={inputStyle}
            type="date"
            value={ctrl.DateCloture || ""}
            onChange={(e) => update("DateCloture", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Commentaire de cloture">
        <textarea
          style={textareaStyle}
          value={ctrl.CommentaireCloture || ""}
          onChange={(e) => update("CommentaireCloture", e.target.value)}
          placeholder="Commentaire final de cloture..."
        />
      </Field>
    </div>
  );
}

