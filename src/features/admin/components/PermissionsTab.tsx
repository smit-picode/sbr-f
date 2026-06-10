'use client';
import { useState, useMemo } from 'react';
import { ShieldCheck, ChevronRight, ChevronDown, Layers, GitBranch } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PERMISSION_TREE, type PermissionNode } from '@/constants/permissionTree';

function countLeafPerms(node: PermissionNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + countLeafPerms(child), 0);
}

// Maps top-level keys to icon colours for visual grouping
const KEY_COLORS: Record<string, { bg: string; text: string }> = {
  establishments:  { bg: 'bg-blue-50',    text: 'text-blue-700' },
  contacts:        { bg: 'bg-violet-50',  text: 'text-violet-700' },
  addresses:       { bg: 'bg-amber-50',   text: 'text-amber-700' },
  audit_log:       { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  admin_panel:     { bg: 'bg-rose-50',    text: 'text-rose-700' },
};

function badge(key: string) {
  return (
    <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono tracking-tight border border-slate-200">
      {key}
    </code>
  );
}

export function PermissionsTab() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Build flat list with parent info — walks all 3 levels for accurate totalCount
  const allItems = useMemo(() => {
    const items: { key: string; label: string; parentKey?: string }[] = [];
    for (const node of PERMISSION_TREE) {
      items.push({ key: node.key, label: node.label });
      for (const child of node.children ?? []) {
        items.push({ key: child.key, label: child.label, parentKey: node.key });
        for (const grandchild of child.children ?? []) {
          items.push({ key: grandchild.key, label: grandchild.label, parentKey: node.key });
        }
      }
    }
    return items;
  }, []);

  const q = search.trim().toLowerCase();

  // When searching, collect matching root keys + parent keys of matching children
  const matchedKeys = useMemo(() => {
    if (!q) return null;
    const keys = new Set<string>();
    allItems.forEach(item => {
      if (item.key.includes(q) || item.label.toLowerCase().includes(q)) {
        keys.add(item.key);
        if (item.parentKey) keys.add(item.parentKey);
      }
    });
    return keys;
  }, [q, allItems]);

  const totalCount = allItems.length;
  const visibleCount = matchedKeys ? matchedKeys.size : totalCount;

  // Keys of all parent nodes (those that have children)
  const parentKeys = useMemo(
    () => PERMISSION_TREE.filter(n => (n.children?.length ?? 0) > 0).map(n => n.key),
    []
  );
  const allExpanded = parentKeys.length > 0 && parentKeys.every(k => expanded.has(k));

  const toggleExpand = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleMasterToggle = () => {
    setExpanded(allExpanded ? new Set() : new Set(parentKeys));
  };

  return (
    <div className="space-y-5">
      {/* Count + master collapse button */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={handleMasterToggle}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          {allExpanded
            ? <><ChevronDown className="h-3.5 w-3.5" /> Collapse All</>
            : <><ChevronRight className="h-3.5 w-3.5" /> Expand All</>
          }
        </button>
        <span className="text-xs text-slate-400 tabular-nums">
          {t('admin.permissions.ofPermissions', { total: totalCount })}
        </span>
      </div>

      {/* Permission tree */}
      <div className="space-y-3">
        {PERMISSION_TREE.map((node) => {
          const colors = KEY_COLORS[node.key] ?? { bg: 'bg-slate-50', text: 'text-slate-600' };
          const hasChildren = (node.children?.length ?? 0) > 0;
          const isOpen = expanded.has(node.key) || (!!matchedKeys && hasChildren);

          // Filtering logic
          const parentMatches = !matchedKeys || matchedKeys.has(node.key);
          if (!parentMatches) return null;

          const visibleChildren = (node.children ?? []).filter(
            c => !matchedKeys || matchedKeys.has(c.key)
          );

          return (
            <div key={node.key} className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Parent row */}
              <div
                className={`flex items-center gap-4 px-5 py-3.5 bg-white ${hasChildren ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}`}
                onClick={() => hasChildren && toggleExpand(node.key)}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${colors.bg}`}>
                  {hasChildren
                    ? <Layers className={`h-4 w-4 ${colors.text}`} />
                    : <ShieldCheck className={`h-4 w-4 ${colors.text}`} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {node.label}
                  </p>
                  {hasChildren && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('admin.permissions.childPermissions', { count: countLeafPerms(node) })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {badge(node.key)}
                  {hasChildren && (
                    <>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                        <GitBranch className="h-3 w-3" />
                        {t('admin.permissions.parent')}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExpand(node.key); }}
                        className="h-6 w-6 flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                        title={isOpen ? 'Collapse' : 'Expand'}
                      >
                        {isOpen
                          ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                          : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                        }
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Child rows — shown when expanded */}
              {isOpen && visibleChildren.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/60 divide-y divide-slate-100">
                  {visibleChildren.map((child) => {
                    const hasGrandchildren = (child.children?.length ?? 0) > 0;

                    if (hasGrandchildren) {
                      const subIsOpen = expanded.has(child.key);
                      return (
                        <div key={child.key}>
                          {/* Sub-group header */}
                          <div
                            className="flex items-center gap-4 pl-8 pr-5 py-2.5 bg-slate-100/80 cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => toggleExpand(child.key)}
                          >
                            <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{child.label}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{child.children!.length} child permissions</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {badge(child.key)}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleExpand(child.key); }}
                                className="h-5 w-5 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-100 transition-colors"
                                title={subIsOpen ? 'Collapse' : 'Expand'}
                              >
                                {subIsOpen
                                  ? <ChevronDown className="h-3 w-3 text-slate-500" />
                                  : <ChevronRight className="h-3 w-3 text-slate-500" />
                                }
                              </button>
                            </div>
                          </div>
                          {/* Grandchildren */}
                          {subIsOpen && (
                            <div className="divide-y divide-slate-100">
                              {child.children!.map((grandchild) => (
                                <div key={grandchild.key} className="flex items-center gap-4 pl-20 pr-5 py-2.5 bg-white hover:bg-slate-50 transition-colors">
                                  <ChevronRight className="h-3 w-3 text-slate-200 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-600">{grandchild.label}</p>
                                  </div>
                                  <div className="shrink-0">
                                    {badge(grandchild.key)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Simple permission row (no grandchildren)
                    return (
                      <div key={child.key} className="flex items-center gap-4 pl-16 pr-5 py-3 hover:bg-slate-50 transition-colors">
                        <ChevronRight className="h-3 w-3 text-slate-300 shrink-0 -ml-5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-600 font-medium">{child.label}</p>
                        </div>
                        <div className="shrink-0">
                          {badge(child.key)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
