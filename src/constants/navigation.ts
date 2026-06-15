export type NavItem = {
  title: string;
  href: string;
  icon: string;
  permKey: string;    // The .view permission required to show this nav link ('' = always visible)
  i18nKey: string;    // Translation key for the link label
  divider?: boolean;  // Render a thin separator above this item (reference design)
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
      { title: 'Legal Units', href: '/legal-units',       icon: 'Building2',     permKey: 'establishments.view', i18nKey: 'nav.legalUnits'  },
      { title: 'Enterprises', href: '/enterprises', icon: 'Layers',        permKey: '',                    i18nKey: 'nav.enterprises' },
      { title: 'Contacts',    href: '/contacts',    icon: 'Users',         permKey: 'contacts.view',       i18nKey: 'nav.contacts'    },
      { title: 'Addresses',   href: '/addresses',   icon: 'MapPin',        permKey: 'addresses.view',      i18nKey: 'nav.addresses'   },
      { title: 'Audit Log',   href: '/audit-log',   icon: 'ClipboardList', permKey: 'audit_log.view',      i18nKey: 'nav.auditLog'    },
      { title: 'Enterprise 360', href: '/enterprise-360', icon: 'Orbit',   permKey: '',                    i18nKey: 'nav.enterprise360', divider: true },
    ],
  },
  {
    id: 'approvals',
    title: 'Approvals',
    i18nKey: 'nav.approvals',
    items: [
      { title: 'Requests',          href: '/approvals/requests', icon: 'Inbox',      permKey: '', i18nKey: 'nav.requests'         },
      { title: 'Approvals History', href: '/approvals/history',  icon: 'CheckCheck', permKey: '', i18nKey: 'nav.approvalsHistory' },
    ],
  },
  {
    id: 'frozen-frames',
    title: 'Frozen Frames',
    i18nKey: 'nav.frozenFrames',
    items: [
      { title: 'Create Snapshot',  href: '/snapshots/create', icon: 'Camera',   permKey: '', i18nKey: 'nav.createSnapshot'  },
      { title: 'Browse Snapshots', href: '/snapshots/browse', icon: 'Database', permKey: '', i18nKey: 'nav.browseSnapshots' },
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
    id: 'administration',
    title: 'Administration',
    i18nKey: 'nav.administration',
    items: [
      { title: 'Users',       href: '/admin/users',       icon: 'Users',     permKey: 'admin_panel.users.view',       i18nKey: 'admin.tabs.users'       },
      { title: 'Roles',       href: '/admin/roles',       icon: 'Shield',    permKey: 'admin_panel.roles.view',       i18nKey: 'admin.tabs.roles'       },
      { title: 'Permissions', href: '/admin/permissions', icon: 'KeyRound',  permKey: 'admin_panel.permissions.view', i18nKey: 'admin.tabs.permissions' },
    ],
  },
];

// Flat list kept for backwards compatibility (breadcrumbs, route lookups)
export const NAVIGATION: NavItem[] = NAV_GROUPS[0].items;
