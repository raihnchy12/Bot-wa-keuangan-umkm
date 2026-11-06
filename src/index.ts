import config from './config/env';
import express, { Express, Request, Response } from 'express';
import { errorHandler } from './middleware/errorHandler';
import { loggerMiddleware } from './middleware/logger';
import { verifyWebhook, receiveWebhook } from './controllers/webhook.controller';
import { verifyWebhookSignature, deduplicateWebhook } from './middleware/whatsappVerify.middleware';
import { webhookLimiter } from './middleware/rateLimiter.middleware';

const app: Express = express();

app.use(loggerMiddleware);

// Configure express.json to capture raw body for signature verification
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'WhatsApp Finance Bot API is running',
    version: '1.0.0'
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


app.use(errorHandler);

if (config.nodeEnv !== 'test') {
  app.listen(config.port, () => {
    console.log(`[server]: Server is running at http://localhost:${config.port} in ${config.nodeEnv} mode`);
  });
}

export default app;