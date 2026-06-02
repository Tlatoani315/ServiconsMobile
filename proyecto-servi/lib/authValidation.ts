export type ValidationRule = {
  id: string;
  label: string;
  met: boolean;
};

const EMAIL_REGEX =
  /^[a-zA-Z0-9](?:[a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;

export function getEmailRules(email: string): ValidationRule[] {
  const value = email.trim();

  return [
    { id: 'not-empty', label: 'No puede estar vacio', met: value.length > 0 },
    { id: 'no-spaces', label: 'Sin espacios', met: value.length > 0 && !/\s/.test(value) },
    {
      id: 'format',
      label: 'Formato valido (ejemplo@dominio.com)',
      met: value.length > 0 && EMAIL_REGEX.test(value),
    },
    {
      id: 'domain',
      label: 'Dominio con extension (.com, .mx, etc.)',
      met: value.includes('.') && /\.[a-zA-Z]{2,}$/.test(value),
    },
    { id: 'max', label: 'Maximo 254 caracteres', met: value.length <= 254 },
  ];
}

export function isEmailValid(email: string): boolean {
  return getEmailRules(email).every((rule) => rule.met);
}

export function getPasswordRules(password: string): ValidationRule[] {
  return [
    { id: 'min', label: 'Minimo 8 caracteres', met: password.length >= 8 },
    { id: 'max', label: 'Maximo 64 caracteres', met: password.length <= 64 },
    { id: 'upper', label: 'Al menos una mayuscula (A-Z)', met: /[A-Z]/.test(password) },
    { id: 'lower', label: 'Al menos una minuscula (a-z)', met: /[a-z]/.test(password) },
    { id: 'number', label: 'Al menos un numero (0-9)', met: /\d/.test(password) },
    {
      id: 'special',
      label: 'Al menos un simbolo (!@#$%^&*)',
      met: /[^A-Za-z0-9\s]/.test(password),
    },
    { id: 'no-spaces', label: 'Sin espacios', met: password.length === 0 || !/\s/.test(password) },
  ];
}

export function isPasswordValid(password: string): boolean {
  return getPasswordRules(password).every((rule) => rule.met);
}

export function getPasswordMatchRule(password: string, confirm: string): ValidationRule {
  return {
    id: 'match',
    label: 'Las contrasenas coinciden',
    met: confirm.length > 0 && password === confirm,
  };
}

export function getPasswordStrengthFromRules(rules: ValidationRule[]) {
  const metCount = rules.filter((r) => r.met).length;
  const total = rules.length;
  const percent = Math.round((metCount / total) * 100);

  if (metCount === 0) {
    return { label: 'Sin evaluar', color: '#2D5A45', percent: 0, isValid: false };
  }
  if (metCount < total) {
    if (percent <= 40) return { label: 'Debil', color: '#64748B', percent, isValid: false };
    if (percent <= 70) return { label: 'Regular', color: '#1B7A4E', percent, isValid: false };
    return { label: 'Casi lista', color: '#FDBA74', percent, isValid: false };
  }
  return { label: 'Segura', color: '#F97316', percent: 100, isValid: true };
}

export function getFirstValidationError(rules: ValidationRule[]): string | null {
  const failed = rules.find((r) => !r.met);
  return failed ? failed.label : null;
}
