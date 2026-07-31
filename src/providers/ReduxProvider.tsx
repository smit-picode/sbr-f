'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { setupListeners } from '@reduxjs/toolkit/query';
import { store } from '@/store';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  // refetchOnFocus / refetchOnReconnect in services/api.ts are inert until these window
  // listeners are wired up. Done here rather than in store/index.ts because that module is
  // also evaluated during SSR, where `window` does not exist.
  useEffect(() => setupListeners(store.dispatch), []);

  return <Provider store={store}>{children}</Provider>;
}
