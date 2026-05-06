import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
import {
  Search, Plus, Edit, Eye, CheckCircle, AlertTriangle, Ban,
  Trash2, X, Clock, ShieldCheck, AlertCircle,
  LayoutGrid, List, SlidersHorizontal, Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE    = 'http://localhost:5006/api/incidents';
const SIGNALR_HUB = 'http://localhost:5006/notificationHub';

// ── Instance axios avec token JWT automatique ────────────────────────────────
const api = axios.create({ baseURL: 'http://localhost:5006' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('⚠️ Aucun token JWT trouvé dans localStorage');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized — token expiré ou invalide');
    }
    return Promise.reject(error);
  }
);
// ────────────────────────────────────────────────────────────────────────────

const T = {
  font: "'Sora', 'Segoe UI', sans-serif",
  bg: '#F8F9FB',
  white: '#ffffff',
  gray900: '#111827',
  gray700: '#374151',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray200: '#e5e7eb',
  shadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)',
  gradBlue:   'linear-gradient(135deg, #1D4ED8, #1E40AF)',
  gradGreen:  'linear-gradient(135deg, #059669, #10b981)',
  gradOrange: 'linear-gradient(135deg, #d97706, #f59e0b)',
  gradRed:    'linear-gradient(135deg, #dc2626, #ef4444)',
};

const PRIORITES = [
  { key: 'BASSE',    label: 'Basse',    color: '#10B981', bg: '#ECFDF5', icon: <AlertCircle size={14} /> },
  { key: 'MOYENNE',  label: 'Moyenne',  color: '#F59E0B', bg: '#FFFBEB', icon: <AlertTriangle size={14} /> },
  { key: 'HAUTE',    label: 'Haute',    color: '#EF4444', bg: '#FEF2F2', icon: <AlertCircle size={14} /> },
  { key: 'CRITIQUE', label: 'Critique', color: '#7F1D1D', bg: '#FEE2E2', icon: <Ban size={14} /> },
];

const STATUTS_INCIDENT = [
  { key: 'EnCours', label: 'En cours', color: '#F59E0B', bg: '#FFFBEB', icon: <AlertTriangle size={14} /> },
  { key: 'Resolu',  label: 'Résolu',   color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle size={14} /> },
];

const animationStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function normalizeIncident(inc) {
  return {
    id:          inc.id          || inc.Id,
    titre:       inc.titre       || inc.Titre       || '',
    description: inc.description || inc.Description || '',
    date:        inc.date        || inc.Date,
    priorite:   (inc.priorite    || inc.Priorite    || 'MOYENNE').toUpperCase(),
    statut:      inc.statut      || inc.Statut      || 'EnCours',
    resolution:  inc.resolution  || inc.Resolution  || '',
  };
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── KPI Strip ────────────────────────────────────────────────────────────────
function KpiStrip({ stats }) {
  const kpis = [
    { label: 'Total incidents',  value: stats.total,   sub: `${stats.total} incidents déclarés`,      bg: T.gradBlue, light: false },
    { label: 'En cours',         value: stats.enCours, sub: `${Math.round((stats.enCours / (stats.total || 1)) * 100)}% du total`, bg: '#fff', light: true },
    { label: 'Résolus',          value: stats.resolus, sub: `${Math.round((stats.resolus / (stats.total || 1)) * 100)}% du total`, bg: '#fff', light: true },
    { label: 'Critiques',        value: stats.critiques, sub: 'priorité critique',                    bg: '#fff', light: true },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{
          background: k.bg, borderRadius: 14, padding: '20px 22px',
          boxShadow: k.light ? T.shadow : '0 8px 24px rgba(29,78,216,.35)',
          animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${i * 80}ms both`,
        }}>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: k.light ? '#111827' : '#fff', letterSpacing: '-1.5px' }}>{k.value}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: k.light ? '#374151' : 'rgba(255,255,255,.9)', marginTop: 6 }}>{k.label}</div>
          <div style={{ fontSize: 11.5, color: k.light ? '#9CA3AF' : 'rgba(255,255,255,.6)', marginTop: 2 }}>{k.sub}</div>
          {!k.light && (
            <div style={{ marginTop: 12, height: 4, borderRadius: 99, background: 'rgba(255,255,255,.2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', background: 'rgba(255,255,255,.8)', borderRadius: 99 }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Badges ───────────────────────────────────────────────────────────────────
function StatutIncidentBadge({ statut }) {
  const s = STATUTS_INCIDENT.find(s => s.key === statut);
  if (!s) return <span>—</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
      background: s.bg, color: s.color, border: `1px solid ${s.color}30`,
    }}>
      {s.icon} {s.label}
    </span>
  );
}

function PrioriteBadge({ priorite }) {
  const p = PRIORITES.find(p => p.key === priorite);
  if (!p) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: p.bg, color: p.color,
    }}>
      {p.icon} {p.label}
    </span>
  );
}

// ── Toast de notification ─────────────────────────────────────────────────────
function NotificationToast({ notification, onClose, onView }) {
  if (!notification) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300, width: 360, animation: 'slideInRight 0.3s cubic-bezier(0.68,-0.55,0.265,1.55)' }}>
      <div style={{ background: '#FFF', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
        <div style={{ height: 4, background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)' }} />
        <div style={{ padding: 16, display: 'flex', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertCircle size={20} color="#FFF" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Nouvel incident</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: '#EFF6FF', color: '#1D4ED8' }}>
                {notification.priorite || 'MOYENNE'}
              </span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 500, color: '#374151' }}>{notification.titre}</p>
            <button onClick={() => { onView(notification.incidentId); onClose(); }}
              style={{ fontSize: 12, fontWeight: 600, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Voir
            </button>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panneau Détails ───────────────────────────────────────────────────────────
function DetailIncidentPanel({ incident, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ backgroundColor: '#fff', borderRadius: 24, width: '90%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontFamily: T.font }} onClick={e => e.stopPropagation()}>
        <div style={{ background: T.gradBlue, padding: '20px 28px', borderTopLeftRadius: 24, borderTopRightRadius: 24, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Détails de l'incident</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}><X size={24} /></button>
        </div>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div><strong>Titre :</strong> {incident.titre}</div>
          <div><strong>Description :</strong> {incident.description || '—'}</div>
          <div><strong>Priorité :</strong> <PrioriteBadge priorite={incident.priorite} /></div>
          <div><strong>Statut :</strong> <StatutIncidentBadge statut={incident.statut} /></div>
          <div><strong>Date :</strong> {formatDateTime(incident.date)}</div>
          {incident.resolution && <div><strong>Résolution :</strong> {incident.resolution}</div>}
        </div>
        <div style={{ padding: '20px 28px', borderTop: `1px solid ${T.gray200}`, textAlign: 'right' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 40, border: `1px solid ${T.gray200}`, background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ── Formulaire Création / Modification ────────────────────────────────────────
function IncidentFormPanel({ incident, onClose, onSave, isCreating }) {
  const [form, setForm] = useState({
    titre:       incident?.titre       || '',
    description: incident?.description || '',
    priorite:    incident?.priorite    || 'MOYENNE',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.titre?.trim()) { alert('Le titre est obligatoire'); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: 540, background: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 50px rgba(0,0,0,0.2)', fontFamily: T.font }}>
        <div style={{ background: T.gradBlue, padding: '24px 28px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{isCreating ? 'Nouvel incident' : "Modifier l'incident"}</h2>
            <X onClick={onClose} style={{ cursor: 'pointer' }} size={20} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 30 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: 'block' }}>Titre *</label>
              <input type="text" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: 'block' }}>Description</label>
              <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, fontSize: 14, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: 'block' }}>Priorité</label>
              <select value={form.priorite} onChange={e => setForm({ ...form, priorite: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, fontSize: 14 }}>
                {PRIORITES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ padding: '20px 28px', borderTop: `1px solid ${T.gray200}`, display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${T.gray200}`, background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: T.gradBlue, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
            {saving ? 'Enregistrement...' : <><CheckCircle size={16} /> Enregistrer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panneau Traitement ────────────────────────────────────────────────────────
function TraitementPanel({ incident, onClose, onSave }) {
  const [statut,     setStatut]     = useState(incident.statut     || 'EnCours');
  const [resolution, setResolution] = useState(incident.resolution || '');
  const [saving,     setSaving]     = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave({ statut, resolution });
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', width: 500, background: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 50px rgba(0,0,0,0.2)' }}>
        <div style={{ background: T.gradGreen, padding: '24px 28px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
              {incident.resolution || incident.statut === 'Resolu' ? 'Modifier le traitement' : "Traiter l'incident"}
            </h2>
            <X onClick={onClose} style={{ cursor: 'pointer' }} size={20} />
          </div>
          <p style={{ fontSize: 13, marginTop: 6, opacity: 0.9 }}>{incident.titre}</p>
        </div>
        <div style={{ flex: 1, padding: 30, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{ fontWeight: 700, fontSize: 13 }}>Statut</label>
            <select value={statut} onChange={e => setStatut(e.target.value)}
              style={{ width: '100%', marginTop: 6, padding: 12, borderRadius: 10, border: `1.5px solid ${T.gray200}` }}>
              {STATUTS_INCIDENT.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 700, fontSize: 13 }}>Commentaire / Résolution</label>
            <textarea rows={5} value={resolution} onChange={e => setResolution(e.target.value)}
              placeholder="Décrivez les actions menées ou la résolution..."
              style={{ width: '100%', marginTop: 6, padding: 12, borderRadius: 10, border: `1.5px solid ${T.gray200}`, resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ padding: '20px 28px', borderTop: `1px solid ${T.gray200}`, display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${T.gray200}`, background: '#fff', cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSubmit} disabled={saving}
            style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: T.gradGreen, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function GestionIncidents() {
  const { canRead, canWrite, canEdit, canDelete } = useAuth();
  const moduleCode = 'incidents';
  const hasAccess  = canRead(moduleCode);

  const [incidents,          setIncidents]          = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [searchTerm,         setSearchTerm]         = useState('');
  const [filterStatut,       setFilterStatut]       = useState('all');
  const [filterPriorite,     setFilterPriorite]     = useState('all');
  const [viewMode,           setViewMode]           = useState('table');
  const [showCreatePanel,    setShowCreatePanel]    = useState(false);
  const [editingIncident,    setEditingIncident]    = useState(null);
  const [traitementIncident, setTraitementIncident] = useState(null);
  const [detailsIncident,    setDetailsIncident]    = useState(null);
  const [notifications,      setNotifications]      = useState([]);
  const [currentToast,       setCurrentToast]       = useState(null);
  const [isSignalRConnected, setIsSignalRConnected] = useState(false);

  const connectionRef = useRef(null);

  // ── Permission notifications navigateur ──────────────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── Connexion SignalR ─────────────────────────────────────────────────────
  useEffect(() => {
    if (connectionRef.current) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ Pas de token JWT — SignalR non connecté');
      return;
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB, {
        accessTokenFactory: () => localStorage.getItem('token') || '',
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    newConnection.on('ReceiveNotification', (notification) => {
      console.log('📢 Notification reçue:', notification);
      setNotifications(prev => {
        if (prev.some(n => n.incidentId === notification.incidentId)) return prev;
        return [notification, ...prev];
      });
    });

    newConnection.start()
      .then(() => {
        console.log('✅ SignalR connecté:', newConnection.connectionId);
        setIsSignalRConnected(true);
        connectionRef.current = newConnection;
      })
      .catch(err => {
        console.error('❌ Erreur SignalR:', err);
        setIsSignalRConnected(false);
      });

    return () => {
      connectionRef.current?.stop();
      connectionRef.current = null;
    };
  }, []);

  // ── Toast ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (notifications.length > 0 && !currentToast) {
      setCurrentToast(notifications[0]);
    }
  }, [notifications, currentToast]);

  const handleCloseToast = () => {
    setCurrentToast(null);
    setNotifications(prev => prev.slice(1));
  };

  const handleViewIncidentFromToast = (incidentId) => {
    fetchData();
    setCurrentToast(null);
    setNotifications([]);
    const found = incidents.find(i => i.id === incidentId);
    if (found) setDetailsIncident(found);
  };

  // ── Chargement ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await api.get('/api/incidents');
      const data = res.data.map(normalizeIncident);
      setIncidents(data);
      setDetailsIncident(prev => prev ? data.find(i => i.id === prev.id) ?? prev : null);
    } catch (err) {
      console.error('Erreur chargement incidents:', err);
      if (err.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
      } else {
        alert('Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleCreate = async (formData) => {
    if (!canWrite(moduleCode)) {
      alert("Vous n'avez pas la permission de créer des incidents");
      return;
    }
    try {
      await api.post('/api/incidents', formData);
      await fetchData();
      setShowCreatePanel(false);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création');
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingIncident) return;
    if (!canEdit(moduleCode)) {
      alert("Vous n'avez pas la permission de modifier cet incident");
      return;
    }
    try {
      await api.put(`/api/incidents/${editingIncident.id}`, { ...formData, id: editingIncident.id });
      await fetchData();
      setEditingIncident(null);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete(moduleCode)) {
      alert("Vous n'avez pas la permission de supprimer des incidents");
      return;
    }
    if (!window.confirm('Supprimer définitivement cet incident ?')) return;
    try {
      await api.delete(`/api/incidents/${id}`);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

  const handleTraitement = async (data) => {
    if (!traitementIncident) return;
    if (!canWrite(moduleCode)) {
      alert("Vous n'avez pas la permission de traiter des incidents");
      return;
    }
    try {
      const payload = {
        titre:       traitementIncident.titre,
        description: traitementIncident.description,
        priorite:    traitementIncident.priorite,
        statut:      data.statut,
        resolution:  data.resolution,
      };
      await api.put(`/api/incidents/${traitementIncident.id}`, payload);
      const updated = { ...traitementIncident, statut: data.statut, resolution: data.resolution };
      setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i));
      setDetailsIncident(prev => prev?.id === updated.id ? updated : prev);
      setTraitementIncident(null);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du traitement');
    }
  };

  // ── Filtres ───────────────────────────────────────────────────────────────
  const filtered = incidents.filter(inc => {
    const matchSearch   = inc.titre?.toLowerCase().includes(searchTerm.toLowerCase())
                       || inc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut   = filterStatut   === 'all' || inc.statut   === filterStatut;
    const matchPriorite = filterPriorite === 'all' || inc.priorite === filterPriorite;
    return matchSearch && matchStatut && matchPriorite;
  });

  const stats = {
    total:    incidents.length,
    enCours:  incidents.filter(i => i.statut   === 'EnCours').length,
    resolus:  incidents.filter(i => i.statut   === 'Resolu').length,
    critiques: incidents.filter(i => i.priorite === 'CRITIQUE').length,
  };

  const btnIcon = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 40, border: '1.5px solid',
    background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s',
  };

  // ── Accès refusé ──────────────────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.font }}>
        <div style={{ textAlign: 'center' }}>
          <Shield size={64} color="#f87171" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>Accès non autorisé</h2>
          <p style={{ color: '#6b7280' }}>Vous n'avez pas les permissions nécessaires pour accéder à la gestion des incidents.</p>
        </div>
      </div>
    );
  }

  // ── Rendu principal ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      <style>{animationStyles}</style>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '36px 36px 60px', width: '100%' }}>

        {/* En-tête */}
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.8px' }}>Gestion des incidents</h1>
            <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0 }}>Suivi et traitement des événements de sécurité</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Indicateur SignalR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: isSignalRConnected ? '#059669' : '#9CA3AF' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: isSignalRConnected ? '#059669' : '#9CA3AF' }} />
              {isSignalRConnected ? 'Notifications actives' : 'Notifications inactives'}
            </div>
            {canWrite(moduleCode) && (
              <button
                onClick={() => setShowCreatePanel(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: T.gradBlue, border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(29,78,216,.3)' }}
              >
                <Plus size={18} /> Déclarer un incident
              </button>
            )}
          </div>
        </div>

        {/* KPI Strip */}
        <KpiStrip stats={stats} />

        {/* Filtres */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', boxShadow: T.shadow, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
              {/* Recherche */}
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }} />
                <input
                  type="text"
                  placeholder="Rechercher un incident..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, fontSize: 13 }}
                />
              </div>
              {/* Filtre statut */}
              <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, background: '#fff', fontSize: 13 }}>
                <option value="all">Tous statuts</option>
                {STATUTS_INCIDENT.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              {/* Filtre priorité */}
              <select value={filterPriorite} onChange={e => setFilterPriorite(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, background: '#fff', fontSize: 13 }}>
                <option value="all">Toutes priorités</option>
                {PRIORITES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              {/* Reset */}
              <button
                onClick={() => { setSearchTerm(''); setFilterStatut('all'); setFilterPriorite('all'); }}
                style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, background: '#F9FAFB', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: T.gray700 }}
              >
                <SlidersHorizontal size={14} /> Réinitialiser
              </button>
            </div>
            {/* Toggle vue */}
            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${T.gray200}` }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? '#2f62de' : '#F9FAFB', color: viewMode === 'grid' ? '#fff' : T.gray600 }}
                title="Vue grille"
              >
                <LayoutGrid size={17} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: viewMode === 'table' ? '#2f62de' : '#F9FAFB', color: viewMode === 'table' ? '#fff' : T.gray600 }}
                title="Vue liste"
              >
                <List size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* Résultats */}
        {loading ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '80px 0', textAlign: 'center', color: T.gray400, boxShadow: T.shadow }}>
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '80px 0', textAlign: 'center', color: T.gray400, boxShadow: T.shadow }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 700 }}>Aucun incident trouvé</div>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Vue Grille ── */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 16 }}>
            {filtered.map((incident, idx) => (
              <div key={incident.id}
                style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: T.shadow, transition: 'transform .25s, box-shadow .25s', animation: `slideUp 0.5s cubic-bezier(.4,0,.2,1) ${idx * 60}ms both` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.shadow; }}
              >
                <div style={{ height: 4, background: 'linear-gradient(90deg,#1D4ED8,#60A5FA)' }} />
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{incident.titre}</h3>
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: T.gray500, lineHeight: 1.5 }}>{incident.description?.substring(0, 120)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                      <PrioriteBadge priorite={incident.priorite} />
                      <StatutIncidentBadge statut={incident.statut} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.gray400 }}>
                    <Clock size={13} /> {formatDateTime(incident.date)}
                  </div>
                  {incident.statut === 'Resolu' && incident.resolution && (
                    <div style={{ marginTop: 12, padding: 10, background: '#F0FDF4', borderRadius: 8, borderLeft: '4px solid #10B981' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>Résolution</div>
                      <div style={{ fontSize: 12, color: '#374151' }}>{incident.resolution}</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                    <button onClick={() => setDetailsIncident(incident)} style={{ ...btnIcon, background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}><Eye size={14} /> Détails</button>
                    {canEdit(moduleCode) && (
                      <button onClick={() => setEditingIncident(incident)} style={{ ...btnIcon, background: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' }}><Edit size={14} /> Modifier</button>
                    )}
                    {canWrite(moduleCode) && (
                      <button onClick={() => setTraitementIncident(incident)} style={{ ...btnIcon, background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>
                        <ShieldCheck size={14} /> {incident.resolution || incident.statut === 'Resolu' ? 'Modifier traitement' : 'Traiter'}
                      </button>
                    )}
                    {canDelete(moduleCode) && (
                      <button onClick={() => handleDelete(incident.id)} style={{ ...btnIcon, background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}><Trash2 size={14} /> Supprimer</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Vue Tableau ── */
          <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: T.shadow }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${T.gray200}` }}>
                    {['Titre', 'Priorité', 'Statut', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '14px 20px', textAlign: h === 'Actions' ? 'center' : 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.gray500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((incident, i) => (
                    <tr key={incident.id}
                      style={{ borderBottom: `1px solid ${T.gray200}`, background: i % 2 === 0 ? '#fff' : '#FAFAFA', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F0F7FF'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA'}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{incident.titre}</div>
                        <div style={{ fontSize: 12, color: T.gray400, marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {incident.description?.substring(0, 80)}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}><PrioriteBadge priorite={incident.priorite} /></td>
                      <td style={{ padding: '14px 20px' }}><StatutIncidentBadge statut={incident.statut} /></td>
                      <td style={{ padding: '14px 20px', fontSize: 12, color: T.gray500 }}>{formatDateTime(incident.date)}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button onClick={() => setDetailsIncident(incident)} title="Détails"
                            style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: '#EFF6FF', color: '#1D4ED8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Eye size={15} />
                          </button>
                          {canEdit(moduleCode) && (
                            <button onClick={() => setEditingIncident(incident)} title="Modifier"
                              style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: '#FFFBEB', color: '#D97706', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Edit size={15} />
                            </button>
                          )}
                          {canWrite(moduleCode) && (
                            <button onClick={() => setTraitementIncident(incident)} title="Traiter"
                              style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: '#ECFDF5', color: '#059669', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShieldCheck size={15} />
                            </button>
                          )}
                          {canDelete(moduleCode) && (
                            <button onClick={() => handleDelete(incident.id)} title="Supprimer"
                              style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Toast notification */}
      {currentToast && (
        <NotificationToast
          notification={currentToast}
          onClose={handleCloseToast}
          onView={handleViewIncidentFromToast}
        />
      )}

      {/* Panneaux */}
      {showCreatePanel    && canWrite(moduleCode) && <IncidentFormPanel isCreating onClose={() => setShowCreatePanel(false)} onSave={handleCreate} />}
      {editingIncident    && canEdit(moduleCode)  && <IncidentFormPanel incident={editingIncident} isCreating={false} onClose={() => setEditingIncident(null)} onSave={handleUpdate} />}
      {traitementIncident && canWrite(moduleCode) && <TraitementPanel  incident={traitementIncident} onClose={() => setTraitementIncident(null)} onSave={handleTraitement} />}
      {detailsIncident    &&                         <DetailIncidentPanel incident={detailsIncident} onClose={() => setDetailsIncident(null)} />}
    </div>
  );
}