export interface PermissionNode {
  key: string;
  label: string;
  children?: PermissionNode[];
}

// Parent keys (establishments, contacts, etc.) are UI-only group labels.
// Only leaf nodes (with dots) exist in the DB.
// The frontend uses this tree to render grouped permission sections.
export const PERMISSION_TREE: PermissionNode[] = [
  {
    key: 'establishments',
    label: 'Legal Units',
    children: [
      { key: 'establishments.view',   label: 'View Legal Units' },
      { key: 'establishments.edit',   label: 'Edit Legal Units' },
      { key: 'establishments.search', label: 'Search & Filter' },
    ],
  },
  {
    key: 'enterprises',
    label: 'Enterprises',
    children: [
      { key: 'enterprises.view',        label: 'View Enterprises' },
      { key: 'enterprises.view_detail', label: 'View Enterprise Detail' },
      { key: 'enterprises.edit',        label: 'Edit Enterprises' },
      { key: 'enterprises.search',      label: 'Search & Filter' },
    ],
  },
  {
    key: 'contacts',
    label: 'Contacts',
    children: [
      { key: 'contacts.view',   label: 'View Contacts' },
      { key: 'contacts.edit',   label: 'Edit Contacts' },
      { key: 'contacts.search', label: 'Search & Filter' },
    ],
  },
  {
    key: 'addresses',
    label: 'Addresses',
    children: [
      { key: 'addresses.view',   label: 'View Addresses' },
      { key: 'addresses.edit',   label: 'Edit Addresses' },
      { key: 'addresses.search', label: 'Search & Filter' },
    ],
  },
  {
    key: 'audit_log',
    label: 'Audit Log',
    children: [
      { key: 'audit_log.view',   label: 'View Audit Log' },
      { key: 'audit_log.search', label: 'Search & Filter' },
    ],
  },
  {
    key: 'admin_panel',
    label: 'Admin Panel',
    children: [
      { key: 'admin_panel.view', label: 'View Admin Panel' },
      {
        key: 'admin_panel.permissions',
        label: 'Permissions Tab',
        children: [
          { key: 'admin_panel.permissions.view',        label: 'View Permissions' },
          { key: 'admin_panel.permissions.view_detail', label: 'View Permission Detail' },
          { key: 'admin_panel.permissions.edit',        label: 'Edit Permissions' },
          { key: 'admin_panel.permissions.search',      label: 'Search Permissions' },
        ],
      },
      {
        key: 'admin_panel.roles',
        label: 'Roles Tab',
        children: [
          { key: 'admin_panel.roles.view',        label: 'View Roles' },
          { key: 'admin_panel.roles.view_detail', label: 'View Role Detail' },
          { key: 'admin_panel.roles.edit',        label: 'Edit Roles' },
          { key: 'admin_panel.roles.create',      label: 'Add Role' },
        ],
      },
      {
        key: 'admin_panel.users',
        label: 'Users Tab',
        children: [
          { key: 'admin_panel.users.view',        label: 'View Users' },
          { key: 'admin_panel.users.view_detail', label: 'View User Detail' },
          { key: 'admin_panel.users.edit',        label: 'Edit Users' },
          { key: 'admin_panel.users.search',      label: 'Search Users' },
        ],
      },
    ],
  },
];

// Flat set of all leaf permission keys
export const CHILD_PERMISSION_KEYS = new Set(
  PERMISSION_TREE.flatMap(n => (n.children ?? []).map(c => c.key))
);
