import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// Store credentials in ~/.my-ai/
const CONFIG_DIR = join(homedir(), '.my-ai')
const TOKENS_FILE = join(CONFIG_DIR, 'tokens.json')
const APIKEYS_FILE = join(CONFIG_DIR, 'apikeys.json')

export interface StoredTokens {
  google?: {
    access_token: string
    refresh_token: string
    expiry_date: number
    token_type: string
    scope: string
  }
}

interface StoredApiKeys {
  [service: string]: string
}

async function ensureConfigDir(): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { mode: 0o700, recursive: true })
  }
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  await ensureConfigDir()
  const existing = await loadTokens()
  const merged = { ...existing, ...tokens }
  await writeFile(TOKENS_FILE, JSON.stringify(merged, null, 2), { mode: 0o600 })
}

export async function loadTokens(): Promise<StoredTokens> {
  try {
    const data = await readFile(TOKENS_FILE, 'utf-8')
    return JSON.parse(data) as StoredTokens
  } catch {
    return {}
  }
}

export async function saveApiKey(service: string, apiKey: string): Promise<void> {
  await ensureConfigDir()
  const existing = await loadAllApiKeys()
  existing[service] = apiKey
  await writeFile(APIKEYS_FILE, JSON.stringify(existing, null, 2), {
    mode: 0o600,
  })
}

export async function loadApiKey(service: string): Promise<string | null> {
  const keys = await loadAllApiKeys()
  return keys[service] ?? null
}

async function loadAllApiKeys(): Promise<StoredApiKeys> {
  try {
    const data = await readFile(APIKEYS_FILE, 'utf-8')
    return JSON.parse(data) as StoredApiKeys
  } catch {
    return {}
  }
}
