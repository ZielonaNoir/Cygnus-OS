'use client';

import * as React from 'react';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Icon } from '@/app/components/Icon';
import { toast } from 'sonner';

interface PermissionToggleProps {
    promptId: string;
    initialPrivate?: boolean;
}

export function PermissionToggle({ promptId, initialPrivate = false }: PermissionToggleProps) {
    const [isPrivate, setIsPrivate] = React.useState(initialPrivate);
    const [loading, setLoading] = React.useState(false);

    const handleToggle = async (checked: boolean) => {
        setLoading(true);
        // Optimistic update
        setIsPrivate(checked);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));

            // TODO: Call Supabase API to update 'visibility' or RLS
            // await updatePromptVisibility(promptId, checked ? 'private' : 'public');
            console.log('Setup for prompt:', promptId);

            toast.success(checked ? '已设为私有' : '已公开发布');
        } catch (error) {
            console.error(error);
            setIsPrivate(!checked); // Revert
            toast.error('设置失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <Badge
                variant={isPrivate ? "outline" : "default"}
                className={`gap-1 transition-colors ${isPrivate
                    ? 'border-border text-muted-foreground'
                    : 'bg-green-500/15 text-green-500 hover:bg-green-500/25 border-transparent'
                    }`}
            >
                <Icon
                    icon={isPrivate ? "mdi:lock-outline" : "mdi:earth"}
                    className="h-3.5 w-3.5"
                />
                {isPrivate ? 'Private' : 'Public'}
            </Badge>

            <div className="flex items-center space-x-2">
                <Switch
                    id="permission-mode"
                    checked={!isPrivate}
                    onCheckedChange={(c) => handleToggle(!c)}
                    disabled={loading}
                />
                <Label htmlFor="permission-mode" className="text-xs text-muted-foreground sr-only">
                    Toggle Public
                </Label>
            </div>
        </div>
    );
}
