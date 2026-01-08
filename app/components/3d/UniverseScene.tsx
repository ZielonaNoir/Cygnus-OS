'use client';

import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles, Float } from '@react-three/drei';

import { ProjectSphere } from './ProjectSphere';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';
import { Icon } from '@/app/components/Icon';
import * as THREE from 'three';

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

// Simple easing function
const lerpVec3 = (current: THREE.Vector3, target: THREE.Vector3, factor: number, delta: number) => {
    current.lerp(target, 1 - Math.exp(-factor * delta));
}

function FlyToCamera({ target, onFinish }: { target: THREE.Vector3 | null, onFinish: () => void }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { controls } = useThree() as any;
    
    useFrame((state, delta) => {
        if (target) {
            // Disable controls during flight
            // eslint-disable-next-line
             if (state.controls) (state.controls as any).enabled = false;
            
            // Calculate fly position (offset from target)
            const flightOffset = new THREE.Vector3(0, 0, 8); // Distance to stop from target
            const flyPos = target.clone().add(flightOffset);

            // Smoothly move camera
            lerpVec3(state.camera.position, flyPos, 2.0, delta);
            
            // Smoothly look at target
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const controls = state.controls as any;
            if (controls && controls.target) {
                lerpVec3(controls.target, target, 2.0, delta);
            } else {
                 // Fallback if no controls target
                 state.camera.lookAt(target);
            }
             
             // Check if close enough to trigger transition
             if (state.camera.position.distanceTo(flyPos) < 0.5) {
                 onFinish();
             }
        } else {
             // eslint-disable-next-line
             if (controls) controls.enabled = true;
        }
    });
    return null;
}

export function UniverseScene({ projects }: UniverseSceneProps) {
    const router = useRouter();
    const [expanded, setExpanded] = React.useState(true);
    const [focusTarget, setFocusTarget] = React.useState<THREE.Vector3 | null>(null);
    const [flying, setFlying] = React.useState(false);

    const handleProjectClick = (id: string, position: [number, number, number]) => {
        if (flying) return;
        setFlying(true);
        setFocusTarget(new THREE.Vector3(...position));
        
        // Timeout backup in case animation stutters, force redirect after 2s
        setTimeout(() => {
             router.push(`/dashboard/projects/${id}`);
        }, 2000);
    };
    
    const onFlightFinished = () => {
        // Animation "done" (close enough), wait a split second then fly
        // Redirect handled by backup timeout or direct calls if we want tighter integration
    }

    // Generate stable positions efficiently on first render
    const positions = React.useMemo(() => projects.map((_, i) => {
        // Golden Spiral / Disc distribution
        const angle = i * 2.4; // Golden angle approx for organic spread
        const radius = 6 + (i * 1.2); // Increasing radius

        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        // Vertical randomness for 3D depth
        const y = Math.sin(i * 137.5) * 3;

        return [x, y, z] as [number, number, number];
    }), [projects]);

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
        <div className="relative w-full h-[600px] border-b border-white/10 transition-all duration-700 ease-in-out group">
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

            <div className="absolute top-6 left-8 z-10 pointer-events-none select-none">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-amber-200 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                    Cygnus Universe
                </h2>
                <div className="flex items-center gap-3 mt-2">
                     <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse box-shadow-[0_0_10px_#22c55e]" />
                     <p className="text-white/60 text-xs tracking-[0.2em] uppercase font-medium">
                        {projects.length} System Nodes Active
                    </p>
                </div>
            </div>

            <Canvas camera={{ position: [0, 8, 28], fov: 40 }} dpr={[1, 2]}>
                <color attach="background" args={['#020205']} />
                <fog attach="fog" args={['#020205', 15, 60]} />
                
                {/* Cinematic Lighting */}
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={1.0} color="#c084fc" />
                <pointLight position={[-20, 0, -20]} intensity={1.0} color="#3b82f6" />
                <pointLight position={[0, -10, 0]} intensity={0.5} color="#fbbf24" />

                <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
                <Sparkles count={150} size={5} scale={[40, 20, 40]} opacity={0.2} color="#ffffff" speed={0.2} />

                {/* Flying Logic */}
                <FlyToCamera target={focusTarget} onFinish={onFlightFinished} />

                <group>
                    {projects.map((project, i) => (
                        <Float key={project.id} speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
                            <ProjectSphere
                                project={project}
                                position={positions[i]}
                                onClick={(id) => handleProjectClick(id, positions[i])}
                            />
                        </Float>
                    ))}
                </group>



                <OrbitControls
                    enablePan={false}
                    enableZoom={!flying}
                    enableRotate={!flying}
                    maxDistance={50}
                    minDistance={5}
                    autoRotate={!flying}
                    autoRotateSpeed={0.3}
                    maxPolarAngle={Math.PI / 1.5}
                />
            </Canvas>
        </div>
    );
}
