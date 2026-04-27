import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
import {
  Search, Plus, Edit, Eye, CheckCircle, AlertTriangle, Ban,
  Trash2, X, Clock, User, ShieldCheck, AlertCircle, Bell,
  LayoutGrid, List, SlidersHorizontal,Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5006/api/incidents';
const SIGNALR_HUB = 'http://localhost:5006/notificationHub';

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
  gradBlue: 'linear-gradient(135deg, #1D4ED8, #1E40AF)',
  gradGreen: 'linear-gradient(135deg, #059669, #10b981)',
  gradOrange: 'linear-gradient(135deg, #d97706, #f59e0b)',
  gradRed: 'linear-gradient(135deg, #dc2626, #ef4444)',
};

const PRIORITES = [
  { key: 'BASSE',    label: 'Basse',    color: '#10B981', bg: '#ECFDF5', icon: <AlertCircle size={14} />, barColor: '#10B981' },
  { key: 'MOYENNE',  label: 'Moyenne',  color: '#F59E0B', bg: '#FFFBEB', icon: <AlertTriangle size={14} />, barColor: '#F59E0B' },
  { key: 'HAUTE',    label: 'Haute',    color: '#EF4444', bg: '#FEF2F2', icon: <AlertCircle size={14} />, barColor: '#EF4444' },
  { key: 'CRITIQUE', label: 'Critique', color: '#7F1D1D', bg: '#FEE2E2', icon: <Ban size={14} />, barColor: '#DC2626' },
];

const STATUTS_INCIDENT = [
  { key: 'EnCours', label: 'En cours', color: '#F59E0B', bg: '#FFFBEB', icon: <AlertTriangle size={14} /> },
  { key: 'Resolu',  label: 'Résolu',   color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle size={14} /> },
];

// ── KpiStrip ──
function KpiStrip({ stats }) {
  const kpis = [
    {
      label: 'Total incidents',
      value: stats.total,
      sub: `${stats.total} incident${stats.total > 1 ? 's' : ''} enregistré${stats.total > 1 ? 's' : ''}`,
      bg: T.gradBlue,
      light: false,
    },
    {
      label: 'En cours',
      value: stats.enCours,
      sub: `${Math.round((stats.enCours / (stats.total || 1)) * 100)}% du total`,
      bg: '#fff',
      light: true,
    },
    {
      label: 'Résolus',
      value: stats.resolus,
      sub: `${Math.round((stats.resolus / (stats.total || 1)) * 100)}% du total`,
      bg: '#fff',
      light: true,
    },
    {
      label: 'Taux résolution',
      value: `${Math.round((stats.resolus / (stats.total || 1)) * 100)}%`,
      sub: `${stats.enCours} en attente`,
      bg: '#fff',
      light: true,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
      {kpis.map((k, i) => (
        <div
          key={i}
          style={{
            background: k.bg,
            borderRadius: 14,
            padding: '20px 22px',
            boxShadow: k.light
              ? '0 2px 8px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.06)'
              : '0 8px 24px rgba(29,78,216,.35)',
            animation: `slideUp .5s cubic-bezier(.4,0,.2,1) ${i * 80}ms both`,
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              lineHeight: 1,
              color: k.light ? '#111827' : '#fff',
              fontFamily: "'Sora', sans-serif",
              letterSpacing: '-1.5px',
            }}
          >
            {k.value}
          </div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: k.light ? '#374151' : 'rgba(255,255,255,.9)',
              marginTop: 6,
            }}
          >
            {k.label}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: k.light ? '#9CA3AF' : 'rgba(255,255,255,.6)',
              marginTop: 2,
            }}
          >
            {k.sub}
          </div>
          {!k.light && (
            <div
              style={{
                marginTop: 12,
                height: 4,
                borderRadius: 99,
                background: 'rgba(255,255,255,.2)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (stats.resolus / (stats.total || 1)) * 100)}%`,
                  background: 'rgba(255,255,255,.8)',
                  borderRadius: 99,
                  transition: 'width 1.2s cubic-bezier(.4,0,.2,1) .3s',
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Styles d'animation pour les toasts
const animationStyles = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
`;

// Badge de statut
function StatutIncidentBadge({ statut }) {
  const s = STATUTS_INCIDENT.find(s => s.key === statut);
  if (!s) return <span>—</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
      background: '#F3F4F6',
      color: '#4B5563',
      border: '1px solid #E5E7EB',
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
      background: '#F3F4F6',
      color: '#4B5563',
    }}>
      {p.icon} {p.label}
    </span>
  );
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Composant Toast de notification
function NotificationToast({ notification, onClose, onView }) {
  if (!notification) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 1300,
      width: 360,
      animation: 'slideInRight 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 12,
        boxShadow: '0 10px 40px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.05)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: 4,
          background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
          width: '100%',
          animation: 'progress 4s linear forwards'
        }} />
        
        <div style={{ padding: '16px', display: 'flex', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertCircle size={20} color="#FFFFFF" />
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
                Nouvel incident
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 12,
                background: '#EFF6FF',
                color: '#1D4ED8'
              }}>
                {notification.priorite || 'MOYENNE'}
              </span>
            </div>
            <p style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 500,
              color: '#374151',
              marginBottom: 8
            }}>
              {notification.titre}
            </p>
            <button
              onClick={() => { onView(notification.incidentId); onClose(); }}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#3B82F6',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              Voir
            </button>
          </div>
          
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9CA3AF',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 6
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Panneau Détails
function DetailIncidentPanel({ incident, onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ backgroundColor: '#fff', borderRadius: 24, width: '90%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontFamily: T.font }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: T.gradBlue, padding: '20px 28px', borderTopLeftRadius: 24, borderTopRightRadius: 24, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Détails de l'incident</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}><X size={24} /></button>
        </div>
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
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

// Formulaire de création/modification
function IncidentFormPanel({ incident, onClose, onSave, isCreating }) {
  const [form, setForm] = useState({
    titre: incident?.titre || '',
    description: incident?.description || '',
    priorite: incident?.priorite || 'MOYENNE',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre?.trim()) {
      alert("Le titre est obligatoire");
      return;
    }
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
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{isCreating ? 'Nouvel incident' : 'Modifier l\'incident'}</h2>
            <X onClick={onClose} style={{ cursor: 'pointer' }} size={20} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 30 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: 'block' }}>Titre *</label>
              <input type="text" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, fontSize: 14 }} required />
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: 'block' }}>Description</label>
              <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, fontSize: 14, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: 'block' }}>Priorité</label>
              <select value={form.priorite} onChange={e => setForm({ ...form, priorite: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, fontSize: 14 }}>
                {PRIORITES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          </form>
        </div>
        <div style={{ padding: '20px 28px', borderTop: `1px solid ${T.gray200}`, display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: T.gradBlue, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
            {saving ? 'Enregistrement...' : <><CheckCircle size={16} /> Enregistrer</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// Panneau de traitement
function TraitementPanel({ incident, onClose, onSave }) {
  const [statut, setStatut] = useState(incident.statut || 'EnCours');
  const [resolution, setResolution] = useState(incident.resolution || '');
  const [saving, setSaving] = useState(false);

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
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{incident.resolution || incident.statut === 'Resolu' ? 'Modifier le traitement' : 'Traiter l\'incident'}</h2>
            <X onClick={onClose} style={{ cursor: 'pointer' }} size={20} />
          </div>
          <p style={{ fontSize: 13, marginTop: 6, opacity: 0.9 }}>{incident.titre}</p>
        </div>
        <div style={{ flex: 1, padding: 30, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{ fontWeight: 700, fontSize: 13 }}>Statut</label>
            <select value={statut} onChange={e => setStatut(e.target.value)} style={{ width: '100%', marginTop: 6, padding: '12px', borderRadius: 10, border: `1.5px solid ${T.gray200}` }}>
              {STATUTS_INCIDENT.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 700, fontSize: 13 }}>Commentaire / Résolution</label>
            <textarea rows={5} value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Décrivez les actions menées ou la résolution..." style={{ width: '100%', marginTop: 6, padding: '12px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ padding: '20px 28px', borderTop: `1px solid ${T.gray200}`, display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, background: '#fff' }}>Annuler</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: T.gradGreen, color: '#fff', fontWeight: 700 }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// Composant principal
export default function GestionIncidents() {
  const { canRead, canWrite, canEdit, canDelete, canExport } = useAuth();
  const moduleCode = "incidents";
  const hasAccess = canRead(moduleCode);
  
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterPriorite, setFilterPriorite] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [traitementIncident, setTraitementIncident] = useState(null);
  const [detailsIncident, setDetailsIncident] = useState(null);
  
  // États pour SignalR et notifications
  const [notifications, setNotifications] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);
  const [isSignalRConnected, setIsSignalRConnected] = useState(false);

  const connectionRef = useRef(null);

  // Demander la permission pour les notifications navigateur
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Connexion SignalR
  useEffect(() => {
    if (connectionRef.current) {
      console.log('⚠️ Connexion déjà existante, annulation...');
      return;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ Pas de token JWT trouvé');
      return;
    }

    console.log('🔑 Création d\'une nouvelle connexion SignalR...');
    
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB, {
        accessTokenFactory: () => localStorage.getItem('token') || '',
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    newConnection.on('ReceiveNotification', (notification) => {
      console.log('📢 Notification reçue:', notification);
      
      setNotifications(prev => {
        const exists = prev.some(n => n.incidentId === notification.incidentId);
        if (exists) {
          console.log('⚠️ Notification déjà présente, ignorée');
          return prev;
        }
        console.log('✅ Nouvelle notification ajoutée');
        return [notification, ...prev];
      });
    });

    newConnection.start()
      .then(() => {
        console.log('✅ SignalR connecté avec ID:', newConnection.connectionId);
        setIsSignalRConnected(true);
        connectionRef.current = newConnection;
      })
      .catch(err => {
        console.error('❌ Erreur SignalR:', err);
        setIsSignalRConnected(false);
      });

    return () => {
      if (connectionRef.current) {
        console.log('🔌 Fermeture de la connexion SignalR...');
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, []);

  // Gérer l'affichage du toast pour la notification la plus récente
  useEffect(() => {
    if (notifications.length > 0 && !currentToast) {
      setCurrentToast(notifications[0]);
    }
  }, [notifications, currentToast]);

  const handleCloseToast = () => {
    setCurrentToast(null);
    if (notifications.length > 0) {
      setNotifications(prev => prev.slice(1));
    }
  };

  const handleViewIncidentFromToast = (incidentId) => {
    fetchData();
    setCurrentToast(null);
    setNotifications([]);
    const incident = incidents.find(i => i.id === incidentId);
    if (incident) {
      setDetailsIncident(incident);
    }
  };

  // Chargement des données
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const incidentsRes = await axios.get(API_BASE);
      const incidentsData = incidentsRes.data.map(inc => ({
        id: inc.id || inc.Id,
        titre: inc.titre || inc.Titre,
        description: inc.description || inc.Description,
        date: inc.date || inc.Date,
        priorite: (inc.priorite || inc.Priorite || 'MOYENNE').toUpperCase(),
        statut: inc.statut || inc.Statut || 'EnCours',
        resolution: inc.resolution || inc.Resolution || '',
      }));
      setIncidents(incidentsData);

      setDetailsIncident(prev =>
        prev ? incidentsData.find(i => i.id === prev.id) ?? prev : null
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (formData) => {
    if (!canWrite(moduleCode)) {
      alert('Vous n\'avez pas la permission de créer des incidents');
      return;
    }
    try {
      await axios.post(API_BASE, formData);
      await fetchData();
      setShowCreatePanel(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création");
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingIncident) return;
    if (!canEdit(moduleCode)) {
      alert('Vous n\'avez pas la permission de modifier cet incident');
      return;
    }
    try {
      await axios.put(`${API_BASE}/${editingIncident.id}`, { ...formData, id: editingIncident.id });
      await fetchData();
      setEditingIncident(null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete(moduleCode)) {
      alert('Vous n\'avez pas la permission de supprimer des incidents');
      return;
    }
    if (!window.confirm("Supprimer définitivement cet incident ?")) return;
    try {
      await axios.delete(`${API_BASE}/${id}`);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  };

  const handleTraitement = async (data) => {
    if (!traitementIncident) return;
    if (!canWrite(moduleCode)) {
      alert('Vous n\'avez pas la permission de traiter des incidents');
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

      await axios.put(`${API_BASE}/${traitementIncident.id}`, payload);

      const updated = { ...traitementIncident, statut: data.statut, resolution: data.resolution };
      setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i));
      setDetailsIncident(prev => prev?.id === updated.id ? updated : prev);
      setTraitementIncident(null);

    } catch (err) {
      console.error(err);
      alert("Erreur lors du traitement");
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatut('all');
    setFilterPriorite('all');
  };

  const filtered = incidents.filter(inc => {
    const matchSearch = inc.titre?.toLowerCase().includes(searchTerm.toLowerCase()) || inc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = filterStatut === 'all' || inc.statut === filterStatut;
    const matchPriorite = filterPriorite === 'all' || inc.priorite === filterPriorite;
    return matchSearch && matchStatut && matchPriorite;
  });

  const stats = {
    total: incidents.length,
    enCours: incidents.filter(i => i.statut === 'EnCours').length,
    resolus: incidents.filter(i => i.statut === 'Resolu').length,
  };

  const getBarColor = (incident) => {
    return 'linear-gradient(90deg, #E5E7EB, #D1D5DB)';
  };

  const btnIcon = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 40, border: '1.5px solid',
    background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s',
  };

  const renderIncidentCard = (incident, idx) => (
    <div key={incident.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: T.shadow, transition: 'transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s', animation: `slideUp 0.5s cubic-bezier(.4,0,.2,1) ${idx * 60}ms both` }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.shadow; }}>
      <div style={{ height: 4, background: getBarColor(incident) }} />
      <div style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{incident.titre}</h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: T.gray500, lineHeight: 1.5 }}>{incident.description?.substring(0, 150)}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <PrioriteBadge priorite={incident.priorite} />
            <StatutIncidentBadge statut={incident.statut} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 12, color: T.gray400 }}>
          <Clock size={14} /> {formatDateTime(incident.date)}
        </div>
        {incident.statut === 'Resolu' && incident.resolution && (
          <div style={{ marginTop: 12, padding: 10, background: '#F9FAFB', borderRadius: 8, borderLeft: '4px solid #D1D5DB' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4B5563' }}>Résolution</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{incident.resolution}</div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <button onClick={() => setDetailsIncident(incident)} style={{ ...btnIcon, background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}><Eye size={15} /> Détails</button>
          {canEdit(moduleCode) && (
            <button onClick={() => setEditingIncident(incident)} style={{ ...btnIcon, background: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' }}><Edit size={15} /> Modifier</button>
          )}
          {canWrite(moduleCode) && (
            <button onClick={() => setTraitementIncident(incident)} style={{ ...btnIcon, background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>
              <ShieldCheck size={15} /> {incident.resolution || incident.statut === 'Resolu' ? 'Modifier traitement' : 'Traiter'}
            </button>
          )}
          {canDelete(moduleCode) && (
            <button onClick={() => handleDelete(incident.id)} style={{ ...btnIcon, background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}><Trash2 size={15} /> Supprimer</button>
          )}
        </div>
      </div>
    </div>
  );

  // Vérification d'accès
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#f4f6fa] flex items-center justify-center px-4">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Accès non autorisé</h2>
          <p className="text-gray-500">Vous n'avez pas les permissions nécessaires pour accéder à la gestion des incidents.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fa] px-4 py-5 sm:px-6" style={{ fontFamily: T.font }}>
      <style>{animationStyles}</style>
      
      <div className="mx-auto max-w-[1200px]">

        {/* ── Header ── */}
        <section className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-[24px] font-extrabold tracking-tight text-slate-900 sm:text-[26px]">
              Gestion des incidents
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Suivi et traitement des événements de sécurité
            </p>
          </div>
          {canWrite(moduleCode) && (
            <button
              type="button"
              onClick={() => setShowCreatePanel(true)}
              className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-95"
              style={{ background: T.gradBlue }}
            >
              <Plus size={18} className="mr-2" /> Déclarer un incident
            </button>
          )}
        </section>

        {/* ── KPI Strip ── */}
        <KpiStrip stats={stats} />

        {/* ── Filters ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un incident..."
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={filterStatut} 
                onChange={e => setFilterStatut(e.target.value)} 
                className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 focus:border-blue-300 focus:outline-none cursor-pointer"
              >
                <option value="all">Tous statuts</option>
                {STATUTS_INCIDENT.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <select 
                value={filterPriorite} 
                onChange={e => setFilterPriorite(e.target.value)} 
                className="h-10 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 focus:border-blue-300 focus:outline-none cursor-pointer"
              >
                <option value="all">Toutes priorités</option>
                {PRIORITES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                <SlidersHorizontal size={15} /> Réinitialiser
              </button>
            </div>

            <div className="inline-flex h-10 overflow-hidden rounded-xl border border-slate-300 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex w-10 items-center justify-center ${viewMode === 'grid' ? 'bg-[#2f62de] text-white' : 'text-slate-600'}`}
                title="Vue grille"
              >
                <LayoutGrid size={17} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`inline-flex w-10 items-center justify-center ${viewMode === 'table' ? 'bg-[#2f62de] text-white' : 'text-slate-600'}`}
                title="Vue liste"
              >
                <List size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Results ── */}
        <section className="mt-5">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400 shadow-sm">
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-400 shadow-sm">
              Aucun incident trouvé.
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-2">
              {filtered.map((incident, idx) => renderIncidentCard(incident, idx))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">Titre</th>
                      <th className="px-6 py-4">Priorité</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((incident, i) => (
                      <tr key={incident.id} className={`transition-colors hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                        <td className="px-6 py-4">
                          <div className="text-xs font-semibold text-slate-800">{incident.titre}</div>
                          <div className="max-w-56 truncate text-xs text-slate-400">{incident.description?.substring(0, 60)}</div>
                        </td>
                        <td className="px-6 py-4"><PrioriteBadge priorite={incident.priorite} /></td>
                        <td className="px-6 py-4"><StatutIncidentBadge statut={incident.statut} /></td>
                        <td className="px-6 py-4 text-xs text-slate-600">{formatDateTime(incident.date)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button type="button" onClick={() => setDetailsIncident(incident)} className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100" title="Détails">
                              <Eye size={15} />
                            </button>
                            {canEdit(moduleCode) && (
                              <button type="button" onClick={() => setEditingIncident(incident)} className="rounded-lg bg-amber-50 p-2 text-amber-600 hover:bg-amber-100" title="Modifier">
                                <Edit size={15} />
                              </button>
                            )}
                            {canWrite(moduleCode) && (
                              <button type="button" onClick={() => setTraitementIncident(incident)} className="rounded-lg bg-green-50 p-2 text-green-600 hover:bg-green-100" title="Traiter">
                                <ShieldCheck size={15} />
                              </button>
                            )}
                            {canDelete(moduleCode) && (
                              <button type="button" onClick={() => handleDelete(incident.id)} className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100" title="Supprimer">
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
        </section>
      </div>

      {currentToast && (
        <NotificationToast
          notification={currentToast}
          onClose={handleCloseToast}
          onView={handleViewIncidentFromToast}
        />
      )}

      {showCreatePanel && canWrite(moduleCode) && <IncidentFormPanel isCreating onClose={() => setShowCreatePanel(false)} onSave={handleCreate} />}
      {editingIncident && canEdit(moduleCode) && <IncidentFormPanel incident={editingIncident} isCreating={false} onClose={() => setEditingIncident(null)} onSave={handleUpdate} />}
      {traitementIncident && canWrite(moduleCode) && <TraitementPanel incident={traitementIncident} onClose={() => setTraitementIncident(null)} onSave={handleTraitement} />}
      {detailsIncident && <DetailIncidentPanel incident={detailsIncident} onClose={() => setDetailsIncident(null)} />}
    </div>
  );
}