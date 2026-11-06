import crypto from 'crypto';
import config from '../config/env';

/**
 * In-memory message deduplication cache with TTL
 */
class MessageDeduplicationCache {
  private cache: Map<string, number> = new Map();
  private readonly ttlMs: number = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  has(messageId: string): boolean {
    const expiryTime = this.cache.get(messageId);
    if (!expiryTime) return false;

    // Check if expired
    if (Date.now() > expiryTime) {
      this.cache.delete(messageId);
      return false;
    }

    return true;
  }

  add(messageId: string): void {
    this.cache.set(messageId, Date.now() + this.ttlMs);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [messageId, expiryTime] of this.cache.entries()) {
      if (now > expiryTime) {
        this.cache.delete(messageId);
      }
    }
    console.log(`[Dedup Cache] Cleanup: ${this.cache.size} active entries`);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

export const dedupCache = new MessageDeduplicationCache();

/**
 * Verify HMAC SHA256 signature from Meta
 * Meta sends: x-hub-signature-256 = sha256=<signature>
 */
export const verifyMetaSignature = (rawBody: string, signature: string): boolean => {
  if (!signature || !signature.startsWith('sha256=')) {
    console.warn('[Signature Verify] Invalid signature format');
    return false;
  }

  const receivedHash = signature.slice(7); // Remove 'sha256=' prefix
  const expectedHash = crypto
    .createHmac('sha256', config.waAppSecret)
    .update(rawBody)
    .digest('hex');

  const isValid = expectedHash === receivedHash;

  if (!isValid) {
    console.warn('[Signature Verify] Signature mismatch');
    console.warn(`  Expected: ${expectedHash}`);
    console.warn(`  Received: ${receivedHash}`);
  }

  return isValid;
};

/**
 * Extract message ID from webhook payload
 */
export const extractMessageId = (body: any): string | null => {
  try {
    if (!body.entry || body.entry.length === 0) return null;

    const entry = body.entry[0];
    if (!entry.changes || entry.changes.length === 0) return null;

    const change = entry.changes[0];
    if (!change.value || !change.value.messages || change.value.messages.length === 0) {
      return null;
    }

    return change.value.messages[0].id || null;
  } catch (error) {
    console.error('[Message ID Extract] Error:', error);
    return null;
  }
};
