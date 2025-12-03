/**
 * Token Encryption Utilities
 *
 * Provides AES-256-GCM encryption for OAuth tokens stored in database.
 *
 * Security considerations:
 * - Uses Web Crypto API for standard, audited implementation
 * - AES-256-GCM provides both encryption and authentication
 * - Each encryption uses unique IV (initialization vector)
 * - IV is prepended to ciphertext for storage
 * - Encryption key must be 32 bytes (256 bits)
 */

/**
 * Get encryption key from environment variable
 * Key must be base64-encoded 32-byte string
 */
function getEncryptionKey(): Uint8Array {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  try {
    // Decode base64 key
    const decoded = Buffer.from(key, 'base64');

    if (decoded.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (256 bits) when decoded');
    }

    return new Uint8Array(decoded);
  } catch (error) {
    throw new Error(
      `Invalid ENCRYPTION_KEY format: ${error instanceof Error ? error.message : 'unknown error'}. ` +
      'Generate a valid key with: openssl rand -base64 32'
    );
  }
}

/**
 * Encrypt a string value using AES-256-GCM
 *
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded ciphertext with prepended IV
 */
export async function encrypt(plaintext: string | null | undefined): Promise<string | null> {
  // Handle null/undefined values
  if (plaintext == null || plaintext === '') {
    return null;
  }

  try {
    const key = getEncryptionKey();

    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Import key for use with Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Convert plaintext to bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Encrypt
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );

    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Return as base64
    return Buffer.from(combined).toString('base64');
  } catch (error) {
    // Never log the plaintext
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  }
}

/**
 * Decrypt a string value using AES-256-GCM
 *
 * @param ciphertext - Base64-encoded ciphertext with prepended IV
 * @returns Decrypted plaintext string
 */
export async function decrypt(ciphertext: string | null | undefined): Promise<string | null> {
  // Handle null/undefined values
  if (ciphertext == null || ciphertext === '') {
    return null;
  }

  try {
    const key = getEncryptionKey();

    // Decode from base64
    const combined = new Uint8Array(Buffer.from(ciphertext, 'base64'));

    // Extract IV (first 12 bytes) and ciphertext (rest)
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    // Import key for use with Web Crypto API
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Decrypt
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );

    // Convert bytes to string
    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
  } catch (error) {
    // Don't log the ciphertext (could leak encrypted data)
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : 'unknown error'}. ` +
      'This could indicate data corruption or wrong encryption key.'
    );
  }
}

/**
 * Check if a value appears to be encrypted
 * (Heuristic: base64 string longer than typical plaintext)
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;

  // Encrypted values are base64 and reasonably long (IV + data + auth tag)
  // Minimum encrypted length is ~24 chars for very short plaintexts
  if (value.length < 20) return false;

  // Check if it's valid base64
  try {
    const decoded = Buffer.from(value, 'base64');
    // Should be able to decode and be at least 12 bytes (IV length)
    return decoded.length >= 12 && Buffer.from(decoded).toString('base64') === value;
  } catch {
    return false;
  }
}

/**
 * Generate a new encryption key
 * Use this to generate ENCRYPTION_KEY for .env file
 *
 * @example
 * ```bash
 * node -e "require('./encryption').generateKey()"
 * # or use OpenSSL:
 * openssl rand -base64 32
 * ```
 */
export function generateKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return Buffer.from(key).toString('base64');
}
