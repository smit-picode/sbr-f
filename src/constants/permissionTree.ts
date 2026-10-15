import type { TFunction } from 'i18next';

import type { PermissionNode } from '@/types';
// Labels live under admin.permLabels, keyed by the permission with dots as underscores; the tree label is the fallback.
export function permissionLabel(key: string, fallback: string, t: TFunction): string {
  return t(`admin.permLabels.${key.replace(/\./g, '_')}`, { defaultValue: fallback });
}

// Parent keys are UI-only group labels; only dotted leaf keys exist in the DB, and the tree drives the grouped permission sections.
export const PERMISSION_TREE: PermissionNode[] = [
  {
    key: 'home',
    label: 'Home',
    children: [
      { key: 'home_executive.view', label: 'Executive Dashboard' },
      { key: 'home_reviewer.view', label: 'Data Reviewer Dashboard' },
      { key: 'home_steward.view', label: 'Data Steward Dashboard' },
    ],
  },
  {
    key: 'establishments',
    label: 'Establishments',
    children: [
      { key: 'establishments.view',         label: 'View Establishments' },
      { key: 'establishments.view_detail',  label: 'View Establishment Detail' },
      { key: 'establishments.view_history', label: 'View Update History' },
      { key: 'establishments.edit',         label: 'Edit Establishments' },
      { key: 'establishments.search',       label: 'Search & Filter' },
    ],
  },
  {
    key: 'enterprises',
    label: 'Enterprises',
    children: [
      { key: 'enterprises.view',         label: 'View Enterprises' },
      { key: 'enterprises.view_detail',  label: 'View Enterprise Detail' },
      { key: 'enterprises.view_history', label: 'View Update History' },
      { key: 'enterprises.edit',         label: 'Edit Enterprises' },
      { key: 'enterprises.search',       label: 'Search & Filter' },
    ],
  },
  {
    key: 'enterprise_groups',
    label: 'Enterprise Groups',
    children: [
      { key: 'enterprise_groups.view',        label: 'View Enterprise Groups' },
      { key: 'enterprise_groups.view_detail', label: 'View Group Detail' },
      { key: 'enterprise_groups.view_history', label: 'View Update History' },
      { key: 'enterprise_groups.create',      label: 'Create Enterprise Group' },
      { key: 'enterprise_groups.edit',        label: 'Edit Enterprise Groups' },
      { key: 'enterprise_groups.search',      label: 'Search & Filter' },
    ],
  },
  {
    key: 'contacts',
    label: 'Contacts',
    children: [
      { key: 'contacts.view',         label: 'View Contacts' },
      { key: 'contacts.view_detail',  label: 'View Contact Detail' },
      { key: 'contacts.view_history', label: 'View Update History' },
      { key: 'contacts.edit',         label: 'Edit Contacts' },
      { key: 'contacts.search',       label: 'Search & Filter' },
      { key: 'contacts.create',       label: 'Add Contacts' },
      { key: 'contacts.tag',          label: 'Tag Contacts (incl. tag upload)' },
    ],
  },
  {
    key: 'addresses',
    label: 'Addresses',
    children: [
      { key: 'addresses.view',         label: 'View Addresses' },
      { key: 'addresses.view_detail',  label: 'View Address Detail' },
      { key: 'addresses.view_history', label: 'View Update History' },
      { key: 'addresses.edit',         label: 'Edit Addresses' },
      { key: 'addresses.search',       label: 'Search & Filter' },
    ],
  },
  {
    key: 'legal_units',
    label: 'Legal Units',
    children: [
      { key: 'legal_units.view',   label: 'View Legal Units' },
      { key: 'legal_units.search', label: 'Search & Filter' },
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
        // UI-only group node merging the Roles and Permissions sections; the leaf keys below are unchanged.
        key: 'admin_panel.roles_permissions',
        label: 'Roles & Permissions Tab',
        children: [
          { key: 'admin_panel.roles.view',         label: 'View Roles' },
          { key: 'admin_panel.roles.edit',         label: 'Edit Roles' },
          { key: 'admin_panel.roles.create',       label: 'Add Role' },
          { key: 'admin_panel.roles.delete',       label: 'Delete Role' },
          { key: 'admin_panel.permissions.view',   label: 'View Permissions' },
          { key: 'admin_panel.permissions.edit',   label: 'Edit Permissions' },
          { key: 'admin_panel.permissions.search', label: 'Search Permissions' },
        ],
      },
      {
        key: 'admin_panel.users',
        label: 'Users Tab',
        children: [
          { key: 'admin_panel.users.view',        label: 'View Users' },
          { key: 'admin_panel.users.view_detail', label: 'View User Detail' },
          { key: 'admin_panel.users.edit',        label: 'Edit Users' },
          { key: 'admin_panel.users.create',      label: 'Add Users' },
          { key: 'admin_panel.users.delete',      label: 'Delete Users' },
          { key: 'admin_panel.users.search',      label: 'Search Users' },
        ],
      },
      {
        key: 'admin_panel.pipeline_logs',
        label: 'Pipeline Logs Tab',
        children: [
          { key: 'admin_panel.pipeline_logs.view', label: 'View Pipeline Logs' },
        ],
      },
    ],
  },
  {
    key: 'data_quality',
    label: 'Data Quality',
    children: [
      { key: 'data_quality.view', label: 'View Data Quality Scores' },
    ],
  },
  {
    key: 'source_catalog',
    label: 'Source Catalog',
    children: [
      { key: 'source_catalog.view', label: 'View Source Catalog' },
      { key: 'source_catalog.view_data', label: 'View Source Table Data' },
    ],
  },
  {
    key: 'snapshots',
    label: 'Snapshots',
    children: [
      { key: 'snapshots.view',   label: 'Browse Snapshots' },
      { key: 'snapshots.create', label: 'Create Snapshot' },
    ],
  },
  {
    // Saved analyses are private unless shared; sharing and deleting stay with the owner (or a super admin).
    key: 'analysis',
    label: 'Analysis',
    children: [
      { key: 'analysis.view',               label: 'View Analyses' },
      { key: 'analysis.edit',               label: 'Create & Edit Analyses' },
      { key: 'analysis.export_unsuppressed', label: 'Export Unsuppressed Figures' },
    ],
  },
  {
    // Draws read the whole register (or a frozen frame), contacts included, so it is its own grant.
    key: 'sampling',
    label: 'Sample Builder',
    children: [
      { key: 'sampling.view', label: 'Build & Draw Samples' },
    ],
  },
  {
    key: 'surveys',
    label: 'Surveys',
    children: [
      { key: 'surveys.view', label: 'View Survey Samples' },
    ],
  },
  {
    key: 'approvals',
    label: 'Approvals',
    children: [
      { key: 'approvals.view',    label: 'View Attribute Change Requests' },
      { key: 'approvals.approve', label: 'Approve / Reject Change Requests' },
    ],
  },
  {
    // Applying a tag needs contacts.tag (Contacts above); this is the registry itself.
    key: 'contact_tags',
    label: 'Contact Tags',
    children: [
      { key: 'contact_tags.manage', label: 'Manage Tag Registry' },
    ],
  },
  {
    // Module-level Bulk Change access on top of per-entity permissions; a submit still needs the table's Edit permission and a decision still needs Approve / Reject.
    key: 'bulk_change',
    label: 'Bulk Change',
    children: [
      { key: 'bulk_change.view',    label: 'View Bulk Changes' },
      { key: 'bulk_change.create',  label: 'Create Bulk Update' },
      { key: 'bulk_change.approve', label: 'Approve / Reject Bulk Changes' },
    ],
  },
];

// Flat set of all leaf permission keys
export const CHILD_PERMISSION_KEYS = new Set(
  PERMISSION_TREE.flatMap(n => (n.children ?? []).map(c => c.key))
);
