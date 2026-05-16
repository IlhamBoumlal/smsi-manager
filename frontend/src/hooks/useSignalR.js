import { useEffect, useRef, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { buildApiUrl } from '../services/config/url';

const HUB_URL = buildApiUrl('/notificationHub');

export const useSignalR = ({ enabled = true, onNotification } = {}) => {
  const [connection, setConnection] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const notificationCallbackRef = useRef(onNotification);

  useEffect(() => {
    notificationCallbackRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!enabled || !localStorage.getItem('token')) {
      setIsConnected(false);
      return undefined;
    }

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    const handleNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      if (notificationCallbackRef.current) {
        notificationCallbackRef.current(notification);
      }
    };

    newConnection.on('ReceiveNotification', handleNotification);

    newConnection.onreconnecting(() => {
      setIsConnected(false);
    });

    newConnection.onreconnected(() => {
      setIsConnected(true);
    });

    newConnection.onclose(() => {
      setIsConnected(false);
    });

    newConnection
      .start()
      .then(() => {
        setIsConnected(true);
      })
      .catch(() => {
        setIsConnected(false);
      });

    setConnection(newConnection);

    return () => {
      newConnection.off('ReceiveNotification', handleNotification);
      newConnection.stop().catch(() => {});
    };
  }, [enabled]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = useCallback((index) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    connection,
    notifications,
    isConnected,
    clearNotifications,
    removeNotification
  };
};
