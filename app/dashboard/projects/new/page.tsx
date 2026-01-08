/**
 * 创建新项目页面
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/app/components/ui/card';
import { toast } from 'sonner';

export default function NewProjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        path: '',
        progress: 0,
        status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'paused' | 'cancelled',
        healthScore: 0,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description || null,
                    path: formData.path,
                    progress: formData.progress,
                    status: formData.status,
                    healthScore: formData.healthScore,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '创建项目失败');
            }

            const { project } = await response.json();
            toast.success('项目创建成功');
            router.push(`/dashboard/projects/${project.id}`);
        } catch (error) {
            console.error('Create project error:', error);
            toast.error(error instanceof Error ? error.message : '创建项目失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>创建新项目</CardTitle>
                    <CardDescription>创建一个新的项目来跟踪进度</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">项目名称 *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="例如：Cygnus-OS"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">项目描述</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="项目的简要描述..."
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="path">项目路径 *</Label>
                            <Input
                                id="path"
                                value={formData.path}
                                onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                                placeholder="例如：/data/cygnus-os"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                项目的本地文件系统路径（唯一标识）
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="progress">进度 (%)</Label>
                                <Input
                                    id="progress"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.progress}
                                    onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="healthScore">健康度 (0-100)</Label>
                                <Input
                                    id="healthScore"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.healthScore}
                                    onChange={(e) => setFormData({ ...formData, healthScore: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">状态</Label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                                className="w-full px-3 py-2 border border-input bg-background rounded-md"
                            >
                                <option value="pending">⏳ 待处理</option>
                                <option value="in_progress">🔄 进行中</option>
                                <option value="completed">✅ 已完成</option>
                                <option value="paused">⏸️ 已暂停</option>
                                <option value="cancelled">❌ 已取消</option>
                            </select>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1"
                            >
                                {loading ? '创建中...' : '创建项目'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                取消
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
