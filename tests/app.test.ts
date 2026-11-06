import request from 'supertest';

// 1. Mock module service yang bergantung pada Baileys agar Jest tidak error saat memuat index.ts
jest.mock('../src/services/whatsapp/messageHandler.service', () => ({
  messageHandlerService: {
    handleMessage: jest.fn(),
  },
}));

import app from '../src/index';

describe('Backend Express Infrastructure Tests (TEST-001)', () => {

    // 2. Menguji Acceptance Criteria: GET /health mengembalikan status 200
    it('GET /health harus mengembalikan status 200 dan status ok', async () => {
        const response = await request(app).get('/health');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('uptime');
    });

    // 3. Menguji Error Handler Middleware
    it('Error Handler Middleware harus menangkap error dan mengembalikan status 500', async () => {
        // Buat rute sementara untuk memicu error middleware
        app.get('/test-error-trigger', (req, res, next) => {
            next(new Error('Test Error Middleware'));
        });

        const response = await request(app).get('/test-error-trigger');
        expect(response.status).toBe(500);
    });

});