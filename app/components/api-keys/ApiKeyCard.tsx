'use client'

import { useState } from 'react'
import { revokeApiKey } from '@/app/actions/api-keys'
import { maskApiKey } from '@/app/lib/api-keys'
import { Button } from '@/app/components/ui/button'
import { Icon } from '@/app/components/Icon'
import { toast } from 'sonner'

interface ApiKeyCardProps {
  apiKey: {
    id: string
    name: string
    key_prefix: string
    created_at: string
    last_used_at: string | null
    expires_at: string | null
  }
}

export function ApiKeyCard({ apiKey }: ApiKeyCardProps) {
  const [isRevoking, setIsRevoking] = useState(false)

  const handleRevoke = async () => {
    if (!confirm(`Are you sure you want to revoke "${apiKey.name}"? This action cannot be undone.`)) {
      return
    }

    setIsRevoking(true)
    const result = await revokeApiKey(apiKey.id)
    
    if (result.success) {
      toast.success('API Key revoked successfully')
      window.location.reload()
    } else {
      toast.error(result.error || 'Failed to revoke API key')
      setIsRevoking(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = apiKey.expires_at && new Date(apiKey.expires_at) < new Date()

  return (
    <div className={`p-6 rounded-xl border transition-all ${
      isExpired 
        ? 'bg-red-500/5 border-red-500/20' 
        : 'bg-white/[0.02] border-white/10 hover:border-white/20'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold">{apiKey.name}</h3>
            {isExpired && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-red-500/20 text-red-400 rounded">
                Expired
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:key-variant" className="w-4 h-4 text-white/40" />
              <code className="text-green-400 font-mono">{maskApiKey(apiKey.key_prefix)}</code>
            </div>

            <div className="flex items-center gap-2 text-white/60">
              <Icon icon="mdi:calendar" className="w-4 h-4" />
              <span>Created {formatDate(apiKey.created_at)}</span>
            </div>

            <div className="flex items-center gap-2 text-white/60">
              <Icon icon="mdi:clock-outline" className="w-4 h-4" />
              <span>Last used {formatDate(apiKey.last_used_at)}</span>
            </div>

            {apiKey.expires_at && (
              <div className="flex items-center gap-2 text-white/60">
                <Icon icon="mdi:timer-sand" className="w-4 h-4" />
                <span>Expires {formatDate(apiKey.expires_at)}</span>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleRevoke}
          disabled={isRevoking}
          variant="outline"
          size="sm"
          className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
        >
          <Icon icon="mdi:delete-outline" className="w-4 h-4 mr-2" />
          {isRevoking ? 'Revoking...' : 'Revoke'}
        </Button>
      </div>
    </div>
  )
}
