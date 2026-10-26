import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
  footer = null,
  showClose = true,
  bodyClassName = '',
  contentClassName = '',
  scrollable = true
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background page scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const modalContent = (
    <div
      className={`fixed inset-0 w-screen h-screen z-[100] flex items-center justify-center p-4 sm:p-6 ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'} animate-fade-in`}
      style={{ margin: 0 }}
    >
      {/* Clean Subtle Backdrop Overlay covering full screen uniformly (Header, Sidebar, Workspace) */}
      <div
        className="fixed inset-0 bg-chocolate-950/45 backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card - Isolated pure white body with prominent depth */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-pop ring-1 ring-black/5 z-10 flex flex-col ${scrollable ? 'max-h-[92vh]' : 'h-auto max-h-[96vh]'} my-auto overflow-hidden animate-scale-up ${contentClassName}`}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3.5 border-b border-stone-100 bg-white shrink-0">
            <div>
              {title && (
                typeof title === 'string' ? (
                  <h3 className="text-base font-bold text-chocolate-900">
                    {title}
                  </h3>
                ) : (
                  title
                )
              )}
              {subtitle && (
                <p className="text-xs text-stone-500 mt-0.5 font-normal">
                  {subtitle}
                </p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 inline-flex items-center justify-center text-stone-400 hover:text-chocolate-900 hover:bg-stone-100 rounded-lg transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Form Body */}
        <div className={`px-5 sm:px-6 py-4 ${scrollable ? 'overflow-y-auto flex-1 custom-scrollbar' : 'overflow-hidden'} ${bodyClassName}`}>
          {children}
        </div>

        {/* Pinned Footer Actions */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-stone-100 bg-stone-50/70 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
