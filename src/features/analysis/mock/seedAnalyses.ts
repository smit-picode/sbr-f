import type { Analysis, AnalysisBlock } from '@/types';
import { ANALYSIS_TEMPLATES } from '../constants/templates';
import { countMeasure, createBlock, uid } from '../utils/blocks';

// Placeholder owner replaced by the signed-in user's email when the store hydrates.
export const SEED_OWNER_ME = '__me__';

function tpl(id: string): AnalysisBlock[] {
  return ANALYSIS_TEMPLATES.find((t) => t.id === id)!.build();
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

export function buildSeedAnalyses(): Analysis[] {
  const construction = { id: uid('f'), field: 'isic_section', op: 'in' as const, values: ['F'] };
  return [
    {
      id: 'seed-briefing',
      name: 'Q3 2026 register briefing',
      description: 'Where the register stands in September and how it moved since April.',
      ownerEmail: SEED_OWNER_ME,
      ownerName: '',
      createdAt: daysAgo(12),
      updatedAt: daysAgo(1),
      frame: 'live',
      compareTo: 'f-2026-04',
      filters: [],
      blocks: [
        createBlock('text', 'establishments', { text: '# Register briefing — Q3 2026\n\nThe live frame holds **115,186 establishments**, up from 109,682 in the April frame. Growth is concentrated in **wholesale & retail** and **construction**; the ISIC coding backlog keeps shrinking.' }),
        ...tpl('overview'),
      ],
      shares: [{ kind: 'role', id: 'executive', label: 'Executives', access: 'view' }],
    },
    {
      id: 'seed-construction',
      name: 'Construction sector deep-dive',
      description: 'Section F establishments: divisions, geography, size and the largest employers.',
      ownerEmail: SEED_OWNER_ME,
      ownerName: '',
      createdAt: daysAgo(30),
      updatedAt: daysAgo(3),
      frame: 'live',
      compareTo: null,
      filters: [construction],
      blocks: [
        createBlock('kpi', 'establishments', { title: 'Construction in numbers', width: 'full', query: { ...createBlock('kpi').query, measures: [countMeasure(), { id: uid('m'), agg: 'sum', field: 'employment' }, { id: uid('m'), agg: 'median', field: 'employment' }] } }),
        createBlock('bar', 'establishments', { title: 'Establishments by division', query: { ...createBlock('bar').query, dimensions: ['isic_division'] } }),
        createBlock('map', 'establishments', { title: 'Employment by municipality', query: { ...createBlock('map').query, measures: [{ id: uid('m'), agg: 'sum', field: 'employment' }] } }),
        createBlock('pivot', 'establishments', { title: 'Municipality × size class', width: 'full', display: { showValues: true, stacked: false, percent: 'row', showTotals: true, sparkline: true } }),
        createBlock('records', 'establishments', { title: 'Largest construction employers', query: { ...createBlock('records').query, columns: ['sbr_id', 'name', 'isic_division', 'municipality', 'employment', 'size_class', 'in_group'] } }),
      ],
      shares: [],
    },
    {
      id: 'seed-quality',
      name: 'Missing activity codes',
      description: 'Tracking the ISIC coding backlog and other gaps before the Q4 survey frame.',
      ownerEmail: SEED_OWNER_ME,
      ownerName: '',
      createdAt: daysAgo(45),
      updatedAt: daysAgo(6),
      frame: 'live',
      compareTo: null,
      filters: [],
      blocks: tpl('quality'),
      shares: [{ kind: 'user', id: 'analyst.b@example.org', label: 'Sample Analyst B', access: 'edit' }],
    },
    {
      id: 'seed-groups',
      name: 'Enterprise groups landscape',
      description: 'Domestic vs foreign-controlled groups and where their employment sits.',
      ownerEmail: 'analyst.b@example.org',
      ownerName: 'Sample Analyst B',
      createdAt: daysAgo(20),
      updatedAt: daysAgo(2),
      frame: 'live',
      compareTo: null,
      filters: [],
      blocks: tpl('groups'),
      shares: [{ kind: 'role', id: 'statistician', label: 'Statisticians', access: 'view' }],
    },
    {
      id: 'seed-movements',
      name: 'April → September frame movements',
      description: 'Births, deaths and size-class migration between the April and live frames.',
      ownerEmail: 'analyst.a@example.org',
      ownerName: 'Sample Analyst A',
      createdAt: daysAgo(9),
      updatedAt: daysAgo(0.2),
      frame: 'live',
      compareTo: 'f-2026-04',
      filters: [],
      blocks: tpl('comparison'),
      shares: [{ kind: 'role', id: 'statistician', label: 'Statisticians', access: 'edit' }],
    },
  ];
}

// Dummy directory for the share dialog until a users/roles lookup endpoint exists.
export const SHARE_DIRECTORY: { kind: 'user' | 'role'; id: string; label: string; sub: string }[] = [
  { kind: 'role', id: 'statistician', label: 'Statisticians', sub: 'Role' },
  { kind: 'role', id: 'executive', label: 'Executives', sub: 'Role' },
  { kind: 'role', id: 'profiling_analyst', label: 'Profiling analysts', sub: 'Role' },
  { kind: 'role', id: 'dq_lead', label: 'Data quality leads', sub: 'Role' },
  { kind: 'user', id: 'analyst.a@example.org', label: 'Sample Analyst A', sub: 'analyst.a@example.org' },
  { kind: 'user', id: 'analyst.b@example.org', label: 'Sample Analyst B', sub: 'analyst.b@example.org' },
  { kind: 'user', id: 'analyst.c@example.org', label: 'Sample Analyst C', sub: 'analyst.c@example.org' },
  { kind: 'user', id: 'analyst.d@example.org', label: 'Sample Analyst D', sub: 'analyst.d@example.org' },
];
