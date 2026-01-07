'use client';

import * as React from 'react';
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, MeshDistortMaterial } from '@react-three/drei';

import * as THREE from 'three';

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

    // calculate size based on progress (min 1, max 2.5)
    const size = 1 + (project.progress / 100) * 1.5;

    // calculate color based on health
    const getColor = (health: number) => {
        if (health >= 80) return '#00ff88'; // Green
        if (health >= 50) return '#f59e0b'; // Yellow (Amber)
        return '#ef4444'; // Red
    };

    const baseColor = getColor(project.health_score);

    useFrame(() => {
        if (meshRef.current) {
            // Gentle rotation
            meshRef.current.rotation.x += 0.002;
            meshRef.current.rotation.y += 0.005;

            // Hover effect: slight scale pulse
            const targetScale = hovered ? 1.2 : 1;
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
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
                    emissive={baseColor}
                    emissiveIntensity={hovered ? 0.8 : 0.4}
                    roughness={0.2}
                    metalness={0.8}
                    distort={0.4} // Strength of distortion
                    speed={2} // Speed of distortion
                />
            </mesh>

            <Html distanceFactor={15} position={[0, size + 0.5, 0]} className="pointer-events-none">
                <div className={`
            px-3 py-1.5 rounded-lg backdrop-blur-md border transition-opacity duration-300
            ${hovered ? 'opacity-100' : 'opacity-60'}
            bg-black/60 border-white/10 text-white whitespace-nowrap
        `}>
                    <div className="font-bold text-sm tracking-wide">{project.name}</div>
                    <div className="text-xs text-center flex items-center justify-between gap-2 mt-0.5 opacity-80">
                        <span>{project.progress}%</span>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: baseColor }} />
                    </div>
                </div>
            </Html>
        </group>
    );
}
