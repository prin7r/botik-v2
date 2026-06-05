// AES-256-GCM encryption for user secrets (OpenRouter API key, Telegram bot token).
// Keys come from BOTIK_VAULT_KEY env (32 bytes base64).
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Env } from '@/libs/Env';

const ALGO = 'aes-256-gcm';

function key(): Buffer {
  const k = Buffer.from(Env.BOTIK_VAULT_KEY, 'base64');
  if (k.length !== 32) {
    throw new Error(
      `[VAULT_KEY_INVALID] BOTIK_VAULT_KEY must be 32 bytes (base64). Got ${k.length}.`,
    );
  }
  return k;
}

/** Encrypt plaintext. Returns base64 string with format:  iv(12) | tag(16) | ciphertext. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

/** Decrypt a string produced by encrypt(). Throws on tamper. */
export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, 'base64');
  if (buf.length < 28) {
    throw new Error('[VAULT_PAYLOAD_TOO_SHORT]');
  }
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}

/** Quick self-test on app boot to fail fast if BOTIK_VAULT_KEY is wrong. */
export function vaultSelfTest(): boolean {
  try {
    const sample = 'botik-vault-selftest';
    const enc = encrypt(sample);
    const dec = decrypt(enc);
    return dec === sample;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[VAULT_SELFTEST_FAILED]', err);
    return false;
  }
}
