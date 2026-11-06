import { Request, Response, NextFunction } from 'express';

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'x-access-token'];
const SENSITIVE_FIELDS = ['password', 'apikey', 'api_key', 'token', 'secret'];

const sanitizeValue = (value: string): string => {
  if (value.length <= 4) return value;
  return value.slice(0, 4) + '*'.repeat(Math.min(value.length - 4, 10));
};

const sanitizeHeaders = (headers: Record<string, any>): Record<string, any> => {
  const sanitized = { ...headers };
  SENSITIVE_HEADERS.forEach(key => {
    if (sanitized[key]) {
      sanitized[key] = sanitizeValue(String(sanitized[key]));
    }
  });
  return sanitized;
};

const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== 'object') return body;
  const sanitized = { ...body };
  SENSITIVE_FIELDS.forEach(key => {
    if (sanitized[key] && typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeValue(sanitized[key]);
    }
  });
  return sanitized;
};

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Terapkan sanitasi pada header dan body request agar aman dari kebocoran rahasia
    const safeHeaders = sanitizeHeaders(req.headers);
    const safeBody = sanitizeBody(req.body);

    const logMessage = {
      timestamp,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      headers: safeHeaders,
      body: safeBody,
    };

    const statusColor = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
    const resetColor = '\x1b[0m';

    // Cetak log ringkas atau sertakan informasi aman
    console.log(
      `${statusColor}[${timestamp}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)${resetColor}`
    );
  });

  next();
};