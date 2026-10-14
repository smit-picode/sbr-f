import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { baseApi } from '@/services/api';
import { setCredentials } from '@/features/auth/authSlice';
import { rootReducer } from './rootReducer';

// Cleared at sign-in so a new session never sees the last user's data (not at sign-out, where mounted queries would refetch tokenless).
const sessionCache = createListenerMiddleware();
sessionCache.startListening({
  actionCreator: setCredentials,
  effect: (_action, api) => { api.dispatch(baseApi.util.resetApiState()); },
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(sessionCache.middleware).concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
