import type { ToastPayload, ToastType } from '@/types';

function emit(message: string, type: ToastType) {
  if (typeof window === 'undefined') return;
  const id = `${Date.now()}-${Math.random()}`;
  window.dispatchEvent(new CustomEvent<ToastPayload>('sbr:toast', { detail: { id, message, type } }));
}

export const toast = {
  success: (message: string) => emit(message, 'success'),
  error: (message: string) => emit(message, 'error'),
  info: (message: string) => emit(message, 'info'),
  warning: (message: string) => emit(message, 'warning'),
};
