import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher globally available for Laravel Echo
if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
  // Enable console logging for real-time visibility and debugging
  Pusher.logToConsole = true;
}

let currentEcho = null;
let currentToken = null;
let connectionState = 'disconnected'; // 'connected' | 'connecting' | 'disconnected'
let autoReconnectTimer = null;

// Registry of active event callbacks and connection state callbacks
const eventSubscribers = new Set();
const statusSubscribers = new Set();

const EVENTS_TO_LISTEN = [
  '.notification',
  'notification',
  'admin_new_order',
  '.admin_new_order',
  'admin_bill_requested',
  '.admin_bill_requested',
  'admin_new_round',
  '.admin_new_round',
  'order_confirmed',
  '.order_confirmed',
  'order_rejected',
  '.order_rejected',
  'round_acknowledged',
  '.round_acknowledged',
  'round_served',
  '.round_served',
  'admin_new_booking',
  '.admin_new_booking',
  'booking_created',
  '.booking_created',
  'booking_updated',
  '.booking_updated',
  'booking_status_updated',
  '.booking_status_updated',
  'booking_confirmed',
  '.booking_confirmed',
  'booking_rejected',
  '.booking_rejected',
  'NewOrder',
  '.NewOrder',
  'OrderCreated',
  '.OrderCreated'
];

/**
 * Update connection state and notify all registered listeners.
 */
function updateConnectionState(newState) {
  if (connectionState === newState) return;
  console.log(`[Real-time State] Transitioned: ${connectionState} -> ${newState}`);
  connectionState = newState;
  statusSubscribers.forEach((cb) => {
    try {
      cb(newState);
    } catch (e) {
      console.warn('[Real-time] Error in status callback:', e);
    }
  });
}

/**
 * Handle incoming real-time event and broadcast to all subscribers.
 */
function dispatchAdminEvent(eventName, rawPayload) {
  console.log(`[Real-time Event Broadcast] ${eventName}:`, rawPayload);
  if (!rawPayload && !eventName) return;

  const payload = typeof rawPayload === 'object' && rawPayload !== null ? rawPayload : {};
  const type = payload.type || (payload.data && payload.data.type) || eventName.replace(/^\./, '');

  let defaultTitleAr = 'إشعار جديد من كافيه 90';
  let defaultTitleEn = 'New Cafe 90 Alert';
  let defaultBodyAr = 'تم استلام تحديث جديد';
  let defaultBodyEn = 'A new update was received';

  if (type === 'admin_new_order') {
    defaultTitleAr = 'أوردر تيك أواي جديد';
    defaultTitleEn = 'New Takeaway Order';
    defaultBodyAr = payload.data?.order_id ? `طلب جديد رقم #${payload.data.order_id}` : 'طلب جديد في الانتظار';
    defaultBodyEn = payload.data?.order_id ? `New order #${payload.data.order_id}` : 'New order pending';
  } else if (type === 'admin_new_round') {
    defaultTitleAr = 'طلب جولة إضافية على طاولة';
    defaultTitleEn = 'New Round on Table';
    defaultBodyAr = 'قام العميل بطلب منتجات إضافية للجلسة';
    defaultBodyEn = 'Guest added more items to the table';
  } else if (type === 'admin_bill_requested') {
    defaultTitleAr = 'طلب حساب طاولة صالة';
    defaultTitleEn = 'Bill Requested on Table';
    defaultBodyAr = 'طلب العميل إغلاق الحساب وإصدار الفاتورة';
    defaultBodyEn = 'Guest requested bill for the table';
  } else if (type.includes('booking')) {
    defaultTitleAr = 'حجز جديد لغرفة اجتماعات';
    defaultTitleEn = 'New Room Booking';
    defaultBodyAr = payload.data?.booking_id ? `تم استلام حجز غرفة جديد رقم #${payload.data.booking_id}` : 'تم استلام حجز قاعة جديد';
    defaultBodyEn = payload.data?.booking_id ? `New room booking #${payload.data.booking_id}` : 'New room booking received';
  }

  const normalizedEvent = {
    ...payload,
    type: type,
    title: payload.title || { ar: defaultTitleAr, en: defaultTitleEn },
    body: payload.body || { ar: defaultBodyAr, en: defaultBodyEn },
    data: payload.data || payload
  };

  eventSubscribers.forEach((cb) => {
    try {
      cb(normalizedEvent);
    } catch (e) {
      console.warn('[Real-time] Error in event subscriber callback:', e);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin:realtime_event', { detail: normalizedEvent }));
    window.dispatchEvent(new CustomEvent('notification:received', { detail: normalizedEvent }));

    if (type.includes('order') || type.includes('round') || type.includes('bill')) {
      window.dispatchEvent(new CustomEvent('order:realtime_update', { detail: normalizedEvent }));
    }
    if (type.includes('booking')) {
      window.dispatchEvent(new CustomEvent('booking:realtime_update', { detail: normalizedEvent }));
    }
  }
}

/**
 * Returns the currently active Laravel Echo instance.
 */
export function getEchoInstance() {
  return currentEcho;
}

/**
 * Returns current connection state synchronously.
 */
export function getConnectionState() {
  return connectionState;
}

/**
 * Disconnects and leaves all channels for the active Echo instance.
 */
export function disconnectEcho() {
  if (autoReconnectTimer) {
    clearTimeout(autoReconnectTimer);
    autoReconnectTimer = null;
  }

  if (currentEcho) {
    try {
      currentEcho.leave('admin');
      currentEcho.leaveChannel('admin');
      currentEcho.leaveChannel('private-admin');
      currentEcho.disconnect();
      console.log('[Echo] Disconnected successfully');
    } catch (e) {
      console.warn('[Echo] Disconnect error:', e);
    }
    currentEcho = null;
    currentToken = null;
  }
  updateConnectionState('disconnected');
}

/**
 * Sets up channels and listeners on the Echo instance.
 */
function setupChannelsAndListeners(echo) {
  // 1. Subscribe to public channel 'admin' first (standard Pusher broadcast, requires no auth and works unconditionally)
  try {
    const publicChan = echo.channel('admin');

    EVENTS_TO_LISTEN.forEach((ev) => {
      publicChan.listen(ev, (data) => dispatchAdminEvent(ev, data));
    });

    const pubSub = publicChan.subscription;
    if (pubSub && typeof pubSub.bind_global === 'function') {
      pubSub.bind_global((evName, evData) => {
        if (evName && !evName.startsWith('pusher:')) {
          dispatchAdminEvent(evName, evData);
        }
      });
    }
  } catch (err) {
    console.warn('[Real-time] Public channel subscribe note:', err);
  }

  // 2. Also subscribe to private channel 'admin' for backend servers using private channel broadcasting
  try {
    const privateChan = echo.private('admin');

    EVENTS_TO_LISTEN.forEach((ev) => {
      privateChan.listen(ev, (data) => dispatchAdminEvent(ev, data));
    });

    const rawSub = privateChan.subscription;
    if (rawSub && typeof rawSub.bind_global === 'function') {
      rawSub.bind_global((evName, evData) => {
        if (evName && !evName.startsWith('pusher:')) {
          dispatchAdminEvent(evName, evData);
        }
      });
    }
  } catch (err) {
    // Graceful fallback
  }

  // 3. Also subscribe to individual user channel App.Models.User.{id} if available
  try {
    let userId = null;
    try {
      const storedUser = localStorage.getItem('admin_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        userId = u?.id;
      }
    } catch (e) {}

    if (userId) {
      const userChan = echo.private(`App.Models.User.${userId}`);
      EVENTS_TO_LISTEN.forEach((ev) => {
        userChan.listen(ev, (data) => dispatchAdminEvent(ev, data));
      });
    }
  } catch (err) {
    // Graceful fallback
  }
}

/**
 * Creates and configures the singleton Laravel Echo instance using Pusher.
 * If an active instance with the same token already exists, it is reused.
 * 
 * @param {string} [token] Optional Bearer token. If omitted, attempts to read from localStorage.
 * @param {boolean} [forceNew=false] Whether to force recreation of the Echo instance.
 * @returns {Echo} Configured Echo instance
 */
export function createEcho(token, forceNew = false) {
  const authToken = token || 
    (typeof localStorage !== 'undefined' 
      ? (localStorage.getItem('admin_token') || localStorage.getItem('token') || '') 
      : '');

  if (!authToken) {
    updateConnectionState('disconnected');
    return null;
  }

  // If already instantiated with the same token and not forcing new, reuse existing
  if (currentEcho && currentToken === authToken && !forceNew) {
    const pusherState = currentEcho.connector?.pusher?.connection?.state;
    if (pusherState === 'connected') {
      updateConnectionState('connected');
    } else if (pusherState === 'connecting') {
      updateConnectionState('connecting');
    }
    return currentEcho;
  }

  // Disconnect old instance if forcing new or token changed
  if (currentEcho) {
    try {
      currentEcho.disconnect();
    } catch (e) {}
    currentEcho = null;
  }

  currentToken = authToken;
  updateConnectionState('connecting');

  currentEcho = new Echo({
    broadcaster: 'pusher',
    key: 'a0c1958aaf0ffd5a18aa',
    cluster: 'eu',
    forceTLS: true,
    authEndpoint: '/api/broadcasting/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
    },
    // Safe authorizer that only queries local proxy endpoints to eliminate browser CORS errors
    authorizer: (channel, options) => {
      return {
        authorize: (socketId, callback) => {
          const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
          // On localhost, strictly use same-origin proxy paths to prevent cross-origin preflight CORS blocks
          const authEndpoints = isLocal
            ? [
                '/api/broadcasting/auth',
                '/public/api/broadcasting/auth',
                '/broadcasting/auth',
                '/public/broadcasting/auth',
              ]
            : [
                '/api/broadcasting/auth',
                '/public/api/broadcasting/auth',
                '/broadcasting/auth',
                'https://backend.ninety90degree.com/public/api/broadcasting/auth',
              ];

          const tryAuth = async () => {
            let lastErr = null;
            for (const endpoint of authEndpoints) {
              try {
                const formData = new URLSearchParams();
                formData.append('socket_id', socketId);
                formData.append('channel_name', channel.name);

                const res = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${authToken}`,
                  },
                  body: formData.toString()
                });

                if (res.ok) {
                  const data = await res.json();
                  return callback(null, data);
                }
              } catch (err) {
                lastErr = err;
              }
            }
            // Gracefully inform Pusher without triggering noisy uncaught promise rejections
            // Public channel listener will continue to capture all broadcasts
            callback(lastErr || new Error('Broadcasting authorization unavailable'), null);
          };

          tryAuth();
        }
      };
    }
  });

  // Attach connection lifecycle listeners
  try {
    const pusherClient = currentEcho.connector?.pusher;
    if (pusherClient && pusherClient.connection) {
      pusherClient.connection.bind('state_change', (states) => {
        const current = states.current;
        console.log('[Pusher Socket State Change]', states.previous, '->', current);
        if (current === 'connected') {
          updateConnectionState('connected');
        } else if (current === 'connecting') {
          updateConnectionState('connecting');
        } else {
          updateConnectionState('disconnected');

          // Auto-reconnect after 4s if disconnected unexpectedly while authenticated
          if (currentToken && !autoReconnectTimer) {
            autoReconnectTimer = setTimeout(() => {
              autoReconnectTimer = null;
              if (currentToken && connectionState !== 'connected') {
                console.log('[Real-time] Attempting automatic reconnection...');
                try {
                  pusherClient.connect();
                } catch (e) {}
              }
            }, 4000);
          }
        }
      });

      pusherClient.connection.bind('connected', () => {
        updateConnectionState('connected');
      });

      pusherClient.connection.bind('disconnected', () => {
        updateConnectionState('disconnected');
      });

      pusherClient.connection.bind('error', (err) => {
        console.warn('[Pusher Socket Error]', err);
      });

      if (pusherClient.connection.state === 'connected') {
        updateConnectionState('connected');
      }
    }
  } catch (e) {
    console.warn('[Real-time] Could not attach Pusher connection listeners:', e);
  }

  // Setup channel subscriptions
  setupChannelsAndListeners(currentEcho);

  return currentEcho;
}

/**
 * Reconnect Echo forcefully (e.g. when clicking reconnect pill or manual refresh).
 */
export function reconnectEcho() {
  console.log('[Real-time] Manual reconnect requested');
  updateConnectionState('connecting');
  const token = typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('admin_token') || localStorage.getItem('token') || '') 
    : '';

  if (!token) {
    updateConnectionState('disconnected');
    return null;
  }

  // Try soft reconnect first if pusher instance exists
  try {
    const pusher = currentEcho?.connector?.pusher;
    if (pusher && typeof pusher.connect === 'function') {
      pusher.connect();
      return currentEcho;
    }
  } catch (e) {}

  // Otherwise recreate instance
  return createEcho(token, true);
}

/**
 * Subscribes a component to real-time events and connection status.
 * Multiple components can subscribe concurrently without disconnecting each other.
 * 
 * @param {Function} onEvent Callback invoked with normalized event
 * @param {Function} [onStatusChange] Callback invoked with current connection state
 * @returns {Function} Unsubscribe function
 */
export function subscribeAdminRealtime(onEvent, onStatusChange) {
  if (typeof onEvent === 'function') {
    eventSubscribers.add(onEvent);
  }
  if (typeof onStatusChange === 'function') {
    statusSubscribers.add(onStatusChange);
    // Immediately notify caller of the current state
    try {
      onStatusChange(connectionState);
    } catch (e) {}
  }

  // Ensure singleton Echo instance is created if we have a token
  const token = typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('admin_token') || localStorage.getItem('token') || '') 
    : '';
  if (token && !currentEcho) {
    createEcho(token);
  }

  return () => {
    if (typeof onEvent === 'function') {
      eventSubscribers.delete(onEvent);
    }
    if (typeof onStatusChange === 'function') {
      statusSubscribers.delete(onStatusChange);
    }
  };
}

export default createEcho;
