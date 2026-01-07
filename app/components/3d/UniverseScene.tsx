'use client';

import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { ProjectSphere } from './ProjectSphere';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Icon } from '@/app/components/Icon';

interface Project {
    id: string;
    name: string;
    progress: number;
    health_score: number;
    status: string;
}

interface UniverseSceneProps {
    projects: Project[];
}

export function UniverseScene({ projects }: UniverseSceneProps) {
    const router = useRouter();
    const [expanded, setExpanded] = React.useState(true);

    const handleProjectClick = (id: string) => {
        router.push(`/dashboard/projects/${id}`);
    };

    // Generate stable positions efficiently on first render
    const positions = projects.map((_, i) => {
        // Golden Spiral / Disc distribution
        const angle = i * 1.5; // Spread angle
        const radius = 5 + (i * 0.8); // Increasing radius

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        // Slight vertical randomness for "3D" feel
        const pseudoRandom = Math.sin(i * 9999);
        const y = pseudoRandom * 2;

        return [x, y, z] as [number, number, number];
    });

    if (!expanded) {
        return (
            <div className="w-full h-16 bg-card/30 border-b border-white/10 flex items-center justify-between px-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-primary">
                    <Icon icon="mdi:galaxy" className="h-5 w-5" />
                    <span className="font-semibold tracking-wider">Cygnus Universe</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
                    展开视图
                </Button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[500px] border-b border-white/10 transition-all duration-700 ease-in-out">
            {/* Controls Overlay */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="bg-black/40 border-white/20 hover:bg-white/10"
                    onClick={() => setExpanded(false)}
                    title="收起视图"
                >
                    <Icon icon="mdi:chevron-up" className="h-5 w-5" />
                </Button>
            </div>

            <div className="absolute top-4 left-6 z-10 pointer-events-none">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-amber-200">
                    Cygnus Universe
                </h2>
                <p className="text-white/50 text-xs tracking-wider mt-1 uppercase">
                    {projects.length} Active System Nodes
                </p>
            </div>

            <Canvas camera={{ position: [0, 5, 20], fov: 45 }}>
                <color attach="background" args={['#050510']} />
                <fog attach="fog" args={['#050510', 10, 50]} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#c084fc" />
                <pointLight position={[-10, -5, -10]} intensity={0.5} color="#60a5fa" />

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Sparkles count={200} size={4} scale={[30, 10, 30]} opacity={0.4} color="#ffffff" />

                <group>
                    {projects.map((project, i) => (
                        <ProjectSphere
                            key={project.id}
                            project={project}
                            position={positions[i]}
                            onClick={handleProjectClick}
                        />
                    ))}
                </group>

                <OrbitControls
                    enablePan={false}
                    enableZoom={true}
                    maxDistance={40}
                    minDistance={5}
                    autoRotate
                    autoRotateSpeed={0.5}
                />
            </Canvas>
        </div>
    );
}
