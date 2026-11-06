import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

/**
 * Mengunduh file binary audio (Voice Note / Audio) langsung dari objek pesan Baileys
 * tanpa memerlukan Meta Access Token atau media_id manual.
 */
export async function downloadAudioFromBaileys(msg: any): Promise<string> {
  try {
    // 1. Menggunakan helper bawaan Baileys untuk mengunduh media ke dalam bentuk Buffer
    const buffer = await downloadMediaMessage(
      msg,
      'buffer',
      {},
      {
        logger: console as any,
        reuploadRequest: async (updateMsg: any) => {
          // Opsional: handler jika butuh reupload request
          return updateMsg;
        }
      }
    );

    if (!buffer) {
      throw new Error('Gagal mengekstrak buffer media dari pesan Baileys.');
    }

    // 2. Tentukan direktori penyimpanan sementara (tmp/audio)
    const uploadDir = path.resolve(process.cwd(), 'tmp', 'audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 3. Gunakan ID pesan unik sebagai nama file
    const mediaId = msg.key.id || Date.now().toString();
    const filePath = path.join(uploadDir, `${mediaId}.ogg`);

    // 4. Simpan buffer ke file fisik
    fs.writeFileSync(filePath, Buffer.from(buffer));

    console.log(`[BaileysMediaDownload] Berhasil mengunduh audio ke: ${filePath}`);
    return filePath;
  } catch (error: any) {
    console.error(`[BaileysMediaDownload] Gagal mengunduh audio:`, error.message);
    throw new Error('Gagal mengunduh file media suara dari pesan masuk.');
  }
}