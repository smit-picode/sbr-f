export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthRole {
  ID: number;
  ROLE_NAME: string;
  IS_SCOPED: boolean;
}

export interface LoginResponse {
  token: string;
  role: string;
  email: string;
  roles?: AuthRole[];
}

// A permission is just a name string. Having it in the list = granted.
export interface UserPermission {
  permissionName: string;
}

export interface AuthState {
  token: string | null;
  user: { email: string; role: string } | null;
  isAuthenticated: boolean;
  permissions: UserPermission[];
  roles: AuthRole[];
}

// What an emailed password link is for: an invitation to a new account, or a reset.
export type PasswordLinkPurpose = 'INVITE' | 'RESET';

export interface PasswordLinkInfo {
  purpose: PasswordLinkPurpose;
  name: string;
  email: string;
  expiresAt: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
