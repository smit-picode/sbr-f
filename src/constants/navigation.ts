export type NavItem = {
  title: string;
  href: string;
  icon: string;
  permKey: string;    // The .view permission required to show this nav link
  children?: NavItem[];
};

export const NAVIGATION: NavItem[] = [
  { title: 'Establishments', href: '/frame',     icon: 'Building2',     permKey: 'establishments.view' },
  { title: 'Contacts',       href: '/contacts',  icon: 'Users',         permKey: 'contacts.view'       },
  { title: 'Addresses',      href: '/addresses', icon: 'MapPin',        permKey: 'addresses.view'      },
  { title: 'Audit Log',      href: '/audit-log', icon: 'ClipboardList', permKey: 'audit_log.view'      },
];
