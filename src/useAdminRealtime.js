import { useEffect, useRef, useState, useCallback } from 'react';
import { subscribeAdminRealtime, createEcho, reconnectEcho, getConnectionState } from './echo';

/**
 * Custom hook to listen to real-time events for admin on both private and public channels.
 * Uses a singleton connection architecture so multiple components (e.g. NotificationContext
 * and OrdersView) can listen concurrently without disconnecting each other.
 * 
 * @param {string} token Admin Sanctum Bearer token
 * @param {Function} onNotification Callback function triggered on any incoming order/admin event
 * @param {Function} [onStatusChange] Optional callback function receiving connection status ('connected' | 'connecting' | 'disconnected')
 */
export function useAdminRealtime(token, onNotification, onStatusChange) {
  const handlerRef = useRef(onNotification);
  const statusRef = useRef(onStatusChange);
  const [connectionState, setConnectionState] = useState(() => getConnectionState());

  useEffect(() => {
    handlerRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    statusRef.current = onStatusChange;
  }, [onStatusChange]);

  // Ensure Echo singleton is initialized whenever token is present
  useEffect(() => {
    const activeToken = token || 
      (typeof localStorage !== 'undefined' 
        ? (localStorage.getItem('admin_token') || localStorage.getItem('token')) 
        : null);

    if (activeToken) {
      createEcho(activeToken);
    }
  }, [token]);

  // Subscribe to real-time event bus
  useEffect(() => {
    const unsubscribe = subscribeAdminRealtime(
      (event) => {
        if (handlerRef.current) {
          handlerRef.current(event);
        }
      },
      (status) => {
        setConnectionState(status);
        if (statusRef.current) {
          statusRef.current(status);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const reconnect = useCallback(() => {
    return reconnectEcho();
  }, []);

  return { connectionState, reconnect };
}

export default useAdminRealtime;
