'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

import { Button } from '../ui/button';
import { Icon } from '../Icon';
import { toast } from '@/app/lib/toast';
import { PermissionToggle } from './PermissionToggle';

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
  promptId?: string; // New prop for advanced features
}

export function PromptEditor({
  initialValue,
  language = 'markdown',
  onSave,
  onChange,

  showToolbar = true,
  height = '400px',
  title = '编辑 Prompt',
  promptId,
}: PromptEditorProps) {
  const [value, setValue] = React.useState(initialValue);
  const [isSaving, setIsSaving] = React.useState(false);

  // Revert handler


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
    <div className="flex flex-col h-full bg-background border-t border-border/50">
      {/* Editor Header / Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-4">
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {promptId && <PermissionToggle promptId={promptId} />}
          </div>
          <div className="flex gap-2">
            {/* Removed VersionHistory from here as it's in the main header now, or keep it if requested? 
                       Recalling the user image, the "Edit" view had a toggle. 
                       The new page header has VersionHistory. We can remove it from here to avoid duplication if it's already in page header.
                       But PromptEditor might be used elsewhere. For now, keep it but style it smaller.
                   */}

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8"
            >
              {isSaving ? (
                <>
                  <Icon icon="mdi:loading" className="h-4 w-4 animate-spin mr-2" />
                  保存中...
                </>
              ) : (
                <>
                  <Icon icon="mdi:content-save" className="h-4 w-4 mr-2" />
                  保存更改
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        <MonacoEditor
          height="100%"
          language={language}
          value={value}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            padding: { top: 24, bottom: 24 },
          }}
        />
      </div>
    </div>
  );
}

