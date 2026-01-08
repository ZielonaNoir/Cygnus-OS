'use client';

import * as React from 'react';
import { TaskStream } from './TaskStream';
import { Button } from '@/app/components/ui/button';
import { Icon } from '@/app/components/Icon';
import { syncProject } from '@/app/actions/project';
import { toast } from 'sonner';

interface Task {
    id: string;
    task_text: string;
    status: string;
    priority: string;
    file_path: string;
    line_number?: number;
    created_at?: string;
}

interface TaskFilterProps {
    tasks: Task[];
    projectId: string;
}

type FilterType = 'all' | 'pending' | 'urgent' | 'completed';

export function TaskFilter({ tasks, projectId }: TaskFilterProps) {
    const [filter, setFilter] = React.useState<FilterType>('all');
    const [isSyncing, setIsSyncing] = React.useState(false);

    const filteredTasks = React.useMemo(() => {
        switch (filter) {
            case 'pending': return tasks.filter(t => t.status === 'pending');
            case 'completed': return tasks.filter(t => t.status === 'completed');
            case 'urgent': return tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
            default: return tasks;
        }
    }, [tasks, filter]);

    const handleSync = async () => {
        setIsSyncing(true);
        toast.info('Initiating Neural Sync...');
        try {
            const result = await syncProject(projectId);
            if (result.success) {
                toast.success('System Synchronized');
            } else {
                toast.error(`Sync Failed: ${result.error}`);
            }
        } catch {
            toast.error('Connection Lost during sync');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleStartAgent = async () => {
        toast.success('Agent Activated: Analyzing Task Matrix...');
        // Mock delay for effect
        setTimeout(() => {
             toast.info('Agent is standing by for instructions.');
        }, 1500);
    }

    return (
        <div className="space-y-6">
            {/* Control Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4">
                
                {/* Filter Tabs */}
                <div className="flex items-center p-1 rounded-lg bg-white/5 border border-white/5">
                    {(['all', 'urgent', 'pending', 'completed'] as FilterType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`
                                px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all
                                ${filter === type 
                                    ? 'bg-amber-500/20 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'}
                            `}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40 font-mono hidden md:block">
                        BUFFER: {filteredTasks.length}/{tasks.length}
                    </span>
                    
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5 ${isSyncing ? 'animate-pulse' : ''}`}
                    >
                        <Icon icon="mdi:sync" className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync'}
                    </Button>
                    
                    <Button 
                        size="sm"
                        onClick={handleStartAgent}
                        className="bg-amber-500 hover:bg-amber-600 text-black border-none shadow-[0_0_20px_rgba(245,158,11,0.3)] font-bold"
                    >
                        <Icon icon="mdi:robot-outline" className="w-4 h-4 mr-2" />
                        Start Agent
                    </Button>
                </div>
            </div>

            {/* Task List */}
            <TaskStream tasks={filteredTasks} />
        </div>
    );
}
