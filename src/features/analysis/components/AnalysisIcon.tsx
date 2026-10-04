import {
  ArrowRightLeft,
  ArrowUpDown,
  Building2,
  ChartBarBig,
  ChartColumnBig,
  ChartLine,
  ChartNoAxesColumnIncreasing,
  ChartPie,
  Gauge,
  Grid3x3,
  Layers,
  LayoutDashboard,
  Map,
  MapPin,
  Network,
  Rows3,
  ShieldCheck,
  Sun,
  Table2,
  Type,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  ArrowRightLeft, ArrowUpDown, Building2, ChartBarBig, ChartColumnBig, ChartLine, ChartNoAxesColumnIncreasing,
  ChartPie, Gauge, Grid3x3, Layers, LayoutDashboard, Map, MapPin, Network, Rows3, ShieldCheck, Sun, Table2, Type, Users, Workflow,
};

export function AnalysisIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}
