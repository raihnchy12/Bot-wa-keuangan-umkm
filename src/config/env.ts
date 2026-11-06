import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  databaseUrl: string;
  waPhoneNumberId: string;
  waAccessToken: string;
  waVerifyToken: string;
  waAppSecret: string;
  geminiApiKey: string;
  geminiModel: string;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || defaultValue || '';
};

const config: EnvConfig = {
  port: parseInt(getEnv('PORT', '3000'), 10),
  nodeEnv: (getEnv('NODE_ENV', 'development') as EnvConfig['nodeEnv']),
  databaseUrl: getEnv('DATABASE_URL'),
  waPhoneNumberId: getEnv('WA_PHONE_NUMBER_ID'),
  waAccessToken: getEnv('WA_ACCESS_TOKEN'),
  waVerifyToken: getEnv('WA_VERIFY_TOKEN'),
  waAppSecret: getEnv('WA_APP_SECRET'),
  geminiApiKey: getEnv('GEMINI_API_KEY'),
  geminiModel: getEnv('GEMINI_MODEL', 'gemini-2.0-flash-lite'),
};

// Validation: Prevent unsafe production defaults
if (config.nodeEnv === 'production') {
  const requiredInProduction = [
    'databaseUrl',
    'waPhoneNumberId',
    'waAccessToken',
    'waVerifyToken',
    'waAppSecret',
    'geminiApiKey',
  ];

  for (const key of requiredInProduction) {
    if (!config[key as keyof EnvConfig] || config[key as keyof EnvConfig] === '') {
      throw new Error(
        `Missing required environment variable for production: ${key}. ` +
        `Check your environment configuration.`
      );
    }
  }
}

export default config;