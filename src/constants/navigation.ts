export type NavItem = {
  title: string;
  href: string;
  icon: string;
  permKey: string | string[]; // The .view permission required to show this nav link ('' = always visible; array = visible if ANY key is held)
  i18nKey: string;       // Translation key for the link label (page header)
  sidebarLabel?: string; // Override label shown only in the sidebar
  breadcrumbLabel?: string; // Override label shown only in the breadcrumb
  divider?: boolean;  // Render a thin separator above this item (reference design)
  showCount?: boolean; // Show live pending-count badge next to this item in the sidebar
  children?: NavItem[];
};

export type NavGroup = {
  id: string;
  title: string;
  i18nKey: string;    // Translation key for the group label
  items: NavItem[];
};

// Grouped sidebar navigation. Permission gating:
// - Regular items: visible if user is SUPER_ADMIN or holds the item's permKey
// - permKey '' : always visible (e.g. Enterprises stub)
// - Administration group: visible if SUPER_ADMIN, admin_panel.view, or any admin_panel.* permission
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'sbr-live-frame',
    title: 'SBR Live Frame',
    i18nKey: 'nav.sbrLiveFrame',
    items: [
      { title: 'Home',        href: '/home',        icon: 'Home',          permKey: '',                    i18nKey: 'nav.home'        },
      { title: 'Establishments', href: '/establishments',       icon: 'Building2',     permKey: 'establishments.view', i18nKey: 'nav.establishments', divider: true  },
      { title: 'Enterprises', href: '/enterprises', icon: 'Orbit',         permKey: 'enterprises.view',    i18nKey: 'nav.enterprises' },
      { title: 'Enterprise Groups', href: '/enterprise-groups', icon: 'GitFork', permKey: 'enterprise_groups.view', i18nKey: 'nav.enterpriseGroups' },
      { title: 'Contacts',    href: '/contacts',    icon: 'Users',         permKey: 'contacts.view',       i18nKey: 'nav.contacts', divider: true    },
      { title: 'Addresses',   href: '/addresses',   icon: 'MapPin',        permKey: 'addresses.view',      i18nKey: 'nav.addresses'   },
      { title: 'Legal Units', href: '/legal-units', icon: 'Table',         permKey: 'legal_units.view',    i18nKey: 'nav.legalUnits'  },
    ],
  },
  {
    id: 'tasks',
    title: 'Tasks',
    i18nKey: 'nav.tasks',
    items: [
      // Hidden in frontend until the Attribute Change Requests feature is ready to show to the client. Uncomment to restore.
      { title: 'Attribute Change Requests', href: '/tasks/attribute-change-requests', icon: 'Inbox', permKey: ['approvals.view', 'approvals.approve'], i18nKey: 'nav.attributeChangeRequests', showCount: true },
      { title: 'Profiling Runs',            href: '/tasks/profiling-runs',             icon: 'GitBranch',        permKey: '', i18nKey: 'nav.profilingRuns'           },
      // Module-level gate. The per-entity permissions are still enforced by the API and by
      // SBR_PORTAL_PKG on every bulk call — this key only decides whether the module is
      // offered at all. Existing roles received it automatically via the seeder backfill,
      // so nobody who could reach Bulk Change before lost it.
      { title: 'Bulk Change',                href: '/tasks/bulk-change',                icon: 'Layers',           permKey: 'bulk_change.view', i18nKey: 'nav.bulkChange' },
      { title: 'Tasks History',             href: '/tasks/tasks-history',              icon: 'CheckCheck',       permKey: '', i18nKey: 'nav.tasksHistory'            },
      { title: 'Profiling History',         href: '/tasks/profiling-history',          icon: 'History',          permKey: '', i18nKey: 'nav.profilingHistory'        },
      { title: 'Audit Log',                 href: '/audit-log',                        icon: 'ClipboardList',    permKey: 'audit_log.view', i18nKey: 'nav.auditLog'     },
    ],
  },
  {
    id: 'frozen-frames',
    title: 'Frozen Frames',
    i18nKey: 'nav.frozenFrames',
    items: [
      { title: 'Create Snapshot',  href: '/snapshots/create',   icon: 'Camera',      permKey: '', i18nKey: 'nav.createSnapshot'  },
      { title: 'Browse Snapshots', href: '/snapshots/browse',   icon: 'Database',    permKey: '', i18nKey: 'nav.browseSnapshots' },
      { title: 'Analysis',         href: '/snapshots/analysis', icon: 'ChartColumn', permKey: '', i18nKey: 'nav.analysis'         },
    ],
  },
  {
    id: 'data-quality',
    title: 'Data Quality',
    i18nKey: 'nav.dataQuality',
    items: [
      { title: 'Quality Dashboard',    href: '/quality/dashboard',  icon: 'Gauge',    permKey: '', i18nKey: 'nav.qualityDashboard'    },
      { title: 'Quality Findings',     href: '/quality/findings',   icon: 'Flag',     permKey: '', i18nKey: 'nav.qualityFindings'     },
      { title: 'Regulator Escalation', href: '/quality/escalation', icon: 'Landmark', permKey: '', i18nKey: 'nav.regulatorEscalation' },
    ],
  },
  {
    id: 'source-data',
    title: 'Source Data',
    i18nKey: 'nav.sourceData',
    items: [
      { title: 'Source Catalog', href: '/sources', icon: 'Database', permKey: '', i18nKey: 'nav.sourceCatalog' },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    i18nKey: 'nav.administration',
    items: [
      { title: 'User Management',  href: '/admin/users',          icon: 'Users',       permKey: 'admin_panel.users.view', i18nKey: 'admin.tabs.users',         sidebarLabel: 'Users', breadcrumbLabel: 'Users' },
      { title: 'Roles',            href: '/admin/roles',          icon: 'ShieldCheck', permKey: 'admin_panel.roles.view', i18nKey: 'admin.tabs.roles'                                                              },
      { title: 'Rule Registry',    href: '/admin/rule-registry',  icon: 'SlidersVertical',  permKey: '',                       i18nKey: 'admin.tabs.ruleRegistry'                                                       },
      { title: 'Column Access',    href: '/admin/column-access',  icon: 'Columns2',    permKey: '',                       i18nKey: 'admin.tabs.columnAccess'                                                       },
      { title: 'Pipeline Logs',    href: '/admin/pipeline-logs',  icon: 'DatabaseZap', permKey: '',                       i18nKey: 'admin.tabs.pipelineLogs'                                                       },
      { title: 'Activity Logs',    href: '/admin/activity-logs',  icon: 'History',     permKey: '',                       i18nKey: 'admin.tabs.activityLogs'                                                       },
    ],
  },
];

// Flat list kept for backwards compatibility (breadcrumbs, route lookups)
export const NAVIGATION: NavItem[] = NAV_GROUPS[0].items;
