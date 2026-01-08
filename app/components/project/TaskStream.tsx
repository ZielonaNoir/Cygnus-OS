'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/app/components/Icon';

// Helper for priority visualization
const getPriorityStyle = (priority: string) => {
    switch (priority) {
        case 'urgent': return 'text-red-400 border-red-500/30 bg-red-500/10 shadow-[0_0_10px_rgba(248,113,113,0.2)] animate-pulse';
        case 'high': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
        case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
        case 'low': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
        default: return 'text-white/40 border-white/10';
    }
};

interface Task {
    id: string;
    task_text: string;
    status: string;
    priority: string;
    file_path: string;
    line_number?: number;
    created_at?: string;
}

const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export function TaskStream({ tasks }: { tasks: Task[] }) {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-white/20 border border-dashed border-white/10 rounded-xl">
                <Icon icon="mdi:checkbox-blank-off-outline" className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-mono text-sm">No active signals detected in datastream.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3">
            {tasks.map((task, index) => {
                 const priorityClass = getPriorityStyle(task.priority);
                 const age = task.created_at ? getRelativeTime(task.created_at) : 'unknown';

                 return (
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative overflow-hidden rounded-xl bg-[#0A0A0F] border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300"
                    >
                        {/* Decorative Left Border based on Status */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.status === 'completed' ? 'bg-green-500/50' : 'bg-transparent group-hover:bg-amber-500/50'} transition-colors`} />

                        <div className="p-4 pl-6 flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-2">
                                {/* Task Text */}
                                <h3 className={`text-sm font-medium tracking-wide ${task.status === 'completed' ? 'text-white/40 line-through decoration-white/20' : 'text-white/90 group-hover:text-amber-100'} transition-colors`}>
                                    {task.task_text}
                                </h3>
                                
                                {/* Metadata Row */}
                                <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
                                    {/* File Path */}
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 truncate max-w-[200px] hover:max-w-full transition-all cursor-help" title={task.file_path}>
                                        <Icon icon="mdi:file-code-outline" className="w-3 h-3 text-blue-400" />
                                        <span className="truncate">
                                            {task.file_path.split('/').pop()}
                                            {task.line_number ? `:${task.line_number}` : ''}
                                        </span>
                                    </div>

                                    {/* Age */}
                                    <div className="flex items-center gap-1 opacity-60">
                                        <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                                        <span>{age}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side badges */}
                            <div className="flex flex-col items-end gap-2">
                                 {/* Priority Badge */}
                                 <div className={`
                                    px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider flex items-center gap-1
                                    ${priorityClass}
                                 `}>
                                     {task.priority === 'urgent' && <Icon icon="mdi:alert-circle" className="w-3 h-3" />}
                                     {task.priority}
                                 </div>
                                 
                                 {/* Status Icon */}
                                 {task.status === 'completed' && (
                                     <div className="text-green-500 flex items-center gap-1 text-[10px] font-medium opacity-80">
                                         <Icon icon="mdi:check-circle" className="w-3 h-3" />
                                         DONE
                                     </div>
                                 )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
