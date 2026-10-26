import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((titleOrMsg, bodyOrType = '', maybeType = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    
    let title = '';
    let message = '';
    let type = 'info';

    if (typeof titleOrMsg === 'object' && titleOrMsg !== null) {
      title = titleOrMsg.title || '';
      message = titleOrMsg.message || titleOrMsg.body || '';
      type = typeof bodyOrType === 'string' && ['success', 'error', 'info', 'warning'].includes(bodyOrType) ? bodyOrType : 'info';
    } else if (typeof bodyOrType === 'string' && ['success', 'error', 'info', 'warning'].includes(bodyOrType)) {
      message = String(titleOrMsg || '');
      type = bodyOrType;
    } else if (bodyOrType) {
      title = String(titleOrMsg || '');
      message = String(bodyOrType || '');
      type = ['success', 'error', 'info', 'warning'].includes(maybeType) ? maybeType : 'info';
    } else {
      message = String(titleOrMsg || '');
      type = 'success';
    }

    setToasts((prev) => {
      const isDuplicate = prev.some(
        t => t.title === title && t.message === message && (Date.now() - (t.timestamp || 0) < 1500)
      );
      if (isDuplicate) return prev;
      return [...prev, { id, title, message, type, timestamp: Date.now() }];
    });

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Callable toast function with helper properties
  const toast = useCallback((titleOrMsg, body = '') => {
    if (body) {
      addToast(titleOrMsg, body, 'info');
    } else {
      addToast(titleOrMsg, 'info');
    }
  }, [addToast]);

  toast.success = (msg, body = '') => {
    if (body) addToast(msg, body, 'success');
    else addToast(msg, 'success');
  };
  toast.error = (msg, body = '') => {
    if (body) addToast(msg, body, 'error');
    else addToast(msg, 'error');
  };
  toast.info = (msg, body = '') => {
    if (body) addToast(msg, body, 'info');
    else addToast(msg, 'info');
  };
  toast.warning = (msg, body = '') => {
    if (body) addToast(msg, body, 'warning');
    else addToast(msg, 'warning');
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[110] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((t) => {
          let bg = 'bg-chocolate-900 border-gold-500/50 text-white';
          let iconColor = 'text-gold-400';
          let iconSvg = (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          );

          if (t.type === 'error') {
            bg = 'bg-rose-950 border-rose-500/50 text-white';
            iconColor = 'text-rose-400';
            iconSvg = (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            );
          } else if (t.type === 'warning') {
            bg = 'bg-amber-950 border-amber-500/50 text-white';
            iconColor = 'text-amber-400';
            iconSvg = (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            );
          } else if (t.type === 'info') {
            bg = 'bg-blue-950 border-blue-500/50 text-white';
            iconColor = 'text-blue-400';
            iconSvg = (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            );
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${bg}`}
            >
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <span className={`${iconColor} mt-0.5 shrink-0`}>{iconSvg}</span>
                <div className="flex flex-col">
                  {t.title && <p className="text-sm font-bold text-gold-300 leading-tight mb-0.5">{t.title}</p>}
                  <p className="text-xs font-medium text-stone-200 leading-relaxed">{t.message}</p>
                </div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-white/60 hover:text-white ml-3 rtl:mr-3 rtl:ml-0 p-1 rounded transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
