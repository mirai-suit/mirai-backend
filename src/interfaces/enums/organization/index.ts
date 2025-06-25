// Organization Role Enum - matching Prisma schema
export enum OrganizationRole {
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  MEMBER = "MEMBER",
}

// Organization Permissions Interface
export interface OrganizationPermissions {
  // User Management
  inviteUsers: boolean;
  removeUsers: boolean;
  changeUserRoles: boolean;

  // Board Management
  createBoards: boolean;
  deleteBoards: boolean;
  archiveBoards: boolean;

  // Organization Settings
  updateOrgSettings: boolean;
  deleteOrganization: boolean;

  // Board Access
  accessAllBoards: boolean; // Admin sees all, others need explicit access
}

// Role Permission Mapping
export const ROLE_PERMISSIONS: Record<
  OrganizationRole,
  OrganizationPermissions
> = {
  [OrganizationRole.ADMIN]: {
    inviteUsers: true,
    removeUsers: true,
    changeUserRoles: true,
    createBoards: true,
    deleteBoards: true,
    archiveBoards: true,
    updateOrgSettings: true,
    deleteOrganization: true,
    accessAllBoards: true,
  },
  [OrganizationRole.EDITOR]: {
    inviteUsers: true,
    removeUsers: false,
    changeUserRoles: false,
    createBoards: true,
    deleteBoards: false,
    archiveBoards: true,
    updateOrgSettings: false,
    deleteOrganization: false,
    accessAllBoards: false, // Need explicit board access
  },
  [OrganizationRole.MEMBER]: {
    inviteUsers: false,
    removeUsers: false,
    changeUserRoles: false,
    createBoards: false,
    deleteBoards: false,
    archiveBoards: false,
    updateOrgSettings: false,
    deleteOrganization: false,
    accessAllBoards: false, // Only assigned boards
  },
};

// Helper function to get permissions for a role
export function getPermissionsForRole(
  role: OrganizationRole
): OrganizationPermissions {
  return ROLE_PERMISSIONS[role];
}

// Helper function to check if user has specific permission
export function hasPermission(
  role: OrganizationRole,
  permission: keyof OrganizationPermissions
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}
