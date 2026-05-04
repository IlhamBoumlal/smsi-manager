import { createContext, isValidElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  Clock3,
  Edit3,
  FileText,
  MapPinned,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  createRiskStudy,
  deleteRiskStudy,
  duplicateRiskStudy,
  getRiskOwners,
  getRiskStudies,
  updateRiskStudy,
} from "../../api/risques";

const RISK_THEME_STYLE_ID = "risk-theme-monolith-style";
const RISK_THEME_CSS = "@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');\n\n.risk-theme {\n  --risk-bg: #f8f9fb;\n  --risk-surface: #ffffff;\n  --risk-surface-soft: #f8fbff;\n  --risk-border: #e2e8f0;\n  --risk-border-strong: #cbd5e1;\n  --risk-text: #0f172a;\n  --risk-muted: #64748b;\n  --risk-primary: #1d4ed8;\n  --risk-primary-strong: #1e40af;\n  --risk-accent: #3b82f6;\n  --risk-radius-lg: 1rem;\n  --risk-radius-xl: 1rem;\n  --risk-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.06);\n  --risk-shadow-strong: 0 16px 34px rgba(15, 23, 42, 0.1);\n  font-family: \"Sora\", \"Inter\", \"Segoe UI\", sans-serif;\n  color: var(--risk-text);\n}\n\n.risk-theme .risk-page {\n  min-height: 100%;\n  background: var(--risk-bg);\n}\n\n.risk-theme .risk-app-shell {\n  margin: 0 auto;\n  max-width: 1420px;\n  padding: 1.15rem;\n}\n\n.risk-theme .risk-page-header {\n  animation: fadeInUp .35s ease both;\n}\n\n.risk-theme .risk-page-header.risk-page-header-hero {\n  position: relative;\n  overflow: hidden;\n  border: 1px solid var(--risk-border);\n  border-radius: 1.25rem;\n  background:\n    radial-gradient(circle at 88% -32%, rgba(59, 130, 246, 0.16), transparent 48%),\n    linear-gradient(160deg, #ffffff 0%, #eff6ff 100%);\n  box-shadow: var(--risk-shadow);\n}\n\n.risk-theme .risk-page-header-grid {\n  display: grid;\n  gap: 0.9rem;\n  grid-template-columns: minmax(0, 1fr);\n}\n\n.risk-theme .risk-page-header.risk-page-header-hero .risk-page-header-grid {\n  padding: 1.15rem 1.2rem;\n}\n\n.risk-theme .risk-page-header-copy {\n  min-width: 0;\n}\n\n.risk-theme .risk-page-header-badge {\n  display: inline-flex;\n  align-items: center;\n  border-radius: 999px;\n  border: 1px solid #bfdbfe;\n  background: #eff6ff;\n  padding: 0.32rem 0.78rem;\n  font-size: 0.7rem;\n  font-weight: 800;\n  letter-spacing: 0.16em;\n  line-height: 1;\n  text-transform: uppercase;\n  color: #1d4ed8;\n}\n\n.risk-theme .risk-page-header-actions {\n  display: flex;\n  width: 100%;\n  flex-direction: column;\n  align-items: stretch;\n  justify-content: flex-start;\n  gap: 0.55rem;\n}\n\n.risk-theme .risk-page-header-actions > * {\n  width: 100%;\n  justify-content: center;\n}\n\n.risk-theme .risk-page-header-actions > button {\n  transition: transform 0.16s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;\n}\n\n.risk-theme .risk-page-header-actions > button:hover {\n  transform: translateY(-1px);\n}\n\n.risk-theme .risk-card {\n  border-color: var(--risk-border);\n  border-radius: var(--risk-radius-xl);\n  box-shadow: var(--risk-shadow);\n  transition: border-color .25s cubic-bezier(.4,0,.2,1), transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s cubic-bezier(.4,0,.2,1);\n}\n\n.risk-theme .risk-card:hover {\n  border-color: var(--risk-border-strong);\n}\n\n.risk-theme .risk-panel {\n  background: #ffffff;\n}\n\n.risk-theme .risk-panel-soft {\n  border: 1px solid var(--risk-border);\n  border-radius: var(--risk-radius-lg);\n  background: var(--risk-surface-soft);\n}\n\n.risk-theme .risk-command-toolbar {\n  border: 1px solid var(--risk-border);\n  background: #ffffff;\n  animation: fadeInUp .35s ease both;\n}\n\n.risk-theme .risk-hero {\n  background:\n    radial-gradient(circle at 88% -30%, rgba(96, 165, 250, 0.22), transparent 45%),\n    linear-gradient(160deg, #ffffff 0%, #f4f8ff 100%);\n}\n\n.risk-theme .risk-topbar {\n  position: sticky;\n  top: 84px;\n  z-index: 30;\n}\n\n.risk-theme .risk-layout-portfolio {\n  display: grid;\n  gap: 1rem;\n  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);\n}\n\n.risk-theme .risk-layout-study {\n  display: grid;\n  gap: 1rem;\n  grid-template-columns: minmax(250px, 300px) minmax(0, 1fr) minmax(260px, 320px);\n}\n\n.risk-theme .risk-layout-workshop {\n  display: grid;\n  gap: 1rem;\n  grid-template-columns: minmax(250px, 290px) minmax(0, 1fr) minmax(250px, 300px);\n}\n\n.risk-theme .risk-layout-workshop.risk-layout-workshop-no-aside {\n  grid-template-columns: minmax(250px, 290px) minmax(0, 1fr);\n}\n\n.risk-theme .risk-study-grid {\n  display: grid;\n  gap: 1rem;\n  grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));\n}\n\n.risk-theme .risk-workshop-grid {\n  display: grid;\n  gap: 1rem;\n  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));\n}\n\n.risk-theme .risk-sidebar-rail,\n.risk-theme .risk-aside-rail,\n.risk-theme .risk-step-rail {\n  position: sticky;\n  top: 150px;\n  align-self: flex-start;\n}\n\n.risk-theme .risk-title-main {\n  font-size: 26px;\n  letter-spacing: -0.8px;\n  line-height: 1.1;\n  font-weight: 800;\n}\n\n.risk-theme .risk-subtitle {\n  color: var(--risk-muted);\n  line-height: 1.55;\n  font-size: 13.5px;\n}\n\n.risk-theme .risk-kpi-grid {\n  display: grid;\n  gap: 0.75rem;\n  grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));\n}\n\n.risk-theme .risk-kpi-band {\n  animation: fadeInUp .35s ease both;\n}\n\n.risk-theme .risk-kpi-tile {\n  border: 1px solid var(--risk-border);\n  border-radius: 14px;\n  background: #ffffff;\n  animation: slideUp .5s cubic-bezier(.4,0,.2,1) both;\n}\n\n.risk-theme .risk-kpi-grid .risk-kpi-tile:nth-child(1) { animation-delay: 0ms; }\n.risk-theme .risk-kpi-grid .risk-kpi-tile:nth-child(2) { animation-delay: 80ms; }\n.risk-theme .risk-kpi-grid .risk-kpi-tile:nth-child(3) { animation-delay: 160ms; }\n.risk-theme .risk-kpi-grid .risk-kpi-tile:nth-child(4) { animation-delay: 240ms; }\n.risk-theme .risk-kpi-grid .risk-kpi-tile:nth-child(5) { animation-delay: 320ms; }\n\n.risk-theme .risk-kpi-tile.risk-kpi-tile-primary {\n  border-color: #1d4ed8;\n  background: linear-gradient(135deg, #1D4ED8 0%, #1e40af 100%);\n  box-shadow: 0 8px 24px rgba(29, 78, 216, .35);\n}\n\n.risk-theme .risk-kpi-value {\n  font-size: 32px;\n  line-height: 1.1;\n  letter-spacing: -1.5px;\n  font-weight: 800;\n}\n\n.risk-theme .risk-progress-track {\n  overflow: hidden;\n  background: #dbe7f5;\n}\n\n.risk-theme .risk-progress-fill {\n  background: linear-gradient(90deg, var(--risk-primary) 0%, var(--risk-accent) 100%);\n}\n\n.risk-theme .risk-progress-circle-block {\n  width: fit-content;\n}\n\n.risk-theme .risk-progress-circle-shell {\n  display: inline-flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 0.35rem;\n}\n\n.risk-theme .risk-progress-circle-wrap {\n  position: relative;\n  display: inline-grid;\n  place-items: center;\n}\n\n.risk-theme .risk-progress-circle-svg {\n  width: 100%;\n  height: 100%;\n  transform: rotate(-90deg);\n}\n\n.risk-theme .risk-progress-circle-bg {\n  stroke: #dbe7f5;\n}\n\n.risk-theme .risk-progress-circle-value {\n  stroke: #1d4ed8;\n  stroke-linecap: round;\n  transition: stroke-dashoffset 0.25s ease;\n}\n\n.risk-theme .risk-progress-circle-center {\n  position: absolute;\n  font-size: 0.93rem;\n  font-weight: 800;\n  color: #1e40af;\n}\n\n.risk-theme .risk-progress-circle-meta {\n  max-width: 130px;\n  text-align: center;\n  font-size: 0.72rem;\n  line-height: 1.25;\n  color: #55647b;\n  font-weight: 600;\n}\n\n.risk-theme .risk-study-card {\n  position: relative;\n  overflow: hidden;\n  animation: slideUp .5s cubic-bezier(.4,0,.2,1) both;\n}\n\n.risk-theme .risk-study-grid .risk-study-card:nth-child(1) { animation-delay: 0ms; }\n.risk-theme .risk-study-grid .risk-study-card:nth-child(2) { animation-delay: 60ms; }\n.risk-theme .risk-study-grid .risk-study-card:nth-child(3) { animation-delay: 120ms; }\n.risk-theme .risk-study-grid .risk-study-card:nth-child(4) { animation-delay: 180ms; }\n.risk-theme .risk-study-grid .risk-study-card:nth-child(5) { animation-delay: 240ms; }\n.risk-theme .risk-study-grid .risk-study-card:nth-child(6) { animation-delay: 300ms; }\n\n.risk-theme .risk-study-card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 20px 40px rgba(15, 23, 42, .12), 0 0 0 1px rgba(30, 58, 95, .12);\n}\n\n.risk-theme .risk-study-card::before {\n  content: \"\";\n  position: absolute;\n  inset: 0 auto 0 0;\n  width: 4px;\n  background: linear-gradient(180deg, var(--risk-primary) 0%, var(--risk-accent) 100%);\n}\n\n.risk-theme .risk-study-card-headline-row {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;\n  align-items: start;\n  column-gap: 0.75rem;\n  row-gap: 0.5rem;\n}\n\n.risk-theme .risk-study-description {\n  display: -webkit-box;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n}\n\n.risk-theme .risk-study-meta-list {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.42rem;\n}\n\n.risk-theme .risk-study-meta-item {\n  display: inline-flex;\n  min-width: 0;\n  max-width: 100%;\n  align-items: center;\n  gap: 0.35rem;\n  border: 1px solid #dbe5f2;\n  border-radius: 999px;\n  background: #f8fbff;\n  padding: 0.28rem 0.62rem;\n  font-size: 0.73rem;\n  font-weight: 700;\n  color: #334155;\n}\n\n.risk-theme .risk-study-progress-band {\n  border: 1px solid #e2e8f0;\n  border-radius: 0.82rem;\n  background: #f8fafc;\n  padding: 0.5rem 0.65rem;\n}\n\n.risk-theme .risk-study-progress-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  font-size: 0.74rem;\n  font-weight: 800;\n}\n\n.risk-theme .risk-study-workshop-segments {\n  margin-top: 0.35rem;\n  display: grid;\n  grid-template-columns: repeat(5, minmax(0, 1fr));\n  gap: 0.34rem;\n}\n\n.risk-theme .risk-study-workshop-segment {\n  height: 8px;\n  border-radius: 999px;\n  border: 1px solid #cbd5e1;\n  background: #e2e8f0;\n}\n\n.risk-theme .risk-study-workshop-segment.risk-seg-termine {\n  border-color: #86efac;\n  background: #86efac;\n}\n\n.risk-theme .risk-study-workshop-segment.risk-seg-en_cours {\n  border-color: #93c5fd;\n  background: #93c5fd;\n}\n\n.risk-theme .risk-study-workshop-segment.risk-seg-a_valider {\n  border-color: #fcd34d;\n  background: #fcd34d;\n}\n\n.risk-theme .risk-study-workshop-segment.risk-seg-bloque {\n  border-color: #fca5a5;\n  background: #fca5a5;\n}\n\n.risk-theme .risk-study-progress-sub {\n  margin-top: 0.32rem;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  font-size: 0.68rem;\n  font-weight: 700;\n  color: #64748b;\n}\n\n.risk-theme .risk-workshop-card {\n  position: relative;\n  animation: slideUp .5s cubic-bezier(.4,0,.2,1) both;\n}\n\n.risk-theme .risk-workshop-card-modern {\n  border-top: 4px solid var(--risk-workshop-accent, #2563eb);\n}\n\n.risk-theme .risk-workshop-card-modern .risk-status-badge {\n  min-height: 1.68rem;\n  padding: 0.24rem 0.62rem;\n  font-size: 0.76rem;\n  gap: 0.32rem;\n}\n\n.risk-theme .risk-workshop-card-modern .risk-status-badge > span:first-child {\n  width: 0.32rem;\n  height: 0.32rem;\n}\n\n.risk-theme .risk-workshop-card-modern .risk-progress-circle-value {\n  stroke: var(--risk-workshop-accent, #2563eb);\n}\n\n.risk-theme .risk-workshop-card-modern .risk-progress-circle-center {\n  color: var(--risk-workshop-accent, #2563eb);\n}\n\n.risk-theme .risk-workshop-card-blocked {\n  opacity: 0.88;\n}\n\n.risk-theme .risk-workshop-grid .risk-workshop-card:nth-child(1) { animation-delay: 0ms; }\n.risk-theme .risk-workshop-grid .risk-workshop-card:nth-child(2) { animation-delay: 60ms; }\n.risk-theme .risk-workshop-grid .risk-workshop-card:nth-child(3) { animation-delay: 120ms; }\n.risk-theme .risk-workshop-grid .risk-workshop-card:nth-child(4) { animation-delay: 180ms; }\n.risk-theme .risk-workshop-grid .risk-workshop-card:nth-child(5) { animation-delay: 240ms; }\n\n.risk-theme .risk-workshop-card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 20px 40px rgba(15, 23, 42, .12), 0 0 0 1px rgba(30, 58, 95, .12);\n}\n\n.risk-theme .risk-workshop-card .risk-card-headline {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;\n  align-items: flex-start;\n  column-gap: 0.75rem;\n  row-gap: 0.5rem;\n}\n\n.risk-theme .risk-workshop-card .risk-card-headline > :first-child {\n  min-width: 0;\n}\n\n.risk-theme .risk-workshop-title {\n  display: -webkit-box;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n  font-size: 1.82rem;\n  line-height: 1.16;\n}\n\n.risk-theme .risk-workshop-card-modern .risk-workshop-title {\n  font-size: 1.08rem;\n  line-height: 1.24;\n}\n\n.risk-theme .risk-workshop-counter {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;\n  font-size: 0.82rem;\n  letter-spacing: 0.04em;\n  color: #64748b;\n}\n\n.risk-theme .risk-workshop-description {\n  display: -webkit-box;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n}\n\n.risk-theme .risk-workshop-card-modern .risk-workshop-description {\n  margin-top: 0.35rem;\n  font-size: 0.62rem;\n  line-height: 1.25;\n}\n\n.risk-theme .risk-workshop-divider {\n  height: 1px;\n  background: #e2e8f0;\n}\n\n.risk-theme .risk-workshop-kpi-grid {\n  display: grid;\n  flex: 1;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 0.4rem;\n}\n\n.risk-theme .risk-workshop-kpi-box {\n  min-height: 56px;\n  border: 1px solid #dbe2ee;\n  border-radius: 0.62rem;\n  background: #f8fafc;\n  padding: 0.4rem 0.5rem;\n}\n\n.risk-theme .risk-workshop-kpi-label {\n  display: block;\n  font-size: 0.58rem;\n  font-weight: 800;\n  letter-spacing: 0.01em;\n  text-transform: uppercase;\n  color: #64748b;\n  line-height: 1.1;\n}\n\n.risk-theme .risk-workshop-kpi-value {\n  margin-top: 0.18rem;\n  font-size: 0.95rem;\n  line-height: 1;\n  font-weight: 800;\n  color: #0f172a;\n}\n\n.risk-theme .risk-workshop-progress-col {\n  display: flex;\n  min-width: 78px;\n  flex-direction: column;\n  align-items: center;\n  gap: 0.28rem;\n}\n\n.risk-theme .risk-workshop-progress-col .risk-progress-circle-wrap {\n  width: 58px !important;\n  height: 58px !important;\n}\n\n.risk-theme .risk-workshop-progress-col .risk-progress-circle-center {\n  font-size: 0.74rem;\n}\n\n.risk-theme .risk-workshop-progress-col .risk-progress-circle-meta {\n  display: none;\n}\n\n.risk-theme .risk-workshop-open-hint {\n  font-size: 0.68rem;\n  font-weight: 700;\n  color: #64748b;\n  text-align: center;\n  line-height: 1.2;\n}\n\n.risk-theme .risk-workshop-card-modern .risk-workshop-open-hint {\n  display: none;\n}\n\n.risk-theme .risk-workshop-footer {\n  justify-content: space-between;\n  border-top: 1px dashed #e2e8f0;\n  padding-top: 0.62rem;\n  flex-wrap: nowrap;\n  align-items: center;\n}\n\n.risk-theme .risk-workshop-footer-progress {\n  flex: 0 0 auto;\n  display: inline-flex;\n  align-items: center;\n  justify-content: flex-end;\n  min-width: 70px;\n}\n\n.risk-theme .risk-workshop-footer-progress .risk-progress-circle-wrap {\n  width: 62px !important;\n  height: 62px !important;\n}\n\n.risk-theme .risk-workshop-footer-progress .risk-progress-circle-center {\n  font-size: 0.82rem;\n}\n\n.risk-theme .risk-workshop-footer-progress .risk-progress-circle-meta {\n  display: none;\n}\n\n.risk-theme .risk-inline-meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.4rem;\n}\n\n.risk-theme .risk-meta-pill {\n  border: 1px solid var(--risk-border);\n  border-radius: 999px;\n  background: #f8fbff;\n  padding: 0.22rem 0.58rem;\n  font-size: 0.71rem;\n  font-weight: 700;\n  color: #334155;\n}\n\n.risk-theme .risk-section-header {\n  border-bottom-color: #e2e8f0;\n  background: #ffffff;\n}\n\n.risk-theme .risk-status-badge {\n  display: inline-flex !important;\n  flex: 0 0 auto;\n  align-items: center;\n  justify-content: center;\n  width: auto;\n  max-width: max-content;\n  min-height: 2.15rem;\n  padding: 0.42rem 0.85rem;\n  border-radius: 999px;\n  align-self: flex-start;\n  white-space: nowrap;\n  line-height: 1;\n  backdrop-filter: saturate(130%);\n}\n\n.risk-theme .risk-workshop-card .risk-status-badge {\n  margin-left: 0;\n  justify-self: end;\n}\n\n.risk-theme .risk-modal-panel {\n  box-shadow: 0 32px 85px rgba(15, 23, 42, 0.28);\n}\n\n.risk-theme .risk-empty-state {\n  background-image: radial-gradient(circle at 10% 20%, rgba(29, 78, 216, 0.08), transparent 46%);\n}\n\n.risk-theme .risk-data-table table thead th {\n  position: sticky;\n  top: 0;\n  z-index: 1;\n  background: #f8fafc;\n  border-bottom: 1px solid #e2e8f0;\n}\n\n.risk-theme .risk-data-table table tbody tr:hover td {\n  background: #f8fbff;\n}\n\n.risk-theme .risk-cell-badge {\n  display: inline-flex;\n  align-items: center;\n  border-radius: 999px;\n  border: 1px solid transparent;\n  padding: 0.2rem 0.55rem;\n  font-size: 0.72rem;\n  font-weight: 700;\n  line-height: 1.1;\n  white-space: nowrap;\n}\n\n.risk-theme .risk-cell-badge.risk-cell-badge-neutral {\n  border-color: #e2e8f0;\n  background: #f1f5f9;\n  color: #475569;\n}\n\n.risk-theme .risk-cell-badge.risk-cell-badge-info {\n  border-color: #bfdbfe;\n  background: #dbeafe;\n  color: #1d4ed8;\n}\n\n.risk-theme .risk-cell-badge.risk-cell-badge-success {\n  border-color: #bbf7d0;\n  background: #dcfce7;\n  color: #166534;\n}\n\n.risk-theme .risk-cell-badge.risk-cell-badge-warning {\n  border-color: #fde68a;\n  background: #fef3c7;\n  color: #a16207;\n}\n\n.risk-theme .risk-cell-badge.risk-cell-badge-orange {\n  border-color: #fed7aa;\n  background: #ffedd5;\n  color: #c2410c;\n}\n\n.risk-theme .risk-cell-badge.risk-cell-badge-danger {\n  border-color: #fecaca;\n  background: #fee2e2;\n  color: #b91c1c;\n}\n\n.risk-theme .risk-cell-tag-list {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.25rem;\n}\n\n.risk-theme .risk-cell-tag {\n  display: inline-flex;\n  align-items: center;\n  border: 1px solid #bfdbfe;\n  border-radius: 999px;\n  background: #dbeafe;\n  color: #1d4ed8;\n  padding: 0.18rem 0.52rem;\n  font-size: 0.69rem;\n  font-weight: 700;\n  line-height: 1.1;\n}\n\n.risk-theme .risk-callout {\n  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);\n}\n\n.risk-theme .risk-step-nav {\n  border: 1px solid var(--risk-border);\n  border-radius: 1rem;\n  background: rgba(255, 255, 255, 0.95);\n  backdrop-filter: blur(8px);\n  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);\n}\n\n.risk-theme .risk-step-list {\n  display: flex;\n  flex-wrap: nowrap;\n  gap: 0.5rem;\n  overflow: visible;\n  padding-bottom: 0;\n}\n\n.risk-theme .risk-workshop-step-summary {\n  border: 1px solid #dbe7f5;\n  border-radius: 0.75rem;\n  background: #f8fbff;\n  padding: 0.52rem 0.62rem;\n}\n\n.risk-theme .risk-workshop-step-summary-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  font-size: 0.69rem;\n  font-weight: 800;\n  color: #475569;\n}\n\n.risk-theme .risk-workshop-step-summary-track {\n  margin-top: 0.34rem;\n  height: 6px;\n  width: 100%;\n  border-radius: 999px;\n  background: #dbe7f5;\n  overflow: hidden;\n}\n\n.risk-theme .risk-workshop-step-summary-fill {\n  display: block;\n  height: 6px;\n  border-radius: 999px;\n  background: linear-gradient(90deg, #1d4ed8 0%, #0ea5e9 100%);\n}\n\n.risk-theme .risk-step-btn {\n  display: flex;\n  width: auto;\n  min-width: 0;\n  flex: 1 1 0;\n  align-items: center;\n  white-space: normal;\n  line-height: 1.25;\n  transition: transform 0.16s ease, border-color 0.2s ease, background-color 0.2s ease;\n}\n\n.risk-theme .risk-step-btn:hover {\n  transform: translateY(-1px);\n}\n\n.risk-theme .risk-step-btn.risk-step-active {\n  border-color: var(--risk-primary);\n  background: linear-gradient(120deg, #1d4ed8 0%, #0ea5e9 100%);\n  color: #ffffff;\n  box-shadow: 0 8px 20px rgba(30, 64, 175, 0.28);\n}\n\n.risk-theme .risk-step-btn .risk-step-index {\n  border: 1px solid rgba(15, 23, 42, 0.1);\n  background: rgba(15, 23, 42, 0.03);\n}\n\n.risk-theme .risk-step-btn.risk-step-active .risk-step-index {\n  border-color: rgba(255, 255, 255, 0.35);\n  background: rgba(255, 255, 255, 0.18);\n}\n\n.risk-theme .risk-workshop-stepbar {\n  border: 1px solid #dbe7f5;\n  border-radius: 0.78rem;\n  background: #f8fbff;\n  padding: 0.52rem 0.66rem;\n}\n\n.risk-theme .risk-workshop-stepbar-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  font-size: 0.75rem;\n  font-weight: 700;\n  color: #475569;\n}\n\n.risk-theme .risk-workshop-stepbar-track {\n  margin-top: 0.38rem;\n  height: 8px;\n  width: 100%;\n  border-radius: 999px;\n  background: #dbe7f5;\n  overflow: hidden;\n}\n\n.risk-theme .risk-workshop-stepbar-fill {\n  display: block;\n  height: 8px;\n  border-radius: 999px;\n  background: linear-gradient(90deg, #1d4ed8 0%, #0ea5e9 100%);\n}\n\n.risk-theme .risk-floating-actions {\n  position: sticky;\n  top: 92px;\n  z-index: 26;\n}\n\n.risk-theme .risk-fade-up {\n  animation: riskFadeUp 0.24s ease both;\n}\n\n@keyframes slideUp {\n  from {\n    opacity: 0;\n    transform: translateY(16px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\n@keyframes fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(8px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\n@keyframes riskFadeUp {\n  from {\n    opacity: 0;\n    transform: translateY(7px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\n@media (max-width: 1420px) {\n  .risk-theme .risk-layout-study {\n    grid-template-columns: minmax(240px, 280px) minmax(0, 1fr);\n  }\n\n  .risk-theme .risk-layout-workshop {\n    grid-template-columns: minmax(230px, 280px) minmax(0, 1fr);\n  }\n\n  .risk-theme .risk-study-grid {\n    grid-template-columns: 1fr;\n  }\n\n  .risk-theme .risk-aside-rail {\n    display: none;\n  }\n}\n\n@media (max-width: 1150px) {\n  .risk-theme .risk-layout-portfolio,\n  .risk-theme .risk-layout-study,\n  .risk-theme .risk-layout-workshop {\n    grid-template-columns: 1fr;\n  }\n\n  .risk-theme .risk-workshop-grid {\n    grid-template-columns: 1fr;\n  }\n\n  .risk-theme .risk-sidebar-rail,\n  .risk-theme .risk-aside-rail,\n  .risk-theme .risk-step-rail,\n  .risk-theme .risk-topbar,\n  .risk-theme .risk-floating-actions {\n    position: static;\n  }\n}\n\n@media (min-width: 820px) {\n  .risk-theme .risk-page-header .risk-page-header-grid {\n    grid-template-columns: minmax(0, 1fr) auto;\n    align-items: start;\n    column-gap: 1rem;\n  }\n\n  .risk-theme .risk-page-header.risk-page-header-hero .risk-page-header-grid {\n    padding: 1.25rem 1.35rem;\n  }\n\n  .risk-theme .risk-page-header-actions {\n    width: auto;\n    flex-direction: row;\n    align-items: flex-start;\n    justify-content: flex-end;\n    flex-wrap: wrap;\n  }\n\n  .risk-theme .risk-page-header-actions > * {\n    width: auto;\n  }\n}\n\n@media (max-width: 760px) {\n  .risk-theme .risk-step-list {\n    flex-wrap: wrap;\n  }\n\n  .risk-theme .risk-step-btn {\n    flex: 1 1 calc(50% - 0.25rem);\n  }\n\n  .risk-theme .risk-study-card-headline-row {\n    grid-template-columns: 1fr;\n  }\n\n  .risk-theme .risk-workshop-card .risk-card-headline {\n    grid-template-columns: 1fr;\n  }\n\n  .risk-theme .risk-workshop-kpi-grid {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n\n  .risk-theme .risk-workshop-footer {\n    flex-wrap: wrap;\n  }\n\n  .risk-theme .risk-workshop-card .risk-status-badge {\n    justify-self: start;\n  }\n}\n";

function RiskThemeStyleInjector() {
  useEffect(() => {
    let style = document.getElementById(RISK_THEME_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = RISK_THEME_STYLE_ID;
      style.type = "text/css";
      style.textContent = RISK_THEME_CSS;
      document.head.appendChild(style);
    }

    return () => {
      const node = document.getElementById(RISK_THEME_STYLE_ID);
      if (node) node.remove();
    };
  }, []);

  return null;
}

const __risk_mitre = (() => {
// Auto-generated from MITRE ATT&CK Enterprise STIX dataset.
const MITRE_ENTERPRISE_TACTICS = [
  {
    "id": "TA0043",
    "name": "Reconnaissance",
    "shortName": "reconnaissance",
    "techniques": [
      "Gather Victim Identity Information (T1589)",
      "Credentials (T1589.001)",
      "Email Addresses (T1589.002)",
      "Employee Names (T1589.003)",
      "Gather Victim Network Information (T1590)",
      "Domain Properties (T1590.001)",
      "DNS (T1590.002)",
      "Network Trust Dependencies (T1590.003)",
      "Network Topology (T1590.004)",
      "IP Addresses (T1590.005)",
      "Network Security Appliances (T1590.006)",
      "Gather Victim Org Information (T1591)",
      "Determine Physical Locations (T1591.001)",
      "Business Relationships (T1591.002)",
      "Identify Business Tempo (T1591.003)",
      "Identify Roles (T1591.004)",
      "Gather Victim Host Information (T1592)",
      "Hardware (T1592.001)",
      "Software (T1592.002)",
      "Firmware (T1592.003)",
      "Client Configurations (T1592.004)",
      "Search Open Websites/Domains (T1593)",
      "Social Media (T1593.001)",
      "Search Engines (T1593.002)",
      "Code Repositories (T1593.003)",
      "Search Victim-Owned Websites (T1594)",
      "Active Scanning (T1595)",
      "Scanning IP Blocks (T1595.001)",
      "Vulnerability Scanning (T1595.002)",
      "Wordlist Scanning (T1595.003)",
      "Search Open Technical Databases (T1596)",
      "DNS/Passive DNS (T1596.001)",
      "WHOIS (T1596.002)",
      "Digital Certificates (T1596.003)",
      "CDNs (T1596.004)",
      "Scan Databases (T1596.005)",
      "Search Closed Sources (T1597)",
      "Threat Intel Vendors (T1597.001)",
      "Purchase Technical Data (T1597.002)",
      "Phishing for Information (T1598)",
      "Spearphishing Service (T1598.001)",
      "Spearphishing Attachment (T1598.002)",
      "Spearphishing Link (T1598.003)",
      "Spearphishing Voice (T1598.004)",
      "Search Threat Vendor Data (T1681)"
    ]
  },
  {
    "id": "TA0042",
    "name": "Resource Development",
    "shortName": "resource-development",
    "techniques": [
      "Acquire Infrastructure (T1583)",
      "Domains (T1583.001)",
      "DNS Server (T1583.002)",
      "Virtual Private Server (T1583.003)",
      "Server (T1583.004)",
      "Botnet (T1583.005)",
      "Web Services (T1583.006)",
      "Serverless (T1583.007)",
      "Malvertising (T1583.008)",
      "Compromise Infrastructure (T1584)",
      "Domains (T1584.001)",
      "DNS Server (T1584.002)",
      "Virtual Private Server (T1584.003)",
      "Server (T1584.004)",
      "Botnet (T1584.005)",
      "Web Services (T1584.006)",
      "Serverless (T1584.007)",
      "Network Devices (T1584.008)",
      "Establish Accounts (T1585)",
      "Social Media Accounts (T1585.001)",
      "Email Accounts (T1585.002)",
      "Cloud Accounts (T1585.003)",
      "Compromise Accounts (T1586)",
      "Social Media Accounts (T1586.001)",
      "Email Accounts (T1586.002)",
      "Cloud Accounts (T1586.003)",
      "Develop Capabilities (T1587)",
      "Malware (T1587.001)",
      "Code Signing Certificates (T1587.002)",
      "Digital Certificates (T1587.003)",
      "Exploits (T1587.004)",
      "Obtain Capabilities (T1588)",
      "Malware (T1588.001)",
      "Tool (T1588.002)",
      "Code Signing Certificates (T1588.003)",
      "Digital Certificates (T1588.004)",
      "Exploits (T1588.005)",
      "Vulnerabilities (T1588.006)",
      "Artificial Intelligence (T1588.007)",
      "Stage Capabilities (T1608)",
      "Upload Malware (T1608.001)",
      "Upload Tool (T1608.002)",
      "Install Digital Certificate (T1608.003)",
      "Drive-by Target (T1608.004)",
      "Link Target (T1608.005)",
      "SEO Poisoning (T1608.006)",
      "Acquire Access (T1650)"
    ]
  },
  {
    "id": "TA0001",
    "name": "Initial Access",
    "shortName": "initial-access",
    "techniques": [
      "Valid Accounts (T1078)",
      "Default Accounts (T1078.001)",
      "Domain Accounts (T1078.002)",
      "Local Accounts (T1078.003)",
      "Cloud Accounts (T1078.004)",
      "Replication Through Removable Media (T1091)",
      "External Remote Services (T1133)",
      "Drive-by Compromise (T1189)",
      "Exploit Public-Facing Application (T1190)",
      "Supply Chain Compromise (T1195)",
      "Compromise Software Dependencies and Development Tools (T1195.001)",
      "Compromise Software Supply Chain (T1195.002)",
      "Compromise Hardware Supply Chain (T1195.003)",
      "Trusted Relationship (T1199)",
      "Hardware Additions (T1200)",
      "Phishing (T1566)",
      "Spearphishing Attachment (T1566.001)",
      "Spearphishing Link (T1566.002)",
      "Spearphishing via Service (T1566.003)",
      "Spearphishing Voice (T1566.004)",
      "Content Injection (T1659)",
      "Wi-Fi Networks (T1669)"
    ]
  },
  {
    "id": "TA0002",
    "name": "Execution",
    "shortName": "execution",
    "techniques": [
      "Windows Management Instrumentation (T1047)",
      "Scheduled Task/Job (T1053)",
      "At (T1053.002)",
      "Cron (T1053.003)",
      "Scheduled Task (T1053.005)",
      "Systemd Timers (T1053.006)",
      "Container Orchestration Job (T1053.007)",
      "Command and Scripting Interpreter (T1059)",
      "PowerShell (T1059.001)",
      "AppleScript (T1059.002)",
      "Windows Command Shell (T1059.003)",
      "Unix Shell (T1059.004)",
      "Visual Basic (T1059.005)",
      "Python (T1059.006)",
      "JavaScript (T1059.007)",
      "Network Device CLI (T1059.008)",
      "Cloud API (T1059.009)",
      "AutoHotKey & AutoIT (T1059.010)",
      "Lua (T1059.011)",
      "Hypervisor CLI (T1059.012)",
      "Container CLI/API (T1059.013)",
      "Software Deployment Tools (T1072)",
      "Native API (T1106)",
      "Shared Modules (T1129)",
      "Exploitation for Client Execution (T1203)",
      "User Execution (T1204)",
      "Malicious Link (T1204.001)",
      "Malicious File (T1204.002)",
      "Malicious Image (T1204.003)",
      "Malicious Copy and Paste (T1204.004)",
      "Malicious Library (T1204.005)",
      "Inter-Process Communication (T1559)",
      "Component Object Model (T1559.001)",
      "Dynamic Data Exchange (T1559.002)",
      "XPC Services (T1559.003)",
      "System Services (T1569)",
      "Launchctl (T1569.001)",
      "Service Execution (T1569.002)",
      "Systemctl (T1569.003)",
      "Container Administration Command (T1609)",
      "Deploy Container (T1610)",
      "Serverless Execution (T1648)",
      "Cloud Administration Command (T1651)",
      "Input Injection (T1674)",
      "ESXi Administration Command (T1675)",
      "Poisoned Pipeline Execution (T1677)"
    ]
  },
  {
    "id": "TA0003",
    "name": "Persistence",
    "shortName": "persistence",
    "techniques": [
      "Boot or Logon Initialization Scripts (T1037)",
      "Logon Script (Windows) (T1037.001)",
      "Login Hook (T1037.002)",
      "Network Logon Script (T1037.003)",
      "RC Scripts (T1037.004)",
      "Startup Items (T1037.005)",
      "Scheduled Task/Job (T1053)",
      "At (T1053.002)",
      "Cron (T1053.003)",
      "Scheduled Task (T1053.005)",
      "Systemd Timers (T1053.006)",
      "Container Orchestration Job (T1053.007)",
      "Valid Accounts (T1078)",
      "Default Accounts (T1078.001)",
      "Domain Accounts (T1078.002)",
      "Local Accounts (T1078.003)",
      "Cloud Accounts (T1078.004)",
      "Account Manipulation (T1098)",
      "Additional Cloud Credentials (T1098.001)",
      "Additional Email Delegate Permissions (T1098.002)",
      "Additional Cloud Roles (T1098.003)",
      "SSH Authorized Keys (T1098.004)",
      "Device Registration (T1098.005)",
      "Additional Container Cluster Roles (T1098.006)",
      "Additional Local or Domain Groups (T1098.007)",
      "Modify Registry (T1112)",
      "External Remote Services (T1133)",
      "Create Account (T1136)",
      "Local Account (T1136.001)",
      "Domain Account (T1136.002)",
      "Cloud Account (T1136.003)",
      "Office Application Startup (T1137)",
      "Office Template Macros (T1137.001)",
      "Office Test (T1137.002)",
      "Outlook Forms (T1137.003)",
      "Outlook Home Page (T1137.004)",
      "Outlook Rules (T1137.005)",
      "Add-ins (T1137.006)",
      "Software Extensions (T1176)",
      "Browser Extensions (T1176.001)",
      "IDE Extensions (T1176.002)",
      "BITS Jobs (T1197)",
      "Traffic Signaling (T1205)",
      "Port Knocking (T1205.001)",
      "Socket Filters (T1205.002)",
      "Server Software Component (T1505)",
      "SQL Stored Procedures (T1505.001)",
      "Transport Agent (T1505.002)",
      "Web Shell (T1505.003)",
      "IIS Components (T1505.004)",
      "Terminal Services DLL (T1505.005)",
      "vSphere Installation Bundles (T1505.006)",
      "Implant Internal Image (T1525)",
      "Pre-OS Boot (T1542)",
      "System Firmware (T1542.001)",
      "Component Firmware (T1542.002)",
      "Bootkit (T1542.003)",
      "ROMMONkit (T1542.004)",
      "TFTP Boot (T1542.005)",
      "Create or Modify System Process (T1543)",
      "Launch Agent (T1543.001)",
      "Systemd Service (T1543.002)",
      "Windows Service (T1543.003)",
      "Launch Daemon (T1543.004)",
      "Container Service (T1543.005)",
      "Event Triggered Execution (T1546)",
      "Change Default File Association (T1546.001)",
      "Screensaver (T1546.002)",
      "Windows Management Instrumentation Event Subscription (T1546.003)",
      "Unix Shell Configuration Modification (T1546.004)",
      "Trap (T1546.005)",
      "LC_LOAD_DYLIB Addition (T1546.006)",
      "Netsh Helper DLL (T1546.007)",
      "Accessibility Features (T1546.008)",
      "AppCert DLLs (T1546.009)",
      "AppInit DLLs (T1546.010)",
      "Application Shimming (T1546.011)",
      "Image File Execution Options Injection (T1546.012)",
      "PowerShell Profile (T1546.013)",
      "Emond (T1546.014)",
      "Component Object Model Hijacking (T1546.015)",
      "Installer Packages (T1546.016)",
      "Udev Rules (T1546.017)",
      "Python Startup Hooks (T1546.018)",
      "Boot or Logon Autostart Execution (T1547)",
      "Registry Run Keys / Startup Folder (T1547.001)",
      "Authentication Package (T1547.002)",
      "Time Providers (T1547.003)",
      "Winlogon Helper DLL (T1547.004)",
      "Security Support Provider (T1547.005)",
      "Kernel Modules and Extensions (T1547.006)",
      "Re-opened Applications (T1547.007)",
      "LSASS Driver (T1547.008)",
      "Shortcut Modification (T1547.009)",
      "Port Monitors (T1547.010)",
      "Print Processors (T1547.012)",
      "XDG Autostart Entries (T1547.013)",
      "Active Setup (T1547.014)",
      "Login Items (T1547.015)",
      "Compromise Host Software Binary (T1554)",
      "Modify Authentication Process (T1556)",
      "Domain Controller Authentication (T1556.001)",
      "Password Filter DLL (T1556.002)",
      "Pluggable Authentication Modules (T1556.003)",
      "Network Device Authentication (T1556.004)",
      "Reversible Encryption (T1556.005)",
      "Multi-Factor Authentication (T1556.006)",
      "Hybrid Identity (T1556.007)",
      "Network Provider DLL (T1556.008)",
      "Conditional Access Policies (T1556.009)",
      "Hijack Execution Flow (T1574)",
      "DLL (T1574.001)",
      "Dylib Hijacking (T1574.004)",
      "Executable Installer File Permissions Weakness (T1574.005)",
      "Dynamic Linker Hijacking (T1574.006)",
      "Path Interception by PATH Environment Variable (T1574.007)",
      "Path Interception by Search Order Hijacking (T1574.008)",
      "Path Interception by Unquoted Path (T1574.009)",
      "Services File Permissions Weakness (T1574.010)",
      "Services Registry Permissions Weakness (T1574.011)",
      "COR_PROFILER (T1574.012)",
      "KernelCallbackTable (T1574.013)",
      "AppDomainManager (T1574.014)",
      "Power Settings (T1653)",
      "Exclusive Control (T1668)",
      "Cloud Application Integration (T1671)"
    ]
  },
  {
    "id": "TA0004",
    "name": "Privilege Escalation",
    "shortName": "privilege-escalation",
    "techniques": [
      "Boot or Logon Initialization Scripts (T1037)",
      "Logon Script (Windows) (T1037.001)",
      "Login Hook (T1037.002)",
      "Network Logon Script (T1037.003)",
      "RC Scripts (T1037.004)",
      "Startup Items (T1037.005)",
      "Scheduled Task/Job (T1053)",
      "At (T1053.002)",
      "Cron (T1053.003)",
      "Scheduled Task (T1053.005)",
      "Systemd Timers (T1053.006)",
      "Container Orchestration Job (T1053.007)",
      "Process Injection (T1055)",
      "Dynamic-link Library Injection (T1055.001)",
      "Portable Executable Injection (T1055.002)",
      "Thread Execution Hijacking (T1055.003)",
      "Asynchronous Procedure Call (T1055.004)",
      "Thread Local Storage (T1055.005)",
      "Ptrace System Calls (T1055.008)",
      "Proc Memory (T1055.009)",
      "Extra Window Memory Injection (T1055.011)",
      "Process Hollowing (T1055.012)",
      "Process Doppelgänging (T1055.013)",
      "VDSO Hijacking (T1055.014)",
      "ListPlanting (T1055.015)",
      "Exploitation for Privilege Escalation (T1068)",
      "Valid Accounts (T1078)",
      "Default Accounts (T1078.001)",
      "Domain Accounts (T1078.002)",
      "Local Accounts (T1078.003)",
      "Cloud Accounts (T1078.004)",
      "Account Manipulation (T1098)",
      "Additional Cloud Credentials (T1098.001)",
      "Additional Email Delegate Permissions (T1098.002)",
      "Additional Cloud Roles (T1098.003)",
      "SSH Authorized Keys (T1098.004)",
      "Device Registration (T1098.005)",
      "Additional Container Cluster Roles (T1098.006)",
      "Additional Local or Domain Groups (T1098.007)",
      "Access Token Manipulation (T1134)",
      "Token Impersonation/Theft (T1134.001)",
      "Create Process with Token (T1134.002)",
      "Make and Impersonate Token (T1134.003)",
      "Parent PID Spoofing (T1134.004)",
      "SID-History Injection (T1134.005)",
      "Domain or Tenant Policy Modification (T1484)",
      "Group Policy Modification (T1484.001)",
      "Trust Modification (T1484.002)",
      "Create or Modify System Process (T1543)",
      "Launch Agent (T1543.001)",
      "Systemd Service (T1543.002)",
      "Windows Service (T1543.003)",
      "Launch Daemon (T1543.004)",
      "Container Service (T1543.005)",
      "Event Triggered Execution (T1546)",
      "Change Default File Association (T1546.001)",
      "Screensaver (T1546.002)",
      "Windows Management Instrumentation Event Subscription (T1546.003)",
      "Unix Shell Configuration Modification (T1546.004)",
      "Trap (T1546.005)",
      "LC_LOAD_DYLIB Addition (T1546.006)",
      "Netsh Helper DLL (T1546.007)",
      "Accessibility Features (T1546.008)",
      "AppCert DLLs (T1546.009)",
      "AppInit DLLs (T1546.010)",
      "Application Shimming (T1546.011)",
      "Image File Execution Options Injection (T1546.012)",
      "PowerShell Profile (T1546.013)",
      "Emond (T1546.014)",
      "Component Object Model Hijacking (T1546.015)",
      "Installer Packages (T1546.016)",
      "Udev Rules (T1546.017)",
      "Python Startup Hooks (T1546.018)",
      "Boot or Logon Autostart Execution (T1547)",
      "Registry Run Keys / Startup Folder (T1547.001)",
      "Authentication Package (T1547.002)",
      "Time Providers (T1547.003)",
      "Winlogon Helper DLL (T1547.004)",
      "Security Support Provider (T1547.005)",
      "Kernel Modules and Extensions (T1547.006)",
      "Re-opened Applications (T1547.007)",
      "LSASS Driver (T1547.008)",
      "Shortcut Modification (T1547.009)",
      "Port Monitors (T1547.010)",
      "Print Processors (T1547.012)",
      "XDG Autostart Entries (T1547.013)",
      "Active Setup (T1547.014)",
      "Login Items (T1547.015)",
      "Abuse Elevation Control Mechanism (T1548)",
      "Setuid and Setgid (T1548.001)",
      "Bypass User Account Control (T1548.002)",
      "Sudo and Sudo Caching (T1548.003)",
      "Elevated Execution with Prompt (T1548.004)",
      "Temporary Elevated Cloud Access (T1548.005)",
      "TCC Manipulation (T1548.006)",
      "Hijack Execution Flow (T1574)",
      "DLL (T1574.001)",
      "Dylib Hijacking (T1574.004)",
      "Executable Installer File Permissions Weakness (T1574.005)",
      "Dynamic Linker Hijacking (T1574.006)",
      "Path Interception by PATH Environment Variable (T1574.007)",
      "Path Interception by Search Order Hijacking (T1574.008)",
      "Path Interception by Unquoted Path (T1574.009)",
      "Services File Permissions Weakness (T1574.010)",
      "Services Registry Permissions Weakness (T1574.011)",
      "COR_PROFILER (T1574.012)",
      "KernelCallbackTable (T1574.013)",
      "AppDomainManager (T1574.014)",
      "Escape to Host (T1611)"
    ]
  },
  {
    "id": "TA0005",
    "name": "Defense Evasion",
    "shortName": "defense-evasion",
    "techniques": [
      "Direct Volume Access (T1006)",
      "Rootkit (T1014)",
      "Obfuscated Files or Information (T1027)",
      "Binary Padding (T1027.001)",
      "Software Packing (T1027.002)",
      "Steganography (T1027.003)",
      "Compile After Delivery (T1027.004)",
      "Indicator Removal from Tools (T1027.005)",
      "HTML Smuggling (T1027.006)",
      "Dynamic API Resolution (T1027.007)",
      "Stripped Payloads (T1027.008)",
      "Embedded Payloads (T1027.009)",
      "Command Obfuscation (T1027.010)",
      "Fileless Storage (T1027.011)",
      "LNK Icon Smuggling (T1027.012)",
      "Encrypted/Encoded File (T1027.013)",
      "Polymorphic Code (T1027.014)",
      "Compression (T1027.015)",
      "Junk Code Insertion (T1027.016)",
      "SVG Smuggling (T1027.017)",
      "Masquerading (T1036)",
      "Invalid Code Signature (T1036.001)",
      "Right-to-Left Override (T1036.002)",
      "Rename Legitimate Utilities (T1036.003)",
      "Masquerade Task or Service (T1036.004)",
      "Match Legitimate Resource Name or Location (T1036.005)",
      "Space after Filename (T1036.006)",
      "Double File Extension (T1036.007)",
      "Masquerade File Type (T1036.008)",
      "Break Process Trees (T1036.009)",
      "Masquerade Account Name (T1036.010)",
      "Overwrite Process Arguments (T1036.011)",
      "Browser Fingerprint (T1036.012)",
      "Process Injection (T1055)",
      "Dynamic-link Library Injection (T1055.001)",
      "Portable Executable Injection (T1055.002)",
      "Thread Execution Hijacking (T1055.003)",
      "Asynchronous Procedure Call (T1055.004)",
      "Thread Local Storage (T1055.005)",
      "Ptrace System Calls (T1055.008)",
      "Proc Memory (T1055.009)",
      "Extra Window Memory Injection (T1055.011)",
      "Process Hollowing (T1055.012)",
      "Process Doppelgänging (T1055.013)",
      "VDSO Hijacking (T1055.014)",
      "ListPlanting (T1055.015)",
      "Indicator Removal (T1070)",
      "Clear Windows Event Logs (T1070.001)",
      "Clear Linux or Mac System Logs (T1070.002)",
      "Clear Command History (T1070.003)",
      "File Deletion (T1070.004)",
      "Network Share Connection Removal (T1070.005)",
      "Timestomp (T1070.006)",
      "Clear Network Connection History and Configurations (T1070.007)",
      "Clear Mailbox Data (T1070.008)",
      "Clear Persistence (T1070.009)",
      "Relocate Malware (T1070.010)",
      "Valid Accounts (T1078)",
      "Default Accounts (T1078.001)",
      "Domain Accounts (T1078.002)",
      "Local Accounts (T1078.003)",
      "Cloud Accounts (T1078.004)",
      "Modify Registry (T1112)",
      "Trusted Developer Utilities Proxy Execution (T1127)",
      "MSBuild (T1127.001)",
      "ClickOnce (T1127.002)",
      "JamPlus (T1127.003)",
      "Access Token Manipulation (T1134)",
      "Token Impersonation/Theft (T1134.001)",
      "Create Process with Token (T1134.002)",
      "Make and Impersonate Token (T1134.003)",
      "Parent PID Spoofing (T1134.004)",
      "SID-History Injection (T1134.005)",
      "Deobfuscate/Decode Files or Information (T1140)",
      "BITS Jobs (T1197)",
      "Indirect Command Execution (T1202)",
      "Traffic Signaling (T1205)",
      "Port Knocking (T1205.001)",
      "Socket Filters (T1205.002)",
      "Rogue Domain Controller (T1207)",
      "Exploitation for Defense Evasion (T1211)",
      "System Script Proxy Execution (T1216)",
      "PubPrn (T1216.001)",
      "SyncAppvPublishingServer (T1216.002)",
      "System Binary Proxy Execution (T1218)",
      "Compiled HTML File (T1218.001)",
      "Control Panel (T1218.002)",
      "CMSTP (T1218.003)",
      "InstallUtil (T1218.004)",
      "Mshta (T1218.005)",
      "Msiexec (T1218.007)",
      "Odbcconf (T1218.008)",
      "Regsvcs/Regasm (T1218.009)",
      "Regsvr32 (T1218.010)",
      "Rundll32 (T1218.011)",
      "Verclsid (T1218.012)",
      "Mavinject (T1218.013)",
      "MMC (T1218.014)",
      "Electron Applications (T1218.015)",
      "XSL Script Processing (T1220)",
      "Template Injection (T1221)",
      "File and Directory Permissions Modification (T1222)",
      "Windows File and Directory Permissions Modification (T1222.001)",
      "Linux and Mac File and Directory Permissions Modification (T1222.002)",
      "Execution Guardrails (T1480)",
      "Environmental Keying (T1480.001)",
      "Mutual Exclusion (T1480.002)",
      "Domain or Tenant Policy Modification (T1484)",
      "Group Policy Modification (T1484.001)",
      "Trust Modification (T1484.002)",
      "Virtualization/Sandbox Evasion (T1497)",
      "System Checks (T1497.001)",
      "User Activity Based Checks (T1497.002)",
      "Time Based Checks (T1497.003)",
      "Unused/Unsupported Cloud Regions (T1535)",
      "Pre-OS Boot (T1542)",
      "System Firmware (T1542.001)",
      "Component Firmware (T1542.002)",
      "Bootkit (T1542.003)",
      "ROMMONkit (T1542.004)",
      "TFTP Boot (T1542.005)",
      "Abuse Elevation Control Mechanism (T1548)",
      "Setuid and Setgid (T1548.001)",
      "Bypass User Account Control (T1548.002)",
      "Sudo and Sudo Caching (T1548.003)",
      "Elevated Execution with Prompt (T1548.004)",
      "Temporary Elevated Cloud Access (T1548.005)",
      "TCC Manipulation (T1548.006)",
      "Use Alternate Authentication Material (T1550)",
      "Application Access Token (T1550.001)",
      "Pass the Hash (T1550.002)",
      "Pass the Ticket (T1550.003)",
      "Web Session Cookie (T1550.004)",
      "Subvert Trust Controls (T1553)",
      "Gatekeeper Bypass (T1553.001)",
      "Code Signing (T1553.002)",
      "SIP and Trust Provider Hijacking (T1553.003)",
      "Install Root Certificate (T1553.004)",
      "Mark-of-the-Web Bypass (T1553.005)",
      "Code Signing Policy Modification (T1553.006)",
      "Modify Authentication Process (T1556)",
      "Domain Controller Authentication (T1556.001)",
      "Password Filter DLL (T1556.002)",
      "Pluggable Authentication Modules (T1556.003)",
      "Network Device Authentication (T1556.004)",
      "Reversible Encryption (T1556.005)",
      "Multi-Factor Authentication (T1556.006)",
      "Hybrid Identity (T1556.007)",
      "Network Provider DLL (T1556.008)",
      "Conditional Access Policies (T1556.009)",
      "Impair Defenses (T1562)",
      "Disable or Modify Tools (T1562.001)",
      "Disable Windows Event Logging (T1562.002)",
      "Impair Command History Logging (T1562.003)",
      "Disable or Modify System Firewall (T1562.004)",
      "Indicator Blocking (T1562.006)",
      "Disable or Modify Cloud Firewall (T1562.007)",
      "Disable or Modify Cloud Logs (T1562.008)",
      "Safe Mode Boot (T1562.009)",
      "Downgrade Attack (T1562.010)",
      "Spoof Security Alerting (T1562.011)",
      "Disable or Modify Linux Audit System (T1562.012)",
      "Disable or Modify Network Device Firewall (T1562.013)",
      "Hide Artifacts (T1564)",
      "Hidden Files and Directories (T1564.001)",
      "Hidden Users (T1564.002)",
      "Hidden Window (T1564.003)",
      "NTFS File Attributes (T1564.004)",
      "Hidden File System (T1564.005)",
      "Run Virtual Instance (T1564.006)",
      "VBA Stomping (T1564.007)",
      "Email Hiding Rules (T1564.008)",
      "Resource Forking (T1564.009)",
      "Process Argument Spoofing (T1564.010)",
      "Ignore Process Interrupts (T1564.011)",
      "File/Path Exclusions (T1564.012)",
      "Bind Mounts (T1564.013)",
      "Extended Attributes (T1564.014)",
      "Hijack Execution Flow (T1574)",
      "DLL (T1574.001)",
      "Dylib Hijacking (T1574.004)",
      "Executable Installer File Permissions Weakness (T1574.005)",
      "Dynamic Linker Hijacking (T1574.006)",
      "Path Interception by PATH Environment Variable (T1574.007)",
      "Path Interception by Search Order Hijacking (T1574.008)",
      "Path Interception by Unquoted Path (T1574.009)",
      "Services File Permissions Weakness (T1574.010)",
      "Services Registry Permissions Weakness (T1574.011)",
      "COR_PROFILER (T1574.012)",
      "KernelCallbackTable (T1574.013)",
      "AppDomainManager (T1574.014)",
      "Modify Cloud Compute Infrastructure (T1578)",
      "Create Snapshot (T1578.001)",
      "Create Cloud Instance (T1578.002)",
      "Delete Cloud Instance (T1578.003)",
      "Revert Cloud Instance (T1578.004)",
      "Modify Cloud Compute Configurations (T1578.005)",
      "Network Boundary Bridging (T1599)",
      "Network Address Translation Traversal (T1599.001)",
      "Weaken Encryption (T1600)",
      "Reduce Key Space (T1600.001)",
      "Disable Crypto Hardware (T1600.002)",
      "Modify System Image (T1601)",
      "Patch System Image (T1601.001)",
      "Downgrade System Image (T1601.002)",
      "Deploy Container (T1610)",
      "Build Image on Host (T1612)",
      "Reflective Code Loading (T1620)",
      "Debugger Evasion (T1622)",
      "Plist File Modification (T1647)",
      "Impersonation (T1656)",
      "Modify Cloud Resource Hierarchy (T1666)",
      "Email Spoofing (T1672)",
      "Delay Execution (T1678)",
      "Selective Exclusion (T1679)"
    ]
  },
  {
    "id": "TA0006",
    "name": "Credential Access",
    "shortName": "credential-access",
    "techniques": [
      "OS Credential Dumping (T1003)",
      "LSASS Memory (T1003.001)",
      "Security Account Manager (T1003.002)",
      "NTDS (T1003.003)",
      "LSA Secrets (T1003.004)",
      "Cached Domain Credentials (T1003.005)",
      "DCSync (T1003.006)",
      "Proc Filesystem (T1003.007)",
      "/etc/passwd and /etc/shadow (T1003.008)",
      "Network Sniffing (T1040)",
      "Input Capture (T1056)",
      "Keylogging (T1056.001)",
      "GUI Input Capture (T1056.002)",
      "Web Portal Capture (T1056.003)",
      "Credential API Hooking (T1056.004)",
      "Brute Force (T1110)",
      "Password Guessing (T1110.001)",
      "Password Cracking (T1110.002)",
      "Password Spraying (T1110.003)",
      "Credential Stuffing (T1110.004)",
      "Multi-Factor Authentication Interception (T1111)",
      "Forced Authentication (T1187)",
      "Exploitation for Credential Access (T1212)",
      "Steal Application Access Token (T1528)",
      "Steal Web Session Cookie (T1539)",
      "Unsecured Credentials (T1552)",
      "Credentials In Files (T1552.001)",
      "Credentials in Registry (T1552.002)",
      "Shell History (T1552.003)",
      "Private Keys (T1552.004)",
      "Cloud Instance Metadata API (T1552.005)",
      "Group Policy Preferences (T1552.006)",
      "Container API (T1552.007)",
      "Chat Messages (T1552.008)",
      "Credentials from Password Stores (T1555)",
      "Keychain (T1555.001)",
      "Securityd Memory (T1555.002)",
      "Credentials from Web Browsers (T1555.003)",
      "Windows Credential Manager (T1555.004)",
      "Password Managers (T1555.005)",
      "Cloud Secrets Management Stores (T1555.006)",
      "Modify Authentication Process (T1556)",
      "Domain Controller Authentication (T1556.001)",
      "Password Filter DLL (T1556.002)",
      "Pluggable Authentication Modules (T1556.003)",
      "Network Device Authentication (T1556.004)",
      "Reversible Encryption (T1556.005)",
      "Multi-Factor Authentication (T1556.006)",
      "Hybrid Identity (T1556.007)",
      "Network Provider DLL (T1556.008)",
      "Conditional Access Policies (T1556.009)",
      "Adversary-in-the-Middle (T1557)",
      "LLMNR/NBT-NS Poisoning and SMB Relay (T1557.001)",
      "ARP Cache Poisoning (T1557.002)",
      "DHCP Spoofing (T1557.003)",
      "Evil Twin (T1557.004)",
      "Steal or Forge Kerberos Tickets (T1558)",
      "Golden Ticket (T1558.001)",
      "Silver Ticket (T1558.002)",
      "Kerberoasting (T1558.003)",
      "AS-REP Roasting (T1558.004)",
      "Ccache Files (T1558.005)",
      "Forge Web Credentials (T1606)",
      "Web Cookies (T1606.001)",
      "SAML Tokens (T1606.002)",
      "Multi-Factor Authentication Request Generation (T1621)",
      "Steal or Forge Authentication Certificates (T1649)"
    ]
  },
  {
    "id": "TA0007",
    "name": "Discovery",
    "shortName": "discovery",
    "techniques": [
      "System Service Discovery (T1007)",
      "Application Window Discovery (T1010)",
      "Query Registry (T1012)",
      "System Network Configuration Discovery (T1016)",
      "Internet Connection Discovery (T1016.001)",
      "Wi-Fi Discovery (T1016.002)",
      "Remote System Discovery (T1018)",
      "System Owner/User Discovery (T1033)",
      "Network Sniffing (T1040)",
      "Network Service Discovery (T1046)",
      "System Network Connections Discovery (T1049)",
      "Process Discovery (T1057)",
      "Permission Groups Discovery (T1069)",
      "Local Groups (T1069.001)",
      "Domain Groups (T1069.002)",
      "Cloud Groups (T1069.003)",
      "System Information Discovery (T1082)",
      "File and Directory Discovery (T1083)",
      "Account Discovery (T1087)",
      "Local Account (T1087.001)",
      "Domain Account (T1087.002)",
      "Email Account (T1087.003)",
      "Cloud Account (T1087.004)",
      "Peripheral Device Discovery (T1120)",
      "System Time Discovery (T1124)",
      "Network Share Discovery (T1135)",
      "Password Policy Discovery (T1201)",
      "Browser Information Discovery (T1217)",
      "Domain Trust Discovery (T1482)",
      "Virtualization/Sandbox Evasion (T1497)",
      "System Checks (T1497.001)",
      "User Activity Based Checks (T1497.002)",
      "Time Based Checks (T1497.003)",
      "Software Discovery (T1518)",
      "Security Software Discovery (T1518.001)",
      "Backup Software Discovery (T1518.002)",
      "Cloud Service Discovery (T1526)",
      "Cloud Service Dashboard (T1538)",
      "Cloud Infrastructure Discovery (T1580)",
      "Container and Resource Discovery (T1613)",
      "System Location Discovery (T1614)",
      "System Language Discovery (T1614.001)",
      "Group Policy Discovery (T1615)",
      "Cloud Storage Object Discovery (T1619)",
      "Debugger Evasion (T1622)",
      "Device Driver Discovery (T1652)",
      "Log Enumeration (T1654)",
      "Virtual Machine Discovery (T1673)",
      "Local Storage Discovery (T1680)"
    ]
  },
  {
    "id": "TA0008",
    "name": "Lateral Movement",
    "shortName": "lateral-movement",
    "techniques": [
      "Remote Services (T1021)",
      "Remote Desktop Protocol (T1021.001)",
      "SMB/Windows Admin Shares (T1021.002)",
      "Distributed Component Object Model (T1021.003)",
      "SSH (T1021.004)",
      "VNC (T1021.005)",
      "Windows Remote Management (T1021.006)",
      "Cloud Services (T1021.007)",
      "Direct Cloud VM Connections (T1021.008)",
      "Software Deployment Tools (T1072)",
      "Taint Shared Content (T1080)",
      "Replication Through Removable Media (T1091)",
      "Exploitation of Remote Services (T1210)",
      "Internal Spearphishing (T1534)",
      "Use Alternate Authentication Material (T1550)",
      "Application Access Token (T1550.001)",
      "Pass the Hash (T1550.002)",
      "Pass the Ticket (T1550.003)",
      "Web Session Cookie (T1550.004)",
      "Remote Service Session Hijacking (T1563)",
      "SSH Hijacking (T1563.001)",
      "RDP Hijacking (T1563.002)",
      "Lateral Tool Transfer (T1570)"
    ]
  },
  {
    "id": "TA0009",
    "name": "Collection",
    "shortName": "collection",
    "techniques": [
      "Data from Local System (T1005)",
      "Data from Removable Media (T1025)",
      "Data from Network Shared Drive (T1039)",
      "Input Capture (T1056)",
      "Keylogging (T1056.001)",
      "GUI Input Capture (T1056.002)",
      "Web Portal Capture (T1056.003)",
      "Credential API Hooking (T1056.004)",
      "Data Staged (T1074)",
      "Local Data Staging (T1074.001)",
      "Remote Data Staging (T1074.002)",
      "Screen Capture (T1113)",
      "Email Collection (T1114)",
      "Local Email Collection (T1114.001)",
      "Remote Email Collection (T1114.002)",
      "Email Forwarding Rule (T1114.003)",
      "Clipboard Data (T1115)",
      "Automated Collection (T1119)",
      "Audio Capture (T1123)",
      "Video Capture (T1125)",
      "Browser Session Hijacking (T1185)",
      "Data from Information Repositories (T1213)",
      "Confluence (T1213.001)",
      "Sharepoint (T1213.002)",
      "Code Repositories (T1213.003)",
      "Customer Relationship Management Software (T1213.004)",
      "Messaging Applications (T1213.005)",
      "Databases (T1213.006)",
      "Data from Cloud Storage (T1530)",
      "Adversary-in-the-Middle (T1557)",
      "LLMNR/NBT-NS Poisoning and SMB Relay (T1557.001)",
      "ARP Cache Poisoning (T1557.002)",
      "DHCP Spoofing (T1557.003)",
      "Evil Twin (T1557.004)",
      "Archive Collected Data (T1560)",
      "Archive via Utility (T1560.001)",
      "Archive via Library (T1560.002)",
      "Archive via Custom Method (T1560.003)",
      "Data from Configuration Repository (T1602)",
      "SNMP (MIB Dump) (T1602.001)",
      "Network Device Configuration Dump (T1602.002)"
    ]
  },
  {
    "id": "TA0011",
    "name": "Command and Control",
    "shortName": "command-and-control",
    "techniques": [
      "Data Obfuscation (T1001)",
      "Junk Data (T1001.001)",
      "Steganography (T1001.002)",
      "Protocol or Service Impersonation (T1001.003)",
      "Fallback Channels (T1008)",
      "Application Layer Protocol (T1071)",
      "Web Protocols (T1071.001)",
      "File Transfer Protocols (T1071.002)",
      "Mail Protocols (T1071.003)",
      "DNS (T1071.004)",
      "Publish/Subscribe Protocols (T1071.005)",
      "Proxy (T1090)",
      "Internal Proxy (T1090.001)",
      "External Proxy (T1090.002)",
      "Multi-hop Proxy (T1090.003)",
      "Domain Fronting (T1090.004)",
      "Communication Through Removable Media (T1092)",
      "Non-Application Layer Protocol (T1095)",
      "Web Service (T1102)",
      "Dead Drop Resolver (T1102.001)",
      "Bidirectional Communication (T1102.002)",
      "One-Way Communication (T1102.003)",
      "Multi-Stage Channels (T1104)",
      "Ingress Tool Transfer (T1105)",
      "Data Encoding (T1132)",
      "Standard Encoding (T1132.001)",
      "Non-Standard Encoding (T1132.002)",
      "Traffic Signaling (T1205)",
      "Port Knocking (T1205.001)",
      "Socket Filters (T1205.002)",
      "Remote Access Tools (T1219)",
      "IDE Tunneling (T1219.001)",
      "Remote Desktop Software (T1219.002)",
      "Remote Access Hardware (T1219.003)",
      "Dynamic Resolution (T1568)",
      "Fast Flux DNS (T1568.001)",
      "Domain Generation Algorithms (T1568.002)",
      "DNS Calculation (T1568.003)",
      "Non-Standard Port (T1571)",
      "Protocol Tunneling (T1572)",
      "Encrypted Channel (T1573)",
      "Symmetric Cryptography (T1573.001)",
      "Asymmetric Cryptography (T1573.002)",
      "Content Injection (T1659)",
      "Hide Infrastructure (T1665)"
    ]
  },
  {
    "id": "TA0010",
    "name": "Exfiltration",
    "shortName": "exfiltration",
    "techniques": [
      "Exfiltration Over Other Network Medium (T1011)",
      "Exfiltration Over Bluetooth (T1011.001)",
      "Automated Exfiltration (T1020)",
      "Traffic Duplication (T1020.001)",
      "Scheduled Transfer (T1029)",
      "Data Transfer Size Limits (T1030)",
      "Exfiltration Over C2 Channel (T1041)",
      "Exfiltration Over Alternative Protocol (T1048)",
      "Exfiltration Over Symmetric Encrypted Non-C2 Protocol (T1048.001)",
      "Exfiltration Over Asymmetric Encrypted Non-C2 Protocol (T1048.002)",
      "Exfiltration Over Unencrypted Non-C2 Protocol (T1048.003)",
      "Exfiltration Over Physical Medium (T1052)",
      "Exfiltration over USB (T1052.001)",
      "Transfer Data to Cloud Account (T1537)",
      "Exfiltration Over Web Service (T1567)",
      "Exfiltration to Code Repository (T1567.001)",
      "Exfiltration to Cloud Storage (T1567.002)",
      "Exfiltration to Text Storage Sites (T1567.003)",
      "Exfiltration Over Webhook (T1567.004)"
    ]
  },
  {
    "id": "TA0040",
    "name": "Impact",
    "shortName": "impact",
    "techniques": [
      "Data Destruction (T1485)",
      "Lifecycle-Triggered Deletion (T1485.001)",
      "Data Encrypted for Impact (T1486)",
      "Service Stop (T1489)",
      "Inhibit System Recovery (T1490)",
      "Defacement (T1491)",
      "Internal Defacement (T1491.001)",
      "External Defacement (T1491.002)",
      "Firmware Corruption (T1495)",
      "Resource Hijacking (T1496)",
      "Compute Hijacking (T1496.001)",
      "Bandwidth Hijacking (T1496.002)",
      "SMS Pumping (T1496.003)",
      "Cloud Service Hijacking (T1496.004)",
      "Network Denial of Service (T1498)",
      "Direct Network Flood (T1498.001)",
      "Reflection Amplification (T1498.002)",
      "Endpoint Denial of Service (T1499)",
      "OS Exhaustion Flood (T1499.001)",
      "Service Exhaustion Flood (T1499.002)",
      "Application Exhaustion Flood (T1499.003)",
      "Application or System Exploitation (T1499.004)",
      "System Shutdown/Reboot (T1529)",
      "Account Access Removal (T1531)",
      "Disk Wipe (T1561)",
      "Disk Content Wipe (T1561.001)",
      "Disk Structure Wipe (T1561.002)",
      "Data Manipulation (T1565)",
      "Stored Data Manipulation (T1565.001)",
      "Transmitted Data Manipulation (T1565.002)",
      "Runtime Data Manipulation (T1565.003)",
      "Financial Theft (T1657)",
      "Email Bombing (T1667)"
    ]
  }
];

  return { MITRE_ENTERPRISE_TACTICS };
})();

const { MITRE_ENTERPRISE_TACTICS } = __risk_mitre;

const __risk_model = (() => {
const STORAGE_PREFIX = "smsi_risk_studies_v1";
const STORAGE_KEY = STORAGE_PREFIX;
const LEGACY_STORAGE_KEY = "ebios_rm_pro_v3";

function normalizeStringId(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function toPositiveInteger(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeActor(actor) {
  const source = actor || {};
  const userId = normalizeStringId(source.id ?? source.Id ?? source.userId ?? source.UserId, "anonymous");
  const societeId = toPositiveInteger(source.societeId ?? source.SocieteId ?? source.societe?.id ?? source.Societe?.Id);
  return {
    userId,
    societeId: societeId ?? "na",
  };
}

function buildRiskStorageKey(actor) {
  const scope = normalizeActor(actor);
  return `${STORAGE_PREFIX}::${scope.userId}::${scope.societeId}`;
}

function readStoredActor() {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getCurrentRiskStorageKey() {
  return buildRiskStorageKey(readStoredActor());
}

function listRiskStorageKeys() {
  if (typeof localStorage === "undefined") return [];
  return Object.keys(localStorage).filter((key) => key.startsWith(`${STORAGE_PREFIX}::`));
}

function isAnonymousStorageKey(key) {
  return key.includes("::anonymous::");
}

const WORKSHOP_STATUS_OPTIONS = [
  { value: "non_evalue", label: "Non evalue" },
  { value: "en_cours", label: "En cours" },
  { value: "a_valider", label: "A valider" },
  { value: "termine", label: "Termine" },
];

const WORKSHOP_META = [
  {
    id: 1,
    short: "Cadrage",
    title: "Atelier 1 - Cadrage et socle de securite",
    description: "Structurer le contexte, les valeurs metier et les evenements redoutes.",
    steps: [
      { id: "team", label: "Equipe et Responsabilites" },
      { id: "context", label: "Contexte de l'etude" },
      { id: "missions", label: "Missions et Valeurs Metier" },
      { id: "assets", label: "Biens supports" },
      { id: "feared", label: "Evenements redoutes" },
      { id: "iso", label: "Controles ISO 27001:2022" },
    ],
  },
  {
    id: 2,
    short: "Sources",
    title: "Atelier 2 - Sources de risque",
    description: "Qualifier les sources, objectifs vises et couples SR/OV.",
    steps: [
      { id: "sources", label: "Caracterisation des Sources de Risque" },
      { id: "pairs", label: "Identification des couples" },
      { id: "matrix", label: "Tableau de Reference (Pertinence)" },
    ],
  },
  {
    id: 3,
    short: "Strategique",
    title: "Atelier 3 - Scenarios strategiques",
    description: "Analyser les parties prenantes et traiter les risques strategiques.",
    steps: [
      { id: "stakeholders", label: "Parties prenantes" },
      { id: "strategic", label: "Scenarios strategiques" },
      { id: "strategic_treat", label: "Traitement des risques strategiques" },
      { id: "stakeholder_matrix", label: "Matrice de Criticite des Parties Prenantes" },
      { id: "threat_zones", label: "Zones de menace des parties prenantes" },
    ],
  },
  {
    id: 4,
    short: "Operationnel",
    title: "Atelier 4 - Scenarios operationnels",
    description: "Qualifier vraisemblance, modes operatoires et scenarios operationnels.",
    steps: [
      { id: "likelihood_scale", label: "Echelle de calcul de vraisemblance" },
      { id: "op_modes", label: "Modes operatoires" },
      { id: "op_scenarios", label: "Scenarios operationnels" },
    ],
  },
  {
    id: 5,
    short: "Traitement",
    title: "Atelier 5 - Traitement du risque",
    description: "Piloter le registre des risques, mesures et residuels.",
    steps: [
      { id: "risk_register", label: "Registre des Risques" },
      { id: "risk_map", label: "Matrice de Risque / Cartographie" },
      { id: "criteria", label: "Tableau des Criteres de Traitement" },
      { id: "residual_matrix", label: "Matrice des Risques Residuels" },
      { id: "measures", label: "Tableau des Mesures de Securite" },
      { id: "governance", label: "Gouvernance & Anticipation" },
      { id: "protection", label: "Protection" },
      { id: "defense", label: "Defense" },
      { id: "resilience", label: "Resilience" },
      { id: "conformite", label: "Conformite" },
      { id: "residual_form", label: "Risques residuels" },
    ],
  },
];

const G_LABELS = { 1: "Mineure", 2: "Significative", 3: "Grave", 4: "Critique" };
const V_LABELS = { 1: "Minimal", 2: "Significatif", 3: "Fort", 4: "Maximal" };

const MEASURE_CATEGORIES = ["Gouvernance", "Protection", "Defense", "Resilience", "Conformite"];

const RISK_ENTRY_STATUS_OPTIONS = [
  { value: "ouvert", label: "Ouvert" },
  { value: "en_traitement", label: "En traitement" },
  { value: "traite", label: "Traite" },
  { value: "accepte", label: "Accepte" },
];

const RISK_ENTRY_STATUS_LABELS = Object.fromEntries(
  RISK_ENTRY_STATUS_OPTIONS.map((item) => [item.value, item.label]),
);

const MITRE_TACTICS = MITRE_ENTERPRISE_TACTICS;

const ANSSI_BASE = {
  guideTitle: "Guide methodologique EBIOS RM",
  guideDescription: "Methode ANSSI en 5 ateliers pour l'analyse des risques cyber. Conforme aux recommandations de l'ANSSI.",
  sources: [
    "Etat etranger / Officine specialisee",
    "Crime organise / Cybercriminel",
    "Concurrent / Hacktiviste",
    "Attaquant interne / Amateur",
  ],
  objectifs: [
    "Espionnage / Pre-positionnement",
    "Destabilisation / Entrave",
    "Lucratif / Atteinte d'image",
    "Sabotage / Chantage",
  ],
  references: ["ISO 27001", "NIST CSF", "RGPD", "NIS2", "SecNumCloud", "HDS", "DORA", "SOC2"],
  gravityScale: [
    { level: "G1", label: "Mineure", tone: "emerald" },
    { level: "G2", label: "Significative", tone: "amber" },
    { level: "G3", label: "Grave", tone: "orange" },
    { level: "G4", label: "Critique", tone: "red" },
  ],
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

function riskLevel(gravity, likelihood) {
  const score = Number(gravity || 0) * Number(likelihood || 0);
  if (score <= 2) return { label: "Faible", cls: "lvl-1", level: 1, score };
  if (score <= 6) return { label: "Moyen", cls: "lvl-2", level: 2, score };
  if (score <= 9) return { label: "Eleve", cls: "lvl-3", level: 3, score };
  return { label: "Critique", cls: "lvl-4", level: 4, score };
}

function createEmptyStudy(meta = {}) {
  return {
    id: uid(),
    name: meta.name || "Nouvelle etude",
    organization: meta.organization || "",
    description: meta.description || "",
    perimeter: meta.perimeter || "",
    author: meta.author || "",
    createdAt: nowDate(),
    updatedAt: nowDate(),
    workshopStatuses: { 1: null, 2: null, 3: null, 4: null, 5: null },
    workshop1: {
      team: [],
      context: {
        description: "",
        perimeter: "",
        environment: "",
        hypotheses: "",
        constraints: "",
        general: "",
        regulatory: "",
        threats: "",
        assumptions: "",
      },
      missions: [],
      businessValues: [],
      supportingAssets: [],
      fearedEvents: [],
      isoControls: [],
    },
    workshop2: {
      riskSources: [],
      targetObjectives: [],
      sourceObjectivePairs: [],
    },
    workshop3: {
      stakeholders: [],
      threatZones: [],
      strategicScenarios: [],
      treatments: [],
    },
    workshop4: {
      operationalModes: [],
      operationalScenarios: [],
    },
    workshop5: {
      riskEntries: [],
      measures: [],
      residualRisks: [],
      soa: [],
    },
  };
}

function createDemoStudies() {
  const base = createEmptyStudy({
    name: "Certification ISO 27001",
    organization: "TechCorp SA",
    description: "Analyse des risques cyber pour le perimetre SI critique.",
    perimeter: "Consultant - SI RH et infrastructure cloud",
    author: "Marie Dupont",
  });

  base.workshop1.team = [
    { id: uid(), role: "RSSI", name: "Marie Dupont", responsibility: "Pilotage EBIOS", contact: "m.dupont@techcorp.fr" },
    { id: uid(), role: "Consultant", name: "Jean Martin", responsibility: "Validation architecture", contact: "j.martin@techcorp.fr" },
  ];
  const missionId = uid();
  const valueId = uid();
  const sourceId = uid();
  const objectiveId = uid();
  const pairId = uid();
  const stakeholderId = uid();
  const strategicId = uid();
  const opModeId = uid();
  const opScenarioId = uid();
  const riskEntryId = uid();

  base.workshop1.missions = [{ id: missionId, name: "Production SaaS", description: "Developpement et exploitation" }];
  base.workshop1.businessValues = [{ id: valueId, missionId, name: "Donnees clients RH", type: "Donnees", description: "Donnees personnelles critiques" }];
  base.workshop1.supportingAssets = [{ id: uid(), businessValueId: valueId, name: "RDS PostgreSQL", type: "BDD", location: "AWS", criticality: "Critique" }];
  base.workshop1.fearedEvents = [{ id: uid(), businessValueId: valueId, description: "Fuite de donnees RH", impact: "Impact RGPD et image", gravity: 4 }];
  base.workshop1.isoControls = [{ id: uid(), reference: "A.5.1", name: "Politiques de securite", status: "applique", comments: "PSSI validee" }];

  base.workshop2.riskSources = [{ id: sourceId, name: "Cybercriminels", type: "Externe", motivation: "Gain financier", capability: 3 }];
  base.workshop2.targetObjectives = [{ id: objectiveId, name: "Exfiltration de donnees", description: "Vol des donnees RH", fearedEventIds: [] }];
  base.workshop2.sourceObjectivePairs = [{ id: pairId, riskSourceId: sourceId, targetObjectiveId: objectiveId, retained: true, justification: "Scenario plausible" }];

  base.workshop3.stakeholders = [{ id: stakeholderId, name: "Prestataire cloud", type: "Sous-traitant", exposure: 3, reliability: 2, access: "Acces admin" }];
  base.workshop3.strategicScenarios = [{ id: strategicId, coupleId: pairId, stakeholderIds: [stakeholderId], name: "Compromission prestataire", description: "Pivot vers SI interne", gravity: 4 }];
  base.workshop3.treatments = [{ id: uid(), scenarioId: strategicId, decision: "Reduction", justification: "MFA, segmentation, SIEM" }];

  base.workshop4.operationalModes = [{ id: opModeId, strategicScenarioId: strategicId, name: "Phishing puis mouvement lateral", description: "Acces illegitime", technics: ["T1566", "T1078"] }];
  base.workshop4.operationalScenarios = [{ id: opScenarioId, strategicScenarioId: strategicId, operationalModeIds: [opModeId], supportingAssetIds: [], likelihood: 3, name: "Ransomware AWS", description: "Chiffrement donnees" }];

  base.workshop5.riskEntries = [{
    id: riskEntryId,
    operationalScenarioId: opScenarioId,
    gravity: 4,
    likelihood: 3,
    treatment: "Reduction",
    status: "en_traitement",
    ownerUserId: "",
    ownerName: "",
    notes: "Priorite haute",
  }];
  base.workshop5.measures = [{ id: uid(), category: "Protection", name: "MFA global", description: "MFA sur comptes privilegies", priority: "Critique", status: "Fait" }];
  base.workshop5.residualRisks = [{ id: uid(), riskEntryId, residualGravity: 3, residualLikelihood: 2, justification: "Mesures en place" }];
  base.workshop5.soa = [{ id: uid(), reference: "A.5.1", objective: "Politique de securite", applicable: "oui", justification: "Applicable au perimetre", implementationStatus: "implemente", linkedMeasureIds: [] }];

  return [base];
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasText(value) {
  return String(value || "").trim().length > 0;
}

function normalizeTextToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeTechniqueValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.toUpperCase().match(/\bT\d{4}(?:\.\d{3})?\b/);
  return match ? match[0] : raw;
}

function normalizeTechniqueList(value) {
  if (!Array.isArray(value)) return [];
  const unique = [];
  const seen = new Set();
  value.forEach((entry) => {
    const normalized = normalizeTechniqueValue(entry);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    unique.push(normalized);
  });
  return unique;
}

function normalizeRiskSourceType(value) {
  const token = normalizeTextToken(value);
  if (!token) return "Externe";

  if (
    token.includes("interne")
    || token.includes("insider")
    || token.includes("employe")
    || token.includes("collabor")
  ) {
    return "Interne";
  }

  return "Externe";
}

function normalizeRiskTreatment(value) {
  const token = normalizeTextToken(value);
  if (!token) return "";
  if (token === "reduction") return "Reduction";
  if (token === "acceptation") return "Acceptation";
  if (token === "partage") return "Partage";
  if (token === "refus") return "Refus";
  return String(value || "").trim();
}

function normalizeRiskEntryStatus(value) {
  const token = normalizeTextToken(value).replace(/\s+/g, "_");
  if (!token) return "ouvert";
  if (token === "ouvert" || token === "open") return "ouvert";
  if (token === "en_traitement" || token === "in_progress" || token === "inprogress" || token === "ongoing") return "en_traitement";
  if (token === "traite" || token === "treated" || token === "closed") return "traite";
  if (token === "accepte" || token === "accepted") return "accepte";
  return "ouvert";
}

function riskEntryStatusLabel(value) {
  const status = normalizeRiskEntryStatus(value);
  return RISK_ENTRY_STATUS_LABELS[status] || "Ouvert";
}

function sanitizeStudyIntegrity(study) {
  const next = study;

  const missions = asArray(next.workshop1?.missions);
  next.workshop1.missions = missions;
  const missionIds = new Set(missions.map((item) => item.id));

  const businessValues = asArray(next.workshop1?.businessValues).filter((item) => missionIds.has(item.missionId));
  next.workshop1.businessValues = businessValues;
  const businessValueIds = new Set(businessValues.map((item) => item.id));

  next.workshop1.supportingAssets = asArray(next.workshop1?.supportingAssets).filter((item) => businessValueIds.has(item.businessValueId));
  next.workshop1.fearedEvents = asArray(next.workshop1?.fearedEvents).filter((item) => businessValueIds.has(item.businessValueId));
  const fearedEventIds = new Set(next.workshop1.fearedEvents.map((item) => item.id));

  next.workshop2.riskSources = asArray(next.workshop2?.riskSources).map((item) => ({
    ...item,
    type: normalizeRiskSourceType(item?.type),
  }));
  next.workshop2.targetObjectives = asArray(next.workshop2?.targetObjectives).map((item) => ({
    ...item,
    fearedEventIds: asArray(item?.fearedEventIds).filter((id) => fearedEventIds.has(id)),
  }));

  const sourceIds = new Set(next.workshop2.riskSources.map((item) => item.id));
  const objectiveIds = new Set(next.workshop2.targetObjectives.map((item) => item.id));
  next.workshop2.sourceObjectivePairs = asArray(next.workshop2?.sourceObjectivePairs).filter((item) => sourceIds.has(item.riskSourceId) && objectiveIds.has(item.targetObjectiveId));
  const retainedPairIds = new Set(next.workshop2.sourceObjectivePairs.filter((item) => item.retained === true).map((item) => item.id));

  next.workshop3.stakeholders = asArray(next.workshop3?.stakeholders);
  const stakeholderIds = new Set(next.workshop3.stakeholders.map((item) => item.id));

  next.workshop3.strategicScenarios = asArray(next.workshop3?.strategicScenarios)
    .filter((item) => retainedPairIds.has(item.coupleId))
    .map((item) => ({
      ...item,
      stakeholderIds: asArray(item?.stakeholderIds).filter((id) => stakeholderIds.has(id)),
    }));

  const strategicScenarioIds = new Set(next.workshop3.strategicScenarios.map((item) => item.id));
  next.workshop3.treatments = asArray(next.workshop3?.treatments).filter((item) => strategicScenarioIds.has(item.scenarioId));

  next.workshop4.operationalModes = asArray(next.workshop4?.operationalModes)
    .filter((item) => strategicScenarioIds.has(item.strategicScenarioId))
    .map((item) => ({
      ...item,
      technics: normalizeTechniqueList(item?.technics),
    }));
  const operationalModeIds = new Set(next.workshop4.operationalModes.map((item) => item.id));

  const supportingAssetIds = new Set(next.workshop1.supportingAssets.map((item) => item.id));
  next.workshop4.operationalScenarios = asArray(next.workshop4?.operationalScenarios)
    .filter((item) => strategicScenarioIds.has(item.strategicScenarioId))
    .map((item) => ({
      ...item,
      operationalModeIds: asArray(item?.operationalModeIds).filter((id) => operationalModeIds.has(id)),
      supportingAssetIds: asArray(item?.supportingAssetIds).filter((id) => supportingAssetIds.has(id)),
    }));

  const operationalScenarioIds = new Set(next.workshop4.operationalScenarios.map((item) => item.id));
  next.workshop5.riskEntries = asArray(next.workshop5?.riskEntries)
    .filter((item) => operationalScenarioIds.has(item.operationalScenarioId))
    .map((item) => ({
      ...item,
      treatment: normalizeRiskTreatment(item?.treatment),
      status: normalizeRiskEntryStatus(item?.status),
      ownerUserId: hasText(item?.ownerUserId) ? String(item.ownerUserId).trim() : "",
      ownerName: hasText(item?.ownerName) ? String(item.ownerName).trim() : "",
    }));

  const riskEntryIds = new Set(next.workshop5.riskEntries.map((item) => item.id));
  next.workshop5.residualRisks = asArray(next.workshop5?.residualRisks).filter((item) => riskEntryIds.has(item.riskEntryId));

  next.workshop5.measures = asArray(next.workshop5?.measures);
  const measureIds = new Set(next.workshop5.measures.map((item) => item.id));

  next.workshop5.soa = asArray(next.workshop5?.soa).map((item) => ({
    ...item,
    linkedMeasureIds: asArray(item?.linkedMeasureIds).filter((id) => measureIds.has(id)),
  }));

  return next;
}

function isContextReady(context) {
  const source = context || {};
  return hasText(source.description || source.general) && hasText(source.perimeter);
}

function getWorkshop3State(study) {
  const scenarios = asArray(study?.workshop3?.strategicScenarios);
  const treatments = asArray(study?.workshop3?.treatments);
  const retainedPairIds = new Set(
    asArray(study?.workshop2?.sourceObjectivePairs)
      .filter((pair) => pair.retained === true)
      .map((pair) => pair.id),
  );

  const scenariosHaveStakeholders = scenarios.every((scenario) => asArray(scenario.stakeholderIds).length > 0);
  const scenariosUseRetainedPairs = scenarios.every((scenario) => retainedPairIds.has(scenario.coupleId));

  const treatmentCountByScenario = new Map();
  treatments.forEach((item) => {
    if (!item?.scenarioId) return;
    treatmentCountByScenario.set(item.scenarioId, (treatmentCountByScenario.get(item.scenarioId) || 0) + 1);
  });

  const everyScenarioHasTreatment = scenarios.every((scenario) => (treatmentCountByScenario.get(scenario.id) || 0) >= 1);
  const oneTreatmentPerScenario = scenarios.every((scenario) => (treatmentCountByScenario.get(scenario.id) || 0) === 1);

  return {
    scenarios,
    scenariosHaveStakeholders,
    scenariosUseRetainedPairs,
    everyScenarioHasTreatment,
    oneTreatmentPerScenario,
  };
}

function getWorkshop4State(study) {
  const scenarios = asArray(study?.workshop4?.operationalScenarios);
  const modes = asArray(study?.workshop4?.operationalModes);
  const modeById = new Map(modes.map((item) => [item.id, item]));

  const likelihoodInRange = scenarios.every((scenario) => Number(scenario.likelihood) >= 1 && Number(scenario.likelihood) <= 4);
  const scenariosHaveModes = scenarios.every((scenario) => asArray(scenario.operationalModeIds).length > 0);
  const modesAlignedWithScenario = scenarios.every((scenario) =>
    asArray(scenario.operationalModeIds).every((modeId) => {
      const mode = modeById.get(modeId);
      return mode && mode.strategicScenarioId === scenario.strategicScenarioId;
    }),
  );

  return {
    scenarios,
    likelihoodInRange,
    scenariosHaveModes,
    modesAlignedWithScenario,
  };
}

function getWorkshopChecklist(study, workshopId) {
  if (!study) return [];

  if (workshopId === 1) {
    return [
      asArray(study.workshop1.team).length > 0,
      isContextReady(study.workshop1.context),
      asArray(study.workshop1.missions).length > 0,
      asArray(study.workshop1.businessValues).length > 0,
      asArray(study.workshop1.supportingAssets).length > 0,
      asArray(study.workshop1.fearedEvents).length > 0,
      asArray(study.workshop1.isoControls).length > 0,
    ];
  }

  if (workshopId === 2) {
    const pairs = asArray(study.workshop2.sourceObjectivePairs);
    return [
      asArray(study.workshop2.riskSources).length > 0,
      asArray(study.workshop2.targetObjectives).length > 0,
      pairs.length > 0,
      pairs.some((pair) => pair.retained === true),
    ];
  }

  if (workshopId === 3) {
    const state = getWorkshop3State(study);
    return [
      asArray(study.workshop3.stakeholders).length > 0,
      state.scenarios.length > 0,
      state.scenariosHaveStakeholders,
      state.scenariosUseRetainedPairs,
      state.everyScenarioHasTreatment,
      state.oneTreatmentPerScenario,
    ];
  }

  if (workshopId === 4) {
    const state = getWorkshop4State(study);
    return [
      asArray(study.workshop4.operationalModes).length > 0,
      state.scenarios.length > 0,
      state.likelihoodInRange,
      state.scenariosHaveModes,
      state.modesAlignedWithScenario,
    ];
  }

  if (workshopId === 5) {
    return [
      asArray(study.workshop5.riskEntries).length > 0,
      asArray(study.workshop5.measures).length > 0,
      asArray(study.workshop5.residualRisks).length > 0,
    ];
  }

  return [];
}

function checklistProgress(checks) {
  if (!checks.length) return 0;
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

function isWorkshopReadyForValidation(study, workshopId) {
  if (!study) return false;

  if (workshopId === 1) {
    return [
      asArray(study.workshop1.team).length > 0,
      isContextReady(study.workshop1.context),
      asArray(study.workshop1.missions).length > 0,
      asArray(study.workshop1.businessValues).length > 0,
      asArray(study.workshop1.supportingAssets).length > 0,
      asArray(study.workshop1.fearedEvents).length > 0,
    ].every(Boolean);
  }

  if (workshopId === 2) {
    return [
      asArray(study.workshop2.riskSources).length > 0,
      asArray(study.workshop2.targetObjectives).length > 0,
      asArray(study.workshop2.sourceObjectivePairs).length > 0,
    ].every(Boolean);
  }

  if (workshopId === 3) {
    const state = getWorkshop3State(study);
    return [
      asArray(study.workshop3.stakeholders).length > 0,
      state.scenarios.length > 0,
      state.scenariosHaveStakeholders,
      state.scenariosUseRetainedPairs,
      state.everyScenarioHasTreatment,
    ].every(Boolean);
  }

  if (workshopId === 4) {
    const state = getWorkshop4State(study);
    return [
      asArray(study.workshop4.operationalModes).length > 0,
      state.scenarios.length > 0,
      state.scenariosHaveModes,
      state.modesAlignedWithScenario,
    ].every(Boolean);
  }

  if (workshopId === 5) {
    return [
      asArray(study.workshop5.riskEntries).length > 0,
      asArray(study.workshop5.measures).length > 0,
    ].every(Boolean);
  }

  return false;
}

function isWorkshopComplete(study, workshopId) {
  if (!study) return false;

  if (workshopId === 1) {
    const controls = asArray(study.workshop1.isoControls);
    return isWorkshopReadyForValidation(study, 1) && controls.length > 0 && controls.every((item) => hasText(item.status));
  }

  if (workshopId === 2) {
    const pairs = asArray(study.workshop2.sourceObjectivePairs);
    return isWorkshopReadyForValidation(study, 2) && pairs.some((pair) => pair.retained === true);
  }

  if (workshopId === 3) {
    const state = getWorkshop3State(study);
    return isWorkshopReadyForValidation(study, 3) && state.oneTreatmentPerScenario;
  }

  if (workshopId === 4) {
    const state = getWorkshop4State(study);
    return (
      isWorkshopReadyForValidation(study, 4)
      && state.likelihoodInRange
      && state.scenariosHaveModes
      && state.modesAlignedWithScenario
    );
  }

  if (workshopId === 5) {
    const residual = asArray(study.workshop5.residualRisks);
    return (
      isWorkshopReadyForValidation(study, 5)
      && residual.length > 0
    );
  }

  return false;
}

function hasWorkshopActivity(study, workshopId) {
  if (!study) return false;
  if (workshopId === 1) {
    return [
      asArray(study.workshop1.team).length,
      asArray(study.workshop1.missions).length,
      asArray(study.workshop1.businessValues).length,
      asArray(study.workshop1.supportingAssets).length,
      asArray(study.workshop1.fearedEvents).length,
      asArray(study.workshop1.isoControls).length,
    ].some((count) => count > 0) || isContextReady(study.workshop1.context);
  }
  if (workshopId === 2) {
    return [
      asArray(study.workshop2.riskSources).length,
      asArray(study.workshop2.targetObjectives).length,
      asArray(study.workshop2.sourceObjectivePairs).length,
    ].some((count) => count > 0);
  }
  if (workshopId === 3) {
    return [
      asArray(study.workshop3.stakeholders).length,
      asArray(study.workshop3.strategicScenarios).length,
      asArray(study.workshop3.treatments).length,
    ].some((count) => count > 0);
  }
  if (workshopId === 4) {
    return [
      asArray(study.workshop4.operationalModes).length,
      asArray(study.workshop4.operationalScenarios).length,
    ].some((count) => count > 0);
  }
  if (workshopId === 5) {
    return [
      asArray(study.workshop5.riskEntries).length,
      asArray(study.workshop5.measures).length,
      asArray(study.workshop5.residualRisks).length,
    ].some((count) => count > 0);
  }
  return false;
}

function isWorkshopBlocked(study, workshopId) {
  if (workshopId <= 1) return false;
  return !isWorkshopComplete(study, workshopId - 1);
}

function mapLegacyStatus(value) {
  const v = String(value || "").toLowerCase();
  if (["completed", "termine", "done"].includes(v)) return "termine";
  if (["in_progress", "en_cours", "ip"].includes(v)) return "en_cours";
  if (["a_valider", "to_validate"].includes(v)) return "a_valider";
  if (["not_started", "non_evalue", "todo"].includes(v)) return "non_evalue";
  return null;
}

function getComputedWorkshopStatus(study, workshopId) {
  if (isWorkshopBlocked(study, workshopId)) return "bloque";
  if (isWorkshopComplete(study, workshopId)) return "termine";
  if (isWorkshopReadyForValidation(study, workshopId)) return "a_valider";
  if (hasWorkshopActivity(study, workshopId)) return "en_cours";
  return "non_evalue";
}

function getEffectiveWorkshopStatus(study, workshopId) {
  return getComputedWorkshopStatus(study, workshopId);
}

function getWorkshopProgress(study, workshopId) {
  const status = getEffectiveWorkshopStatus(study, workshopId);
  if (status === "bloque") return 0;
  const checks = getWorkshopChecklist(study, workshopId);
  if (!checks.length) return status === "termine" ? 100 : 0;
  const progress = checklistProgress(checks);
  return status === "termine" ? 100 : progress;
}

function getStudyProgress(study) {
  const ids = [1, 2, 3, 4, 5];
  const statuses = ids.map((id) => getEffectiveWorkshopStatus(study, id));
  const progressValues = ids.map((id) => getWorkshopProgress(study, id));

  const done = statuses.filter((x) => x === "termine").length;
  const toValidate = statuses.filter((x) => x === "a_valider").length;
  const inProgress = statuses.filter((x) => x === "en_cours").length;
  const blocked = statuses.filter((x) => x === "bloque").length;
  const pct = progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0;

  let status = "non_evalue";
  if (done === 5) status = "termine";
  else if (toValidate > 0 && inProgress === 0) status = "a_valider";
  else if (done > 0 || toValidate > 0 || inProgress > 0) status = "en_cours";

  return { done, toValidate, inProgress, blocked, pct, status };
}

function statusLabel(status) {
  if (status === "termine") return "Termine";
  if (status === "a_valider") return "A valider";
  if (status === "en_cours") return "En cours";
  if (status === "bloque") return "Bloque";
  return "Non evalue";
}

function statusClass(status) {
  if (status === "termine") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "a_valider") return "bg-amber-100 text-amber-700 border-amber-200";
  if (status === "en_cours") return "bg-blue-100 text-blue-700 border-blue-200";
  if (status === "bloque") return "bg-red-100 text-red-700 border-red-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function getWorkshopMeta(workshopId) {
  return WORKSHOP_META.find((workshop) => workshop.id === Number(workshopId));
}

function normalizeLegacyStudy(study) {
  const next = createEmptyStudy({
    name: study?.name,
    organization: study?.organization,
    description: study?.description,
    perimeter: study?.perimeter,
    author: study?.author,
  });

  const merged = {
    ...next,
    ...study,
    workshopStatuses: {
      1: mapLegacyStatus(study?.workshopStatuses?.[1]),
      2: mapLegacyStatus(study?.workshopStatuses?.[2]),
      3: mapLegacyStatus(study?.workshopStatuses?.[3]),
      4: mapLegacyStatus(study?.workshopStatuses?.[4]),
      5: mapLegacyStatus(study?.workshopStatuses?.[5]),
    },
    workshop1: { ...next.workshop1, ...(study?.workshop1 || {}) },
    workshop2: { ...next.workshop2, ...(study?.workshop2 || {}) },
    workshop3: { ...next.workshop3, ...(study?.workshop3 || {}) },
    workshop4: { ...next.workshop4, ...(study?.workshop4 || {}) },
    workshop5: { ...next.workshop5, ...(study?.workshop5 || {}) },
  };

  if (!merged.id) merged.id = uid();
  if (!merged.createdAt) merged.createdAt = nowDate();
  if (!merged.updatedAt) merged.updatedAt = nowDate();

  return sanitizeStudyIntegrity(merged);
}

function loadInitialStudies(storageKey = getCurrentRiskStorageKey()) {
  if (typeof localStorage === "undefined") return [];

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeLegacyStudy);
    }
  } catch {
    // ignore parse errors and continue with fallback
  }

  if (isAnonymousStorageKey(storageKey)) {
    try {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        const list = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
        if (list.length) return list.map(normalizeLegacyStudy);
      }
    } catch {
      // ignore parse errors and continue with seed
    }

    return createDemoStudies();
  }

  return [];
}

  return { buildRiskStorageKey, getCurrentRiskStorageKey, listRiskStorageKeys, uid, nowDate, riskLevel, createEmptyStudy, createDemoStudies, normalizeRiskEntryStatus, riskEntryStatusLabel, isWorkshopComplete, hasWorkshopActivity, isWorkshopBlocked, mapLegacyStatus, getComputedWorkshopStatus, getEffectiveWorkshopStatus, getWorkshopProgress, getStudyProgress, statusLabel, statusClass, getWorkshopMeta, normalizeLegacyStudy, loadInitialStudies, STORAGE_PREFIX, STORAGE_KEY, LEGACY_STORAGE_KEY, WORKSHOP_STATUS_OPTIONS, WORKSHOP_META, G_LABELS, V_LABELS, MEASURE_CATEGORIES, RISK_ENTRY_STATUS_OPTIONS, MITRE_TACTICS, ANSSI_BASE };
})();

const { buildRiskStorageKey, getCurrentRiskStorageKey, listRiskStorageKeys, uid, nowDate, riskLevel, createEmptyStudy, createDemoStudies, normalizeRiskEntryStatus, riskEntryStatusLabel, isWorkshopComplete, hasWorkshopActivity, isWorkshopBlocked, mapLegacyStatus, getComputedWorkshopStatus, getEffectiveWorkshopStatus, getWorkshopProgress, getStudyProgress, statusLabel, statusClass, getWorkshopMeta, normalizeLegacyStudy, loadInitialStudies, STORAGE_PREFIX, STORAGE_KEY, LEGACY_STORAGE_KEY, WORKSHOP_STATUS_OPTIONS, WORKSHOP_META, G_LABELS, V_LABELS, MEASURE_CATEGORIES, RISK_ENTRY_STATUS_OPTIONS, MITRE_TACTICS, ANSSI_BASE } = __risk_model;

const __risk_ui = (() => {
function RiskPageHeader({ title, subtitle, badge, actions, variant = "default" }) {
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

function RiskStatusBadge({ status }) {
  return (
    <span className={`risk-status-badge inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusClass(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {statusLabel(status)}
    </span>
  );
}

function RiskCard({ children, className = "", ...props }) {
  return (
    <div className={`risk-card risk-panel rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

function RiskSectionHeader({ title, subtitle, right }) {
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

function RiskKpiTile({ label, value, tone = "default", helper, primary = false, progress }) {
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

function RiskProgressBar({ value = 0, label, rightLabel, size = 92, stroke = 10, centerLabel }) {
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

function RiskModal({ open, title, onClose, children, size = "max-w-3xl" }) {
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

function RiskCrudTable({
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
  deleteConfirmMessage,
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({}));
  const [errors, setErrors] = useState(() => ({}));

  const rowCount = rows?.length || 0;
  const canSave = useMemo(
    () => !readOnly && fields.every((field) => !isFieldRequired(field, draft) || valueHasContent(draft[field.key])),
    [draft, fields, readOnly],
  );

  const startCreate = () => {
    if (readOnly) return;
    const next = {};
    fields.forEach((field) => {
      next[field.key] = field.defaultValue ?? (field.type === "multiselect" ? [] : "");
    });
    setDraft(next);
    setErrors({});
    setEditorOpen(true);
  };

  const startEdit = (row) => {
    if (readOnly) return;
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

  const askDelete = (row) => {
    if (readOnly) return;
    const message = typeof deleteConfirmMessage === "function" ? deleteConfirmMessage(row) : deleteConfirmMessage;
    const confirmed = window.confirm(message || "Confirmer la suppression de cet element ?");
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
            <button
              type="button"
              onClick={startCreate}
              disabled={readOnly}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={14} /> {addLabel}
            </button>
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
                  <th className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
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
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => startEdit(row)} className="rounded-lg border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" disabled={readOnly}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => askDelete(row)} className="rounded-lg border border-red-200 p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50" disabled={readOnly}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
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

function RiskCallout({ tone = "info", title, children }) {
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

  return { RiskPageHeader, RiskStatusBadge, RiskCard, RiskSectionHeader, RiskKpiTile, RiskProgressBar, RiskModal, RiskCrudTable, RiskCallout };
})();

const { RiskPageHeader, RiskStatusBadge, RiskCard, RiskSectionHeader, RiskKpiTile, RiskProgressBar, RiskModal, RiskCrudTable, RiskCallout } = __risk_ui;

const __risk_exporter = (() => {
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

function exportStudyAsJson(study) {
  if (!study) return;
  const name = normalizeFilePart(study.name || "etude");
  const datePart = study.updatedAt || new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(study, null, 2)], { type: "application/json" });
  triggerDownload(blob, `ebios_rm_${name}_${datePart}.json`);
}

function printWorkshopLivrable(study, workshopNum) {
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

function buildLivrableHtml(study, workshopNum, today) {
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

  return { exportStudyAsJson, printWorkshopLivrable, buildLivrableHtml };
})();

const { exportStudyAsJson, printWorkshopLivrable, buildLivrableHtml } = __risk_exporter;

const __risk_context = (() => {
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

function RiskStudiesProvider({ children }) {
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

function useRiskStudies() {
  const ctx = useContext(RiskStudiesContext);
  if (!ctx) throw new Error("useRiskStudies must be used within RiskStudiesProvider");
  return ctx;
}

  return { RiskStudiesProvider, useRiskStudies };
})();

const { RiskStudiesProvider, useRiskStudies } = __risk_context;

const __risk_studies = (() => {
function StudyCreateModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", organization: "", description: "", perimeter: "", author: "" });
  const [creating, setCreating] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const ok = await onSubmit(form);
      if (ok) {
        setForm({ name: "", organization: "", description: "", perimeter: "", author: "" });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <RiskModal open={open} onClose={onClose} title="Nouvelle etude de risques">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Nom de l'etude *</label>
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Organisation</label>
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm" value={form.organization} onChange={(event) => setForm((prev) => ({ ...prev, organization: event.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Auteur</label>
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm" value={form.author} onChange={(event) => setForm((prev) => ({ ...prev, author: event.target.value }))} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Perimetre</label>
          <input className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm" value={form.perimeter} onChange={(event) => setForm((prev) => ({ ...prev, perimeter: event.target.value }))} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Description</label>
          <textarea className="min-h-[90px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={creating} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          Annuler
        </button>
        <button type="button" onClick={submit} disabled={!form.name.trim() || creating} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          {creating ? "Creation..." : "Creer l'etude"}
        </button>
      </div>
    </RiskModal>
  );
}

function KnowledgeModal({ open, onClose }) {
  const gravityToneClass = {
    emerald: "border-emerald-200 bg-emerald-100 text-emerald-700",
    amber: "border-amber-200 bg-amber-100 text-amber-700",
    orange: "border-orange-200 bg-orange-100 text-orange-700",
    red: "border-red-200 bg-red-100 text-red-700",
  };

  return (
    <RiskModal open={open} onClose={onClose} title="Referentiels MITRE / ANSSI" size="max-w-6xl">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RiskCard>
          <RiskSectionHeader title="MITRE ATT&CK" subtitle="Tactiques de reference" />
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
            {MITRE_TACTICS.map((tactic) => (
              <div key={tactic.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="mb-2 text-sm font-bold text-slate-900">{tactic.name}</div>
                <div className="space-y-1 text-xs text-slate-600">
                  {tactic.techniques.map((technique) => (
                    <div key={technique} className="rounded-md border border-slate-200 bg-white px-2 py-1">
                      {technique}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </RiskCard>

        <RiskCard>
          <RiskSectionHeader title="Base ANSSI" subtitle="Socle de reference pour la qualification des risques" />
          <div className="space-y-4 p-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-base font-black text-blue-700">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-700">
                  <BookOpen size={14} />
                </span>
                {ANSSI_BASE.guideTitle}
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{ANSSI_BASE.guideDescription}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[13px] font-black text-orange-600">Sources de risque types</div>
                <ul className="mt-2 space-y-1.5 text-[13px] text-slate-600">
                  {ANSSI_BASE.sources.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-slate-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-[13px] font-black text-blue-700">Objectifs vises types</div>
                <ul className="mt-2 space-y-1.5 text-[13px] text-slate-600">
                  {ANSSI_BASE.objectifs.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-slate-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-[13px] font-black text-emerald-700">Referentiels associes</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ANSSI_BASE.references.map((item) => (
                  <span key={item} className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{item}</span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-[13px] font-black text-blue-700">Echelle de gravite EBIOS RM</div>
              <div className="mt-3 space-y-2">
                {ANSSI_BASE.gravityScale.map((entry) => (
                  <div key={entry.level} className="flex items-center gap-3 text-[13px] text-slate-700">
                    <span className={`inline-flex min-w-[54px] items-center justify-center rounded-full border px-2 py-0.5 text-xs font-bold ${gravityToneClass[entry.tone] || gravityToneClass.emerald}`}>
                      {entry.level}
                    </span>
                    <span className="font-semibold">{entry.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RiskCard>
      </div>
    </RiskModal>
  );
}

function studyStatus(study) {
  const progress = getStudyProgress(study);
  if (progress.done === 5) return "termine";
  return progress.status;
}

function RiskStudiesPage() {
  const navigate = useNavigate();
  const { studies, createStudy, deleteStudy, refreshStudies, loading, error, clearError } = useRiskStudies();
  const [createOpen, setCreateOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const global = useMemo(() => {
    const done = studies.filter((study) => getStudyProgress(study).done === 5).length;
    const ongoing = studies.filter((study) => getStudyProgress(study).status === "en_cours").length;
    const toValidate = studies.reduce((count, study) => count + getStudyProgress(study).toValidate, 0);
    const avg = studies.length ? Math.round(studies.reduce((sum, study) => sum + getStudyProgress(study).pct, 0) / studies.length) : 0;
    return { done, ongoing, toValidate, avg };
  }, [studies]);

  const visibleStudies = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = studies.filter((study) => {
      const matchesQuery = !q || [study.name, study.organization, study.perimeter, study.author, study.description].some((value) => String(value || "").toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || studyStatus(study) === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return filtered.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  }, [studies, query, statusFilter]);

  const hasFilters = query.trim() || statusFilter !== "all";
  const statusTabs = useMemo(() => ([
    { value: "all", label: "Tous", count: studies.length, tone: "all", icon: Search },
    { value: "non_evalue", label: "Non evalues", count: studies.filter((study) => studyStatus(study) === "non_evalue").length, tone: "non_evalue", icon: CircleSlash },
    { value: "en_cours", label: "En cours", count: studies.filter((study) => studyStatus(study) === "en_cours").length, tone: "en_cours", icon: Clock3 },
    { value: "a_valider", label: "A valider", count: studies.filter((study) => studyStatus(study) === "a_valider").length, tone: "a_valider", icon: AlertCircle },
    { value: "termine", label: "Termines", count: studies.filter((study) => studyStatus(study) === "termine").length, tone: "termine", icon: CheckCircle2 },
  ]), [studies]);

  const statusToneClass = {
    all: {
      activeBtn: "border-blue-600 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]",
      inactiveBtn: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      inactivePill: "border-slate-200 bg-slate-100 text-slate-600",
    },
    non_evalue: {
      activeBtn: "border-slate-700 bg-slate-700 text-white shadow-[0_10px_24px_rgba(51,65,85,0.22)]",
      inactiveBtn: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
      inactivePill: "border-slate-200 bg-white text-slate-600",
    },
    en_cours: {
      activeBtn: "border-blue-600 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]",
      inactiveBtn: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
      inactivePill: "border-blue-200 bg-white text-blue-700",
    },
    a_valider: {
      activeBtn: "border-amber-500 bg-amber-500 text-white shadow-[0_10px_24px_rgba(217,119,6,0.22)]",
      inactiveBtn: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
      inactivePill: "border-amber-200 bg-white text-amber-700",
    },
    termine: {
      activeBtn: "border-emerald-600 bg-emerald-600 text-white shadow-[0_10px_24px_rgba(5,150,105,0.22)]",
      inactiveBtn: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
      inactivePill: "border-emerald-200 bg-white text-emerald-700",
    },
  };

  return (
    <div className="risk-page risk-fade-up">
      <div className="risk-app-shell space-y-4">
        <RiskPageHeader
          title="Etudes de risques"
          subtitle="Portefeuille multi-etudes EBIOS RM avec pilotage des statuts, progression automatique et acces direct aux ateliers."
          actions={(
            <>
              <button onClick={() => setKnowledgeOpen(true)} type="button" className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <BookOpen size={15} /> MITRE / ANSSI
              </button>
              <button onClick={() => setCreateOpen(true)} type="button" className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700">
                <Plus size={15} /> Nouvelle etude
              </button>
            </>
          )}
        />

        {error ? (
          <RiskCard className="border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button type="button" onClick={clearError} className="rounded-lg border border-red-300 bg-white px-2 py-1 text-xs text-red-700 hover:bg-red-100">
                Fermer
              </button>
            </div>
          </RiskCard>
        ) : null}

        <div className="risk-kpi-band">
          <div className="risk-kpi-grid">
            <RiskKpiTile
              label="Progression moyenne"
              value={`${global.avg}%`}
              helper={`${studies.length} etude${studies.length > 1 ? "s" : ""}`}
              primary
              progress={global.avg}
            />
            <RiskKpiTile label="Etudes" value={studies.length} helper={`${global.done} terminee${global.done > 1 ? "s" : ""}`} />
            <RiskKpiTile label="En cours" value={global.ongoing} tone="info" helper={`${global.toValidate} a valider`} />
            <RiskKpiTile label="Ateliers a valider" value={global.toValidate} tone="warning" />
            <RiskKpiTile label="Etudes terminees" value={global.done} tone="success" helper={`${Math.max(0, studies.length - global.done)} restantes`} />
          </div>
        </div>

        <RiskCard className="risk-command-toolbar p-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {statusTabs.map((tab) => {
                  const active = statusFilter === tab.value;
                  const tone = statusToneClass[tab.tone] || statusToneClass.all;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setStatusFilter(tab.value)}
                      className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-all duration-300 ${
                        active ? tone.activeBtn : tone.inactiveBtn
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                      <span className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border px-1.5 text-[11px] font-bold ${
                        active ? "border-white/20 bg-white/20 text-white" : tone.inactivePill
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => void refreshStudies()}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={14} />
                {loading ? "Actualisation..." : "Actualiser"}
              </button>
            </div>

            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-[14px] font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Rechercher une etude..."
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-600">
                {visibleStudies.length} / {studies.length} etudes affichees
              </div>
              <div className="flex items-center gap-2">
                {hasFilters ? (
                  <button type="button" onClick={() => { setQuery(""); setStatusFilter("all"); }} className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                    <X size={13} /> Reinit
                  </button>
                ) : null}
              </div>
            </div>

          </div>
        </RiskCard>

        <section className="space-y-4">
            {loading ? (
              <RiskCard className="p-10 text-center">
                <ShieldCheck size={34} className="mx-auto animate-pulse text-blue-600" />
                <h2 className="mt-3 text-xl font-black text-slate-900">Chargement des etudes...</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                  Synchronisation du portefeuille risques avec la base de donnees.
                </p>
              </RiskCard>
            ) : !visibleStudies.length ? (
              <RiskCard className="p-10 text-center">
                <ShieldCheck size={34} className="mx-auto text-blue-600" />
                <h2 className="mt-3 text-xl font-black text-slate-900">{studies.length ? "Aucune etude sur ce filtre" : "Aucune etude pour le moment"}</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                  {studies.length ? "Change les filtres ou lance une nouvelle etude." : "Cree ta premiere etude de risque EBIOS RM pour lancer le workflow complet sur les 5 ateliers."}
                </p>
                <button onClick={() => setCreateOpen(true)} type="button" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  <Plus size={14} /> Creer une etude
                </button>
              </RiskCard>
            ) : (
              <div className="risk-study-grid">
                {visibleStudies.map((study) => {
                  const progress = getStudyProgress(study);
                  const status = studyStatus(study);
                  const statuses = WORKSHOP_META.map((workshop) => getEffectiveWorkshopStatus(study, workshop.id));
                  const doneCount = statuses.filter((item) => item === "termine").length;
                  const activeCount = statuses.filter((item) => item === "en_cours").length;
                  const validateCount = statuses.filter((item) => item === "a_valider").length;

                  return (
                    <RiskCard
                      key={study.id}
                      className="risk-study-card cursor-pointer p-4 pl-5"
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/risques/etudes/${study.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate(`/risques/etudes/${study.id}`);
                        }
                      }}
                    >
                      <div className="risk-study-card-headline-row">
                        <div>
                          <h3 className="text-xl font-black tracking-tight text-slate-900">{study.name}</h3>
                          <p className="risk-study-description mt-1.5 text-sm text-slate-500">{study.description || "Etude sans description"}</p>
                        </div>
                        <RiskStatusBadge status={status} />
                      </div>

                      <div className="mt-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="risk-study-meta-list">
                            <span className="risk-study-meta-item">
                              <Building2 size={12} />
                              <span className="truncate">Perimetre: {study.perimeter || "-"}</span>
                            </span>
                            <span className="risk-study-meta-item">
                              <UserRound size={12} />
                              <span className="truncate">Auteur: {study.author || "-"}</span>
                            </span>
                            <span className="risk-study-meta-item">
                              <CalendarDays size={12} />
                              <span className="truncate">Maj: {study.updatedAt || "-"}</span>
                            </span>
                          </div>

                          <div className="risk-study-progress-band mt-3">
                            <div className="risk-study-progress-head">
                              <span className="text-slate-700">Ateliers termines</span>
                              <span>{doneCount}/5</span>
                            </div>
                            <div className="risk-study-workshop-segments" aria-label="Progression des ateliers">
                              {statuses.map((workshopStatus, index) => (
                                <span
                                  key={`${study.id}-${index + 1}`}
                                  className={`risk-study-workshop-segment risk-seg-${workshopStatus}`}
                                  title={`Atelier ${index + 1}`}
                                />
                              ))}
                            </div>
                            <div className="risk-study-progress-sub">
                              <span>{activeCount} en cours</span>
                              <span>{validateCount} a valider</span>
                            </div>
                          </div>
                        </div>
                        <RiskProgressBar value={progress.pct} centerLabel={`${progress.pct}%`} rightLabel={`${progress.done}/5`} size={76} />
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            const confirmed = window.confirm(`Supprimer l'etude "${study.name || "sans nom"}" ? Cette action est irreversible.`);
                            if (!confirmed) return;
                            void deleteStudy(study.id);
                          }}
                          type="button"
                          aria-label="Supprimer l'etude"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </RiskCard>
                  );
                })}
              </div>
            )}
        </section>
      </div>

      <StudyCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (payload) => {
          const created = await createStudy(payload);
          if (!created) return false;
          setCreateOpen(false);
          navigate(`/risques/etudes/${created.id}`);
          return true;
        }}
      />
      <KnowledgeModal open={knowledgeOpen} onClose={() => setKnowledgeOpen(false)} />
    </div>
  );
}

  return { RiskStudiesPage };
})();

const { RiskStudiesPage } = __risk_studies;

const __risk_detail = (() => {
function countItems(value) {
  return Array.isArray(value) ? value.length : 0;
}

function compactWorkshopTitle(rawTitle, workshopId) {
  if (!rawTitle) return `Atelier ${workshopId}`;
  return rawTitle.replace(/^Atelier\s+\d+\s*[-–]\s*/i, "").trim();
}

function getWorkshopCardKpis(study, workshopId, stepsCount) {
  const w1 = study?.workshop1 || {};
  const w2 = study?.workshop2 || {};
  const w3 = study?.workshop3 || {};
  const w4 = study?.workshop4 || {};
  const w5 = study?.workshop5 || {};

  if (workshopId === 1) {
    return [
      { label: "Etapes", value: stepsCount },
      { label: "Missions", value: countItems(w1.missions) },
      { label: "Evt redoutes", value: countItems(w1.fearedEvents) },
    ];
  }

  if (workshopId === 2) {
    const totalPairs = countItems(w2.sourceObjectivePairs);
    const retainedPairs = (w2.sourceObjectivePairs || []).filter((pair) => pair?.retained).length;
    return [
      { label: "Etapes", value: stepsCount },
      { label: "Couples retenus", value: `${retainedPairs}/${totalPairs}` },
      { label: "Sources", value: countItems(w2.riskSources) },
    ];
  }

  if (workshopId === 3) {
    return [
      { label: "Etapes", value: stepsCount },
      { label: "Parties prenantes", value: countItems(w3.stakeholders) },
      { label: "Scenarios strat.", value: countItems(w3.strategicScenarios) },
    ];
  }

  if (workshopId === 4) {
    return [
      { label: "Etapes", value: stepsCount },
      { label: "Modes operatoires", value: countItems(w4.operationalModes) },
      { label: "Scenarios op.", value: countItems(w4.operationalScenarios) },
    ];
  }

  if (workshopId === 5) {
    const riskEntries = w5.riskEntries || [];
    const criticalRisks = riskEntries.filter((risk) => Number(risk?.gravity || 0) * Number(risk?.likelihood || 0) >= 10).length;
    return [
      { label: "Etapes", value: stepsCount },
      { label: "Risques registre", value: riskEntries.length },
      { label: "Risques critiques", value: criticalRisks },
    ];
  }

  return [{ label: "Etapes", value: stepsCount }];
}

function RiskStudyDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getStudyById, updateStudyMeta, loading } = useRiskStudies();
  const study = getStudyById(id);

  const [editMeta, setEditMeta] = useState(false);
  const [metaDraft, setMetaDraft] = useState(() => ({
    name: study?.name || "",
    organization: study?.organization || "",
    perimeter: study?.perimeter || "",
    author: study?.author || "",
    description: study?.description || "",
  }));

  useEffect(() => {
    setMetaDraft({
      name: study?.name || "",
      organization: study?.organization || "",
      perimeter: study?.perimeter || "",
      author: study?.author || "",
      description: study?.description || "",
    });
  }, [study?.id, study?.name, study?.organization, study?.perimeter, study?.author, study?.description]);

  const progress = useMemo(() => (study ? getStudyProgress(study) : null), [study]);
  const blockedCount = useMemo(
    () => (study ? WORKSHOP_META.filter((workshop) => isWorkshopBlocked(study, workshop.id)).length : 0),
    [study],
  );

  if (loading && !study) {
    return (
      <div className="risk-page p-6">
        <RiskCard className="mx-auto max-w-3xl p-8 text-center">
          <h2 className="text-xl font-black text-slate-900">Chargement de l'etude...</h2>
          <p className="mt-2 text-sm text-slate-500">Synchronisation avec la base de donnees en cours.</p>
        </RiskCard>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="risk-page p-6">
        <RiskCard className="mx-auto max-w-3xl p-8 text-center">
          <h2 className="text-xl font-black text-slate-900">Etude introuvable</h2>
          <p className="mt-2 text-sm text-slate-500">Cette etude n'existe pas ou a ete supprimee.</p>
          <button type="button" onClick={() => navigate("/risques")} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Retour au portefeuille
          </button>
        </RiskCard>
      </div>
    );
  }

  return (
    <div className="risk-page risk-fade-up">
      <div className="risk-app-shell space-y-4">
        <RiskPageHeader
          variant="hero"
          title={study.name}
          subtitle={study.description || "Aucune description renseignee."}
          actions={(
            <>
              <button type="button" onClick={() => navigate("/risques")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <ArrowLeft size={14} /> Retour portefeuille
              </button>
            </>
          )}
        />

        <div className="risk-kpi-band">
          <div className="risk-kpi-grid">
            <RiskKpiTile label="Progression globale" value={`${progress.pct}%`} helper={`${progress.done}/5 ateliers termines`} primary progress={progress.pct} />
            <RiskKpiTile label="Ateliers termines" value={`${progress.done}/5`} tone="success" helper={`${5 - progress.done} restants`} />
            <RiskKpiTile label="A valider" value={progress.toValidate} tone="warning" helper="Validation metier requise" />
            <RiskKpiTile
              label="Ateliers bloques"
              value={blockedCount}
              tone={blockedCount > 0 ? "warning" : "success"}
              helper={blockedCount > 0 ? "A debloquer via l'atelier precedent" : "Aucun blocage"}
            />
          </div>
        </div>

        <main className="space-y-4">
          <RiskCard className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  <Building2 size={13} /> {study.organization || "Organisation -"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  <MapPinned size={13} /> {study.perimeter || "Perimetre -"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  <UserRound size={13} /> {study.author || "Auteur -"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  <CalendarDays size={13} /> Creation {study.createdAt || "-"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditMeta((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700 hover:bg-slate-50"
              >
                <Edit3 size={13} /> {editMeta ? "Fermer edition" : "Modifier fiche"}
              </button>
            </div>

            {editMeta ? (
              <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" value={metaDraft.name} placeholder="Nom" onChange={(event) => setMetaDraft((prev) => ({ ...prev, name: event.target.value }))} />
                <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" value={metaDraft.organization} placeholder="Organisation" onChange={(event) => setMetaDraft((prev) => ({ ...prev, organization: event.target.value }))} />
                <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" value={metaDraft.perimeter} placeholder="Perimetre" onChange={(event) => setMetaDraft((prev) => ({ ...prev, perimeter: event.target.value }))} />
                <input className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" value={metaDraft.author} placeholder="Auteur" onChange={(event) => setMetaDraft((prev) => ({ ...prev, author: event.target.value }))} />
                <textarea className="min-h-[90px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" value={metaDraft.description} placeholder="Description" onChange={(event) => setMetaDraft((prev) => ({ ...prev, description: event.target.value }))} />
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => { updateStudyMeta(study.id, metaDraft); setEditMeta(false); }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    <Save size={14} /> Enregistrer
                  </button>
                  <button type="button" onClick={() => { setEditMeta(false); setMetaDraft({ name: study.name || "", organization: study.organization || "", perimeter: study.perimeter || "", author: study.author || "", description: study.description || "" }); }} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Annuler
                  </button>
                </div>
              </div>
            ) : null}
          </RiskCard>

          <RiskCallout tone="info" title="Workflow automatique">
            Atelier N bloque tant que l'atelier N-1 n'est pas termine. Le livrable apparait automatiquement au statut "Termine".
          </RiskCallout>

          <div className="risk-workshop-grid">
            {WORKSHOP_META.map((workshop) => {
                const status = getEffectiveWorkshopStatus(study, workshop.id);
                const blocked = isWorkshopBlocked(study, workshop.id);
                const pct = getWorkshopProgress(study, workshop.id);
                const workshopKpis = getWorkshopCardKpis(study, workshop.id, workshop.steps.length);
                const workshopNumber = String(workshop.id).padStart(2, "0");
                const workshopCount = String(WORKSHOP_META.length).padStart(2, "0");
                const cleanTitle = compactWorkshopTitle(workshop.title, workshop.id);
                const accentByWorkshop = ["#2563eb", "#059669", "#0ea5e9", "#4f46e5", "#d97706"];
                const accent = accentByWorkshop[(workshop.id - 1) % accentByWorkshop.length];

                return (
                  <RiskCard
                    key={workshop.id}
                    className={`risk-workshop-card risk-workshop-card-modern p-5 ${blocked ? "risk-workshop-card-blocked cursor-not-allowed" : "cursor-pointer"}`}
                    style={{ "--risk-workshop-accent": accent }}
                    role="button"
                    tabIndex={blocked ? -1 : 0}
                    onClick={() => {
                      if (!blocked) navigate(`/risques/etudes/${study.id}/atelier/${workshop.id}`);
                    }}
                    onKeyDown={(event) => {
                      if (blocked) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/risques/etudes/${study.id}/atelier/${workshop.id}`);
                      }
                    }}
                  >
                    <div className="risk-card-headline">
                      <div>
                        <p className="risk-workshop-counter">{workshopNumber} / {workshopCount}</p>
                        <h3 className="risk-workshop-title mt-1 text-xl font-black tracking-tight text-slate-900">{cleanTitle}</h3>
                        <p className="risk-workshop-description mt-1.5 text-sm text-slate-500">{workshop.description}</p>
                      </div>
                      <RiskStatusBadge status={status} />
                    </div>

                    <div className="risk-workshop-divider mt-3" />

                    <div className="mt-3">
                      <div className="risk-workshop-kpi-grid">
                        {workshopKpis.map((kpi) => (
                          <div key={`${workshop.id}-${kpi.label}`} className="risk-workshop-kpi-box">
                            <span className="risk-workshop-kpi-label">{kpi.label}</span>
                            <span className="risk-workshop-kpi-value">{kpi.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="risk-workshop-footer mt-4 flex flex-wrap items-center gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {status === "termine" ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              printWorkshopLivrable(study, workshop.id);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <FileText size={14} /> Livrable
                          </button>
                        ) : null}
                        {blocked ? (
                          <span className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700">Atelier bloque</span>
                        ) : null}
                      </div>
                      <div className="risk-workshop-footer-progress">
                        <RiskProgressBar
                          value={pct}
                          centerLabel={`${pct}%`}
                          rightLabel={pct === 100 ? "" : "finalisation"}
                          size={62}
                          stroke={7}
                        />
                      </div>
                    </div>

                    {status === "a_valider" ? (
                      <div className="mt-3">
                        <RiskCallout tone="warning" title="A valider">
                          L'atelier est pret a validation. Complete les champs requis pour atteindre automatiquement "Termine".
                        </RiskCallout>
                      </div>
                    ) : null}
                  </RiskCard>
                );
              })}
          </div>
        </main>
      </div>
    </div>
  );
}

  return { RiskStudyDetailPage };
})();

const { RiskStudyDetailPage } = __risk_detail;

const __risk_workshop = (() => {
const SCALE_1_4_OPTIONS = [1, 2, 3, 4].map((value) => ({ value, label: `${value}/4` }));
const GRAVITY_OPTIONS = [1, 2, 3, 4].map((value) => ({ value, label: `G${value} - ${G_LABELS[value]}` }));
const LIKELIHOOD_OPTIONS = [1, 2, 3, 4].map((value) => ({ value, label: `V${value} - ${V_LABELS[value]}` }));
const YES_NO_OPTIONS = [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }];
const TREATMENT_OPTIONS = [
  { value: "Reduction", label: "Reduction" },
  { value: "Acceptation", label: "Acceptation" },
  { value: "Partage", label: "Partage" },
  { value: "Refus", label: "Refus" },
];
const TREATMENT_LABEL_BY_VALUE = new Map(TREATMENT_OPTIONS.map((option) => [option.value, option.label]));
const TEAM_ROLE_OPTIONS = ["Super Admin", "Admin Societe", "Auditeur", "Consultant", "RSSI"].map((value) => ({ value, label: value }));
const BUSINESS_VALUE_TYPE_OPTIONS = ["Donnees", "Service", "Processus", "Image", "Conformite", "Financier", "Autre"].map((value) => ({ value, label: value }));
const SUPPORTING_ASSET_TYPE_OPTIONS = ["Application", "Serveur", "Base de donnees", "Reseau", "Cloud", "Poste", "Prestataire", "Autre"].map((value) => ({ value, label: value }));
const CRITICALITY_OPTIONS = ["Faible", "Moyenne", "Elevee", "Critique"].map((value) => ({ value, label: value }));
const RISK_SOURCE_TYPE_OPTIONS = ["Interne", "Externe"].map((value) => ({ value, label: value }));
const ISO_STATUS_OPTIONS = [
  { value: "applique", label: "Applique" },
  { value: "partiel", label: "Partiel" },
  { value: "en_cours", label: "En cours" },
  { value: "non_applique", label: "Non applique" },
];
const STAKEHOLDER_TYPE_OPTIONS = ["Interne", "Fournisseur", "Sous-traitant", "Partenaire", "Client", "Autorite", "Autre"].map((value) => ({ value, label: value }));
const STAKEHOLDER_ACCESS_OPTIONS = ["Aucun acces", "Acces limite", "Acces metier", "Acces privilegie", "Acces administrateur"].map((value) => ({ value, label: value }));
const MEASURE_PRIORITY_OPTIONS = ["Faible", "Moyenne", "Haute", "Critique"].map((value) => ({ value, label: value }));
const MEASURE_STATUS_OPTIONS = ["A faire", "En cours", "Fait"].map((value) => ({ value, label: value }));
const SOA_IMPLEMENTATION_OPTIONS = [
  { value: "implemente", label: "Implemente" },
  { value: "partiel", label: "Partiel" },
  { value: "planifie", label: "Planifie" },
  { value: "non_implemente", label: "Non implemente" },
];

function normalizeScale(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.min(4, Math.max(1, Math.round(numeric)));
}

function truncateLabel(value, max = 72) {
  const text = String(value || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function normalizeToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizeTreatmentValue(value) {
  const token = normalizeToken(value);
  if (!token) return "";
  if (token === "reduction") return "Reduction";
  if (token === "acceptation") return "Acceptation";
  if (token === "partage") return "Partage";
  if (token === "refus") return "Refus";
  return String(value || "").trim();
}

function decisionBadgeClass(decision) {
  const value = String(decision || "").trim();
  if (value === "Reduction") return "risk-cell-badge-warning";
  if (value === "Partage") return "risk-cell-badge-info";
  if (value === "Acceptation") return "risk-cell-badge-neutral";
  if (value === "Refus") return "risk-cell-badge-danger";
  return "risk-cell-badge-neutral";
}

const TECHNIQUE_CODE_PATTERN = /\bT\d{4}(?:\.\d{3})?\b/i;

function escapeForRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTechniqueCode(value) {
  const match = String(value || "").toUpperCase().match(TECHNIQUE_CODE_PATTERN);
  return match ? match[0] : "";
}

function extractTechniqueName(value, code) {
  const text = String(value || "").trim();
  if (!text || !code || text.toUpperCase() === code) return "";

  const withoutTrailingCode = text.replace(/\(\s*T\d{4}(?:\.\d{3})?\s*\)/i, "").trim();
  if (withoutTrailingCode && withoutTrailingCode.toUpperCase() !== code) return withoutTrailingCode;

  const leadingCodePattern = new RegExp(`^${escapeForRegex(code)}\\s*(?:[-:]\\s*)?`, "i");
  const afterLeadingCode = text.replace(leadingCodePattern, "").trim();
  const unwrapped = afterLeadingCode.replace(/^\((.*)\)$/, "$1").trim();
  if (unwrapped && unwrapped.toUpperCase() !== code) return unwrapped;

  return "";
}

function buildMitreTechniqueNameMap() {
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
}

const MITRE_TECHNIQUE_NAMES = buildMitreTechniqueNameMap();

function normalizeTechniqueValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const code = extractTechniqueCode(raw);
  return code || raw;
}

function normalizeTechniqueList(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const normalized = [];
  value.forEach((entry) => {
    const technique = normalizeTechniqueValue(entry);
    if (!technique || seen.has(technique)) return;
    seen.add(technique);
    normalized.push(technique);
  });
  return normalized;
}

function formatTechniqueLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const code = extractTechniqueCode(raw);
  if (!code) return raw;

  const explicitName = extractTechniqueName(raw, code);
  const catalogName = MITRE_TECHNIQUE_NAMES.get(code);
  const name = explicitName || catalogName;
  return name ? `${code} (${name})` : code;
}

function buildTechniqueOptions(modes) {
  const optionMap = new Map();
  const upsertOption = (value, label) => {
    const normalizedValue = normalizeTechniqueValue(value);
    if (!normalizedValue) return;
    const displayLabel = String(label || formatTechniqueLabel(normalizedValue)).trim() || normalizedValue;
    optionMap.set(normalizedValue, displayLabel);
  };

  Array.from(MITRE_TECHNIQUE_NAMES.entries()).forEach(([code, name]) => {
    upsertOption(code, `${code} (${name})`);
  });

  (modes || []).forEach((mode) => {
    (mode.technics || []).forEach((technique) => {
      upsertOption(technique, formatTechniqueLabel(technique));
    });
  });

  return Array.from(optionMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
}

function ContextEditor({ context, onSave, readOnly = false }) {
  const [draft, setDraft] = useState(context || {});

  return (
    <RiskCard>
      <RiskSectionHeader title="Contexte de l'etude" subtitle="Edition des informations generales de l'atelier" />
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Description</label>
          <textarea disabled={readOnly} className="min-h-[90px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100" value={draft.description || ""} onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Perimetre</label>
          <input disabled={readOnly} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100" value={draft.perimeter || ""} onChange={(event) => setDraft((prev) => ({ ...prev, perimeter: event.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Environnement</label>
          <input disabled={readOnly} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100" value={draft.environment || ""} onChange={(event) => setDraft((prev) => ({ ...prev, environment: event.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Hypotheses</label>
          <textarea disabled={readOnly} className="min-h-[90px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100" value={draft.hypotheses || ""} onChange={(event) => setDraft((prev) => ({ ...prev, hypotheses: event.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Contraintes</label>
          <textarea disabled={readOnly} className="min-h-[90px] w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100" value={draft.constraints || ""} onChange={(event) => setDraft((prev) => ({ ...prev, constraints: event.target.value }))} />
        </div>
      </div>
      <div className="flex justify-end border-t border-slate-200 p-4">
        <button type="button" disabled={readOnly} onClick={() => onSave(draft)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white enabled:hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          Enregistrer le contexte
        </button>
      </div>
    </RiskCard>
  );
}

function MatrixCard({ title, children }) {
  return (
    <RiskCard>
      <RiskSectionHeader title={title} />
      <div className="p-5">{children}</div>
    </RiskCard>
  );
}

function getVisibleWorkshopSteps(study, workshopMeta) {
  if (!workshopMeta?.steps?.length) return [];
  if (workshopMeta.id !== 5) return workshopMeta.steps;

  const hiddenStepIds = new Set([
    "risk_map",
    "criteria",
    "residual_matrix",
    "governance",
    "protection",
    "defense",
    "resilience",
    "conformite",
  ]);

  return workshopMeta.steps.filter((step) => !hiddenStepIds.has(step.id));
}

function workshopStepRenderer({ study, workshopId, stepId, upsert, remove, updateContext, readOnly, riskOwners }) {
  const w1 = study.workshop1;
  const w2 = study.workshop2;
  const w3 = study.workshop3;
  const w4 = study.workshop4;
  const w5 = study.workshop5;

  const missionOptions = (w1.missions || []).map((mission) => ({ value: mission.id, label: mission.name }));
  const businessValueOptions = (w1.businessValues || []).map((value) => ({ value: value.id, label: value.name }));
  const fearedOptions = (w1.fearedEvents || []).map((event) => ({ value: event.id, label: event.description?.slice(0, 45) || "Evenement" }));
  const sourceOptions = (w2.riskSources || []).map((source) => ({ value: source.id, label: source.name }));
  const objectiveOptions = (w2.targetObjectives || []).map((objective) => ({ value: objective.id, label: objective.name }));
  const pairOptions = (w2.sourceObjectivePairs || [])
    .filter((pair) => pair.retained === true || pair.retained === "true")
    .map((pair) => {
      const source = w2.riskSources.find((entry) => entry.id === pair.riskSourceId);
      const objective = w2.targetObjectives.find((entry) => entry.id === pair.targetObjectiveId);
      return { value: pair.id, label: `${source?.name || "Source"} -> ${objective?.name || "Objectif"}` };
    });
  const stakeholderOptions = (w3.stakeholders || []).map((stakeholder) => ({ value: stakeholder.id, label: stakeholder.name }));
  const strategicScenarioOptions = (w3.strategicScenarios || []).map((scenario) => ({ value: scenario.id, label: scenario.name }));
  const strategicScenarioLabelById = new Map((w3.strategicScenarios || []).map((scenario) => [scenario.id, scenario.name]));
  const operationalModeOptions = (w4.operationalModes || []).map((mode) => {
    const scenarioLabel = strategicScenarioLabelById.get(mode.strategicScenarioId);
    return {
      value: mode.id,
      label: scenarioLabel ? `${mode.name} (${scenarioLabel})` : mode.name,
      strategicScenarioId: mode.strategicScenarioId,
    };
  });
  const supportingAssetOptions = (w1.supportingAssets || []).map((asset) => ({ value: asset.id, label: asset.name }));
  const operationalScenarioOptions = (w4.operationalScenarios || []).map((scenario) => ({ value: scenario.id, label: scenario.name }));
  const riskEntryOptions = (w5.riskEntries || []).map((risk) => ({ value: risk.id, label: w4.operationalScenarios.find((scenario) => scenario.id === risk.operationalScenarioId)?.name || "Risque" }));
  const measureOptions = (w5.measures || []).map((measure) => ({ value: measure.id, label: measure.name }));
  const ownerNameById = new Map((riskOwners || []).map((owner) => [owner.id, owner.name]));
  const ownerOptionsMap = new Map(
    (riskOwners || []).map((owner) => [owner.id, owner.email ? `${owner.name} (${owner.email})` : owner.name]),
  );
  (w5.riskEntries || []).forEach((entry) => {
    const ownerId = String(entry?.ownerUserId || "").trim();
    if (!ownerId || ownerOptionsMap.has(ownerId)) return;
    ownerOptionsMap.set(ownerId, entry.ownerName || ownerId);
  });
  const ownerOptions = Array.from(ownerOptionsMap.entries()).map(([value, label]) => ({ value, label }));

  if (workshopId === 1 && stepId === "team") {
    return (
      <RiskCrudTable
        title="Equipe et Responsabilites"
        subtitle="Definir les membres de l'etude"
        rows={w1.team || []}
        columns={[
          { key: "role", label: "Role" },
          { key: "name", label: "Nom" },
          { key: "responsibility", label: "Responsabilite" },
          { key: "contact", label: "Contact" },
        ]}
        fields={[
          { key: "role", label: "Role", type: "select", required: true, options: TEAM_ROLE_OPTIONS },
          { key: "name", label: "Nom", required: true },
          { key: "responsibility", label: "Responsabilite", required: true, full: true },
          { key: "contact", label: "Contact" },
        ]}
        onSave={(item) => upsert(1, "team", item)}
        onDelete={(id) => remove(1, "team", id)}
        deleteConfirmMessage={(row) => `Supprimer le membre "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un membre"
      />
    );
  }

  if (workshopId === 1 && stepId === "context") {
    return <ContextEditor context={w1.context} onSave={(ctx) => updateContext(1, ctx)} readOnly={readOnly} />;
  }

  if (workshopId === 1 && stepId === "missions") {
    return (
      <div className="space-y-4">
        <RiskCrudTable
          title="Missions"
          subtitle="Identifier les missions du perimetre"
          rows={w1.missions || []}
          columns={[{ key: "name", label: "Mission" }, { key: "description", label: "Description" }]}
          fields={[
            { key: "name", label: "Mission", required: true },
            { key: "description", label: "Description", type: "textarea", full: true },
          ]}
          onSave={(item) => upsert(1, "missions", item)}
          onDelete={(id) => remove(1, "missions", id)}
          deleteConfirmMessage={(row) => `Supprimer la mission "${row?.name || "sans nom"}" ?`}
          readOnly={readOnly}
          addLabel="Ajouter une mission"
        />
        <RiskCrudTable
          title="Valeurs Metier"
          subtitle="Lier les valeurs metier aux missions"
          rows={w1.businessValues || []}
          columns={[
            {
              key: "missionId",
              label: "Mission",
              render: (row) => w1.missions.find((mission) => mission.id === row.missionId)?.name || "-",
            },
            { key: "name", label: "Valeur" },
            { key: "type", label: "Type" },
            { key: "description", label: "Description" },
          ]}
          fields={[
            { key: "missionId", label: "Mission", type: "select", required: true, options: missionOptions },
            { key: "name", label: "Valeur metier", required: true },
            { key: "type", label: "Type", type: "select", required: true, options: BUSINESS_VALUE_TYPE_OPTIONS },
            { key: "description", label: "Description", type: "textarea", full: true },
          ]}
          onSave={(item) => upsert(1, "businessValues", item)}
          onDelete={(id) => remove(1, "businessValues", id)}
          deleteConfirmMessage={(row) => `Supprimer la valeur metier "${row?.name || "sans nom"}" ?`}
          readOnly={readOnly}
          addLabel="Ajouter une valeur"
        />
      </div>
    );
  }
  if (workshopId === 1 && stepId === "assets") {
    return (
      <RiskCrudTable
        title="Biens supports"
        subtitle="Associer les biens supports aux valeurs metier"
        rows={w1.supportingAssets || []}
        columns={[
          {
            key: "businessValueId",
            label: "Valeur metier",
            render: (row) => w1.businessValues.find((value) => value.id === row.businessValueId)?.name || "-",
          },
          { key: "name", label: "Bien" },
          { key: "type", label: "Type" },
          { key: "location", label: "Localisation" },
          { key: "criticality", label: "Criticite" },
        ]}
        fields={[
          { key: "businessValueId", label: "Valeur metier", type: "select", required: true, options: businessValueOptions },
          { key: "name", label: "Bien support", required: true },
          { key: "type", label: "Type", type: "select", required: true, options: SUPPORTING_ASSET_TYPE_OPTIONS },
          { key: "location", label: "Localisation" },
          {
            key: "criticality",
            label: "Criticite",
            type: "select",
            required: true,
            options: CRITICALITY_OPTIONS,
          },
        ]}
        onSave={(item) => upsert(1, "supportingAssets", item)}
        onDelete={(id) => remove(1, "supportingAssets", id)}
        deleteConfirmMessage={(row) => `Supprimer le bien support "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un bien"
      />
    );
  }

  if (workshopId === 1 && stepId === "feared") {
    return (
      <RiskCrudTable
        title="Evenements redoutes"
        subtitle="Evaluer les impacts redoutes"
        rows={w1.fearedEvents || []}
        columns={[
          {
            key: "businessValueId",
            label: "Valeur metier",
            render: (row) => w1.businessValues.find((value) => value.id === row.businessValueId)?.name || "-",
          },
          { key: "description", label: "Evenement" },
          { key: "impact", label: "Impact" },
          { key: "gravity", label: "Gravite", render: (row) => `G${row.gravity} - ${G_LABELS[row.gravity] || "-"}` },
        ]}
        fields={[
          { key: "businessValueId", label: "Valeur metier", type: "select", required: true, options: businessValueOptions },
          { key: "description", label: "Evenement", required: true, full: true },
          { key: "impact", label: "Impact", type: "textarea", full: true },
          {
            key: "gravity",
            label: "Gravite",
            type: "select",
            required: true,
            options: GRAVITY_OPTIONS,
          },
        ]}
        onSave={(item) => upsert(1, "fearedEvents", { ...item, gravity: normalizeScale(item.gravity) })}
        onDelete={(id) => remove(1, "fearedEvents", id)}
        deleteConfirmMessage={(row) => `Supprimer l'evenement "${row?.description || "sans description"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un evenement"
      />
    );
  }

  if (workshopId === 1 && stepId === "iso") {
    return (
      <RiskCrudTable
        title="Controles ISO 27001:2022"
        rows={w1.isoControls || []}
        columns={[
          { key: "reference", label: "Reference" },
          { key: "name", label: "Controle" },
          { key: "status", label: "Statut" },
          { key: "comments", label: "Commentaires" },
        ]}
        fields={[
          { key: "reference", label: "Reference", required: true },
          { key: "name", label: "Controle", required: true, full: true },
          {
            key: "status",
            label: "Statut",
            type: "select",
            required: true,
            options: ISO_STATUS_OPTIONS,
          },
          { key: "comments", label: "Commentaires", type: "textarea", full: true },
        ]}
        onSave={(item) => upsert(1, "isoControls", item)}
        onDelete={(id) => remove(1, "isoControls", id)}
        deleteConfirmMessage={(row) => `Supprimer le controle "${row?.reference || row?.name || "sans reference"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un controle"
      />
    );
  }

  if (workshopId === 2 && stepId === "pairs") {
    return (
      <RiskCrudTable
        title="Identification des couples"
        rows={w2.sourceObjectivePairs || []}
        columns={[
          { key: "riskSourceId", label: "Source", render: (row) => w2.riskSources.find((source) => source.id === row.riskSourceId)?.name || "-" },
          { key: "targetObjectiveId", label: "Objectif", render: (row) => w2.targetObjectives.find((objective) => objective.id === row.targetObjectiveId)?.name || "-" },
          { key: "retained", label: "Pertinent", render: (row) => (row.retained ? "Oui" : "Non") },
          { key: "justification", label: "Justification" },
        ]}
        fields={[
          { key: "riskSourceId", label: "Source", type: "select", required: true, options: sourceOptions },
          {
            key: "targetObjectiveId",
            label: "Objectif",
            type: "select",
            required: true,
            options: objectiveOptions,
            validate: (value, draft) => {
              if (!draft?.riskSourceId || !value) return "";
              const duplicate = (w2.sourceObjectivePairs || []).some(
                (pair) =>
                  pair.riskSourceId === draft.riskSourceId
                  && pair.targetObjectiveId === value
                  && pair.id !== draft.id,
              );
              return duplicate ? "Ce couple Source / Objectif existe deja." : "";
            },
          },
          { key: "retained", label: "Pertinence", type: "select", required: true, options: [{ value: "true", label: "Pertinent" }, { value: "false", label: "Non pertinent" }] },
          {
            key: "justification",
            label: "Justification",
            type: "textarea",
            full: true,
            requiredWhen: (draft) => draft?.retained === "false" || draft?.retained === false,
            requiredMessage: "La justification est obligatoire pour un couple non pertinent.",
          },
        ]}
        onSave={(item) => upsert(2, "sourceObjectivePairs", { ...item, retained: item.retained === true || item.retained === "true" })}
        onDelete={(id) => remove(2, "sourceObjectivePairs", id)}
        deleteConfirmMessage="Supprimer ce couple source/objectif ?"
        readOnly={readOnly}
        addLabel="Ajouter un couple"
      />
    );
  }

  if (workshopId === 2 && stepId === "matrix") {
    return (
      <MatrixCard title="Tableau de Reference (Pertinence)">
        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Source / Objectif</th>
                {(w2.targetObjectives || []).map((objective) => (
                  <th key={objective.id} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">{objective.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(w2.riskSources || []).map((source) => (
                <tr key={source.id} className="border-t border-slate-200">
                  <td className="px-3 py-2 font-semibold text-slate-800">{source.name}</td>
                  {(w2.targetObjectives || []).map((objective) => {
                    const pair = (w2.sourceObjectivePairs || []).find((entry) => entry.riskSourceId === source.id && entry.targetObjectiveId === objective.id);
                    const value = pair ? (pair.retained ? "Oui" : "Non") : "-";
                    return (
                      <td key={`${source.id}-${objective.id}`} className="px-3 py-2 text-sm text-slate-700">
                        <span className={`risk-cell-badge ${value === "Oui" ? "risk-cell-badge-success" : "risk-cell-badge-neutral"}`}>{value}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MatrixCard>
    );
  }

  if (workshopId === 2 && stepId === "sources") {
    return (
      <div className="space-y-4">
        <RiskCrudTable
          title="Caracterisation des Sources de Risque"
          rows={w2.riskSources || []}
          columns={[{ key: "name", label: "Source" }, { key: "type", label: "Type" }, { key: "motivation", label: "Motivation" }, { key: "capability", label: "Capacite" }]}
          fields={[
            { key: "name", label: "Source", required: true },
            { key: "type", label: "Type", type: "select", required: true, options: RISK_SOURCE_TYPE_OPTIONS },
            { key: "motivation", label: "Motivation", type: "textarea", full: true },
            { key: "capability", label: "Capacite", type: "select", options: SCALE_1_4_OPTIONS, required: true },
          ]}
          onSave={(item) => upsert(2, "riskSources", { ...item, capability: normalizeScale(item.capability) })}
          onDelete={(id) => remove(2, "riskSources", id)}
          deleteConfirmMessage={(row) => `Supprimer la source "${row?.name || "sans nom"}" ?`}
          readOnly={readOnly}
          addLabel="Ajouter une source"
        />
        <RiskCrudTable
          title="Objectifs vises"
          rows={w2.targetObjectives || []}
          columns={[
            { key: "name", label: "Objectif" },
            { key: "description", label: "Description" },
            {
              key: "fearedEventIds",
              label: "Evenements associes",
              render: (row) => {
                const names = (row.fearedEventIds || [])
                  .map((eventId) => w1.fearedEvents.find((event) => event.id === eventId)?.description)
                  .filter(Boolean);
                if (!names.length) return "-";
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {names.map((name, index) => (
                      <span
                        key={`${row.id || "objectif"}-event-${index}`}
                        className="risk-cell-badge risk-cell-badge-info"
                        title={name}
                      >
                        {truncateLabel(name)}
                      </span>
                    ))}
                  </div>
                );
              },
            },
          ]}
          fields={[
            { key: "name", label: "Objectif", required: true },
            { key: "description", label: "Description", type: "textarea", full: true },
            { key: "fearedEventIds", label: "Evenements redoutes associes", type: "multiselect", options: fearedOptions, full: true },
          ]}
          onSave={(item) => upsert(2, "targetObjectives", item)}
          onDelete={(id) => remove(2, "targetObjectives", id)}
          deleteConfirmMessage={(row) => `Supprimer l'objectif "${row?.name || "sans nom"}" ?`}
          readOnly={readOnly}
          addLabel="Ajouter un objectif"
        />
      </div>
    );
  }
  if (workshopId === 3 && stepId === "stakeholder_matrix") {
    return (
      <MatrixCard title="Matrice de Criticite des Parties Prenantes">
        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Partie prenante</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Type</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Exposition</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Fiabilite</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Zone</th>
              </tr>
            </thead>
            <tbody>
              {(w3.stakeholders || []).map((stakeholder) => {
                const score = Number(stakeholder.exposure || 1) * Number(stakeholder.reliability || 1);
                const zone = score >= 9 ? "Critique" : score >= 6 ? "Elevee" : score >= 3 ? "Moderee" : "Faible";
                return (
                  <tr key={stakeholder.id} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-semibold text-slate-800">{stakeholder.name}</td>
                    <td className="px-3 py-2 text-slate-600"><span className="risk-cell-badge risk-cell-badge-info">{stakeholder.type || "-"}</span></td>
                    <td className="px-3 py-2 text-slate-600"><span className={`risk-cell-badge ${Number(stakeholder.exposure || 1) >= 4 ? "risk-cell-badge-danger" : Number(stakeholder.exposure || 1) >= 3 ? "risk-cell-badge-orange" : Number(stakeholder.exposure || 1) >= 2 ? "risk-cell-badge-warning" : "risk-cell-badge-success"}`}>{stakeholder.exposure || "-"}/4</span></td>
                    <td className="px-3 py-2 text-slate-600"><span className={`risk-cell-badge ${Number(stakeholder.reliability || 1) >= 4 ? "risk-cell-badge-danger" : Number(stakeholder.reliability || 1) >= 3 ? "risk-cell-badge-orange" : Number(stakeholder.reliability || 1) >= 2 ? "risk-cell-badge-warning" : "risk-cell-badge-success"}`}>{stakeholder.reliability || "-"}/4</span></td>
                    <td className="px-3 py-2 text-slate-700"><span className={`risk-cell-badge ${zone === "Critique" ? "risk-cell-badge-danger" : zone === "Elevee" ? "risk-cell-badge-orange" : zone === "Moderee" ? "risk-cell-badge-warning" : "risk-cell-badge-success"}`}>{zone}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </MatrixCard>
    );
  }

  if (workshopId === 3 && stepId === "threat_zones") {
    return (
      <MatrixCard title="Zones de menace des parties prenantes">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            { label: "Zone critique", min: 9, max: 16, tone: "border-red-200 bg-red-50 text-red-700" },
            { label: "Zone elevee", min: 6, max: 8, tone: "border-amber-200 bg-amber-50 text-amber-700" },
            { label: "Zone moderee", min: 3, max: 5, tone: "border-blue-200 bg-blue-50 text-blue-700" },
            { label: "Zone faible", min: 1, max: 2, tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
          ].map((zone) => {
            const people = (w3.stakeholders || []).filter((stakeholder) => {
              const score = Number(stakeholder.exposure || 1) * Number(stakeholder.reliability || 1);
              return score >= zone.min && score <= zone.max;
            });
            return (
              <div key={zone.label} className={`rounded-xl border p-4 ${zone.tone}`}>
                <div className="text-sm font-bold">{zone.label}</div>
                <div className="mt-2 flex flex-wrap gap-2">{people.length ? people.map((p) => <span key={p.id} className="rounded-full border border-current/30 bg-white/80 px-2 py-1 text-xs font-semibold">{p.name}</span>) : <span className="text-xs">Aucune partie prenante</span>}</div>
              </div>
            );
          })}
        </div>
      </MatrixCard>
    );
  }

  if (workshopId === 3 && stepId === "stakeholders") {
    return (
      <RiskCrudTable
        title="Parties prenantes"
        rows={w3.stakeholders || []}
        columns={[{ key: "name", label: "Nom" }, { key: "type", label: "Type" }, { key: "exposure", label: "Exposition" }, { key: "reliability", label: "Fiabilite" }, { key: "access", label: "Acces" }]}
        fields={[
          { key: "name", label: "Nom", required: true },
          { key: "type", label: "Type", type: "select", required: true, options: STAKEHOLDER_TYPE_OPTIONS },
          { key: "exposure", label: "Exposition", type: "select", required: true, options: SCALE_1_4_OPTIONS },
          { key: "reliability", label: "Fiabilite", type: "select", required: true, options: SCALE_1_4_OPTIONS },
          { key: "access", label: "Acces", type: "select", required: true, options: STAKEHOLDER_ACCESS_OPTIONS },
        ]}
        onSave={(item) => upsert(3, "stakeholders", { ...item, exposure: normalizeScale(item.exposure), reliability: normalizeScale(item.reliability) })}
        onDelete={(id) => remove(3, "stakeholders", id)}
        deleteConfirmMessage={(row) => `Supprimer la partie prenante "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter une partie prenante"
      />
    );
  }

  if (workshopId === 3 && stepId === "strategic") {
    const pairLabelById = (pairId) => {
      const pair = (w2.sourceObjectivePairs || []).find((entry) => entry.id === pairId);
      if (!pair) return "-";
      const source = w2.riskSources.find((entry) => entry.id === pair.riskSourceId)?.name || "Source";
      const objective = w2.targetObjectives.find((entry) => entry.id === pair.targetObjectiveId)?.name || "Objectif";
      return `${source} -> ${objective}`;
    };

    return (
      <RiskCrudTable
        title="Scenarios strategiques"
        rows={w3.strategicScenarios || []}
        columns={[
          { key: "name", label: "Scenario" },
          { key: "coupleId", label: "Couple SR/OV", render: (row) => pairLabelById(row.coupleId) },
          {
            key: "stakeholderIds",
            label: "Parties prenantes",
            render: (row) => {
              const names = (row.stakeholderIds || [])
                .map((id) => w3.stakeholders.find((item) => item.id === id)?.name)
                .filter(Boolean);
              if (!names.length) return "-";
              return (
                <div className="flex flex-wrap gap-1.5">
                  {names.map((name, index) => (
                    <span key={`${row.id || "scenario"}-stakeholder-${index}`} className="risk-cell-badge risk-cell-badge-info" title={name}>
                      {truncateLabel(name, 48)}
                    </span>
                  ))}
                </div>
              );
            },
          },
          { key: "gravity", label: "Gravite" },
          { key: "description", label: "Description" },
        ]}
        fields={[
          { key: "name", label: "Scenario", required: true, full: true },
          { key: "coupleId", label: "Couple SR/OV", type: "select", required: true, options: pairOptions },
          { key: "gravity", label: "Gravite", type: "select", options: GRAVITY_OPTIONS, required: true },
          { key: "stakeholderIds", label: "Parties prenantes", type: "multiselect", options: stakeholderOptions, required: true, full: true },
          { key: "description", label: "Description", type: "textarea", full: true },
        ]}
        onSave={(item) => upsert(3, "strategicScenarios", { ...item, gravity: normalizeScale(item.gravity) })}
        onDelete={(id) => remove(3, "strategicScenarios", id)}
        deleteConfirmMessage={(row) => `Supprimer le scenario strategique "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un scenario"
      />
    );
  }

  if (workshopId === 3 && stepId === "strategic_treat") {
    return (
      <RiskCrudTable
        title="Traitement des risques strategiques"
        rows={w3.treatments || []}
        columns={[
          {
            key: "scenarioId",
            label: "Scenario",
            render: (row) => {
              const label = w3.strategicScenarios.find((entry) => entry.id === row.scenarioId)?.name || "-";
              if (label === "-") return "-";
              return <span className="risk-cell-badge risk-cell-badge-info" title={label}>{truncateLabel(label, 56)}</span>;
            },
          },
          {
            key: "decision",
            label: "Decision",
            render: (row) => {
              const decision = row.decision || "-";
              if (decision === "-") return "-";
              return <span className={`risk-cell-badge ${decisionBadgeClass(decision)}`}>{decision}</span>;
            },
          },
          { key: "justification", label: "Justification" },
        ]}
        fields={[
          {
            key: "scenarioId",
            label: "Scenario",
            type: "select",
            required: true,
            options: strategicScenarioOptions,
            validate: (value, draft) => {
              if (!value) return "";
              const duplicate = (w3.treatments || []).some((item) => item.scenarioId === value && item.id !== draft.id);
              return duplicate ? "Un traitement existe deja pour ce scenario." : "";
            },
          },
          { key: "decision", label: "Decision", type: "select", required: true, options: TREATMENT_OPTIONS },
          { key: "justification", label: "Justification", type: "textarea", required: true, full: true },
        ]}
        onSave={(item) => upsert(3, "treatments", item)}
        onDelete={(id) => remove(3, "treatments", id)}
        deleteConfirmMessage="Supprimer ce traitement strategique ?"
        readOnly={readOnly}
        addLabel="Ajouter un traitement"
      />
    );
  }

  if (workshopId === 4 && stepId === "likelihood_scale") {
    return (
      <MatrixCard title="Echelle de calcul de vraisemblance">
        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr><th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Niveau</th><th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Libelle</th><th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Description</th></tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((v) => (
                <tr key={v} className="border-t border-slate-200">
                  <td className="px-3 py-2 font-semibold text-slate-800"><span className={`risk-cell-badge ${v === 4 ? "risk-cell-badge-danger" : v === 3 ? "risk-cell-badge-orange" : v === 2 ? "risk-cell-badge-warning" : "risk-cell-badge-success"}`}>V{v}</span></td>
                  <td className="px-3 py-2 text-slate-700"><span className={`risk-cell-badge ${v === 4 ? "risk-cell-badge-danger" : v === 3 ? "risk-cell-badge-orange" : v === 2 ? "risk-cell-badge-warning" : "risk-cell-badge-success"}`}>{V_LABELS[v]}</span></td>
                  <td className="px-3 py-2 text-slate-600">{v === 1 ? "Attaque peu probable" : v === 2 ? "Attaque possible" : v === 3 ? "Attaque probable" : "Attaque tres probable"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MatrixCard>
    );
  }

  if (workshopId === 4 && stepId === "op_modes") {
    const operationalModeRows = (w4.operationalModes || []).map((mode) => ({
      ...mode,
      technics: normalizeTechniqueList(mode.technics),
    }));
    const techniqueOptions = buildTechniqueOptions(operationalModeRows);
    const techniqueLabelByValue = new Map(techniqueOptions.map((option) => [option.value, option.label]));

    return (
      <RiskCrudTable
        title="Modes operatoires"
        rows={operationalModeRows}
        columns={[
          { key: "name", label: "Mode" },
          { key: "strategicScenarioId", label: "Scenario strategique", render: (row) => w3.strategicScenarios.find((entry) => entry.id === row.strategicScenarioId)?.name || "-" },
          {
            key: "technics",
            label: "Techniques",
            render: (row) => {
              const labels = normalizeTechniqueList(row.technics)
                .map((technique) => techniqueLabelByValue.get(technique) || formatTechniqueLabel(technique))
                .filter(Boolean);
              return labels.length ? labels : "-";
            },
          },
          { key: "description", label: "Description" },
        ]}
        fields={[
          { key: "name", label: "Mode", required: true },
          { key: "strategicScenarioId", label: "Scenario strategique", type: "select", required: true, options: strategicScenarioOptions },
          {
            key: "technics",
            label: `Techniques (${techniqueOptions.length})`,
            type: "multiselect",
            options: techniqueOptions,
            searchPlaceholder: "Rechercher un code ou libelle MITRE...",
          },
          { key: "description", label: "Description", type: "textarea", full: true },
        ]}
        onSave={(item) => upsert(4, "operationalModes", { ...item, technics: normalizeTechniqueList(item.technics) })}
        onDelete={(id) => remove(4, "operationalModes", id)}
        deleteConfirmMessage={(row) => `Supprimer le mode operatoire "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un mode"
      />
    );
  }
  if (workshopId === 4 && stepId === "op_scenarios") {
    const modeLabelById = (modeId) => w4.operationalModes.find((entry) => entry.id === modeId)?.name;
    const assetLabelById = (assetId) => w1.supportingAssets.find((entry) => entry.id === assetId)?.name;
    const renderTagList = (labels) => {
      if (!labels.length) return "-";
      return (
        <div className="risk-cell-tag-list">
          {labels.map((label) => (
            <span key={label} className="risk-cell-tag">{label}</span>
          ))}
        </div>
      );
    };

    return (
      <RiskCrudTable
        title="Scenarios operationnels"
        rows={w4.operationalScenarios || []}
        columns={[
          { key: "name", label: "Scenario" },
          { key: "description", label: "Description", render: (row) => truncateLabel(row.description || "-", 110) },
          { key: "strategicScenarioId", label: "Scenario strategique", render: (row) => w3.strategicScenarios.find((entry) => entry.id === row.strategicScenarioId)?.name || "-" },
          {
            key: "operationalModeIds",
            label: "Modes operatoires",
            render: (row) => {
              const labels = (row.operationalModeIds || []).map((id) => modeLabelById(id)).filter(Boolean);
              return renderTagList(labels);
            },
          },
          {
            key: "supportingAssetIds",
            label: "Biens supports",
            render: (row) => {
              const labels = (row.supportingAssetIds || []).map((id) => assetLabelById(id)).filter(Boolean);
              return renderTagList(labels);
            },
          },
          { key: "likelihood", label: "Vraisemblance", render: (row) => `V${row.likelihood} - ${V_LABELS[row.likelihood] || "-"}` },
        ]}
        fields={[
          { key: "name", label: "Scenario", required: true, full: true },
          { key: "strategicScenarioId", label: "Scenario strategique", type: "select", required: true, options: strategicScenarioOptions },
          {
            key: "operationalModeIds",
            label: "Modes operatoires",
            type: "multiselect",
            options: (draft) => {
              const scenarioId = draft?.strategicScenarioId;
              const filtered = scenarioId
                ? operationalModeOptions.filter((option) => option.strategicScenarioId === scenarioId)
                : operationalModeOptions;
              return filtered.map((option) => ({ value: option.value, label: option.label }));
            },
            required: true,
            full: true,
            searchPlaceholder: "Rechercher un mode operatoire...",
            validate: (value, draft) => {
              if (!Array.isArray(value) || !value.length) return "";
              if (!draft?.strategicScenarioId) return "";
              const invalid = value.some((modeId) => {
                const mode = w4.operationalModes.find((entry) => entry.id === modeId);
                return mode && mode.strategicScenarioId !== draft.strategicScenarioId;
              });
              return invalid ? "Les modes operatoires doivent appartenir au meme scenario strategique." : "";
            },
          },
          { key: "supportingAssetIds", label: "Biens supports", type: "multiselect", options: supportingAssetOptions, full: true },
          { key: "likelihood", label: "Vraisemblance", type: "select", options: LIKELIHOOD_OPTIONS, required: true },
          { key: "description", label: "Description", type: "textarea", full: true },
        ]}
        onSave={(item) => upsert(4, "operationalScenarios", {
          ...item,
          likelihood: normalizeScale(item.likelihood),
          operationalModeIds: (item.operationalModeIds || []).filter((modeId) => {
            const mode = w4.operationalModes.find((entry) => entry.id === modeId);
            return mode && mode.strategicScenarioId === item.strategicScenarioId;
          }),
        })}
        onDelete={(id) => remove(4, "operationalScenarios", id)}
        deleteConfirmMessage={(row) => `Supprimer le scenario operationnel "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter un scenario"
      />
    );
  }

  if (workshopId === 5 && stepId === "risk_register") {
    return (
      <RiskCrudTable
        title="Registre des Risques"
        rows={w5.riskEntries || []}
        columns={[
          { key: "operationalScenarioId", label: "Scenario", render: (row) => w4.operationalScenarios.find((entry) => entry.id === row.operationalScenarioId)?.name || "-" },
          { key: "gravity", label: "Gravite", render: (row) => `G${row.gravity} - ${G_LABELS[row.gravity] || "-"}` },
          { key: "likelihood", label: "Vraisemblance", render: (row) => `V${row.likelihood} - ${V_LABELS[row.likelihood] || "-"}` },
          { key: "level", label: "Niveau", render: (row) => `${riskLevel(row.gravity, row.likelihood).label} (${riskLevel(row.gravity, row.likelihood).score})` },
          { key: "status", label: "Statut", render: (row) => riskEntryStatusLabel(row.status) },
          { key: "ownerUserId", label: "Responsable", render: (row) => ownerNameById.get(row.ownerUserId) || row.ownerName || "-" },
          { key: "treatment", label: "Traitement", render: (row) => TREATMENT_LABEL_BY_VALUE.get(normalizeTreatmentValue(row.treatment)) || row.treatment || "-" },
          { key: "notes", label: "Notes", render: (row) => truncateLabel(row.notes || "-", 110) },
        ]}
        fields={[
          { key: "operationalScenarioId", label: "Scenario operationnel", type: "select", required: true, options: operationalScenarioOptions },
          { key: "gravity", label: "Gravite", type: "select", options: GRAVITY_OPTIONS, required: true },
          { key: "likelihood", label: "Vraisemblance", type: "select", options: LIKELIHOOD_OPTIONS, required: true },
          { key: "status", label: "Statut", type: "select", required: true, options: RISK_ENTRY_STATUS_OPTIONS },
          {
            key: "ownerUserId",
            label: "Responsable",
            type: "select",
            options: ownerOptions,
            requiredWhen: (draft) => ["en_traitement", "traite", "accepte"].includes(normalizeRiskEntryStatus(draft.status)),
            validate: (value, draft) => {
              const status = normalizeRiskEntryStatus(draft.status);
              if (["en_traitement", "traite", "accepte"].includes(status) && !String(value || "").trim()) {
                return "Le responsable est requis pour ce statut.";
              }
              return "";
            },
          },
          { key: "treatment", label: "Traitement", type: "select", required: true, options: TREATMENT_OPTIONS },
          { key: "notes", label: "Notes", type: "textarea", full: true },
        ]}
        onSave={(item) => upsert(5, "riskEntries", {
          ...item,
          gravity: normalizeScale(item.gravity),
          likelihood: normalizeScale(item.likelihood),
          status: normalizeRiskEntryStatus(item.status),
          ownerUserId: String(item.ownerUserId || "").trim(),
          ownerName: ownerNameById.get(String(item.ownerUserId || "").trim()) || "",
          treatment: normalizeTreatmentValue(item.treatment),
        })}
        onDelete={(id) => remove(5, "riskEntries", id)}
        deleteConfirmMessage="Supprimer cette entree du registre des risques ?"
        readOnly={readOnly}
        addLabel="Ajouter un risque"
      />
    );
  }

  if (workshopId === 5 && stepId === "risk_map") {
    return <MatrixCard title="Matrice de Risque / Cartographie"><p className="text-sm text-slate-600">La cartographie est calculee automatiquement a partir du registre des risques (gravite x vraisemblance).</p></MatrixCard>;
  }
  if (workshopId === 5 && stepId === "criteria") {
    return <MatrixCard title="Tableau des Criteres de Traitement"><p className="text-sm text-slate-600">Les criteres de traitement sont derives du registre des risques et des decisions associees.</p></MatrixCard>;
  }
  if (workshopId === 5 && stepId === "residual_matrix") {
    return <MatrixCard title="Matrice des Risques Residuels"><p className="text-sm text-slate-600">La matrice residuelle est calculee a partir des risques residuels saisis.</p></MatrixCard>;
  }

  if (workshopId === 5 && ["measures", "governance", "protection", "defense", "resilience", "conformite"].includes(stepId)) {
    const categoryMap = { governance: "Gouvernance", protection: "Protection", defense: "Defense", resilience: "Resilience", conformite: "Conformite" };
    const filtered = stepId === "measures" ? w5.measures || [] : (w5.measures || []).filter((entry) => entry.category === categoryMap[stepId]);
    return (
      <RiskCrudTable
        title={stepId === "measures" ? "Tableau des Mesures de Securite" : categoryMap[stepId]}
        rows={filtered}
        columns={[{ key: "category", label: "Categorie" }, { key: "name", label: "Mesure" }, { key: "priority", label: "Priorite" }, { key: "status", label: "Statut" }]}
        fields={[
          { key: "category", label: "Categorie", type: "select", required: true, options: MEASURE_CATEGORIES.map((value) => ({ value, label: value })) },
          { key: "name", label: "Mesure", required: true, full: true },
          { key: "description", label: "Description", type: "textarea", full: true },
          { key: "priority", label: "Priorite", type: "select", required: true, options: MEASURE_PRIORITY_OPTIONS },
          { key: "status", label: "Statut", type: "select", required: true, options: MEASURE_STATUS_OPTIONS },
        ]}
        onSave={(item) => upsert(5, "measures", item)}
        onDelete={(id) => remove(5, "measures", id)}
        deleteConfirmMessage={(row) => `Supprimer la mesure "${row?.name || "sans nom"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter une mesure"
      />
    );
  }

  if (workshopId === 5 && stepId === "soa") {
    return (
      <RiskCrudTable
        title="SoA minimal"
        subtitle="Applicabilite des controles et lien avec les mesures de traitement."
        rows={w5.soa || []}
        columns={[
          { key: "reference", label: "Reference" },
          { key: "objective", label: "Objectif" },
          { key: "applicable", label: "Applicable", render: (row) => (row.applicable === "oui" ? "Oui" : "Non") },
          { key: "implementationStatus", label: "Mise en oeuvre" },
        ]}
        fields={[
          { key: "reference", label: "Reference controle", required: true, placeholder: "Ex: A.5.1" },
          { key: "objective", label: "Objectif", required: true, full: true },
          { key: "applicable", label: "Applicable", type: "select", required: true, options: YES_NO_OPTIONS },
          {
            key: "justification",
            label: "Justification",
            type: "textarea",
            full: true,
            requiredWhen: (draft) => draft?.applicable === "non",
            requiredMessage: "La justification est obligatoire quand le controle n'est pas applicable.",
          },
          { key: "implementationStatus", label: "Mise en oeuvre", type: "select", required: true, options: SOA_IMPLEMENTATION_OPTIONS },
          { key: "linkedMeasureIds", label: "Mesures associees", type: "multiselect", options: measureOptions, full: true },
        ]}
        onSave={(item) => upsert(5, "soa", item)}
        onDelete={(id) => remove(5, "soa", id)}
        deleteConfirmMessage={(row) => `Supprimer l'entree SoA "${row?.reference || "sans reference"}" ?`}
        readOnly={readOnly}
        addLabel="Ajouter une entree SoA"
      />
    );
  }

  if (workshopId === 5 && stepId === "residual_form") {
    return (
      <RiskCrudTable
        title="Risques residuels"
        rows={w5.residualRisks || []}
        columns={[
          { key: "riskEntryId", label: "Risque", render: (row) => w4.operationalScenarios.find((scenario) => scenario.id === w5.riskEntries.find((risk) => risk.id === row.riskEntryId)?.operationalScenarioId)?.name || "-" },
          { key: "residualGravity", label: "Gravite", render: (row) => `G${row.residualGravity} - ${G_LABELS[row.residualGravity] || "-"}` },
          { key: "residualLikelihood", label: "Vraisemblance", render: (row) => `V${row.residualLikelihood} - ${V_LABELS[row.residualLikelihood] || "-"}` },
          { key: "justification", label: "Justification" },
        ]}
        fields={[
          { key: "riskEntryId", label: "Risque reference", type: "select", required: true, options: riskEntryOptions },
          { key: "residualGravity", label: "Gravite residuelle", type: "select", options: GRAVITY_OPTIONS, required: true },
          { key: "residualLikelihood", label: "Vraisemblance residuelle", type: "select", options: LIKELIHOOD_OPTIONS, required: true },
          { key: "justification", label: "Justification", type: "textarea", required: true, full: true },
        ]}
        onSave={(item) => upsert(5, "residualRisks", { ...item, residualGravity: normalizeScale(item.residualGravity), residualLikelihood: normalizeScale(item.residualLikelihood) })}
        onDelete={(id) => remove(5, "residualRisks", id)}
        deleteConfirmMessage="Supprimer ce risque residuel ?"
        readOnly={readOnly}
        addLabel="Ajouter un risque residuel"
      />
    );
  }

  return <RiskCard className="p-8 text-center text-sm text-slate-500">Etape non disponible pour cet atelier.</RiskCard>;
}

function RiskWorkshopPage() {
  const navigate = useNavigate();
  const { id, atelierId } = useParams();
  const workshopId = Number(atelierId);

  const { getStudyById, updateWorkshopContext, upsertWorkshopItem, deleteWorkshopItem, owners, refreshOwners, loading } = useRiskStudies();
  const study = getStudyById(id);
  const workshopMeta = getWorkshopMeta(workshopId);
  const visibleSteps = useMemo(() => getVisibleWorkshopSteps(study, workshopMeta), [study, workshopMeta]);

  const [activeStep, setActiveStep] = useState(() => visibleSteps?.[0]?.id || workshopMeta?.steps?.[0]?.id || null);

  useEffect(() => {
    if (!visibleSteps?.length) {
      setActiveStep(null);
      return;
    }

    setActiveStep((prev) => {
      if (prev && visibleSteps.some((step) => step.id === prev)) return prev;
      return visibleSteps[0].id;
    });
  }, [visibleSteps]);

  useEffect(() => {
    if (Array.isArray(owners) && owners.length > 0) return;
    void refreshOwners();
  }, [owners, refreshOwners]);

  if (loading && !study) {
    return (
      <div className="risk-page p-6">
        <RiskCard className="mx-auto max-w-3xl p-8 text-center">
          <h2 className="text-xl font-black text-slate-900">Chargement de l'atelier...</h2>
          <p className="mt-2 text-sm text-slate-500">Recuperation des donnees de l'etude en cours.</p>
        </RiskCard>
      </div>
    );
  }

  if (!study || !workshopMeta) {
    return (
      <div className="risk-page p-6">
        <RiskCard className="mx-auto max-w-3xl p-8 text-center">
          <h2 className="text-xl font-black text-slate-900">Atelier introuvable</h2>
          <button type="button" onClick={() => navigate("/risques")} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Retour
          </button>
        </RiskCard>
      </div>
    );
  }

  const status = getEffectiveWorkshopStatus(study, workshopId);
  const blocked = isWorkshopBlocked(study, workshopId);
  const progress = getWorkshopProgress(study, workshopId);
  const currentStep = visibleSteps.find((step) => step.id === activeStep) || visibleSteps[0];
  const stepCount = visibleSteps.length || 1;
  const stepIndex = Math.max(0, visibleSteps.findIndex((step) => step.id === currentStep.id));
  const prevStep = stepIndex > 0 ? visibleSteps[stepIndex - 1] : null;
  const nextStep = stepIndex < visibleSteps.length - 1 ? visibleSteps[stepIndex + 1] : null;
  const stepPathPct = Math.round(((stepIndex + 1) / stepCount) * 100);

  return (
    <div className="risk-page risk-fade-up">
      <div className="risk-app-shell space-y-4">
        <RiskPageHeader
          variant="hero"
          title={workshopMeta.title}
          subtitle={workshopMeta.description}
          actions={(
            <>
              <button
                type="button"
                onClick={() => navigate(`/risques/etudes/${study.id}`)}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={14} /> Retour etude
              </button>
              {status === "termine" ? (
                <button
                  type="button"
                  onClick={() => printWorkshopLivrable(study, workshopId)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <FileText size={14} /> Telecharger livrable
                </button>
              ) : null}
            </>
          )}
        />

        <div className="risk-kpi-band">
          <div className="risk-kpi-grid">
            <RiskKpiTile label="Finalisation atelier" value={`${progress}%`} helper={`${stepCount} etapes`} primary progress={progress} />
            <RiskKpiTile label="Etape active" value={`${stepIndex + 1}/${stepCount}`} helper={currentStep.label} />
            <RiskKpiTile label="Etapes configurees" value={stepCount} helper={`Atelier ${workshopId}`} />
          </div>
        </div>

        <RiskCard className="risk-step-nav p-3">
          <div className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Parcours atelier</div>
          <div className="risk-workshop-step-summary mb-3">
            <div className="risk-workshop-step-summary-head">
              <span>Progression atelier</span>
              <span>{progress}%</span>
            </div>
            <div className="risk-workshop-step-summary-track">
              <span className="risk-workshop-step-summary-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="risk-step-list">
            {visibleSteps.map((step, index) => {
              const isActive = currentStep.id === step.id;
              const isPassed = index < stepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`risk-step-btn w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold ${
                    isActive
                      ? "risk-step-active"
                      : isPassed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="risk-step-index mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold">
                    {isPassed ? <Check size={11} /> : index + 1}
                  </span>
                  {step.label}
                </button>
              );
            })}
          </div>
        </RiskCard>

        <main className="space-y-4">
            {blocked ? (
              <RiskCallout tone="danger" title="Atelier bloque">
                Termine d'abord l'atelier precedent pour debloquer le workflow.
              </RiskCallout>
            ) : null}

            {workshopId === 5 && currentStep?.id === "risk_register" ? (
              <RiskCallout tone="info" title="Calcul automatique du niveau de risque">
                Le niveau est calcule automatiquement selon la formule Gravite x Vraisemblance.
              </RiskCallout>
            ) : null}

            <RiskCard className="risk-command-toolbar p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">Etape active</div>
                  <h2 className="mt-1 text-xl font-black text-slate-900">{currentStep.label}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <RiskStatusBadge status={status} />
                </div>
              </div>

              <div className="risk-workshop-stepbar mt-3">
                <div className="risk-workshop-stepbar-head">
                  <span>Parcours interne</span>
                  <span>{stepIndex + 1}/{stepCount}</span>
                </div>
                <div className="risk-workshop-stepbar-track">
                  <span className="risk-workshop-stepbar-fill" style={{ width: `${stepPathPct}%` }} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!prevStep}
                    onClick={() => prevStep && setActiveStep(prevStep.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft size={14} /> Precedent
                  </button>
                  <button
                    type="button"
                    disabled={!nextStep}
                    onClick={() => nextStep && setActiveStep(nextStep.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Suivant <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </RiskCard>

            {workshopStepRenderer({
              study,
              workshopId,
              stepId: currentStep.id,
              upsert: (wid, key, item) => upsertWorkshopItem(study.id, wid, key, item),
              remove: (wid, key, itemId) => deleteWorkshopItem(study.id, wid, key, itemId),
              updateContext: (wid, payload) => updateWorkshopContext(study.id, wid, payload),
              readOnly: blocked,
              riskOwners: owners,
            })}
        </main>
      </div>
    </div>
  );
}

  return { RiskWorkshopPage };
})();

const { RiskWorkshopPage } = __risk_workshop;


// Version monolithique complete du module Risques (context + pages + UI + model + export + theme)
// Non branchee dans App.js pour ne pas impacter l'application existante.
export default function RiskPageGlobalMonolith() {
  return (
    <RiskStudiesProvider>
      <RiskThemeStyleInjector />
      <div className="risk-theme">
        <Routes>
          <Route index element={<RiskStudiesPage />} />
          <Route path="etudes/:id" element={<RiskStudyDetailPage />} />
          <Route path="etudes/:id/atelier/:atelierId" element={<RiskWorkshopPage />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </div>
    </RiskStudiesProvider>
  );
}
