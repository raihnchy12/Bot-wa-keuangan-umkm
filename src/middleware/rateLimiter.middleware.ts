import rateLimit from 'express-rate-limit';

// Konfigurasi rate limiter untuk endpoint webhook
export const webhookLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Jendela waktu 15 menit
    max: 100, // Batas maksimal 100 request per IP dalam 15 menit
    standardHeaders: true, // Mengembalikan info rate limit pada header `RateLimit-*`
    legacyHeaders: false, // Menonaktifkan header `X-RateLimit-*` lama
    message: {
        status: 429,
        error: 'Too Many Requests',
        message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah beberapa saat.'
    }
});