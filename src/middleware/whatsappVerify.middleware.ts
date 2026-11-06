import { Request, Response, NextFunction } from 'express';
import { verifyMetaSignature, dedupCache, extractMessageId } from '../utils/webhookSecurity';

/**
 * Middleware: Verify Meta webhook signature (HMAC SHA256)
 */
export const verifyWebhookSignature = (req: Request, res: Response, next: NextFunction) => {
  const signature = req.headers['x-hub-signature-256'] as string;

  if (!signature) {
    console.warn('[Middleware] Missing x-hub-signature-256 header');
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  // Get raw body - Express JSON middleware stores this in req.rawBody if configured
  // Otherwise we stringify the parsed body
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  if (!verifyMetaSignature(rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  console.log('[Middleware] Webhook signature verified');
  next();
};

/**
 * Middleware: Deduplicate webhook messages
 */
export const deduplicateWebhook = (req: Request, res: Response, next: NextFunction) => {
  const messageId = extractMessageId(req.body);

  if (!messageId) {
    // No message ID found, proceed normally
    console.log('[Dedup Middleware] No message ID found, proceeding');
    return next();
  }

  if (dedupCache.has(messageId)) {
    console.log(`[Dedup Middleware] Duplicate message detected: ${messageId}, returning 200 OK`);
    return res.status(200).send('EVENT_RECEIVED');
  }

  // New message, add to cache
  dedupCache.add(messageId);
  console.log(`[Dedup Middleware] New message: ${messageId}, added to cache`);
  next();
};
