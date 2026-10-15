export type NavGroup = {
  id: string;
  title: string;
  i18nKey: string;
  icon: string;
  items: NavItem[];
};

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
  hidden?: boolean;    // Left out of the sidebar; the page stays reachable by URL and keeps its title and breadcrumb
  children?: NavItem[];
};

export interface NavAccess {
  isSuperAdmin: boolean;
  permissionNames: string[];
}
