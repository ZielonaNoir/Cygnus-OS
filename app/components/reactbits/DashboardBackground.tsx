'use client';

import Aurora from './Aurora';

/**
 * Dashboard 背景组件
 * 集成 Aurora 极光效果，适配 Cygnus-OS 艺术风格
 */
export function DashboardBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Aurora
        primaryColor="rgb(15, 23, 42)" // slate-900
        secondaryColor="rgb(245, 158, 11)" // amber-500
        intensity={0.4}
        className="opacity-60"
      />
      {/* 额外的渐变层增强效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-slate-900/80" />
    </div>
  );
}

