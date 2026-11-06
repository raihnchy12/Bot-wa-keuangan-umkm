import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState 
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import * as fs from 'fs'; // 1. Impor modul fs untuk manajemen file

// Mengimpor service yang dibutuhkan
import { messageHandlerService } from './services/whatsapp/messageHandler.service';
import { downloadAudioFromBaileys } from './services/voice/mediaDownload.service';
import { transcribeAudio } from './services/ai/whisper.service';

async function startBot() {
    // Menyimpan sesi autentikasi secara lokal
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
    });

    // Menangani pemunculan QR Code
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('Scan QR code di bawah ini menggunakan WhatsApp kamu:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus karena ', lastDisconnect?.error, ', mencoba menghubungkan ulang:', shouldReconnect);
            
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Bot WhatsApp berhasil terhubung dan siap digunakan!');
        }
    });

    // Menyimpan kredensial setiap ada pembaruan sesi
    sock.ev.on('creds.update', saveCreds);

    // Mendengarkan pesan masuk
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const senderNumber = msg.key.remoteJid;
        if (!senderNumber) return;

        // Abaikan jika pesan berasal dari grup (berakhiran @g.us)
        if (senderNumber.endsWith('@g.us')) {
            return;
        }

        const senderName = msg.pushName || senderNumber || '';

        // Cek apakah pesan berupa Voice Note / Audio
        const isAudio = !!(msg.message.audioMessage);
        
        const messageText = msg.message.conversation || 
                            msg.message.extendedTextMessage?.text || '';

        // Jika bukan teks dan bukan audio, abaikan
        if (!messageText && !isAudio) return;

        try {
            let replyText: string | null = null;

            if (isAudio) {
                console.log(`[Bot] Menerima pesan suara dari ${senderNumber}`);
                let audioPath: string | null = null; // 2. Deklarasikan variabel jalur file audio
                
                try {
                    // 1. Unduh audio langsung menggunakan Baileys
                    audioPath = await downloadAudioFromBaileys(msg);
                    console.log('Voice note berhasil diunduh ke:', audioPath);

                    // 2. Transkripsi audio menggunakan layanan AI
                    const transcribedText = await transcribeAudio(audioPath);
                    console.log(`[Bot] Transkripsi suara: "${transcribedText}"`);

                    // 3. Validasi jika hasil transkripsi kosong / suara tidak jelas
                    if (!transcribedText || transcribedText.trim().length === 0) {
                        replyText = 'Maaf, suara tidak terdengar jelas. Silakan coba kirim ulang pesan suara atau ketik pesan teks.';
                    } else {
                        // Proses teks hasil transkripsi ke handler keuangan
                        const textResponse = await messageHandlerService.handleIncomingMessage(
                            senderNumber,
                            transcribedText,
                            senderName
                        );

                        replyText = `🎙️ *(Transkrip: "${transcribedText}")*\n\n${textResponse}`;
                    }
                } catch (audioError) {
                    console.error('❌ Gagal memproses voice note:', audioError);
                    replyText = 'Maaf, suara tidak terdengar jelas. Silakan coba kirim ulang pesan suara atau ketik pesan teks.';
                } finally {
                    // 4. CLEANUP UTILITY (VOICE-007): 
                    // Menghapus file audio sementara dari disk dalam blok finally (berjalan saat sukses/gagal)
                    if (audioPath && fs.existsSync(audioPath)) {
                        try {
                            fs.unlinkSync(audioPath);
                            console.log(`[Cleanup] File audio sementara berhasil dihapus: ${audioPath}`);
                        } catch (unlinkError) {
                            console.error(`[Cleanup] Gagal menghapus file audio di ${audioPath}:`, unlinkError);
                        }
                    }
                }
            } else {
                console.log(`Pesan masuk dari ${senderNumber}: ${messageText}`);
                replyText = await messageHandlerService.handleIncomingMessage(
                    senderNumber,
                    messageText,
                    senderName
                );
            }

            // Kirimkan balasan ke pengguna jika ada
            if (replyText) {
                await sock.sendMessage(senderNumber, { text: replyText }, { quoted: msg });
            }
        } catch (error) {
            console.error('❌ Gagal memproses pesan masuk:', error);
            await sock.sendMessage(senderNumber, { 
                text: '⚠️ Maaf, terjadi kesalahan internal pada sistem bot keuangan saat memproses pesan kamu.' 
            }, { quoted: msg });
        }
    });
}

startBot().catch((err) => console.log('Error pada bot:', err));