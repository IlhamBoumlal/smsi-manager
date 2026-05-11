// components/Admin/GestionRoles.jsx - Version connectée à l'API réelle
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Search, ArrowLeft, Shield, X, CheckCircle,
  Settings, AlertTriangle, MousePointerClick, SlidersHorizontal,
  LayoutGrid, List, FolderPlus, RefreshCw, Save
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5006/api';
const GRAD_BLUE    = "linear-gradient(135deg, #1D4ED8, #1E40AF)";
const FONT         = "'Sora', 'Segoe UI', sans-serif";
const GREEN_COLOR  = "#059669";
const GREEN_BG     = "#D1FAE5";
const GREEN_BORDER = "#6EE7B7";

// ─── Helper fetch ────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };
  if (options.body && options.method !== 'DELETE') config.body = JSON.stringify(options.body);

  const res = await fetch(`${API_BASE_URL}${path}`, config);

  if (!res.ok) {
    let errorMessage = `Erreur ${res.status}`;
    try {
      const err = await res.json();
      if (err.errors) {
        errorMessage = Array.isArray(err.errors) ? err.errors.join(', ') : err.errors;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
      }
    } catch (e) {
      errorMessage = res.statusText;
    }
    throw new Error(errorMessage);
  }
  
  if (res.status === 204) return null;
  
  const data = await res.json();
  return data;
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success' ? 'bg-green-500'
           : type === 'error'   ? 'bg-red-500'
           :                      'bg-blue-500';
  return (
    <div className={`fixed bottom-4 right-4 ${bg} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2`}>
      {type === 'error'   && <AlertTriangle size={16} />}
      {type === 'success' && <CheckCircle   size={16} />}
      {message}
    </div>
  );
}

// ─── Dropdown hook ────────────────────────────────────────────────────────────
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return { open, setOpen, ref };
}

// ─── Badges permission ────────────────────────────────────────────────────────
function RemovablePermBadge({ actionName, onRemove, disabled }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: GREEN_BG, color: GREEN_COLOR, border: `1px solid ${GREEN_BORDER}` }}
    >
      {actionName}
      {!disabled && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-60 transition-opacity">
          <X size={11} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}

function AddPermDropdown({ availableActions, onAdd, disabled }) {
  const { open, setOpen, ref } = useDropdown();
  if (disabled || availableActions.length === 0) return null;
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="text-xs text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap font-medium"
      >
        + Permissions
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px]">
          {availableActions.map(a => (
            <button
              key={a.actionId}
              onClick={() => { onAdd(a); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-green-50 text-left text-sm"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: GREEN_BORDER }} />
              <span style={{ color: GREEN_COLOR }} className="font-medium">{a.actionName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Module Row ───────────────────────────────────────────────────────────────
function ModuleRow({ module, onTogglePermission, savingKeys, onDeleteModulePermissions, isDeletingModule }) {
  const granted   = module.permissions.filter(a => a.isGranted);
  const available = module.permissions.filter(a => !a.isGranted);
  const isModuleSaving = module.permissions.some(
    a => savingKeys[`${module.moduleId}-${a.actionId}`]
  );

  return (
    <div className="border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="flex items-end gap-4 flex-wrap">
        <div className="flex-shrink-0">
          <p className="text-[10px] font-semibold text-slate-500 mb-1.5 tracking-widest uppercase">Module</p>
          <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 w-56 bg-slate-50">
            <span className="flex-1 truncate">{module.moduleName}</span>
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] font-semibold text-slate-500 mb-1.5 tracking-widest uppercase">Permissions</p>
          <div className="flex items-center gap-1.5 flex-wrap px-3 py-2 border border-slate-200 rounded-lg min-h-[42px] bg-white">
            {granted.map(action => (
              <RemovablePermBadge
                key={action.actionId}
                actionName={action.actionName}
                onRemove={() => onTogglePermission(module, action)}
                disabled={!!savingKeys[`${module.moduleId}-${action.actionId}`]}
              />
            ))}
            <AddPermDropdown
              availableActions={available}
              onAdd={(action) => onTogglePermission(module, action)}
              disabled={false}
            />
            {isModuleSaving && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 ml-2" />
            )}
          </div>
        </div>

        {/* Bouton de suppression du module entier */}
        <div className="flex-shrink-0">
          <button
            onClick={() => onDeleteModulePermissions(module)}
            disabled={isDeletingModule || granted.length === 0}
            className={`p-2.5 rounded-xl transition-all duration-200 ${
              granted.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'text-red-500 hover:bg-red-50 hover:text-red-700 hover:scale-105'
            }`}
            title="Supprimer toutes les permissions de ce module"
          >
            {isDeletingModule ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-500 border-t-transparent" />
            ) : (
              <Trash2 size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal d'attribution de permissions ──────────────────────────────────────
function GrantPermissionModal({ modules, actions, onClose, onSave, loading }) {
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedActionIds, setSelectedActionIds] = useState([]);

  const handleToggleAction = (actionId) => {
    setSelectedActionIds(prev => 
      prev.includes(actionId) ? prev.filter(id => id !== actionId) : [...prev, actionId]
    );
  };

  const handleSave = () => {
    if (!selectedModuleId) {
      alert("Veuillez choisir un module");
      return;
    }
    if (selectedActionIds.length === 0) {
      alert("Veuillez choisir au moins une action");
      return;
    }
    onSave(selectedModuleId, selectedActionIds);
  };

  const hasModules = modules && modules.length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center" style={{ background: GRAD_BLUE }}>
          <h3 className="text-base font-bold text-white">Ajouter des permissions</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/15 rounded-lg transition-colors">
            <X size={18} className="text-white" />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">1. Choisir le module</label>
            <select 
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none text-sm focus:border-blue-400 bg-slate-50 font-medium"
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
            >
              <option value="">-- Sélectionner un module --</option>
              {hasModules ? (
                modules.map((module, index) => {
                  const moduleId = module.id || module.moduleId;
                  const moduleName = module.name || module.moduleName || `Module ${index + 1}`;
                  return (
                    <option key={moduleId || index} value={moduleId}>
                      {moduleName}
                    </option>
                  );
                })
              ) : (
                <option value="" disabled>Aucun module disponible</option>
              )}
            </select>
            {!hasModules && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Aucun module trouvé. Veuillez d'abord créer des modules dans "Administrer les modules".
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Actions à autoriser</label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {actions && actions.length > 0 ? (
                actions.map(action => {
                  const actionId = action.id || action.actionId;
                  const actionName = action.name || action.actionName;
                  return (
                    <label 
                      key={actionId} 
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedActionIds.includes(actionId) 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={selectedActionIds.includes(actionId)}
                        onChange={() => handleToggleAction(actionId)}
                      />
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${
                        selectedActionIds.includes(actionId) ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                      }`}>
                        {selectedActionIds.includes(actionId) && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{actionName}</span>
                    </label>
                  );
                })
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <AlertTriangle size={32} className="mx-auto mb-2" />
                  <p className="text-sm">Aucune action disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors">
            Annuler
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading || !selectedModuleId || selectedActionIds.length === 0 || !hasModules}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            {loading ? "Enregistrement..." : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleDetailPage({ role, onBack, showToast }) {
  const [modules, setModules] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [allActions, setAllActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState({});
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingModuleId, setDeletingModuleId] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [permData, modulesData, actionsData] = await Promise.all([
        apiFetch(`/roles/${role.id}/permissions`),
        apiFetch('/module'),
        apiFetch('/actions')
      ]);
      
      setModules(permData || []);
      setAllModules(modulesData || []);
      setAllActions(actionsData || []);
      
    } catch (err) {
      console.error('Erreur chargement:', err);
      showToast('Erreur chargement : ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [role.id, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleBulkGrant = async (moduleId, actionIds) => {
    setIsSubmitting(true);
    try {
      for (const actionId of actionIds) {
        await apiFetch(`/roles/${role.id}/permissions`, {
          method: 'POST',
          body: { moduleId: moduleId, actionId: actionId },
        });
      }
      showToast(`${actionIds.length} permission(s) ajoutée(s) avec succès`, "success");
      setIsGrantModalOpen(false);
      await loadData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModulePermissions = async (module) => {
    const grantedPermissions = module.permissions.filter(a => a.isGranted);
    
    if (grantedPermissions.length === 0) {
      showToast("Aucune permission à supprimer pour ce module", "error");
      return;
    }

    if (!window.confirm(`Supprimer toutes les permissions du module "${module.moduleName}" (${grantedPermissions.length} action(s)) ?`)) {
      return;
    }

    setDeletingModuleId(module.moduleId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/roles/${role.id}/permissions/module/${module.moduleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Erreur ${response.status}`);
      }
      
      const result = await response.json();
      showToast(result.message, "success");
      await loadData();
    } catch (err) {
      console.error('Erreur suppression module:', err);
      showToast('Erreur lors de la suppression : ' + err.message, 'error');
    } finally {
      setDeletingModuleId(null);
    }
  };

  const handleTogglePermission = async (module, action) => {
    const key = `${module.moduleId}-${action.actionId}`;
    setSavingKeys(prev => ({ ...prev, [key]: true }));

    try {
      const method = action.isGranted ? 'DELETE' : 'POST';
      
      const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          moduleId: module.moduleId, 
          actionId: action.actionId 
        })
      };
      
      const response = await fetch(`${API_BASE_URL}/roles/${role.id}/permissions`, options);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Erreur ${response.status}`);
      }
      
      showToast(
        action.isGranted 
          ? `"${action.actionName}" révoquée avec succès` 
          : `"${action.actionName}" accordée avec succès`, 
        "success"
      );
      
      await loadData();
    } catch (err) {
      console.error('Erreur détaillée:', err);
      showToast('Erreur : ' + err.message, 'error');
    } finally {
      setSavingKeys(prev => { const s = { ...prev }; delete s[key]; return s; });
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa]" style={{ fontFamily: FONT }}>
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors text-sm bg-white font-medium">
            <ArrowLeft size={16} /> Retour à la liste
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600 border border-blue-200">
                <Shield size={20} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">{role.nom || role.name}</h1>
                <p className="text-xs text-slate-500 font-medium">Gestion des permissions par module</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsGrantModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95"
            disabled={!allModules || allModules.length === 0}
          >
            <Plus size={18} strokeWidth={3} /> Ajouter des permissions
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-300 rounded-2xl bg-white">
            <FolderPlus size={48} className="mx-auto text-slate-400 mb-3" />
            <p className="text-slate-500 font-medium">Aucune permission attribuée à ce rôle</p>
            <p className="text-xs text-slate-400 mt-1">Cliquez sur "Ajouter des permissions" pour en attribuer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map(module => (
              <ModuleRow
                key={module.moduleId}
                module={module}
                onTogglePermission={handleTogglePermission}
                savingKeys={savingKeys}
                onDeleteModulePermissions={handleDeleteModulePermissions}
                isDeletingModule={deletingModuleId === module.moduleId}
              />
            ))}
          </div>
        )}

        {isGrantModalOpen && (
          <GrantPermissionModal 
            modules={allModules}
            actions={allActions}
            onClose={() => setIsGrantModalOpen(false)}
            onSave={handleBulkGrant}
            loading={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}

// ─── Modules Admin Page ───────────────────────────────────────────────────────
function ModulesAdminPage({ modules, onRefresh, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const filtered = modules.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.code?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestion des modules</h2>
          <p className="text-sm text-slate-500 mt-1">Ajoutez ou supprimez des modules fonctionnels</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 bg-white">
            <RefreshCw size={16} /> Actualiser
          </button>
          <button onClick={onAdd}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-blue-700 transition-colors">
            <Plus size={18} /> Nouveau module
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un module…"
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-blue-300 focus:outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-4 text-left">Code</th>
              <th className="px-6 py-4 text-left">Nom</th>
              <th className="px-6 py-4 text-left">Date de création</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Aucun module trouvé</td>
              </tr>
            ) : filtered.map((module, i) => (
              <tr key={module.id || module.moduleId} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                <td className="px-6 py-4 font-mono text-sm">{module.code}</td>
                <td className="px-6 py-4 font-medium">{module.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{formatDate(module.createdAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => onEdit(module)}
                      className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => onDelete(module.id || module.moduleId, module.name)}
                      className="p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────
function KpiStrip({ roles, totalPermissions, modulesCount }) {
  const avgPermissions = roles.length > 0 ? Math.round(totalPermissions / roles.length) : 0;
  
  const kpis = [
    { label: 'Total rôles', value: roles.length, sub: 'rôle(s) défini(s)', primary: true },
    { label: 'Permissions', value: totalPermissions, sub: 'accordées', primary: false },
    { label: 'Modules', value: modulesCount, sub: 'disponibles', primary: false },
    { label: 'Moyenne', value: avgPermissions, sub: 'perm./rôle', primary: false },
  ];
  
  return (
    <div className="grid grid-cols-4 gap-3 mb-7">
      {kpis.map((k, i) => (
        <div key={i} className="rounded-2xl p-5 shadow-sm" style={{
          background:  k.primary ? GRAD_BLUE : "#fff",
          boxShadow:   k.primary ? "0 8px 24px rgba(29,78,216,.30)" : "0 2px 8px rgba(0,0,0,.06)",
        }}>
          <div className="text-3xl font-bold" style={{ color: k.primary ? "#fff" : "#111827" }}>{k.value}</div>
          <div className="text-xs font-semibold mt-1" style={{ color: k.primary ? "rgba(255,255,255,.9)" : "#374151" }}>{k.label}</div>
          <div className="text-xs mt-0.5" style={{ color: k.primary ? "rgba(255,255,255,.6)" : "#9CA3AF"  }}>{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Role List Page (sans affichage des IDs) ─────────────────────────────────
function RoleListPage({ roles, loading, onSelectRole, onAddRole, onEditRole, onDeleteRole, search, setSearch, viewMode, setViewMode, onRefresh, totalPermissions, modulesCount }) {
  const filtered = roles.filter(r => {
    const roleName = r.nom || r.name;
    return roleName?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des rôles & permissions</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez les rôles Identity et leurs accès aux modules</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 bg-white">
            <RefreshCw size={16} /> Actualiser
          </button>
          <button onClick={onAddRole}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-blue-700 transition-colors">
            <Plus size={18} /> Nouveau rôle
          </button>
        </div>
      </div>

      <KpiStrip roles={roles} totalPermissions={totalPermissions} modulesCount={modulesCount} />

      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5 shadow-sm">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un rôle…"
            className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-blue-300 focus:outline-none" />
        </div>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <button onClick={() => setSearch("")}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 bg-white">
            <SlidersHorizontal size={15} /> Réinitialiser
          </button>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button onClick={() => setViewMode("grid")}
              className={`px-3 py-2 transition-colors ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
              <LayoutGrid size={17} />
            </button>
            <button onClick={() => setViewMode("table")}
              className={`px-3 py-2 transition-colors ${viewMode === "table" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
              <List size={17} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-4 py-3 mb-5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
        <MousePointerClick size={16} className="flex-shrink-0 text-blue-500" />
        <span>Cliquez sur un rôle pour consulter et modifier ses permissions par module.</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Shield size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Aucun rôle trouvé</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(role => (
            <div key={role.id} onClick={() => onSelectRole(role)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-300 group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <Shield size={16} />
                </div>
                <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                  {role.nom || role.name}
                </div>
              </div>
              {/* Ligne d'ID supprimée */}
              <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => onEditRole(role)}
                  className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors">
                  <Edit size={14} /> Modifier
                </button>
                <button onClick={() => onDeleteRole(role)}
                  className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 text-left">Rôle</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((role, i) => (
                <tr key={role.id} onClick={() => onSelectRole(role)}
                  className={`hover:bg-slate-50 cursor-pointer transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
                  <td className="px-6 py-4 font-semibold text-slate-800">{role.nom || role.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => onEditRole(role)}
                        className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors">
                        <Edit size={15} />
                      </button>
                      <button onClick={() => onDeleteRole(role)}
                        className="p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100 transition-colors">
                        <Trash2 size={15} />
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
  );
}

// ─── Role Modal ───────────────────────────────────────────────────────────────
function RoleModal({ editing, onClose, onSave, loading }) {
  const [name, setName] = useState(editing?.nom || editing?.name || "");

  const handleSave = async () => {
    if (!name.trim()) { alert("Le nom du rôle est requis"); return; }
    await onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        <div className="px-6 py-4 border-b flex justify-between items-center rounded-t-2xl" style={{ background: GRAD_BLUE }}>
          <h3 className="text-base font-bold text-white">{editing ? "Modifier le rôle" : "Nouveau rôle"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/15 rounded-lg transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Nom du rôle</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                type="text"
                placeholder="ex: Gestionnaire"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-400 bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors bg-white">
              Annuler
            </button>
            <button onClick={handleSave} disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition-colors">
              {loading
                ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                : <CheckCircle size={15} />}
              {loading ? "Chargement…" : (editing ? "Enregistrer" : "Créer")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Module Modal ─────────────────────────────────────────────────────────────
function ModuleModal({ editing, onClose, onSave, loading }) {
  const [form, setForm] = useState({ code: editing?.code || "", name: editing?.name || "" });

  const handleSave = async () => {
    if (!form.code.trim()) { alert("Le code du module est requis"); return; }
    if (!form.name.trim()) { alert("Le nom du module est requis"); return; }
    await onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        <div className="px-6 py-4 border-b flex justify-between items-center rounded-t-2xl" style={{ background: GRAD_BLUE }}>
          <h3 className="text-base font-bold text-white">{editing ? "Modifier le module" : "Nouveau module"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/15 rounded-lg transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Code *</label>
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
              type="text" placeholder="ex: dashboard"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-400 bg-white" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Nom *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              type="text" placeholder="ex: Tableau de bord"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none text-sm focus:border-blue-400 bg-white" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors bg-white">
              Annuler
            </button>
            <button onClick={handleSave} disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition-colors">
              {loading
                ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                : <Save size={15} />}
              {loading ? "Chargement…" : (editing ? "Modifier" : "Créer")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function GestionRoles({ isAdminSocieteMode = false }) {
  const [roles, setRoles]           = useState([]);
  const [modules, setModules]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [currentView, setCurrentView] = useState("list");
  const [selectedRole, setSelectedRole] = useState(null);
  const [search, setSearch]         = useState("");
  const [viewMode, setViewMode]     = useState("grid");
  const [roleModalOpen, setRoleModalOpen]     = useState(false);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingRole, setEditingRole]         = useState(null);
  const [editingModule, setEditingModule]     = useState(null);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);
  const [totalPermissions, setTotalPermissions] = useState(0);
  const [modulesCount, setModulesCount] = useState(0);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/role');
      
      let total = 0;
      for (const role of data) {
        try {
          const perms = await apiFetch(`/roles/${role.id}/permissions`);
          const rolePermsCount = perms.reduce((sum, module) => 
            sum + module.permissions.filter(p => p.isGranted).length, 0);
          total += rolePermsCount;
          role.permissionsCount = rolePermsCount;
        } catch {
          role.permissionsCount = 0;
        }
      }
      
      setTotalPermissions(total);
      setRoles(data);
    } catch (err) {
      showToast('Erreur chargement des rôles : ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadModules = useCallback(async () => {
    try {
      const data = await apiFetch('/module');
      setModules(data);
      setModulesCount(data.length);
    } catch (err) {
      showToast('Erreur chargement des modules : ' + err.message, 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadRoles();
    loadModules();
  }, [loadRoles, loadModules]);

  const handleRoleSave = async (roleName) => {
    setSaving(true);
    try {
      if (editingRole) {
        await apiFetch(`/role/${editingRole.id}`, {
          method: 'PUT',
          body: { roleId: editingRole.id, roleName: roleName },
        });
        showToast('Rôle modifié avec succès', 'success');
        await loadRoles();
      } else {
        await apiFetch('/role', {
          method: 'POST',
          body: { roleName: roleName },
        });
        showToast('Rôle créé avec succès', 'success');
        await loadRoles();
      }
      setRoleModalOpen(false);
      setEditingRole(null);
    } catch (err) {
      showToast('Erreur : ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Supprimer le rôle "${role.nom || role.name}" ?\nToutes ses permissions seront supprimées.`)) return;
    try {
      await apiFetch(`/role/${role.id}`, { method: 'DELETE' });
      showToast('Rôle supprimé', 'success');
      await loadRoles();
      if (selectedRole?.id === role.id) {
        setCurrentView("list");
        setSelectedRole(null);
      }
    } catch (err) {
      showToast('Erreur : ' + err.message, 'error');
    }
  };

  const handleModuleSave = async (moduleData) => {
    setSaving(true);
    try {
      if (editingModule) {
        await apiFetch(`/module/${editingModule.id}`, {
          method: 'PUT',
          body: { id: editingModule.id, ...moduleData },
        });
        setModules(prev => prev.map(m =>
          m.id === editingModule.id ? { ...m, ...moduleData } : m
        ));
        showToast('Module modifié avec succès', 'success');
      } else {
        const newModule = await apiFetch('/module', {
          method: 'POST',
          body: moduleData,
        });
        setModules(prev => [...prev, newModule]);
        showToast('Module créé avec succès', 'success');
      }
      setModuleModalOpen(false);
      setEditingModule(null);
    } catch (err) {
      showToast('Erreur : ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (id, name) => {
    if (!window.confirm(`Supprimer le module "${name}" ?\nToutes les permissions associées seront supprimées.`)) return;
    try {
      await apiFetch(`/module/${id}`, { method: 'DELETE' });
      setModules(prev => prev.filter(m => m.id !== id));
      showToast('Module supprimé', 'success');
    } catch (err) {
      showToast('Erreur : ' + err.message, 'error');
    }
  };

  if (currentView === "detail" && selectedRole) {
    return (
      <>
        <RoleDetailPage
          role={selectedRole}
          onBack={() => { setCurrentView("list"); setSelectedRole(null); }}
          showToast={showToast}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  if (currentView === "admin") {
    return (
      <div className="min-h-screen bg-[#f4f6fa]" style={{ fontFamily: FONT }}>
        <div className="p-6 max-w-[1400px] mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setCurrentView("list")}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors text-sm bg-white">
              <ArrowLeft size={16} /> Retour
            </button>
            <h1 className="text-2xl font-bold text-slate-800">Administration des modules</h1>
          </div>
          <ModulesAdminPage
            modules={modules}
            onRefresh={loadModules}
            onAdd={() => { setEditingModule(null); setModuleModalOpen(true); }}
            onEdit={(m) => { setEditingModule(m); setModuleModalOpen(true); }}
            onDelete={handleDeleteModule}
          />
        </div>
        {moduleModalOpen && (
          <ModuleModal
            editing={editingModule}
            onClose={() => { setModuleModalOpen(false); setEditingModule(null); }}
            onSave={handleModuleSave}
            loading={saving}
          />
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fa]" style={{ fontFamily: FONT }}>
      <div className="p-6 max-w-[1400px] mx-auto">
        {/* Bouton "Administrer les modules" toujours visible */}
        <div className="flex justify-end mb-4">
          <button onClick={() => setCurrentView("admin")}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-purple-700 transition-colors">
            <Settings size={16} /> Administrer les modules
          </button>
        </div>

        <RoleListPage
          roles={roles}
          loading={loading}
          totalPermissions={totalPermissions}
          modulesCount={modulesCount}
          onSelectRole={(role) => { setSelectedRole(role); setCurrentView("detail"); }}
          onAddRole={() => { setEditingRole(null); setRoleModalOpen(true); }}
          onEditRole={(role) => { setEditingRole(role); setRoleModalOpen(true); }}
          onDeleteRole={handleDeleteRole}
          onRefresh={loadRoles}
          search={search}
          setSearch={setSearch}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {roleModalOpen && (
          <RoleModal
            editing={editingRole}
            onClose={() => { setRoleModalOpen(false); setEditingRole(null); }}
            onSave={handleRoleSave}
            loading={saving}
          />
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}