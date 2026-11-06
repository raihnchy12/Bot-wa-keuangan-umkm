/**
 * Message templates (balasan bot ke pengguna WhatsApp)
 */

export const buildWelcomeMessage = (name: string): string =>
  `👋 Selamat datang di KasKu, ${name}!\n\n` +
  `Akun dan usaha Anda sudah otomatis dibuat.\n\n` +
  `Anda bisa mencatat transaksi langsung lewat WhatsApp, contoh:\n` +
  `• "Jualan hari ini 500 ribu"\n` +
  `• "Beli gas 25 ribu"\n\n` +
  `Voice note juga bisa. 🎤`;