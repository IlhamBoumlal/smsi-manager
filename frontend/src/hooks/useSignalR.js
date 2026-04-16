import { useEffect, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

export const useSignalR = () => {
  const [connection, setConnection] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Création de la connexion
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5006/notificationHub', {
        accessTokenFactory: () => localStorage.getItem('token')
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])  // Reconnexion automatique
      .build();

    // Gestion des événements de connexion
    newConnection.onreconnecting(() => {
      console.log('Reconnexion en cours...');
    });

    newConnection.onreconnected(() => {
      console.log('Reconnecté !');
      setIsConnected(true);
    });

    newConnection.onclose(() => {
      console.log('Connexion fermée');
      setIsConnected(false);
    });

    // Démarrage de la connexion
    newConnection.start()
      .then(() => {
        console.log('SignalR connecté');
        setIsConnected(true);
        
        // Écoute des notifications d'incidents
        newConnection.on('ReceiveIncidentNotification', (notification) => {
          console.log('Notification reçue:', notification);
          setNotifications(prev => [notification, ...prev]);
        });
      })
      .catch(err => console.error('Erreur SignalR:', err));

    setConnection(newConnection);

    // Nettoyage à la destruction du composant
    return () => {
      newConnection.stop();
    };
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    connection,
    notifications,
    isConnected,
    clearNotifications,
    removeNotification
  };
};