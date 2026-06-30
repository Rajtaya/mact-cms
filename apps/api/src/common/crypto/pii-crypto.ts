import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

/**
 * Application-layer encryption for KYC PII (Aadhaar, PAN, bank account no.).
 *
 * AES-256-GCM with a key from ENCRYPTION_KEY (64 hex chars / 32 bytes).
 * Ciphertext format: "enc:v1:<iv b64>:<tag b64>:<data b64>".
 *
 * - decrypt() returns the input unchanged if it isn't in the enc:v1 format,
 *   so legacy plaintext rows keep working during/after migration.
 * - If no key is configured, encrypt/decrypt are pass-throughs with a warning
 *   (keeps local dev runnable); ENCRYPTION_KEY MUST be set in production.
 */
const PREFIX = 'enc:v1:';

function getKey(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) return null;
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }
  return key;
}

let warned = false;
function warnOnce() {
  if (!warned) {
    warned = true;
    // eslint-disable-next-line no-console
    console.warn('[pii-crypto] ENCRYPTION_KEY not set — PII stored in plaintext.');
  }
}

export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

export function encrypt(plaintext: string): string {
  if (plaintext == null || plaintext === '') return plaintext;
  if (isEncrypted(plaintext)) return plaintext; // idempotent
  const key = getKey();
  if (!key) {
    warnOnce();
    return plaintext;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decrypt(value: string): string {
  if (value == null || !isEncrypted(value)) return value; // legacy plaintext
  const key = getKey();
  if (!key) {
    warnOnce();
    return value;
  }
  const [, , ivB64, tagB64, dataB64] = value.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** Field names that hold encrypt-at-rest PII. */
export const PII_FIELDS = new Set(['aadhaar', 'pan', 'bankAccountNo']);

/** Recursively encrypt PII fields in Prisma write args (data trees). */
export function encryptDeep(node: any, seen = new WeakSet()): void {
  if (node == null || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  if (Array.isArray(node)) {
    node.forEach((v) => encryptDeep(v, seen));
    return;
  }
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (PII_FIELDS.has(key) && typeof v === 'string') {
      node[key] = encrypt(v);
    } else if (v && typeof v === 'object') {
      encryptDeep(v, seen);
    }
  }
}

/** Recursively decrypt PII fields in Prisma results. */
export function decryptDeep(node: any, seen = new WeakSet()): void {
  if (node == null || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  if (Array.isArray(node)) {
    node.forEach((v) => decryptDeep(v, seen));
    return;
  }
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (PII_FIELDS.has(key) && typeof v === 'string') {
      node[key] = decrypt(v);
    } else if (v && typeof v === 'object') {
      decryptDeep(v, seen);
    }
  }
}
