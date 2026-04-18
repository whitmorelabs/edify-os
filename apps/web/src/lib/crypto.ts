import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENC_PREFIX = 'enc:v1:';
const IV_BYTES = 12;
const KEY_BYTES = 32;

export const CRYPTO_LABEL_ANTHROPIC_KEY = "orgs.anthropic_api_key";
export const CRYPTO_LABEL_GOOGLE_ACCESS_TOKEN = "integrations.access_token";
export const CRYPTO_LABEL_GOOGLE_REFRESH_TOKEN = "integrations.refresh_token";

let _cachedKey: Buffer | null = null;
function getKey(): Buffer {
  if (_cachedKey) return _cachedKey;
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY env var not set');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_BYTES} bytes when base64-decoded; got ${key.length}`);
  }
  _cachedKey = key;
  return _cachedKey;
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString('base64')}.${ciphertext.toString('base64')}.${authTag.toString('base64')}`;
}

export function decrypt(value: string): string {
  if (!isEncrypted(value)) {
    throw new Error('Value is not encrypted (missing enc:v1: prefix)');
  }
  const body = value.slice(ENC_PREFIX.length);
  const [ivB64, ctB64, tagB64] = body.split('.');
  if (!ivB64 || !ctB64 || !tagB64) throw new Error('Malformed ciphertext');
  const iv = Buffer.from(ivB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plaintext.toString('utf8');
}

/**
 * Read helper: returns decrypted value if encrypted, returns input as-is if plaintext (legacy).
 * Logs a one-time warning on legacy plaintext detection so we know there's data to migrate.
 */
const _legacyWarned = new Set<string>();
export function decryptIfEncrypted(value: string | null | undefined, contextLabel: string): string | null {
  if (value == null) return null;
  if (isEncrypted(value)) return decrypt(value);
  if (!_legacyWarned.has(contextLabel)) {
    console.warn(`[crypto] Legacy plaintext detected in ${contextLabel}; will be re-encrypted on next write`);
    _legacyWarned.add(contextLabel);
  }
  return value;
}
