/**
 * Message Parser Utility
 * Extracts and validates WhatsApp message metadata and content from webhook payload
 */

/**
 * Parsed message object with extracted metadata
 */
export interface ParsedMessage {
  from: string;
  name: string;
  msgId: string;
  timestamp: string;
  type: 'text' | 'audio';
  textBody?: string;
  audioId?: string;
  audioMimeType?: string;
}

/**
 * Extract contact name from webhook contacts array by phone number
 */
const getContactName = (
  phone: string,
  contacts?: Array<{ profile: { name: string }; wa_id: string }>
): string => {
  if (!contacts || contacts.length === 0) return phone;
  const contact = contacts.find((c) => c.wa_id === phone);
  return contact?.profile.name || phone;
};

/**
 * Parse a single WhatsApp message object
 * @param message Raw message object from webhook
 * @param contacts Contact array from webhook value for name lookup
 * @returns Parsed message or null if invalid
 */
export const parseMessage = (
  message: {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    audio?: { id: string; mime_type: string };
    interactive?: {
      type: string;
      button_reply?: { id: string; title: string };
      list_reply?: { id: string; title: string; description?: string };
    };
    button?: { payload: string; text: string };
  },
  contacts?: Array<{ profile: { name: string }; wa_id: string }>
): ParsedMessage | null => {
  // Validate required fields
  if (!message.from || !message.id || !message.timestamp || !message.type) {
    console.warn('[Message Parser] Skipping message with missing required fields:', {
      from: message.from,
      id: message.id,
      type: message.type,
    });
    return null;
  }

  // 1. Text message
  if (message.type === 'text' && message.text?.body) {
    return {
      from: message.from,
      name: getContactName(message.from, contacts),
      msgId: message.id,
      timestamp: message.timestamp,
      type: 'text',
      textBody: message.text.body,
    };
  }

  // 2. Interactive button / list reply (Meta Cloud API) -> diekstrak sebagai text
  if (message.type === 'interactive' && message.interactive) {
    const buttonTitle =
      message.interactive.button_reply?.title ||
      message.interactive.button_reply?.id ||
      message.interactive.list_reply?.title ||
      message.interactive.list_reply?.id;

    if (buttonTitle) {
      return {
        from: message.from,
        name: getContactName(message.from, contacts),
        msgId: message.id,
        timestamp: message.timestamp,
        type: 'text',
        textBody: buttonTitle,
      };
    }
  }

  // 3. Quick reply button click -> diekstrak sebagai text
  if (message.type === 'button' && message.button) {
    const buttonText = message.button.text || message.button.payload;
    if (buttonText) {
      return {
        from: message.from,
        name: getContactName(message.from, contacts),
        msgId: message.id,
        timestamp: message.timestamp,
        type: 'text',
        textBody: buttonText,
      };
    }
  }

  // 4. Audio / Voice message
  if (message.type === 'audio' && message.audio?.id) {
    return {
      from: message.from,
      name: getContactName(message.from, contacts),
      msgId: message.id,
      timestamp: message.timestamp,
      type: 'audio',
      audioId: message.audio.id,
      audioMimeType: message.audio.mime_type,
    };
  }

  // Ignore other message types (image, video, document, etc.)
  console.log(`[Message Parser] Ignoring message type: ${message.type}`);
  return null;
};

/**
 * Extract all valid messages from a webhook value object
 * Filters out status updates and invalid messages
 * @param value WhatsApp webhook value object
 * @returns Array of parsed messages
 */
export const extractMessagesFromWebhookValue = (
  value: {
    messaging_product: string;
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    messages?: Array<{
      from: string;
      id: string;
      timestamp: string;
      type: string;
      text?: { body: string };
      audio?: { id: string; mime_type: string };
    }>;
    statuses?: Array<{
      id: string;
      status: string;
      timestamp: string;
      recipient_id: string;
    }>;
    contacts?: Array<{ profile: { name: string }; wa_id: string }>;
  }
): ParsedMessage[] => {
  const parsedMessages: ParsedMessage[] = [];

  // Skip if no messages present (only statuses/receipts in this webhook)
  if (!value.messages || value.messages.length === 0) {
    if (value.statuses && value.statuses.length > 0) {
      console.log(
        `[Message Parser] Ignoring webhook with only status updates (${value.statuses.length} statuses)`
      );
    }
    return parsedMessages;
  }

  // Parse each message
  for (const message of value.messages) {
    const parsed = parseMessage(message, value.contacts);
    if (parsed) {
      parsedMessages.push(parsed);
    }
  }

  return parsedMessages;
};

/**
 * Check if a webhook value contains only status updates (no actual messages)
 * Useful for early filtering in webhook handlers
 * @param value WhatsApp webhook value object
 * @returns true if only statuses present, false if messages exist
 */
export const isStatusOnlyWebhook = (value: {
  messages?: unknown[];
  statuses?: unknown[];
}): boolean => {
  return (!value.messages || value.messages.length === 0) && (value.statuses?.length ?? 0) > 0;
};
