import axios, { AxiosInstance } from 'axios';
import config from './env';

const whatsappClient: AxiosInstance = axios.create({
  baseURL: 'https://graph.facebook.com/v19.0/',
  headers: {
    Authorization: `Bearer ${config.waAccessToken}`,
  },
});

export default whatsappClient;
