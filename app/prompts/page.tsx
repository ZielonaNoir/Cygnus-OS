'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { TreeView, TreeNode } from '@/app/components/ui/tree-view';
// import { CommandPalette, CommandItem } from '@/app/components/ui/command-palette';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Icon } from '@/app/components/Icon';
import { AgentSummaryPopup } from '@/app/components/prompts/AgentSummaryPopup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ShinyTitle } from '@/app/components/reactbits/ShinyTitle';
import { Select } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';

type PromptItem = {
  id: string; // domain/scenario/name
  label: string;
  domain: string;
  scenario: string;
  name: string;
  hasContext: boolean;
};

type ListResponse =
  | { ok: true; items: PromptItem[] }
  | { ok: false; error: string };

const DOMAIN_ICONS: Record<string, string> = {
  coding: 'mdi:code-tags',
  finance: 'mdi:chart-line',
  writing: 'mdi:pencil',
};

const SCENARIO_ICONS: Record<string, string> = {
  frontend: 'mdi:web',
  backend: 'mdi:server',
  devops: 'mdi:docker',
  tradingview: 'mdi:trending-up',
  quant: 'mdi:calculator',
  'technical-docs': 'mdi:file-document-edit',
  copywriting: 'mdi:format-text',
};

function toPromptHref(id: string): string {
  return `/prompts/${id.split('/').map(encodeURIComponent).join('/')}`;
}

function buildTreeFromItems(items: PromptItem[]): TreeNode[] {
  const domainMap = new Map<string, Map<string, PromptItem[]>>();
  for (const item of items) {
    const d = item.domain;
    const s = item.scenario;
    if (!domainMap.has(d)) domainMap.set(d, new Map());
    const scenarioMap = domainMap.get(d)!;
    if (!scenarioMap.has(s)) scenarioMap.set(s, []);
    scenarioMap.get(s)!.push(item);
  }

  const domains: TreeNode[] = [];
  for (const [domain, scenarioMap] of [...domainMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const scenarioNodes: TreeNode[] = [];
    for (const [scenario, assets] of [...scenarioMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      const assetNodes: TreeNode[] = assets
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((asset) => ({
          id: asset.id, // 完整路径，避免重名冲突
          label: asset.label,
          icon: asset.hasContext ? 'mdi:file-document-edit-outline' : 'mdi:file-document-outline',
          metadata: {
            summary: `来自文件系统：/data/prompts/${asset.id}`,
            tags: [],
            domain: asset.domain,
            scenario: asset.scenario,
            path: asset.id,
          },
        }));

      scenarioNodes.push({
        id: `${domain}/${scenario}`,
        label: scenario,
        icon: SCENARIO_ICONS[scenario] ?? 'mdi:folder-outline',
        metadata: {
          count: assetNodes.length,
          summary: `场景：${scenario}（${assetNodes.length} 个资产）`,
        },
        children: assetNodes,
      });
    }

    const totalCount = scenarioNodes.reduce((acc, n) => acc + (typeof n.metadata?.count === 'number' ? n.metadata.count : 0), 0);
    domains.push({
      id: domain,
      label: domain,
      icon: DOMAIN_ICONS[domain] ?? 'mdi:folder-outline',
      metadata: {
        count: totalCount,
        summary: `领域：${domain}（${totalCount} 个资产）`,
      },
      children: scenarioNodes,
    });
  }

  return domains;
}

// 递归查找节点
function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export default function PromptsPage() {
  const router = useRouter();

  const [treeData, setTreeData] = React.useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string>('');
  const [selectedNode, setSelectedNode] = React.useState<TreeNode | null>(null);

  // 筛选器状态
  const [selectedDomain, setSelectedDomain] = React.useState<string>('');
  const [selectedScenario, setSelectedScenario] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const resp = await fetch('/api/prompts/list');
        const data: ListResponse = await resp.json();
        if (!resp.ok || !('ok' in data) || !data.ok) {
          throw new Error(('error' in data && data.error) || '加载失败');
        }
        if (!mounted) return;
        setTreeData(buildTreeFromItems(data.items));
      } catch (e) {
        const msg = e instanceof Error ? e.message : '加载失败';
        if (!mounted) return;
        setLoadError(msg);
        setTreeData([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const domains = React.useMemo(() => {
    return treeData.map((node) => ({ id: node.id, label: node.label }));
  }, [treeData]);

  // 获取当前可用的 Scenario 列表
  const availableScenarios = React.useMemo(() => {
    if (!selectedDomain) return [];
    const domain = treeData.find((d) => d.id === selectedDomain);
    if (!domain?.children) return [];
    return domain.children.map((c) => ({ id: c.id, label: c.label }));
  }, [selectedDomain, treeData]);

  // 重置 Scenario 当 Domain 改变时
  React.useEffect(() => {
    setSelectedScenario('');
  }, [selectedDomain]);

//   const [commandItems] = React.useState<CommandItem[]>([
//     {
//       id: 'search-prompt',
//       title: '搜索 Prompt',
//       description: '在 PromptHub 中搜索',
//       icon: 'mdi:magnify',
//       action: () => console.log('Search prompt'),
//     },
//     {
//       id: 'new-prompt',
//       title: '新建 Prompt',
//       description: '创建一个新的 Prompt Repo',
//       icon: 'mdi:plus-circle',
//       action: () => router.push('/prompts/new'),
//     },
//   ]);

  const collectLeafNodes = React.useCallback((node: TreeNode): TreeNode[] => {
    if (!node.children || node.children.length === 0) return [node];
    function collect(n: TreeNode): TreeNode[] {
      if (!n.children || n.children.length === 0) return [n];
      return n.children.flatMap(collect);
    }
    return collect(node);
  }, []);

  const allLeafAssets = React.useMemo(() => {
    return treeData.flatMap(collectLeafNodes);
  }, [collectLeafNodes, treeData]);

  // 基于筛选器和 TreeView 选择的资产列表
  const assetsToShow = React.useMemo(() => {
    let assets: TreeNode[] = [];

    // 优先使用 TreeView 选择
    if (selectedNode) {
      assets = collectLeafNodes(selectedNode);
    }
    // 否则使用下拉筛选器
    else if (selectedDomain) {
      const domain = findNodeById(treeData, selectedDomain);
      if (domain) {
        if (selectedScenario) {
          const scenario = findNodeById(domain.children || [], selectedScenario);
          if (scenario) {
            assets = collectLeafNodes(scenario);
          }
        } else {
          assets = collectLeafNodes(domain);
        }
      }
    }
    // 默认显示全部
    else {
      assets = allLeafAssets;
    }

    // 应用搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      assets = assets.filter(asset =>
        asset.label.toLowerCase().includes(query) ||
        asset.metadata?.summary?.toLowerCase().includes(query) ||
        asset.metadata?.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    return assets;
  }, [allLeafAssets, collectLeafNodes, searchQuery, selectedDomain, selectedNode, selectedScenario, treeData]);

  // 清除所有筛选
  const clearFilters = React.useCallback(() => {
    setSelectedNode(null);
    setSelectedDomain('');
    setSelectedScenario('');
    setSearchQuery('');
  }, []);

  return (
    <div className="flex h-full bg-background">
      {/* Command Palette Removed - Used GlobalSearch instead */}
      {/* <CommandPalette items={commandItems} /> */}

      {/* Left Sidebar - Tree View */}
      <aside className="w-64 border-r border-border/50 bg-card/50 backdrop-blur-sm p-4">
        <div className="mb-4">
          <ShinyTitle text="PromptHub" className="text-lg" description="Prompt 资产库" as="h2" />
        </div>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-11/12" />
            <Skeleton className="h-8 w-10/12" />
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-border/50 bg-background/50 p-3 text-sm text-muted-foreground">
            <div className="font-medium text-foreground mb-1">加载失败</div>
            <div className="text-xs leading-5">{loadError}</div>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => window.location.reload()}
            >
              <Icon icon="mdi:refresh" className="h-4 w-4" />
              重新加载
            </Button>
          </div>
        ) : (
          <TreeView
            nodes={treeData}
            defaultExpanded={treeData.length > 0 ? [treeData[0]!.id] : []}
            onNodeClick={(node) => {
              setSelectedNode(node);
            }}
          />
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-6">
          {/* 标题和统计 */}
          <div>
            <div className="flex items-center gap-3">
              <ShinyTitle
                text={selectedNode ? selectedNode.label : (selectedScenario ? findNodeById(treeData, selectedScenario)?.label : (selectedDomain ? findNodeById(treeData, selectedDomain)?.label : '全部 Prompt 资产')) || '全部 Prompt 资产'}
                className="text-2xl"
                as="h1"
              />
              {(selectedNode?.metadata?.summary || (selectedDomain && findNodeById(treeData, selectedScenario || selectedDomain)?.metadata?.summary)) && (
                <AgentSummaryPopup
                  title={selectedNode?.label || findNodeById(treeData, selectedScenario || selectedDomain)?.label || ''}
                  summary={selectedNode?.metadata?.summary || findNodeById(treeData, selectedScenario || selectedDomain)?.metadata?.summary || ''}
                  stats={{
                    count: selectedNode?.metadata?.count || findNodeById(treeData, selectedScenario || selectedDomain)?.metadata?.count,
                    lastUpdated: '2026-01-07',
                  }}
                >
                  <button className="text-primary hover:text-primary/80 transition-colors">
                    <Icon icon="mdi:information-outline" className="h-5 w-5" />
                  </button>
                </AgentSummaryPopup>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {assetsToShow.length} 个资产
              {(selectedNode || selectedDomain) ? '（已按分类筛选）' : ''}
              {searchQuery ? `（搜索: "${searchQuery}"）` : ''}
            </p>
          </div>

          {/* 筛选器栏 */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/50 bg-card/30 p-4 backdrop-blur-sm">
            {/* 搜索框 */}
            <div className="relative flex-1 min-w-[200px]">
              <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索 Prompt 名称、描述或标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>

            {/* Domain 选择器 */}
            <Select
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value);
                setSelectedNode(null); // 清除 TreeView 选择
              }}
              className="w-40"
            >
              <option value="">全部 Domain</option>
              {domains.map(d => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </Select>

            {/* Scenario 选择器 */}
            <Select
              value={selectedScenario}
              onChange={(e) => {
                setSelectedScenario(e.target.value);
                setSelectedNode(null);
              }}
              className="w-40"
              disabled={!selectedDomain}
            >
              <option value="">全部 Scenario</option>
              {availableScenarios.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </Select>

            {/* 清除筛选按钮 */}
            {(selectedNode || selectedDomain || searchQuery) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <Icon icon="mdi:close" className="h-4 w-4 mr-1" />
                清除筛选
              </Button>
            )}

            {/* 新建按钮 */}
            <Button size="sm" onClick={() => router.push('/prompts/new')}>
              <Icon icon="mdi:plus" className="h-4 w-4 mr-1" />
              新建
            </Button>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-card/50 border border-border/50">
              <TabsTrigger value="all" suppressHydrationWarning>全部</TabsTrigger>
              <TabsTrigger value="recent" suppressHydrationWarning>最近</TabsTrigger>
              <TabsTrigger value="favorites" suppressHydrationWarning>收藏</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6" suppressHydrationWarning>
              {/* Prompt Cards Grid（联动 TreeView） */}
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="mt-3 h-4 w-full" />
                      <Skeleton className="mt-2 h-4 w-5/6" />
                      <Skeleton className="mt-5 h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : assetsToShow.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 bg-card/30 p-10 text-center text-sm text-muted-foreground">
                  <Icon icon="mdi:file-document-outline" className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>{treeData.length === 0 ? '暂无 Prompt 资产' : '暂无匹配的 Prompt 资产'}</p>
                  <p className="mt-1 text-xs">
                    {searchQuery
                      ? '尝试修改搜索关键词'
                      : '请在 /prompts/new 创建，或同步本地 `/data/prompts`。'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {assetsToShow.map((asset) => (
                    <Card
                      key={asset.id}
                      className="cursor-pointer hover:scale-[1.02] transition-all duration-200 border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                      onClick={() => router.push(toPromptHref(asset.id))}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle className="text-lg leading-tight">{asset.label}</CardTitle>
                          <Icon icon={asset.icon ?? 'mdi:book-open-variant'} className="h-5 w-5 text-primary shrink-0" />
                        </div>
                        <CardDescription className="line-clamp-2">
                          {asset.metadata?.summary ?? 'Prompt Repo'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {/* 标签 */}
                        {asset.metadata?.tags && asset.metadata.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(asset.metadata.tags as string[]).slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                            {(asset.metadata.tags as string[]).length > 3 && (
                              <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                                +{(asset.metadata.tags as string[]).length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        {/* 分类路径 */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Icon icon="mdi:folder-outline" className="h-3.5 w-3.5" />
                          <span className="truncate">{asset.id}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="recent" className="mt-6" suppressHydrationWarning>
              <div className="text-center text-muted-foreground py-12">
                <Icon icon="mdi:clock-outline" className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无最近访问的 Prompt</p>
              </div>
            </TabsContent>
            <TabsContent value="favorites" className="mt-6" suppressHydrationWarning>
              <div className="text-center text-muted-foreground py-12">
                <Icon icon="mdi:star-outline" className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无收藏的 Prompt</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
