import { HOME_DASHBOARD_PERMISSIONS } from '@/features/home/constants';

import type { NavGroup, NavItem } from '@/types';
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'sbr-live-frame',
    title: 'SBR Live Frame',
    i18nKey: 'nav.sbrLiveFrame',
    icon: 'Building2',
    items: [
      { title: 'Home',        href: '/home',        icon: 'Home',          permKey: HOME_DASHBOARD_PERMISSIONS, i18nKey: 'nav.home'        },
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
    icon: 'Inbox',
    items: [
      { title: 'Attribute Change Requests', href: '/tasks/attribute-change-requests', icon: 'Inbox', permKey: ['approvals.view', 'approvals.approve'], i18nKey: 'nav.attributeChangeRequests', showCount: true },
      { title: 'Profiling Runs',            href: '/tasks/profiling-runs',             icon: 'GitBranch',        permKey: '', i18nKey: 'nav.profilingRuns', hidden: true },
      // Module-level gate only: per-entity permissions are still enforced by the API and SBR_PORTAL_PKG.
      { title: 'Bulk Change',                href: '/tasks/bulk-change',                icon: 'Layers',           permKey: 'bulk_change.view', i18nKey: 'nav.bulkChange' },
      // The registry is readable with contacts access; editing needs contact_tags.manage.
      { title: 'Contact Tags',              href: '/tasks/contact-tags',               icon: 'Tag',              permKey: 'contacts.view', i18nKey: 'nav.contactTags' },
      { title: 'Tag Upload',                href: '/tasks/tag-upload',                 icon: 'Tags',             permKey: 'contacts.tag', i18nKey: 'nav.tagUpload' },
      { title: 'Tasks History',             href: '/tasks/tasks-history',              icon: 'CheckCheck',       permKey: '', i18nKey: 'nav.tasksHistory', hidden: true },
      { title: 'Profiling History',         href: '/tasks/profiling-history',          icon: 'History',          permKey: '', i18nKey: 'nav.profilingHistory', hidden: true },
      { title: 'Audit Log',                 href: '/audit-log',                        icon: 'ClipboardList',    permKey: 'audit_log.view', i18nKey: 'nav.auditLog'     },
    ],
  },
  {
    id: 'frozen-frames',
    title: 'Frozen Frames',
    i18nKey: 'nav.frozenFrames',
    icon: 'Camera',
    items: [
      { title: 'Create Snapshot',  href: '/snapshots/create',   icon: 'Camera',      permKey: 'snapshots.create', i18nKey: 'nav.createSnapshot'  },
      { title: 'Browse Snapshots', href: '/snapshots/browse',   icon: 'Database',    permKey: 'snapshots.view', i18nKey: 'nav.browseSnapshots' },
      { title: 'Analysis',         href: '/snapshots/analysis', icon: 'ChartColumn', permKey: 'analysis.view', i18nKey: 'nav.analysis'         },
    ],
  },
  {
    id: 'surveys',
    title: 'Surveys',
    i18nKey: 'nav.surveys',
    icon: 'ClipboardList',
    items: [
      // Dummy-data screens (no survey source yet), so ungated like the other placeholder modules.
      { title: 'Survey Samples', href: '/surveys', icon: 'ClipboardList', permKey: 'surveys.view', i18nKey: 'nav.surveySamples' },
      { title: 'Sample Builder', href: '/sampling', icon: 'Dices', permKey: 'sampling.view', i18nKey: 'nav.sampleBuilder' },
    ],
  },
  {
    id: 'data-quality',
    title: 'Data Quality',
    i18nKey: 'nav.dataQuality',
    icon: 'Gauge',
    items: [
      { title: 'Quality Dashboard',    href: '/quality/dashboard',  icon: 'Gauge',    permKey: 'data_quality.view', i18nKey: 'nav.qualityDashboard' },
      { title: 'NPC Corrections',      href: '/quality/corrections', icon: 'PenLine', permKey: 'data_quality.view', i18nKey: 'nav.npcCorrections' },
      { title: 'Quality Findings',     href: '/quality/findings',   icon: 'Flag',     permKey: '', i18nKey: 'nav.qualityFindings', hidden: true },
      { title: 'Regulator Escalation', href: '/quality/escalation', icon: 'Landmark', permKey: '', i18nKey: 'nav.regulatorEscalation', hidden: true },
    ],
  },
  {
    id: 'source-data',
    title: 'Source Data',
    i18nKey: 'nav.sourceData',
    icon: 'Database',
    items: [
      { title: 'Source Catalog', href: '/sources', icon: 'Database', permKey: 'source_catalog.view', i18nKey: 'nav.sourceCatalog' },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    i18nKey: 'nav.administration',
    icon: 'ShieldCheck',
    items: [
      { title: 'User Management',  href: '/admin/users',          icon: 'Users',       permKey: 'admin_panel.users.view', i18nKey: 'admin.tabs.users',         sidebarLabel: 'Users', breadcrumbLabel: 'Users' },
      { title: 'Roles',            href: '/admin/roles',          icon: 'ShieldCheck', permKey: 'admin_panel.roles.view', i18nKey: 'admin.tabs.roles'                                                              },
      { title: 'Rule Registry',    href: '/admin/rule-registry',  icon: 'SlidersVertical',  permKey: '',                       i18nKey: 'admin.tabs.ruleRegistry', hidden: true },
      { title: 'Column Access',    href: '/admin/column-access',  icon: 'Columns2',    permKey: '',                       i18nKey: 'admin.tabs.columnAccess', hidden: true },
      { title: 'System Accounts',  href: '/admin/system-accounts', icon: 'KeyRound',   permKey: 'admin_panel.system_accounts.manage', i18nKey: 'admin.tabs.systemAccounts' },
      { title: 'Pipeline Logs',    href: '/admin/pipeline-logs',  icon: 'DatabaseZap', permKey: 'admin_panel.pipeline_logs.view', i18nKey: 'admin.tabs.pipelineLogs'                                                 },
      { title: 'Activity Logs',    href: '/admin/activity-logs',  icon: 'History',     permKey: '',                       i18nKey: 'admin.tabs.activityLogs', hidden: true },
    ],
  },
];

export const NAVIGATION: NavItem[] = NAV_GROUPS[0].items;
