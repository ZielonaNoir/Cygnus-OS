import { listApiKeys } from '@/app/actions/api-keys'
import { CreateApiKeyDialog } from '@components/api-keys/CreateApiKeyDialog'
import { ApiKeyCard } from '@components/api-keys/ApiKeyCard'
import { Icon } from '@components/Icon'
import Link from 'next/link'

export default async function ApiKeysPage() {
  const { keys } = await listApiKeys()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6 md:p-12">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6">
          <Icon icon="mdi:arrow-left" className="w-4 h-4" />
          <span className="text-sm">Back to Dashboard</span>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">API Keys</h1>
            <p className="text-white/60">Manage permanent authentication keys for MCP connections</p>
          </div>
          <CreateApiKeyDialog />
        </div>
      </div>

      {/* Info Banner */}
      <div className="max-w-5xl mx-auto mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <Icon icon="mdi:information-outline" className="w-5 h-5 text-amber-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-200 mb-1">Permanent Authentication</h3>
            <p className="text-sm text-amber-100/80">
              API Keys provide permanent authentication for MCP connections. Configure once in Cursor and never worry about token expiration.
              Keep your keys secure and never commit them to version control.
            </p>
          </div>
        </div>
      </div>

      {/* API Keys List */}
      <div className="max-w-5xl mx-auto">
        {keys.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <Icon icon="mdi:key-outline" className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No API Keys Yet</h3>
            <p className="text-white/60 mb-6">Create your first API key to get started with permanent MCP authentication</p>
            <CreateApiKeyDialog />
          </div>
        ) : (
          <div className="grid gap-4">
            {keys.map((key) => (
              <ApiKeyCard key={key.id} apiKey={key} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
