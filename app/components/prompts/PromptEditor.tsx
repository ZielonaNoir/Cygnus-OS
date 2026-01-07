'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Icon } from '../Icon';
import { toast } from '@/app/lib/toast';

// 动态导入 Monaco Editor（仅在客户端加载）
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        加载编辑器...
      </div>
    ),
  }
);

interface PromptEditorProps {
  initialValue: string;
  language?: string;
  onSave?: (value: string) => void | Promise<void>;
  onChange?: (value: string) => void; // 用于表单集成（无工具栏模式）
  onCancel?: () => void;
  showToolbar?: boolean;
  height?: string;
  title?: string;
}

export function PromptEditor({
  initialValue,
  language = 'markdown',
  onSave,
  onChange,
  onCancel,
  showToolbar = true,
  height = '400px',
  title = '编辑 Prompt',
}: PromptEditorProps) {
  const [value, setValue] = React.useState(initialValue);
  const [isSaving, setIsSaving] = React.useState(false);

  // 处理编辑器内容变化
  const handleEditorChange = React.useCallback((newValue: string | undefined) => {
    const val = newValue || '';
    setValue(val);
    // 无工具栏模式：通过 onChange 回调通知父组件
    if (!showToolbar && onChange) {
      onChange(val);
    }
  }, [showToolbar, onChange]);

  const handleSave = async () => {
    if (!onSave) {
      toast.warning('保存功能未配置');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(value);
      toast.success('保存成功', 'Prompt 内容已更新');
    } catch (error) {
      toast.error('保存失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsSaving(false);
    }
  };

  // 无工具栏模式（用于表单内嵌）
  if (!showToolbar) {
    return (
      <div className="rounded-lg overflow-hidden">
        <MonacoEditor
          height={height}
          language={language}
          value={value}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Icon icon="mdi:loading" className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Icon icon="mdi:content-save" className="h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <div className="h-full rounded-lg overflow-hidden border border-border/50">
          <MonacoEditor
            height="100%"
            language={language}
            value={value}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

