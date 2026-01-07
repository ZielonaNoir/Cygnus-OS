'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { Icon } from '@/app/components/Icon';
import { toast } from '@/app/lib/toast';
import { PromptEditor } from '@/app/components/prompts/PromptEditor';
import { ShinyTitle } from '@/app/components/reactbits/ShinyTitle';
import Link from 'next/link';
import { useCategories } from '@/app/lib/prompts/categories';

interface FormData {
  name: string;
  domain: string;
  scenario: string;
  newScenario: string;
  description: string;
  tags: string;
  mainPrompt: string;
  context: string;
  visibility: 'public' | 'private';
}

const defaultPromptTemplate = `# {{name}}

你是一位专精于 {{domain}} 领域的 AI 助手。

## 核心能力

- 能力 1
- 能力 2
- 能力 3

## 开发规范

1. 规范 1
2. 规范 2
3. 规范 3

## 注意事项

- 注意事项 1
- 注意事项 2
`;

export default function NewPromptPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { domains, isLoading: isCategoriesLoading } = useCategories();
  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    domain: '',
    scenario: '',
    newScenario: '',
    description: '',
    tags: '',
    mainPrompt: defaultPromptTemplate,
    context: '',
    visibility: 'private',
  });

  // 获取当前选中的 Domain 数据
  const selectedDomainData = React.useMemo(() => {
    return domains.find(d => d.id === formData.domain);
  }, [domains, formData.domain]);

  // 获取当前可用的 Scenario 列表
  const availableScenarios = React.useMemo(() => {
    if (!selectedDomainData) return [];
    return selectedDomainData.scenarios;
  }, [selectedDomainData]);

  // 重置 Scenario 当 Domain 改变时
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, scenario: '', newScenario: '' }));
  }, [formData.domain]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!formData.name.trim()) {
      toast.error('请输入 Prompt 名称');
      return;
    }
    if (!formData.domain) {
      toast.error('请选择 Domain');
      return;
    }
    if (!formData.scenario && !formData.newScenario.trim()) {
      toast.error('请选择或新建 Scenario');
      return;
    }
    if (!formData.mainPrompt.trim()) {
      toast.error('请输入 Prompt 内容');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 获取实际的 label（文件夹名称）
      const domainLabel = selectedDomainData?.label || formData.domain;
      const scenarioLabel = formData.newScenario.trim() || 
        availableScenarios.find(s => s.id === formData.scenario)?.label || 
        formData.scenario;

      const resp = await fetch('/api/prompts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          domain: domainLabel,
          scenario: scenarioLabel,
          description: formData.description.trim(),
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          mainPrompt: formData.mainPrompt,
          context: formData.context,
          visibility: formData.visibility,
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error || '创建失败');
      }

      toast.success('Prompt 创建成功！', `已保存到 ${data.path}`);
      router.push('/prompts');
    } catch (error) {
      console.error('Failed to create prompt:', error);
      toast.error('创建失败', '请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background p-8">
      <div className="mx-auto max-w-4xl">
        {/* 标题 */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground"
            >
              <Icon icon="mdi:arrow-left" className="h-4 w-4 mr-1" />
              返回
            </Button>
          </div>
          <div className="mt-4">
            <ShinyTitle text="新建 Prompt" className="text-3xl" as="h1" />
            <p className="mt-2 text-muted-foreground">
              创建一个新的 Prompt Repo，将保存到本地文件系统并同步到数据库
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon icon="mdi:information-outline" className="h-5 w-5 text-primary" />
                基本信息
              </CardTitle>
              <CardDescription>设置 Prompt 的名称、分类和描述</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 名称 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  名称 <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="例如：Nuxt4-Expert"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  使用英文、数字、连字符命名，将作为文件夹名称
                </p>
              </div>

              {/* Domain 和 Scenario */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Domain <span className="text-destructive">*</span>
                    </label>
                    <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      <Link href="/prompts/categories">
                        <Icon icon="mdi:folder-cog" className="h-3 w-3 mr-1" />
                        分类管理
                      </Link>
                    </Button>
                  </div>
                  <Select
                    value={formData.domain}
                    onChange={(e) => handleChange('domain', e.target.value)}
                    className="bg-background/50"
                    disabled={isCategoriesLoading}
                  >
                    <option value="">{isCategoriesLoading ? '加载中...' : '选择 Domain'}</option>
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Scenario <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData.scenario}
                    onChange={(e) => handleChange('scenario', e.target.value)}
                    className="bg-background/50"
                    disabled={!formData.domain || isCategoriesLoading}
                  >
                    <option value="">选择 Scenario</option>
                    {availableScenarios.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                    <option value="__new__">+ 新建 Scenario</option>
                  </Select>
                </div>
              </div>

              {/* 新建 Scenario */}
              {formData.scenario === '__new__' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    新 Scenario 名称 <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="例如：mobile-dev"
                    value={formData.newScenario}
                    onChange={(e) => handleChange('newScenario', e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              )}

              {/* 描述 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">描述</label>
                <Input
                  placeholder="简短描述这个 Prompt 的用途"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {/* 标签 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">标签</label>
                <Input
                  placeholder="用逗号分隔，例如：TypeScript, React, Hooks"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {/* 可见性 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">可见性</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={formData.visibility === 'private'}
                      onChange={() => handleChange('visibility', 'private')}
                      className="text-primary"
                    />
                    <Icon icon="mdi:lock" className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">私有</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={formData.visibility === 'public'}
                      onChange={() => handleChange('visibility', 'public')}
                      className="text-primary"
                    />
                    <Icon icon="mdi:earth" className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">公开</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prompt 内容 */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon icon="mdi:file-document-edit" className="h-5 w-5 text-primary" />
                Prompt 内容
              </CardTitle>
              <CardDescription>
                编写主 Prompt 指令（main.prompt）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border border-border/50">
                <PromptEditor
                  initialValue={formData.mainPrompt}
                  language="markdown"
                  onChange={(value) => handleChange('mainPrompt', value)}
                  showToolbar={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Context（可选） */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon icon="mdi:text-box-outline" className="h-5 w-5 text-primary" />
                背景知识（可选）
              </CardTitle>
              <CardDescription>
                补充上下文信息（context.md），帮助 AI 更好地理解任务背景
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border border-border/50">
                <PromptEditor
                  initialValue={formData.context}
                  language="markdown"
                  onChange={(value) => handleChange('context', value)}
                  showToolbar={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* 提交按钮 */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icon icon="mdi:loading" className="h-4 w-4 mr-2 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Icon icon="mdi:check" className="h-4 w-4 mr-2" />
                  创建 Prompt
                </>
              )}
            </Button>
          </div>
        </form>

        {/* 预览路径 */}
        {formData.name && formData.domain && (formData.scenario || formData.newScenario) && (
          <div className="mt-6 rounded-lg border border-border/50 bg-card/30 p-4">
            <p className="text-sm text-muted-foreground">
              <Icon icon="mdi:folder-outline" className="inline h-4 w-4 mr-1" />
              预览保存路径：
              <code className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-primary">
                /data/prompts/{selectedDomainData?.label || formData.domain}/{formData.newScenario || availableScenarios.find(s => s.id === formData.scenario)?.label || formData.scenario}/{formData.name.replace(/[^a-zA-Z0-9_-]/g, '-')}
              </code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

