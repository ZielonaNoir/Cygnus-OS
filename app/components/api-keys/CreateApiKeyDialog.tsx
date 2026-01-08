'use client'

import { useState } from 'react'
import { createApiKeyAction } from '@/app/actions/api-keys'
import { Button } from '@/app/components/ui/button'
import { Icon } from '@/app/components/Icon'
import { toast } from 'sonner'

export function CreateApiKeyDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for your API key')
      return
    }

    setIsLoading(true)
    const result = await createApiKeyAction(name.trim())
    setIsLoading(false)

    if (result.success && result.key) {
      setGeneratedKey(result.key)
      toast.success('API Key created successfully!')
    } else {
      toast.error(result.error || 'Failed to create API key')
    }
  }

  const handleCopy = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey)
      toast.success('API Key copied to clipboard!')
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setName('')
    setGeneratedKey(null)
    // Refresh the page to show new key
    window.location.reload()
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
      >
        <Icon icon="mdi:plus" className="w-5 h-5 mr-2" />
        Create API Key
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {!generatedKey ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Create New API Key</h2>
            <p className="text-white/60 text-sm mb-6">
              Give your API key a descriptive name to help you remember its purpose.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Key Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Cursor MCP Connection"
                className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Key'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Icon icon="mdi:check" className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">API Key Created!</h2>
                <p className="text-sm text-white/60">Save this key securely</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2 mb-3">
                <Icon icon="mdi:alert" className="w-5 h-5 text-amber-400 mt-0.5" />
                <p className="text-sm text-amber-100">
                  This is the only time you&apos;ll see this key. Copy it now and store it securely.
                </p>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between gap-3">
                <code className="text-sm text-green-400 font-mono break-all flex-1">
                  {generatedKey}
                </code>
                <Button
                  onClick={handleCopy}
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                >
                  <Icon icon="mdi:content-copy" className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleClose}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              Done
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
