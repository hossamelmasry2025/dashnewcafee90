import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useLanguage } from '../../context/LanguageContext';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = "danger",
  loading = false
}) => {
  const { isRtl } = useLanguage();

  const finalTitle = title || (isRtl ? "هل أنت متأكد؟" : "Are you sure?");
  const finalMessage = message || (isRtl ? "لا يمكن التراجع عن هذا الإجراء." : "This action cannot be undone.");
  const finalConfirm = confirmText || (isRtl ? "تأكيد الحذف" : "Delete");
  const finalCancel = cancelText || (isRtl ? "إلغاء" : "Cancel");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="max-w-md"
      showClose={false}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {finalCancel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'gold'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {finalConfirm}
          </Button>
        </>
      }
    >
      <div className="flex items-start space-x-4 rtl:space-x-reverse py-2">
        <div className={`p-3 rounded-2xl flex-shrink-0 ${variant === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-gold-50 text-gold-600'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-chocolate-900">{finalTitle}</h4>
          <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">{finalMessage}</p>
        </div>
      </div>
    </Modal>
  );
};
