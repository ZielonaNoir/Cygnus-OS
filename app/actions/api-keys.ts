'use server'

import { createClient } from '@/app/lib/supabase/server'
import { generateApiKey, hashApiKey, isValidApiKeyFormat } from '@/app/lib/api-keys'
import { revalidatePath } from 'next/cache'

export async function createApiKeyAction(name: string, expiresAt?: Date) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Generate new API key
  const { key, prefix, hash } = generateApiKey()

  // Store in database
  const { error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      key_prefix: prefix,
      key_hash: hash,
      name,
      expires_at: expiresAt?.toISOString()
    })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/api-keys')
  
  // Return the full key ONLY once (never stored in plaintext)
  return { success: true, key, prefix }
}

export async function listApiKeys() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, created_at, last_used_at, expires_at')
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message, keys: [] }
  }

  return { success: true, keys: data }
}

export async function revokeApiKey(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/api-keys')
  return { success: true }
}

/**
 * Authenticate an API key and return a valid Supabase token
 * This is called by the MCP route
 */
export async function authenticateApiKey(apiKey: string): Promise<string | null> {
  if (!isValidApiKeyFormat(apiKey)) {
    return null
  }

  const supabase = await createClient()
  const keyHash = hashApiKey(apiKey)

  // Find the API key
  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('user_id, expires_at')
    .eq('key_hash', keyHash)
    .single()

  if (error || !keyData) {
    return null
  }

  // Check expiration
  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return null
  }

  // Update last_used_at (fire and forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)
    .then(() => {}) // Ignore result

  // Generate a proper user-scoped JWT instead of using Service Role Key
  // This ensures RLS policies are enforced
  const jwt = await import('jsonwebtoken')
  const secret = process.env.SUPABASE_JWT_SECRET
  
  if (!secret) {
    console.error('SUPABASE_JWT_SECRET is not set')
    return null
  }

  // Create a JWT that Supabase will recognize as this specific user
  const payload = {
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    sub: keyData.user_id,
    email: '',
    role: 'authenticated',
    app_metadata: {
      provider: 'api_key',
      providers: ['api_key']
    },
    user_metadata: {}
  }

  const token = jwt.sign(payload, secret)
  return token
}
