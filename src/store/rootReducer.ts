import { combineReducers } from '@reduxjs/toolkit';
import { baseApi } from '@/services/api';
import authReducer from '@/features/auth/authSlice';

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
