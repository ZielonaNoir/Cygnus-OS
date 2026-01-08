'use client';

import * as React from 'react';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { easing } from 'maath';

interface ProjectSphereProps {
    project: {
        id: string;
        name: string;
        progress: number;
        health_score: number;
        status: string;
    };
    position: [number, number, number];
    onClick?: (id: string) => void;
}

export function ProjectSphere({ project, position, onClick }: ProjectSphereProps) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const [hovered, setHovered] = useState(false);
    
    // Size logic: larger for developed projects, minimum size for visibility
    const size = 1.2 + (project.progress / 100) * 1.8;

    // Health color logic with HSL for better transitions could be nice, but Hex is fine for now
    const getColor = (health: number) => {
        if (health >= 90) return '#4ade80'; // Bright Green
        if (health >= 70) return '#22c55e'; // Green
        if (health >= 50) return '#fbbf24'; // Amber
        return '#ef4444'; // Red
    };

    const baseColor = getColor(project.health_score);
    // Emissive color pushes through bloom
    const emissiveRaw = hovered ? '#ffffff' : baseColor;

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Organic Rotation
            meshRef.current.rotation.x += delta * 0.2;
            meshRef.current.rotation.y += delta * 0.1;

            // Smooth Scale (Breath + Hover)
            const breath = Math.sin(state.clock.elapsedTime * 1.5) * 0.05 + 1;
            const targetScale = hovered ? 1.3 : 1.0;
            // Combined scale: base scale * breath * hover multiplier
            const finalScale = targetScale * breath;

            easing.damp3(meshRef.current.scale, [finalScale, finalScale, finalScale], 0.2, delta);
        }
    });

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onPointerOver={() => {
                    document.body.style.cursor = 'pointer';
                    setHovered(true);
                }}
                onPointerOut={() => {
                    document.body.style.cursor = 'default';
                    setHovered(false);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick?.(project.id);
                }}
            >
                <sphereGeometry args={[size, 64, 64]} />
                <MeshDistortMaterial
                    color={baseColor}
                    emissive={emissiveRaw}
                    emissiveIntensity={hovered ? 2.0 : 0.6} // High intensity triggers bloom
                    roughness={0.1}
                    metalness={0.9}
                    distort={0.4} 
                    speed={2} 
                />
            </mesh>
            
            {/* Connection Line to base plane (optional visual anchor) */}
            <mesh position={[0, -position[1] - 10, 0]}>
                 <cylinderGeometry args={[0.02, 0.02, position[1] + 20]} />
                 <meshBasicMaterial color={baseColor} transparent opacity={0.1} />
            </mesh>

            <Html distanceFactor={15} position={[0, size + 0.8, 0]} style={{ pointerEvents: 'none' }}>
                <div 
                    className={`
                        transform transition-all duration-300 ease-out origin-bottom
                        ${hovered ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-4'}
                    `}
                >
                    <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] w-48 overflow-hidden group-hover:border-white/20">
                        {/* Glow gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Header */}
                        <h3 className="text-sm font-bold text-white tracking-wide truncate mb-1">
                            {project.name}
                        </h3>
                        
                        {/* Status Badge */}
                        <div className="flex items-center gap-2 mb-3">
                             <div className={`w-2 h-2 rounded-full ${project.status === 'completed' ? 'bg-green-400' : 'bg-blue-400'} animate-pulse`} />
                             <span className="text-[10px] uppercase tracking-wider text-white/50">{project.status}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-2">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500" 
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                        
                        {/* Stats Row */}
                        <div className="flex justify-between items-center text-[10px] text-white/70">
                            <div>
                                <span className="text-white/40 mr-1">PROG</span>
                                {project.progress}%
                            </div>
                            <div>
                                <span className="text-white/40 mr-1">HLTH</span>
                                <span style={{ color: baseColor }}>{project.health_score}</span>
                            </div>
                        </div>

                        {/* Decorative Corner */}
                        <div className="absolute top-0 right-0 p-1">
                            <div className="w-2 h-2 border-t border-r border-white/20 rounded-tr" />
                        </div>
                        <div className="absolute bottom-0 left-0 p-1">
                            <div className="w-2 h-2 border-b border-l border-white/20 rounded-bl" />
                        </div>
                    </div>
                    
                    {/* Connecting Line */}
                    <div className="absolute left-1/2 -bottom-4 w-[1px] h-4 bg-gradient-to-b from-white/20 to-transparent -translate-x-1/2" />
                </div>
            </Html>
        </group>
    );
}
