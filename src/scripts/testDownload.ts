import { downloadAudioFromBaileys } from '../services/voice/mediaDownload.service';

async function testDownload() {
  try {
    // Simulasi objek pesan (msg) dari Baileys yang memiliki audioMessage / pttMessage
    // Pada implementasi nyata, objek 'msg' ini didapat langsung dari event listener pesan masuk Baileys.
    const mockBaileysMessage = {
      key: {
        id: 'TEST_MESSAGE_ID_123',
        remoteJid: '628xxx@s.whatsapp.net',
        fromMe: false,
      },
      message: {
        audioMessage: {
          url: '...',
          mimetype: 'audio/ogg; codecs=opus',
          // atribut media lainnya dari Baileys...
        }
      }
    };
    
    console.log(`Memulai unduh media dari pesan Baileys...`);
    const filePath = await downloadAudioFromBaileys(mockBaileysMessage);
    
    console.log(`Berhasil! File audio tersimpan di: ${filePath}`);
  } catch (error) {
    console.error('Pengujian gagal:', error);
  }
}

testDownload();