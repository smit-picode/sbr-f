// Integration API system accounts: machine logins managed under Administration (backend SBR_SYSTEM_ACCOUNT_API).
export interface SystemAccount {
  ID: number;
  NAME: string;
  CLIENT_ID: string;
  DESCRIPTION: string | null;
  IS_ACTIVE: boolean;
  TOKEN_TTL_MINUTES: number;
  CHANNEL: string;
  ROLE_ID: number | null;
  ROLE_NAME: string | null;
  TAGS: string[];
  LIVE_CREDENTIALS: number;
  LAST_USED_AT: string | null;
  CREATED_AT: string | null;
}

export interface SystemAccountCredential {
  ID: number;
  SECRET_HINT: string | null;
  CREATED_BY: number | null;
  CREATED_AT: string | null;
  EXPIRES_AT: string | null;
  REVOKED_AT: string | null;
  REVOKED_BY: number | null;
  LAST_USED_AT: string | null;
  IS_LIVE: boolean;
}

export interface SystemAccountDetail {
  account: SystemAccount | null;
  credentials: SystemAccountCredential[];
}

export interface SystemAccountRole {
  ID: number;
  ROLE_NAME: string;
  PERMISSIONS: string[];
}

export interface SystemAccountInput {
  name?: string;
  description?: string;
  roleId?: number;
  tokenTtlMinutes?: number;
  isActive?: boolean;
  tags?: string[];
}

export interface IssuedSecret {
  credentialId: number;
  secret: string;
  hint: string;
}

export interface SystemAccountForm {
  name: string;
  description: string;
  roleId: string;
  ttl: string;
  tags: string[];
}
