import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';

const ai = new GoogleGenAI();

export async function transcribeAudio(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File audio tidak ditemukan di path: ${filePath}`);
    }

    console.log(`[GeminiAudioService] Memproses transkripsi file audio: ${filePath}`);

    const audioBytes = fs.readFileSync(filePath);
    const base64Audio = audioBytes.toString('base64');

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'audio/ogg',
            data: base64Audio,
          },
        },
        {
          text: `Dengarkan rekaman audio berbahasa Indonesia ini dengan teliti. 
Tugas kamu adalah mentranskripsikannya menjadi teks hanya jika audio tersebut berisi ucapan kata atau kalimat perintah transaksi keuangan yang JELAS (seperti "pemasukan", "pengeluaran", atau penyebutan nominal uang).
PENTING: Jika audio tersebut hanya berupa suara batuk, gumaman, desisan, suara bising, atau tidak jelas kata-katanya, JANGAN menebak-nebak angka atau nominal. Cukup kembalikan teks persis: "TIDAK_JELAS".`,
        },
      ],
    });

    let transcribedText = response.text ? response.text.trim() : '';
    console.log(`[GeminiAudioService] Hasil transkripsi mentah: "${transcribedText}"`);

    // Jika AI mendeteksi suara tidak jelas / mengembalikan keyword TIDAK_JELAS, ubah jadi string kosong
    if (transcribedText.includes('TIDAK_JELAS') || transcribedText.toLowerCase() === 'tidak jelas') {
      transcribedText = '';
    }

    return transcribedText;
  } catch (error) {
    console.error('[GeminiAudioService] Gagal memproses audio:', error);
    throw new Error('Gagal mengonversi pesan suara.');
  }
}