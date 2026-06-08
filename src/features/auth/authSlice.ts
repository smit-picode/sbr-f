import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, LoginResponse } from '@/types';

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginResponse>) => {
      state.token = action.payload.token;
      state.user = { email: action.payload.email, role: action.payload.role };
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sbr_token', action.payload.token);
        localStorage.setItem('sbr_user', JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sbr_token');
        localStorage.removeItem('sbr_user');
      }
    },
    hydrateAuth: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('sbr_token');
        const userStr = localStorage.getItem('sbr_user');
        if (token) {
          state.token = token;
          state.isAuthenticated = true;
          if (userStr) {
            try {
              state.user = JSON.parse(userStr);
            } catch {
              // Invalid JSON, skip
            }
          }
        }
      }
    },
  },
});

export const { setCredentials, logout, hydrateAuth } = authSlice.actions;
export default authSlice.reducer;
