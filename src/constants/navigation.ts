export type NavItem = {
  title: string;
  href: string;
  icon: string;
  children?: NavItem[];
};

export const NAVIGATION: NavItem[] = [
  // { title: 'Dashboard', href: '/frame', icon: 'LayoutDashboard' },
  { title: 'Establishments', href: '/frame', icon: 'Building2' },
  { title: 'Contacts', href: '/contacts', icon: 'Users' },
  { title: 'Addresses', href: '/addresses', icon: 'MapPin' },
  { title: 'Audit Log', href: '/audit-log', icon: 'ClipboardList' },
];
