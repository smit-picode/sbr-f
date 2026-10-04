import { combineReducers } from '@reduxjs/toolkit';
import { baseApi } from '@/services/api';
import authReducer from '@/features/auth/authSlice';
import analysesReducer from '@/features/analysis/store/analysesSlice';

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  analyses: analysesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
