import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, LoginResponse, UserPermission } from '@/types';

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  permissions: [],
  roles: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<LoginResponse>) => {
      state.token = action.payload.token;
      state.user = { email: action.payload.email, role: action.payload.role };
      state.isAuthenticated = true;
      state.permissions = [];
      state.roles = action.payload.roles ?? [];
      if (typeof window !== 'undefined') {
        localStorage.setItem('sbr_token', action.payload.token);
        localStorage.setItem('sbr_user', JSON.stringify(state.user));
        localStorage.setItem('sbr_roles', JSON.stringify(state.roles));
      }
    },
    setPermissions: (state, action: PayloadAction<UserPermission[] | string[]>) => {
      // Backend may return string[] or legacy UserPermission[] — normalise to UserPermission[]
      const normalised: UserPermission[] = (action.payload as Array<unknown>).map((p) =>
        typeof p === 'string' ? { permissionName: p } : (p as UserPermission)
      );
      state.permissions = normalised;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sbr_permissions', JSON.stringify(normalised));
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.permissions = [];
      state.roles = [];
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sbr_token');
        localStorage.removeItem('sbr_user');
        localStorage.removeItem('sbr_permissions');
        localStorage.removeItem('sbr_roles');
      }
    },
    hydrateAuth: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('sbr_token');
        const userStr = localStorage.getItem('sbr_user');
        const permStr = localStorage.getItem('sbr_permissions');
        const rolesStr = localStorage.getItem('sbr_roles');
        if (token) {
          state.token = token;
          state.isAuthenticated = true;
          if (userStr) {
            try { state.user = JSON.parse(userStr); } catch { /* skip */ }
          }
          if (permStr) {
            try { state.permissions = JSON.parse(permStr); } catch { /* skip */ }
          }
          if (rolesStr) {
            try { state.roles = JSON.parse(rolesStr); } catch { /* skip */ }
          }
        }
      }
    },
  },
});

export const { setCredentials, setPermissions, logout, hydrateAuth } = authSlice.actions;
export default authSlice.reducer;
