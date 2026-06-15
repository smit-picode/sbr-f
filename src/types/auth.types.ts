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
  // All roles the user holds — powers the post-login role picker / role switching
  roles: AuthRole[];
}
