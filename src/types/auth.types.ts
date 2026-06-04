export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  email: string;
}

export interface AuthState {
  token: string | null;
  user: { email: string; role: string } | null;
  isAuthenticated: boolean;
}
