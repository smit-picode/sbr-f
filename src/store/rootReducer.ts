import { combineReducers } from '@reduxjs/toolkit';
import { baseApi } from '@/services/api';
import authReducer from '@/features/auth/authSlice';
import snapshotsReducer from '@/features/snapshots/store/snapshotsSlice';

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  snapshots: snapshotsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
