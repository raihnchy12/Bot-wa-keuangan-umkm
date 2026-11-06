import whatsappClient from '../config/whatsapp';
import config from '../config/env';
import { parseWhatsAppError } from '../utils/whatsappError';
import { AxiosError } from 'axios';

export interface SendMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface SendTextMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: unknown;
}

export interface WhatsAppButton {
  id: string;
  title: string;
}

export interface SendInteractiveButtonsResult {
  success: boolean;
  messageId?: string;
  fallbackUsed?: boolean;
  error?: string;
  details?: unknown;
}

/**
 * Format body text and button options into a plain text message fallback
 */
export const formatButtonFallbackText = (
  bodyText: string,
  buttons: WhatsAppButton[]
): string => {
  if (!buttons || buttons.length === 0) {
    return bodyText;
  }

  const optionsList = buttons
    .map((button, index) => `${index + 1}. ${button.title}`)
    .join('\n');

  return `${bodyText}\n\nPilihan:\n${optionsList}`;
};

/**
 * Send outgoing WhatsApp text message via Meta Graph API
 * @param toPhoneNumber Recipient phone number (e.g. "628123456789")
 * @param textMessage Message body text
 */
export const sendTextMessage = async (
  toPhoneNumber: string,
  textMessage: string
): Promise<SendTextMessageResult> => {
  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhoneNumber,
      type: 'text',
      text: {
        body: textMessage,
      },
    };

    const response = await whatsappClient.post<SendMessageResponse>(
      `${config.waPhoneNumberId}/messages`,
      payload
    );

    const messageId = response.data?.messages?.[0]?.id;

    console.log(`[WhatsApp Service] Text message sent successfully to ${toPhoneNumber}`, {
      messageId,
      status: response.status,
    });

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const parsedError = parseWhatsAppError(error as AxiosError<any>);
    console.error(`[WhatsApp Error] Failed to send text message to ${toPhoneNumber}:`, {
      to: toPhoneNumber,
      error: parsedError.message,
      code: parsedError.code,
      type: parsedError.type,
      details: parsedError.details,
    });

    return {
      success: false,
      error: parsedError.message,
      details: parsedError,
    };
  }
};

/**
 * Send outgoing WhatsApp interactive reply buttons message via Meta Graph API.
 * Fallbacks to plain text message if interactive sending fails.
 * @param toPhoneNumber Recipient phone number (e.g. "628123456789")
 * @param bodyText Body text above interactive buttons
 * @param buttons Array of buttons (maximum 3 buttons)
 */
export const sendInteractiveButtons = async (
  toPhoneNumber: string,
  bodyText: string,
  buttons: WhatsAppButton[]
): Promise<SendInteractiveButtonsResult> => {
  try {
    if (!buttons || buttons.length === 0) {
      throw new Error('No buttons provided for interactive message');
    }

    // WhatsApp Cloud API supports max 3 reply buttons
    const formattedButtons = buttons.slice(0, 3).map((button) => ({
      type: 'reply',
      reply: {
        id: button.id,
        title: button.title.substring(0, 20),
      },
    }));

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhoneNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText,
        },
        action: {
          buttons: formattedButtons,
        },
      },
    };

    const response = await whatsappClient.post<SendMessageResponse>(
      `${config.waPhoneNumberId}/messages`,
      payload
    );

    const messageId = response.data?.messages?.[0]?.id;

    console.log(
      `[WhatsApp Service] Interactive button message sent successfully to ${toPhoneNumber}`,
      {
        messageId,
        status: response.status,
      }
    );

    return {
      success: true,
      messageId,
      fallbackUsed: false,
    };
  } catch (error) {
    const parsedError = parseWhatsAppError(error as AxiosError<any>);
    console.warn(
      `[WhatsApp Service] Interactive button message failed for ${toPhoneNumber}, attempting fallback to text message:`,
      {
        to: toPhoneNumber,
        error: parsedError.message,
        code: parsedError.code,
        type: parsedError.type,
        details: parsedError.details,
      }
    );

    // Automatic fallback to plain text message
    const fallbackText = formatButtonFallbackText(bodyText, buttons);
    const fallbackResult = await sendTextMessage(toPhoneNumber, fallbackText);

    if (fallbackResult.success) {
      console.log(
        `[WhatsApp Service] Fallback text message sent successfully to ${toPhoneNumber}`
      );
      return {
        success: true,
        messageId: fallbackResult.messageId,
        fallbackUsed: true,
      };
    }

    console.error(
      `[WhatsApp Service] Fallback text message also failed for ${toPhoneNumber}`
    );

    return {
      success: false,
      fallbackUsed: true,
      error: `Interactive failed (${parsedError.message}) & Fallback failed (${fallbackResult.error})`,
      details: {
        interactiveError: parsedError,
        fallbackError: fallbackResult.details,
      },
    };
  }
};

/**
 * VOICE-002: Download WhatsApp Audio / Voice Note via Media ID
 * Step 1: Request media URL from GET /{media_id}
 * Step 2: Download binary audio buffer using Axios
 */
export const downloadWhatsAppAudio = async (
  mediaId: string
): Promise<{ success: boolean; buffer?: Buffer; mimeType?: string; error?: string }> => {
  try {
    // Step 1: Memanggil GET /{media_id} untuk mendapatkan URL download file
    const mediaMetadataResponse = await whatsappClient.get<{ url: string; mime_type?: string }>(
      `/${mediaId}`
    );

    const mediaUrl = mediaMetadataResponse.data?.url;
    const mimeType = mediaMetadataResponse.data?.mime_type;

    if (!mediaUrl) {
      return { success: false, error: 'URL media tidak ditemukan dari response Meta API.' };
    }

    console.log(`[WhatsApp Service] Mengunduh media audio dari URL untuk Media ID: ${mediaId}`);

    // Step 2: Mengunduh file binary audio menggunakan Axios dengan header Authorization Bearer Token
    const audioResponse = await whatsappClient.get(mediaUrl, {
      responseType: 'arraybuffer',
    });

    const audioBuffer = Buffer.from(audioResponse.data);

    return {
      success: true,
      buffer: audioBuffer,
      mimeType,
    };
  } catch (error) {
    const parsedError = parseWhatsAppError(error as AxiosError<any>);
    console.error(`[WhatsApp Service] Gagal mengunduh media ${mediaId}:`, {
      message: parsedError.message,
      code: parsedError.code,
      details: parsedError.details,
    });

    return {
      success: false,
      error: `Gagal mengunduh media: ${parsedError.message}`,
    };
  }
};