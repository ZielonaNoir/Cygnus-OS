'use client';

import * as React from 'react';
import { cn } from '@/app/lib/utils';
import { Icon } from '../Icon';
import { AgentSummaryPopup } from '../prompts/AgentSummaryPopup';

export interface TreeNode {
  id: string;
  label: string;
  icon?: string;
  children?: TreeNode[];
  metadata?: {
    count?: number;
    summary?: string;
    tags?: string[];
    [key: string]: unknown; // 允许扩展字段
  };
}

interface TreeViewProps {
  nodes: TreeNode[];
  defaultExpanded?: string[];
  onNodeClick?: (node: TreeNode) => void;
  className?: string;
}

export function TreeView({ nodes, defaultExpanded = [], onNodeClick, className }: TreeViewProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(
    new Set(defaultExpanded)
  );

  const toggleExpanded = (nodeId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const indent = level * 20;

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all',
            'hover:bg-accent/50 cursor-pointer',
            'group'
          )}
          style={{ paddingLeft: `${8 + indent}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(node.id);
            }
            onNodeClick?.(node);
          }}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren ? (
            <Icon
              icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'}
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform"
            />
          ) : (
            <div className="h-4 w-4 shrink-0" />
          )}

          {/* Node Icon */}
          {node.icon && (
            <Icon
              icon={node.icon}
              className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground"
            />
          )}

          {/* Label */}
          <span className="flex-1 truncate text-foreground group-hover:text-primary">
            {node.label}
          </span>

          {/* Metadata and Info */}
          <div className="flex items-center gap-2">
            {node.metadata?.summary && (
              <AgentSummaryPopup
                title={node.label}
                summary={node.metadata.summary}
                stats={{
                  count: node.metadata.count,
                  lastUpdated: '2024-01-07',
                }}
              >
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Icon icon="mdi:information-outline" className="h-4 w-4" />
                </button>
              </AgentSummaryPopup>
            )}
            {node.metadata?.count !== undefined && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {node.metadata.count}
              </span>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-2 border-l border-border/30">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      {nodes.map((node) => renderNode(node))}
    </div>
  );
}

