'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';

type UnsavedChangesContextType = {
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextType>({
  isDirty: false,
  setDirty: () => {},
});

export const useUnsavedChanges = () => useContext(UnsavedChangesContext);

export const UnsavedChangesProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDirty, setDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const router = useRouter();

  // 1. Chặn F5, tải lại trang, tắt tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // 2. Chặn điều hướng nội bộ bằng Link (bắt sự kiện click vào thẻ <a>)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isDirty) return;
      const target = (e.target as Element).closest('a');
      if (target && target.href && target.target !== '_blank') {
        const isInternal = target.href.startsWith(window.location.origin);
        // Bỏ qua nếu bấm vào chính trang hiện tại
        if (isInternal && target.href !== window.location.href) {
          e.preventDefault();
          e.stopPropagation();
          setPendingUrl(target.href);
          setShowModal(true);
        }
      }
    };
    // Dùng capture: true để bắt sự kiện trước khi Next.js Link xử lý
    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [isDirty]);

  const confirmLeave = () => {
    setDirty(false);
    setShowModal(false);
    if (pendingUrl) {
      router.push(pendingUrl);
    }
  };

  const cancelLeave = () => {
    setShowModal(false);
    setPendingUrl(null);
  };

  return (
    <UnsavedChangesContext.Provider value={{ isDirty, setDirty }}>
      {children}
      <Modal
        isOpen={showModal}
        onClose={cancelLeave}
        title="Cảnh báo thay đổi chưa lưu"
        maxWidth="md"
      >
        <div className="space-y-6">
          <p className="text-slate-600">
            Bạn đang có những thay đổi chưa được lưu. Nếu bạn rời khỏi trang bây giờ, những thay đổi này sẽ bị mất. Bạn có chắc chắn muốn thoát không?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={cancelLeave}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Tiếp tục chỉnh sửa
            </button>
            <button
              onClick={confirmLeave}
              className="px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-sm transition-colors"
            >
              Vẫn thoát và Hủy
            </button>
          </div>
        </div>
      </Modal>
    </UnsavedChangesContext.Provider>
  );
};
