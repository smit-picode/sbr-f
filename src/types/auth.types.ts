export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  email: string;
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
}
