/**
 * 项目导出按钮组件
 */

'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { FileText, FileDown } from 'lucide-react';

interface ExportButtonProps {
    projectId: string;
    projectName: string;
}

export function ExportButton({ projectId, projectName }: ExportButtonProps) {
    const [exporting, setExporting] = useState(false);

    const handleExport = async (format: 'markdown' | 'pdf') => {
        setExporting(true);
        try {
            if (format === 'markdown') {
                // 直接下载 Markdown
                const response = await fetch(`/api/projects/${projectId}/export?format=markdown`);
                if (!response.ok) {
                    throw new Error('Export failed');
                }
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${projectName}-${new Date().toISOString().split('T')[0]}.md`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                // PDF 导出（需要客户端生成）
                const response = await fetch(`/api/projects/${projectId}/export?format=pdf`);
                if (!response.ok) {
                    throw new Error('Export failed');
                }
                const data = await response.json();

                // 生成 Markdown 内容
                const markdown = generateMarkdownFromData(data);

                // 使用 jsPDF 生成 PDF（如果已安装）
                try {
                    const { generatePDF, downloadPDF } = await import('@/app/lib/export/pdf');
                    const blob = await generatePDF({
                        title: data.project.name,
                        content: markdown,
                    });
                    downloadPDF(blob, `${projectName}-${new Date().toISOString().split('T')[0]}.pdf`);
                } catch {
                    // 如果 jsPDF 未安装，提示用户安装或使用 Markdown
                    alert('PDF 导出需要安装 jsPDF 库。请先导出为 Markdown 格式。');
                }
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('导出失败，请重试');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('markdown')}
                disabled={exporting}
            >
                <FileText className="w-4 h-4 mr-2" />
                {exporting ? '导出中...' : '导出 Markdown'}
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
            >
                <FileDown className="w-4 h-4 mr-2" />
                {exporting ? '导出中...' : '导出 PDF'}
            </Button>
        </div>
    );
}

interface ExportData {
    project: {
        name: string;
        description?: string;
        status: string;
        progress: number;
        health_score: number;
        last_sync?: string;
    };
    tasks: Array<{
        status: string;
        priority?: string;
        task_text: string;
    }>;
}

function generateMarkdownFromData(data: ExportData): string {
    const lines: string[] = [];
    const { project, tasks } = data;

    lines.push(`# ${project.name}\n`);

    if (project.description) {
        lines.push(`${project.description}\n`);
    }

    lines.push(`## 项目信息\n`);
    lines.push(`- **状态**: ${project.status}`);
    lines.push(`- **进度**: ${project.progress}%`);
    lines.push(`- **健康度**: ${project.health_score}/100`);
    if (project.last_sync) {
        lines.push(`- **最后同步**: ${new Date(project.last_sync).toLocaleString('zh-CN')}`);
    }
    lines.push(`\n`);

    if (tasks && tasks.length > 0) {
        lines.push(`## 任务列表\n`);
        tasks.forEach((task) => {
            const checkbox = task.status === 'completed' ? '[x]' : '[ ]';
            const priority = task.priority ? `[${task.priority}]` : '';
            lines.push(`- ${checkbox} ${priority} ${task.task_text}`);
        });
    }

    return lines.join('\n');
}
