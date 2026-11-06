import { AxiosError } from 'axios';

export interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      messaging_product: string;
      details: string;
    };
  };
}

export const parseWhatsAppError = (error: AxiosError<MetaApiError>) => {
  const status = error.response?.status || 500;
  const errorData = error.response?.data?.error;

  const message = errorData?.message || error.message || 'WhatsApp API error';
  const code = errorData?.code || status;
  const type = errorData?.type || 'unknown_error';

  return {
    status,
    code,
    type,
    message,
    details: errorData?.error_data?.details,
    raw: error.response?.data,
  };
};
