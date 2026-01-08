
import { ConnectToCursor } from '@components/mcp/ConnectToCursor';
import { Icon } from '@/app/components/Icon';

export default function MCPConnectPage() {
    return (
        <div className="container mx-auto max-w-4xl py-10 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    MCP Integration
                </h1>
                <p className="text-muted-foreground">
                    一键将 Cygnus-OS PromptHub 连接到 Cursor AI
                </p>
            </div>

            <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-2 items-center">
                {/* Helper Text Area */}
                <div className="space-y-4">
                    <div className="p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
                        <h3 className="text-lg font-semibold mb-2 text-foreground">工作原理</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                            <li>点击 <strong className="text-foreground">一键安装</strong> 按钮</li>
                            <li>Cursor 会自动打开</li>
                            <li>确认 &quot;Add MCP Server&quot; 对话框</li>
                            <li>开始在 Cursor Chat 中使用你的 prompts！</li>
                        </ol>

                        <div className="mt-4 p-3 bg-muted/50 rounded-md border border-border/50 text-xs font-mono text-muted-foreground">
                            试试问 Cursor：<br />
                            <span className="text-primary">&quot;Search @Cygnus-OS for react component patterns&quot;</span>
                        </div>
                    </div>

                    <div className="p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-foreground">
                            <Icon icon="mdi:information-outline" className="w-5 h-5 text-primary" />
                            Token 过期时间
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            JWT token 默认 1 小时后过期。如需调整，可在 Supabase Dashboard 
                            → Authentication → Settings → JWT Expiry 中修改。
                        </p>
                    </div>
                </div>

                {/* The Action Card */}
                <div className="flex justify-center py-6">
                    <ConnectToCursor />
                </div>
            </div>
        </div>
    );
}
