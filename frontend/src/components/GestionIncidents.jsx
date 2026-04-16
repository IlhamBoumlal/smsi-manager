import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
import {
  Search, Plus, Edit, Eye, CheckCircle, AlertTriangle, Ban,
  Trash2, X, Clock, User, ShieldCheck, AlertCircle, Bell
} from 'lucide-react';

const API_BASE = 'http://localhost:5006/api/incidents';
const API_USERS = 'http://localhost:5006/api/user';
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
  { key: 'BASSE',    label: 'Basse',    color: '#10B981', bg: '#ECFDF5', icon: <AlertCircle size={14} /> },
  { key: 'MOYENNE',  label: 'Moyenne',  color: '#F59E0B', bg: '#FFFBEB', icon: <AlertTriangle size={14} /> },
  { key: 'HAUTE',    label: 'Haute',    color: '#EF4444', bg: '#FEF2F2', icon: <AlertCircle size={14} /> },
  { key: 'CRITIQUE', label: 'Critique', color: '#7F1D1D', bg: '#FEE2E2', icon: <Ban size={14} /> },
];

const STATUTS_INCIDENT = [
  { key: 'EnCours', label: 'En cours', color: '#F59E0B', bg: '#FFFBEB', icon: <AlertTriangle size={14} /> },
  { key: 'Resolu',  label: 'Résolu',   color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle size={14} /> },
];

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

  const getPriorityInfo = (priorite) => {
    switch (priorite) {
      case 'CRITIQUE':
        return { color: '#DC2626', bg: '#FEE2E2', icon: <AlertCircle size={20} />, label: 'Critique' };
      case 'HAUTE':
        return { color: '#EF4444', bg: '#FEF2F2', icon: <AlertTriangle size={20} />, label: 'Haute priorité' };
      case 'MOYENNE':
        return { color: '#F59E0B', bg: '#FFFBEB', icon: <AlertTriangle size={20} />, label: 'Priorité moyenne' };
      default:
        return { color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle size={20} />, label: 'Priorité basse' };
    }
  };

  const priorityInfo = getPriorityInfo(notification.priorite);
  const timeAgo = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 1300,
      maxWidth: 380,
      minWidth: 300,
      animation: 'slideInRight 0.3s ease-out'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderLeft: `4px solid ${priorityInfo.color}`,
        overflow: 'hidden'
      }}>
        <div style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {/* Icône */}
            <div style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: 8,
              background: priorityInfo.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ color: priorityInfo.color }}>
                {priorityInfo.icon}
              </div>
            </div>
            
            {/* Contenu */}
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 4
              }}>
                <span style={{ 
                  fontWeight: 700, 
                  fontSize: 13, 
                  color: '#111827'
                }}>
                  Nouvel incident
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 12,
                  background: priorityInfo.bg,
                  color: priorityInfo.color
                }}>
                  {priorityInfo.label}
                </span>
              </div>
              
              <div style={{ 
                fontWeight: 600, 
                fontSize: 13, 
                color: '#374151',
                marginBottom: 8
              }}>
                {notification.titre}
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginTop: 4
              }}>
                <div style={{
                  fontSize: 10,
                  color: '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Clock size={10} />
                  <span>{timeAgo}</span>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => onView(notification.incidentId)}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: priorityInfo.color,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 4
                    }}
                  >
                    Voir
                  </button>
                  <button
                    onClick={onClose}
                    style={{
                      fontSize: 11,
                      color: '#9CA3AF',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: 4
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
            
            {/* Bouton fermer X */}
            <button
              onClick={onClose}
              style={{
                flexShrink: 0,
                background: 'none',
                border: 'none',
                borderRadius: 4,
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#9CA3AF'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F3F4F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <X size={14} />
            </button>
          </div>
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
          <div><strong>Déclarant :</strong> {incident.declarant || '—'}</div>
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
function IncidentFormPanel({ incident, onClose, onSave, isCreating, users }) {
  const [form, setForm] = useState({
    titre: incident?.titre || '',
    description: incident?.description || '',
    priorite: incident?.priorite || 'MOYENNE',
    declarant: incident?.declarant || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre.trim()) {
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
            <div>
              <label style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, display: 'block' }}>Déclarant</label>
              <select value={form.declarant} onChange={e => setForm({ ...form, declarant: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${T.gray200}`, fontSize: 14 }}>
                <option value="">-- Sélectionner un utilisateur --</option>
                {users.map(user => (<option key={user.id} value={user.nomComplet || user.email}>{user.nomComplet || user.email}</option>))}
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
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterPriorite, setFilterPriorite] = useState('all');
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [traitementIncident, setTraitementIncident] = useState(null);
  const [detailsIncident, setDetailsIncident] = useState(null);
  
  // États pour SignalR et notifications
  const [connection, setConnection] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);
  const [isSignalRConnected, setIsSignalRConnected] = useState(false);

  // Demander la permission pour les notifications navigateur
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Connexion SignalR
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_HUB, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    newConnection.start()
      .then(() => {
        console.log('✅ SignalR connecté');
        setIsSignalRConnected(true);
        
        // Écoute des notifications d'incidents
        newConnection.on('ReceiveNotification', (notification) => {
          console.log('📢 Notification reçue:', notification);
          setNotifications(prev => [notification, ...prev]);
          
          // Notification système du navigateur
          if (Notification.permission === 'granted') {
            new Notification('Nouvel incident', {
              body: notification.message,
              icon: '/alert-icon.png',
              silent: false,
              requireInteraction: true
            });
          }
        });
      })
      .catch(err => {
        console.error('❌ Erreur SignalR:', err);
        setIsSignalRConnected(false);
      });

    setConnection(newConnection);

    return () => {
      if (newConnection) {
        newConnection.stop();
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
      const [incidentsRes, usersRes] = await Promise.all([
        axios.get(API_BASE),
        axios.get(API_USERS)
      ]);
      const incidentsData = incidentsRes.data.map(inc => ({
        id: inc.id || inc.Id,
        titre: inc.titre || inc.Titre,
        description: inc.description || inc.Description,
        date: inc.date || inc.Date,
        priorite: (inc.priorite || inc.Priorite || 'MOYENNE').toUpperCase(),
        declarant: inc.declarant || inc.Declarant,
        statut: inc.statut || inc.Statut || 'EnCours',
        resolution: inc.resolution || inc.Resolution || '',
      }));
      setIncidents(incidentsData);
      setUsers(usersRes.data);

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
    try {
      const payload = {
        titre:       traitementIncident.titre,
        description: traitementIncident.description,
        declarant:   traitementIncident.declarant,
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

  const btnIcon = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 40, border: '1.5px solid',
    background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      <style>{animationStyles}</style>
      
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 36px 60px' }}>
        {isSignalRConnected && (
          <div style={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            background: '#10B981',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: 99,
            fontSize: 11,
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
            Notifications temps réel actives
          </div>
        )}

        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.8px' }}>Gestion des incidents</h1>
            <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0 }}>Suivi et traitement des événements de sécurité</p>
          </div>
          <button onClick={() => setShowCreatePanel(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: T.gradBlue, border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(29,78,216,.3)' }}>
            <Plus size={18} /> Déclarer un incident
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: T.shadow }}><div style={{ fontSize: 28, fontWeight: 800 }}>{stats.total}</div><div style={{ fontSize: 12, color: T.gray500 }}>Total incidents</div></div>
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: T.shadow }}><div style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B' }}>{stats.enCours}</div><div style={{ fontSize: 12, color: T.gray500 }}>En cours</div></div>
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: T.shadow }}><div style={{ fontSize: 28, fontWeight: 800, color: '#10B981' }}>{stats.resolus}</div><div style={{ fontSize: 12, color: T.gray500 }}>Résolus</div></div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }} />
            <input type="text" placeholder="Rechercher un incident..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 40px', borderRadius: 40, border: `1.5px solid ${T.gray200}`, fontSize: 14 }} />
          </div>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} style={{ padding: '10px 16px', borderRadius: 40, border: `1.5px solid ${T.gray200}`, background: '#fff', fontSize: 13 }}>
            <option value="all">Tous statuts</option>
            {STATUTS_INCIDENT.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select value={filterPriorite} onChange={e => setFilterPriorite(e.target.value)} style={{ padding: '10px 16px', borderRadius: 40, border: `1.5px solid ${T.gray200}`, background: '#fff', fontSize: 13 }}>
            <option value="all">Toutes priorités</option>
            {PRIORITES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {loading && <div style={{ textAlign: 'center', padding: '80px 0' }}>⏳ Chargement...</div>}
          {!loading && filtered.length === 0 && <div style={{ textAlign: 'center', padding: '80px 0' }}><div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div><div style={{ fontSize: 15, fontWeight: 700 }}>Aucun incident trouvé</div></div>}
          {!loading && filtered.map((incident, idx) => (
            <div key={incident.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: T.shadow, transition: 'transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s', animation: `slideUp 0.5s cubic-bezier(.4,0,.2,1) ${idx * 60}ms both` }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = T.shadow; }}>
              <div style={{ height: 4, background: 'linear-gradient(90deg, #1D4ED8, #60A5FA)' }} />
              <div style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{incident.titre}</h3>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: T.gray500, lineHeight: 1.5 }}>{incident.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <PrioriteBadge priorite={incident.priorite} />
                    <StatutIncidentBadge statut={incident.statut} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 12, color: T.gray400 }}>
                  <Clock size={14} /> {formatDateTime(incident.date)}
                  {incident.declarant && <><User size={14} /> {incident.declarant}</>}
                </div>
                {incident.statut === 'Resolu' && incident.resolution && (
                  <div style={{ marginTop: 12, padding: 10, background: '#F0FDF4', borderRadius: 8, borderLeft: '4px solid #10B981' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>Résolution</div>
                    <div style={{ fontSize: 12, color: '#374151' }}>{incident.resolution}</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                  <button onClick={() => setDetailsIncident(incident)} style={{ ...btnIcon, background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}><Eye size={15} /> Détails</button>
                  <button onClick={() => setEditingIncident(incident)} style={{ ...btnIcon, background: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' }}><Edit size={15} /> Modifier</button>
                  <button onClick={() => setTraitementIncident(incident)} style={{ ...btnIcon, background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>
                    <ShieldCheck size={15} /> {incident.resolution || incident.statut === 'Resolu' ? 'Modifier traitement' : 'Traiter'}
                  </button>
                  <button onClick={() => handleDelete(incident.id)} style={{ ...btnIcon, background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}><Trash2 size={15} /> Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {currentToast && (
        <NotificationToast
          notification={currentToast}
          onClose={handleCloseToast}
          onView={handleViewIncidentFromToast}
        />
      )}

      {showCreatePanel && <IncidentFormPanel isCreating onClose={() => setShowCreatePanel(false)} onSave={handleCreate} users={users} />}
      {editingIncident && <IncidentFormPanel incident={editingIncident} isCreating={false} onClose={() => setEditingIncident(null)} onSave={handleUpdate} users={users} />}
      {traitementIncident && <TraitementPanel incident={traitementIncident} onClose={() => setTraitementIncident(null)} onSave={handleTraitement} />}
      {detailsIncident && <DetailIncidentPanel incident={detailsIncident} onClose={() => setDetailsIncident(null)} />}
    </div>
  );
}