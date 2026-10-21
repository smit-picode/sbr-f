export const LOGIN_SELECTED_ROLE_KEY: string = 'sbr_selected_role';

// Matches the backend rule for every new password.
export const PASSWORD_MIN_LENGTH: number = 10;
export const PASSWORD_MAX_LENGTH: number = 128;
export const PASSWORD_LETTER_PATTERN: RegExp = /\p{L}/u;
export const PASSWORD_DIGIT_PATTERN: RegExp = /\d/;

export const FORGOT_PASSWORD_HREF: string = '/forgot-password';
export const LOGIN_HREF: string = '/login';
