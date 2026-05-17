import React, { useEffect, useState } from 'react';

export interface ToastItem {
  id: string;
  message: string;
  kind?: 'info' | 'error' | 'warn';
}

export const ToastContainer: React.FC<{ toasts: ToastItem[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-[200000] flex items-start justify-center p-4">
      <div className="mt-[18vh] flex flex-col gap-2">
        {toasts.map(t => (
          <Toast key={t.id} item={t} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
};

const Toast: React.FC<{ item: ToastItem; onRemove: (id: string) => void }> = ({ item, onRemove }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t1 = window.setTimeout(() => setShow(true), 10);
    const t2 = window.setTimeout(() => setShow(false), 1700);
    const t3 = window.setTimeout(() => onRemove(item.id), 2200);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3); };
  }, [item.id, onRemove]);
  const color = item.kind === 'error' ? 'from-rose-600 to-red-600' : item.kind === 'warn' ? 'from-amber-500 to-yellow-500' : 'from-sky-500 to-indigo-600';
  return (
    <div className={`pointer-events-auto mx-auto w-[min(80vw,28rem)] rounded-2xl px-4 py-3 text-white font-bold text-sm shadow-[0_18px_48px_rgba(6,12,28,0.5)] bg-gradient-to-r ${color} transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      {item.message}
    </div>
  );
};

