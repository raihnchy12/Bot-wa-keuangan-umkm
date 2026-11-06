import { extractMessagesFromWebhookValue, isStatusOnlyWebhook } from '../utils/messageParser';
import { handleIncomingMessage } from './whatsapp/messageHandler.service';

/**
 * Meta WhatsApp Cloud API webhook payload types
 */
export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  audio?: { id: string; mime_type: string };
}

export interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

export interface WhatsAppWebhookValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
  contacts?: Array<{ profile: { name: string }; wa_id: string }>;
}

export interface WhatsAppWebhookChange {
  value: WhatsAppWebhookValue;
  field: string;
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

const errorInfo = (error: unknown) => ({
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
});

/**
 * Parse and process WhatsApp webhook payload.
 * Async: setiap pesan diproses berurutan (for...of + await), dan error pada
 * satu pesan/change/entry tidak menghentikan yang lain (WA-006).
 */
export const processWebhookPayload = async (
  payload: WhatsAppWebhookPayload
): Promise<void> => {
  try {
    console.log('[Webhook Processor] Processing payload...');

    if (!payload.entry || payload.entry.length === 0) {
      console.log('[Webhook Processor] No entries found');
      return;
    }

    for (const entry of payload.entry) {
      try {
        console.log(`[Webhook Processor] Processing entry: ${entry.id}`);

        for (const change of entry.changes ?? []) {
          try {
            const value = change.value;
            const phoneNumberId = value.metadata?.phone_number_id;

            // Check if this is a status-only webhook (no actual messages)
            if (isStatusOnlyWebhook(value)) {
              console.log(
                `[Webhook Processor] Status-only webhook on phone ${phoneNumberId}: ${value.statuses?.length ?? 0} status update(s)`
              );
              continue;
            }

            // Extract and parse incoming messages
            const parsedMessages = extractMessagesFromWebhookValue(value);

            if (parsedMessages.length === 0) {
              console.log(`[Webhook Processor] No valid messages extracted on phone ${phoneNumberId}`);
              continue;
            }

            console.log(
              `[Webhook Processor] Extracted ${parsedMessages.length} message(s) on phone ${phoneNumberId}`
            );

            // Process each parsed message (WA-010: identify user & onboarding)
            for (const msg of parsedMessages) {
              try {
                console.log(`  - Message ID: ${msg.msgId}`);
                console.log(`    From: ${msg.from} (${msg.name})`);
                console.log(`    Timestamp: ${msg.timestamp}`);
                console.log(`    Type: ${msg.type}`);

                if (msg.type === 'text') {
                  console.log(`    Text: ${msg.textBody}`);
                } else if (msg.type === 'audio') {
                  console.log(`    Audio ID: ${msg.audioId}`);
                  console.log(`    Audio MIME: ${msg.audioMimeType}`);
                }

                await handleIncomingMessage(msg);
              } catch (messageError) {
                console.error('[Webhook Error] Failed to handle message:', {
                  msgId: msg.msgId,
                  ...errorInfo(messageError),
                });
              }
            }
          } catch (changeError) {
            console.error('[Webhook Error] Failed to process change:', errorInfo(changeError));
          }
        }
      } catch (entryError) {
        console.error('[Webhook Error] Failed to process entry:', {
          entryId: entry.id,
          ...errorInfo(entryError),
        });
      }
    }

    console.log('[Webhook Processor] Payload processing completed');
  } catch (error) {
    console.error('[Webhook Error] Critical error during webhook processing:', errorInfo(error));
  }
};