//Un toast = une petite notification temporaire qui apparaît à l’écran puis disparaît automatiquement.
import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Bell } from 'lucide-react';

export function NotificationToast({ notification, onClose, onView }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!notification) return;
    
    // Auto-fermeture après 8 secondes
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Délai pour l'animation
    }, 8000);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification || !isVisible) return null;

  const getPriorityColor = (priorite) => {
    switch (priorite) {
      case 'CRITIQUE': return '#dc2626';
      case 'HAUTE': return '#ef4444';
      case 'MOYENNE': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 1300,
      animation: 'slideInRight 0.3s ease-out',
      maxWidth: 380
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        borderLeft: `4px solid ${getPriorityColor(notification.priorite)}`,
        overflow: 'hidden'
      }}>
        <div style={{ padding: 16, display: 'flex', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={20} color="#dc2626" />
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
              Nouvel incident
            </div>
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>
              {notification.titre}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => onView(notification.incidentId)}
                style={{
                  fontSize: 12,
                  color: '#1D4ED8',
                  fontWeight: 600,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Voir détails
              </button>
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                style={{
                  fontSize: 12,
                  color: '#9CA3AF',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={16} color="#9CA3AF" />
          </button>
        </div>
      </div>
    </div>
  );
}
