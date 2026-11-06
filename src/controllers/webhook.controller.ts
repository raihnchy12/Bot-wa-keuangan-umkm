import { Request, Response } from 'express';
import config from '../config/env';
import { processWebhookPayload, WhatsAppWebhookPayload } from '../services/webhookProcessor.service';

/**
 * GET /webhook - Webhook verification endpoint for Meta WhatsApp Cloud API
 * Validates hub.verify_token and returns hub.challenge if valid
 */
export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const verifyToken = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  // Validate webhook verification request
  if (mode === 'subscribe' && verifyToken === config.waVerifyToken) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Invalid verification token or mode' });
  }
};

/**
 * POST /webhook - Webhook receiver for incoming WhatsApp messages
 * Returns 200 immediately to prevent timeout, processes asynchronously
 */
export const receiveWebhook = (req: Request, res: Response) => {
  // Return 200 immediately to prevent webhook timeout
  res.status(200).send('EVENT_RECEIVED');

  // Process webhook payload asynchronously (non-blocking).
  // processWebhookPayload is async, so errors must be caught with .catch()
  // (a plain try/catch would not catch a rejected promise).
  setImmediate(() => {
    processWebhookPayload(req.body as WhatsAppWebhookPayload).catch((error) => {
      console.error('[Webhook Error] Failed to process webhook:', error);
    });
  });
};