import React from 'react';
import Toast, { type ToastType } from './Toast';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  subText?: string;
  duration?: number;
}

interface ToasterProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

const Toaster: React.FC<ToasterProps> = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};

export default Toaster;
