import Threads from '@/app/components/Threads.jsx';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* 背景（ReactBits 占位 Aurora） */}
      <div className="absolute inset-0 z-0">
        {/* ReactBits Threads 背景（官方组件） */}
        {/* 为避免遮挡交互，置于指针事件禁用层 */}
        <ThreadsWrapper />
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/60 via-slate-950/30 to-background pointer-events-none" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-14">
        {/* Hero */}
        <div className="flex flex-col gap-10">
          <div className="max-w-3xl">
            <p className="text-sm text-muted-foreground">
              Prompt 即资产，并行即进化
            </p>
            <h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Cygnus-OS
              <span className="ml-3 text-primary/90">一人即组织</span>
            </h1>
            <p className="mt-4 text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              一个开源 AI 并行工程管理系统：用 SIPE 指挥部把项目进度、健康度与活跃度可视化；
              用 PromptHub 管理你的 Prompt 资产库；用 MCP Skills Market 组装技能。
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
            >
              进入 SIPE 指挥部
            </a>
            <a
              href="/prompts"
              className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-card/50 px-5 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-card/70"
            >
              打开 PromptHub
            </a>
            <a
              href="/mcp"
              className="inline-flex items-center justify-center rounded-lg border border-border/40 bg-transparent px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              MCP Skills Market
            </a>
          </div>

          {/* Feature Grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
              <div className="text-sm font-medium text-foreground">SIPE 指挥部</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                项目进度、健康度、活跃度一屏掌控，支持筛选与卡片网格展示。
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
              <div className="text-sm font-medium text-foreground">PromptHub</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                树状分类 + Command+K 搜索 + Monaco 编辑，打造可维护的 Prompt 资产仓库。
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur-sm">
              <div className="text-sm font-medium text-foreground">PWA</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                支持安装到桌面与离线页面。开发环境已禁用 SW，避免缓存导致的页面卡死。
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-12 text-xs text-muted-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Cygnus-OS</span>
            <span className="text-muted-foreground/70">
              Next.js 16 · React 19 · Tailwind 4 · Supabase · Bun
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function ThreadsWrapper() {
  return (
    <div className="absolute inset-0">
      <Threads
        color={[0.83, 0.59, 0.16]}
        amplitude={3.0}
        distance={0.60}
        enableMouseInteraction
      />
    </div>
  );
}
