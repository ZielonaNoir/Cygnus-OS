'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { Icon } from '@/app/components/Icon';
import { toast } from '@/app/lib/toast';

import type { Domain } from '@/app/lib/prompts/categories';

interface CategoryManagerProps {
  onCategoryChange?: () => void;
  children?: React.ReactNode;
}

type ActionType = 'create-domain' | 'create-scenario' | 'rename-domain' | 'rename-scenario' | 'delete-domain' | 'delete-scenario';

export function CategoryManager({ onCategoryChange, children }: CategoryManagerProps) {
  const [open, setOpen] = React.useState(false);
  const [domains, setDomains] = React.useState<Domain[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [actionType, setActionType] = React.useState<ActionType>('create-domain');
  const [selectedDomain, setSelectedDomain] = React.useState('');
  const [selectedScenario, setSelectedScenario] = React.useState('');
  const [inputValue, setInputValue] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // 获取分类数据
  const fetchCategories = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/prompts/categories');
      const data = await resp.json();
      if (data.ok) {
        setDomains(data.domains);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open, fetchCategories]);

  // 重置选择
  React.useEffect(() => {
    setSelectedScenario('');
    setInputValue('');
  }, [selectedDomain, actionType]);

  const selectedDomainData = React.useMemo(() => {
    return domains.find(d => d.id === selectedDomain);
  }, [domains, selectedDomain]);

  const handleSubmit = async () => {
    if (!inputValue.trim() && !actionType.startsWith('delete')) {
      toast.error('请输入名称');
      return;
    }

    setIsSubmitting(true);
    try {
      let resp: Response;
      
      switch (actionType) {
        case 'create-domain':
          resp = await fetch('/api/prompts/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'domain', name: inputValue.trim() }),
          });
          break;
        case 'create-scenario':
          if (!selectedDomain) {
            toast.error('请先选择 Domain');
            return;
          }
          resp = await fetch('/api/prompts/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'scenario', domain: selectedDomainData?.label, name: inputValue.trim() }),
          });
          break;
        case 'rename-domain':
          if (!selectedDomain) {
            toast.error('请选择要重命名的 Domain');
            return;
          }
          resp = await fetch('/api/prompts/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'domain', oldName: selectedDomainData?.label, newName: inputValue.trim() }),
          });
          break;
        case 'rename-scenario':
          if (!selectedDomain || !selectedScenario) {
            toast.error('请选择要重命名的 Scenario');
            return;
          }
          const scenarioData = selectedDomainData?.scenarios.find(s => s.id === selectedScenario);
          resp = await fetch('/api/prompts/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'scenario', domain: selectedDomainData?.label, oldName: scenarioData?.label, newName: inputValue.trim() }),
          });
          break;
        case 'delete-domain':
          if (!selectedDomain) {
            toast.error('请选择要删除的 Domain');
            return;
          }
          if (!confirm(`确定要删除 Domain "${selectedDomainData?.label}" 吗？此操作不可逆！`)) {
            setIsSubmitting(false);
            return;
          }
          resp = await fetch('/api/prompts/categories', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'domain', name: selectedDomainData?.label, force: true }),
          });
          break;
        case 'delete-scenario':
          if (!selectedDomain || !selectedScenario) {
            toast.error('请选择要删除的 Scenario');
            return;
          }
          const scenarioToDelete = selectedDomainData?.scenarios.find(s => s.id === selectedScenario);
          if (!confirm(`确定要删除 Scenario "${scenarioToDelete?.label}" 吗？此操作不可逆！`)) {
            setIsSubmitting(false);
            return;
          }
          resp = await fetch('/api/prompts/categories', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'scenario', domain: selectedDomainData?.label, name: scenarioToDelete?.label, force: true }),
          });
          break;
        default:
          return;
      }

      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || '操作失败');
      }

      toast.success('操作成功');
      setInputValue('');
      setSelectedDomain('');
      setSelectedScenario('');
      fetchCategories();
      onCategoryChange?.();
    } catch (error) {
      console.error('Category operation failed:', error);
      toast.error('操作失败', error instanceof Error ? error.message : '请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionLabels: Record<ActionType, string> = {
    'create-domain': '新建 Domain',
    'create-scenario': '新建 Scenario',
    'rename-domain': '重命名 Domain',
    'rename-scenario': '重命名 Scenario',
    'delete-domain': '删除 Domain',
    'delete-scenario': '删除 Scenario',
  };

  const actionIcons: Record<ActionType, string> = {
    'create-domain': 'mdi:folder-plus',
    'create-scenario': 'mdi:folder-plus-outline',
    'rename-domain': 'mdi:folder-edit',
    'rename-scenario': 'mdi:folder-edit-outline',
    'delete-domain': 'mdi:folder-remove',
    'delete-scenario': 'mdi:folder-remove-outline',
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Icon icon="mdi:folder-cog" className="h-4 w-4 mr-2" />
            管理分类
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="mdi:folder-cog" className="h-5 w-5 text-primary" />
            分类管理
          </DialogTitle>
          <DialogDescription>
            管理 Prompt 的 Domain 和 Scenario 分类
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 操作类型选择 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">操作类型</label>
            <Select
              value={actionType}
              onChange={(e) => setActionType(e.target.value as ActionType)}
              className="bg-background/50"
            >
              <optgroup label="创建">
                <option value="create-domain">新建 Domain</option>
                <option value="create-scenario">新建 Scenario</option>
              </optgroup>
              <optgroup label="重命名">
                <option value="rename-domain">重命名 Domain</option>
                <option value="rename-scenario">重命名 Scenario</option>
              </optgroup>
              <optgroup label="删除">
                <option value="delete-domain">删除 Domain</option>
                <option value="delete-scenario">删除 Scenario</option>
              </optgroup>
            </Select>
          </div>

          {/* Domain 选择（部分操作需要） */}
          {actionType !== 'create-domain' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                选择 Domain
                {actionType.includes('domain') ? '' : ' *'}
              </label>
              <Select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="bg-background/50"
                disabled={isLoading}
              >
                <option value="">
                  {isLoading ? '加载中...' : '选择 Domain'}
                </option>
                {domains.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.label} ({d.scenarios.length} Scenarios)
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Scenario 选择（部分操作需要） */}
          {(actionType === 'rename-scenario' || actionType === 'delete-scenario') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">选择 Scenario *</label>
              <Select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="bg-background/50"
                disabled={!selectedDomain}
              >
                <option value="">选择 Scenario</option>
                {selectedDomainData?.scenarios.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label} ({s.count} Prompts)
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* 名称输入（创建和重命名需要） */}
          {!actionType.startsWith('delete') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {actionType.startsWith('rename') ? '新名称' : '名称'} *
              </label>
              <Input
                placeholder="例如：Coding, Frontend"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">
                使用英文字母开头，可包含字母、数字、连字符和下划线
              </p>
            </div>
          )}

          {/* 当前分类预览 */}
          <div className="rounded-lg border border-border/50 bg-card/30 p-3">
            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Icon icon="mdi:folder-tree" className="h-4 w-4 text-primary" />
              当前分类结构
            </p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">加载中...</p>
            ) : domains.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无分类</p>
            ) : (
              <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                {domains.map(d => (
                  <div key={d.id}>
                    <div className="flex items-center gap-1 text-foreground">
                      <Icon icon="mdi:folder" className="h-4 w-4 text-primary" />
                      {d.label}
                      <span className="text-muted-foreground text-xs">({d.scenarios.length})</span>
                    </div>
                    {d.scenarios.length > 0 && (
                      <div className="ml-5 space-y-0.5">
                        {d.scenarios.map(s => (
                          <div key={s.id} className="flex items-center gap-1 text-muted-foreground">
                            <Icon icon="mdi:folder-outline" className="h-3 w-3" />
                            {s.label}
                            <span className="text-xs">({s.count})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between border-t border-border/50 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            关闭
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant={actionType.startsWith('delete') ? 'destructive' : 'default'}
          >
            {isSubmitting ? (
              <>
                <Icon icon="mdi:loading" className="h-4 w-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <Icon icon={actionIcons[actionType]} className="h-4 w-4 mr-2" />
                {actionLabels[actionType]}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

