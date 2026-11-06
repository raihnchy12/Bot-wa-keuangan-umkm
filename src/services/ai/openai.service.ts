import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Token AQ... kamu akan diterima di sini
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});