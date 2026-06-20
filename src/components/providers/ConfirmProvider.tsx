'use client';

import React, { createContext, useContext, useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

interface AlertOptions {
  title?: string;
  buttonText?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}

type ConfirmContextType = {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  alert: (message: string, options?: AlertOptions) => Promise<void>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};

export const useAlert = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useAlert must be used within a ConfirmProvider');
  }
  return context.alert;
};

export const ConfirmProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'confirm' | 'alert'>('confirm');
  const [alertType, setAlertType] = useState<'info' | 'success' | 'error' | 'warning'>('warning');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [confirmText, setConfirmText] = useState('Xác nhận');
  const [cancelText, setCancelText] = useState('Hủy bỏ');
  
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = (msg: string, options?: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setType('confirm');
      setTitle(options?.title || 'Xác nhận hành động');
      setMessage(msg);
      setConfirmText(options?.confirmText || 'Xác nhận');
      setCancelText(options?.cancelText || 'Hủy bỏ');
      setIsOpen(true);
    });
  };

  const alert = (msg: string, options?: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      resolveRef.current = (val) => {
        resolve();
      };
      setType('alert');
      setAlertType(options?.type || 'warning');
      setTitle(options?.title || (options?.type === 'success' ? 'Thành công' : 'Thông báo'));
      setMessage(msg);
      setConfirmText(options?.buttonText || 'Đóng');
      setIsOpen(true);
    });
  };

  const handleConfirm = () => {
    if (resolveRef.current) {
      resolveRef.current(true);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolveRef.current) {
      resolveRef.current(false);
    }
    setIsOpen(false);
  };

  const renderIcon = () => {
    if (type === 'confirm') {
      return <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0" />;
    }
    switch (alertType) {
      case 'success':
        return <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertTriangle className="w-10 h-10 text-red-500 shrink-0" />;
      case 'info':
        return <Info className="w-10 h-10 text-blue-500 shrink-0" />;
      default:
        return <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0" />;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={
          <div className="flex items-center gap-3">
            {renderIcon()}
            <span>{title}</span>
          </div>
        }
        maxWidth="md"
      >
        <div className="space-y-6">
          <p className="text-slate-650 font-medium leading-relaxed">
            {message}
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            {type === 'confirm' && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all ${
                type === 'confirm' || alertType === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : alertType === 'error'
                  ? 'bg-red-500 hover:bg-red-650'
                  : alertType === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
};
