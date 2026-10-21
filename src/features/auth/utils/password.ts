import { PASSWORD_DIGIT_PATTERN, PASSWORD_LETTER_PATTERN, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../constants';

export type PasswordRuleKey = 'length' | 'letter' | 'digit';

export const PASSWORD_RULE_KEYS: PasswordRuleKey[] = ['length', 'letter', 'digit'];

export const passwordRuleMet = (rule: PasswordRuleKey, password: string): boolean => {
  if (rule === 'length') return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
  if (rule === 'letter') return PASSWORD_LETTER_PATTERN.test(password);
  return PASSWORD_DIGIT_PATTERN.test(password);
};

export const passwordAcceptable = (password: string): boolean =>
  PASSWORD_RULE_KEYS.every((rule) => passwordRuleMet(rule, password));
