import type { SamplingApiCondition, SamplingApiGroup, SamplingCondition, SamplingGroup, SamplingNode } from '@/types';
import { SAMPLING_LIST_OPERATORS, SAMPLING_NO_VALUE_OPERATORS } from '../constants';

let counter = 0;
export const newNodeId = (): string => `n${Date.now().toString(36)}${(counter++).toString(36)}`;

export const newCondition = (column: string, operator: string): SamplingCondition => ({
  id: newNodeId(), kind: 'condition', column, operator, value: '', values: [],
});

export const newGroup = (op: 'and' | 'or' = 'and'): SamplingGroup => ({
  id: newNodeId(), kind: 'group', op, not: false, rules: [],
});

// A condition is sent once it can mean something: a column, and a value unless the operator needs none.
export function isComplete(c: SamplingCondition): boolean {
  if (!c.column) return false;
  if (SAMPLING_NO_VALUE_OPERATORS.includes(c.operator)) return true;
  if (SAMPLING_LIST_OPERATORS.includes(c.operator)) return c.values.length > 0;
  if (c.operator === 'between') {
    const [lo = '', hi = ''] = c.value.split(',');
    return lo.trim() !== '' && hi.trim() !== '';
  }
  return c.value.trim() !== '';
}

function toApiNode(node: SamplingNode): SamplingApiCondition | SamplingApiGroup | null {
  if (node.kind === 'condition') {
    if (!isComplete(node)) return null;
    if (SAMPLING_NO_VALUE_OPERATORS.includes(node.operator)) return { column: node.column, operator: node.operator };
    return {
      column: node.column,
      operator: node.operator,
      value: SAMPLING_LIST_OPERATORS.includes(node.operator) ? node.values : node.value.trim(),
    };
  }
  const rules = node.rules.map(toApiNode).filter((r): r is SamplingApiCondition | SamplingApiGroup => r !== null);
  if (!rules.length) return null;
  return node.not ? { op: node.op, not: true, rules } : { op: node.op, rules };
}

// The tree the API takes, or null for "the whole frame".
export function toApiFilter(root: SamplingGroup): SamplingApiGroup | null {
  const out = toApiNode(root);
  return out && 'rules' in out ? out : null;
}

export function countConditions(node: SamplingNode): number {
  return node.kind === 'condition' ? 1 : node.rules.reduce((a, r) => a + countConditions(r), 0);
}

export function depthOf(node: SamplingNode): number {
  return node.kind === 'condition' ? 0 : 1 + Math.max(0, ...node.rules.map(depthOf));
}

// Immutable edits by node id.
export function updateNode(root: SamplingGroup, id: string, patch: (n: SamplingNode) => SamplingNode): SamplingGroup {
  const walk = (n: SamplingNode): SamplingNode => {
    if (n.id === id) return patch(n);
    if (n.kind === 'group') return { ...n, rules: n.rules.map(walk) };
    return n;
  };
  return walk(root) as SamplingGroup;
}

export function removeNode(root: SamplingGroup, id: string): SamplingGroup {
  const walk = (g: SamplingGroup): SamplingGroup => ({
    ...g,
    rules: g.rules.filter((r) => r.id !== id).map((r) => (r.kind === 'group' ? walk(r) : r)),
  });
  return walk(root);
}

export function addToGroup(root: SamplingGroup, groupId: string, child: SamplingNode): SamplingGroup {
  return updateNode(root, groupId, (n) => (n.kind === 'group' ? { ...n, rules: [...n.rules, child] } : n));
}

// Ids are local to one browser session; a loaded design gets fresh ones so it can never collide.
export function reId(node: SamplingNode): SamplingNode {
  return node.kind === 'condition'
    ? { ...node, id: newNodeId() }
    : { ...node, id: newNodeId(), rules: node.rules.map(reId) };
}

// The tree without conditions on fields outside `known`, whose names land in `removed`.
export function pruneFields(root: SamplingGroup, known: Set<string>, removed: Set<string>): SamplingGroup {
  const walk = (g: SamplingGroup): SamplingGroup => ({
    ...g,
    rules: g.rules
      .filter((r) => r.kind === 'group' || !r.column || known.has(r.column) || !removed.add(r.column))
      .map((r) => (r.kind === 'group' ? walk(r) : r)),
  });
  return walk(root);
}

// Every field an API filter tree names.
export function apiFilterFields(node: SamplingApiGroup | SamplingApiCondition | null | undefined, out: string[] = []): string[] {
  if (!node) return out;
  if ('rules' in node) node.rules.forEach((r) => apiFilterFields(r, out));
  else out.push(node.column);
  return out;
}
