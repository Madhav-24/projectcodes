/**
 * Role Constants and Configurations
 * Centralized management of user roles and their permissions
 */

export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  ENGINEER: 'engineer',
  PROJECT_MANAGER: 'project_manager',
};

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'project_manager', label: 'Project Manager' },
];

/**
 * Roles requiring site assignment
 */
export const ROLES_REQUIRING_SITE = [ROLES.ENGINEER, ROLES.SUPERVISOR];

/**
 * Role descriptions for UI display
 */
export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: 'Full system access and user management',
  [ROLES.SUPERVISOR]: 'Supervisor with assigned site access',
  [ROLES.ENGINEER]: 'Engineer with assigned site access',
  [ROLES.PROJECT_MANAGER]: 'View all sites, manage messages, no settings access',
};

/**
 * Role route mappings
 */
export const ROLE_ROUTES = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.SUPERVISOR]: '/supervisor/dashboard',
  [ROLES.ENGINEER]: '/engineer/dashboard',
  [ROLES.PROJECT_MANAGER]: '/project-manager/dashboard',
};
