'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

interface ProjectHeroProps {
    project: {
        name: string;
        description?: string;
        health_score: number;
        progress: number;
        status: string;
    };
}

export function ProjectHero({ project }: ProjectHeroProps) {
    // Determine color based on health
    const getHealthColor = (score: number) => {
        if (score >= 90) return 'text-green-400 border-green-500/50 shadow-green-500/20';
        if (score >= 70) return 'text-emerald-400 border-emerald-500/50 shadow-emerald-500/20';
        if (score >= 50) return 'text-amber-400 border-amber-500/50 shadow-amber-500/20';
        return 'text-red-400 border-red-500/50 shadow-red-500/20';
    };

    const healthColorClass = getHealthColor(project.health_score);
    // Actually, let's make it: High Health = Stable, Slow Pulse. Low Health = Rapid, Erratic Pulse.

    return (
        <div className="relative w-full h-[400px] flex items-center justify-center overflow-hidden rounded-3xl border border-white/5 bg-black/40 backdrop-blur-md">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            {/* Central Core */}
            <div className="relative z-10 flex flex-col items-center text-center">
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className={`
                        w-32 h-32 rounded-full border-4 flex items-center justify-center
                        bg-black/50 backdrop-blur-xl
                        shadow-[0_0_50px_rgba(0,0,0,0.5)]
                        ${healthColorClass}
                    `}
                >
                    <div className="text-4xl font-bold font-mono tracking-tighter">
                        {project.health_score}
                    </div>
                </motion.div>
                
                <h1 className="mt-8 text-4xl font-black tracking-tight text-white drop-shadow-lg">
                    {project.name}
                </h1>
                <p className="mt-2 text-lg text-white/60 max-w-lg">
                    {project.description || "System Node Online"}
                </p>

                {/* Status Chips */}
                <div className="mt-6 flex gap-4">
                     <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-widest text-white/70 backdrop-blur-sm">
                         {project.status}
                     </div>
                     <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-widest text-white/70 backdrop-blur-sm">
                         Progress: {project.progress}%
                     </div>
                </div>
            </div>

            {/* Orbiting Particles (Simple CSS/Framer) */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-[500px] h-[500px] border border-white/5 rounded-full pointer-events-none"
            />
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute w-[700px] h-[700px] border border-white/5 rounded-full pointer-events-none opacity-50"
            />
        </div>
    );
}
