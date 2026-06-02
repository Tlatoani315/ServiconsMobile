import type { UserRole } from '../types/models';

export const ROLES: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'super_usuario',
    label: 'Super usuario',
    description: 'Acceso total. Crea jefes, custodios y clientes.',
  },
  {
    value: 'jefe_custodios',
    label: 'Jefe de custodios',
    description: 'Supervisa operaciones. Crea custodios y clientes.',
  },
  {
    value: 'custodio',
    label: 'Custodio',
    description: 'Opera servicios en campo.',
  },
  {
    value: 'cliente',
    label: 'Cliente',
    description: 'Consulta bitacoras de su empresa.',
  },
];

export function getRoleLabel(role: UserRole | null | undefined): string {
  return ROLES.find((r) => r.value === role)?.label ?? 'Usuario';
}

export function getHomeRouteForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case 'super_usuario':
    case 'jefe_custodios':
      return '/(app)/admin/home';
    case 'custodio':
      return '/(app)/home';
    case 'cliente':
      return '/(app)/cliente/home';
    default:
      return '/auth/login';
  }
}

export function isRouteAllowedForRole(
  role: UserRole | null | undefined,
  routePath: string,
): boolean {
  if (!role) return false;

  if (role === 'super_usuario' || role === 'jefe_custodios') {
    return routePath.includes('admin');
  }

  if (role === 'custodio') {
    return !routePath.includes('admin') && !routePath.includes('cliente');
  }

  if (role === 'cliente') {
    return routePath.includes('cliente');
  }

  return false;
}

export function canManageUsers(role: UserRole | null | undefined): boolean {
  return role === 'super_usuario' || role === 'jefe_custodios';
}

export function getCreatableRoles(actorRole: UserRole | null | undefined): UserRole[] {
  if (actorRole === 'super_usuario') {
    return ['custodio', 'jefe_custodios', 'cliente'];
  }
  if (actorRole === 'jefe_custodios') {
    return ['custodio', 'cliente'];
  }
  return [];
}

export function canCreateBitacora(role: UserRole | null | undefined): boolean {
  return role === 'custodio';
}

export function getCreatableRoleOptions(actorRole: UserRole | null | undefined) {
  const allowed = getCreatableRoles(actorRole);
  return ROLES.filter((r) => allowed.includes(r.value));
}
