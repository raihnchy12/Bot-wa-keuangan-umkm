import { parseMultiTransactions } from '../ai/transactionParser.service';
import { validateMultiTransactions } from '../ai/transactionGuard.service';
import { pendingTransactionManager, PendingTransactionPayload } from '../ai/pendingTransaction.service';
import { 
  confirmationHandlerService, 
  parseConfirmationIntent, 
  formatBatchConfirmationPrompt 
} from '../ai/confirmationHandler.service';
import { stateExpiryHandlerService } from '../ai/stateExpiryHandler.service';
import { onboardingService } from '../onboarding.service';
import { generateDailyReport, generateWeeklyReport, getRemainingBalance, generateMonthlyReport, generateMonthlyReportByMonthIndex } from '../report/dailyReport.service';
import { 
  getTransactionHistory, 
  deleteLatestTransaction, 
  deleteTransactionByIndex, 
  updateTransactionByIndex 
} from '../transaction/transactionHistory.service'; 
import { normalizePhoneNumber } from '../../utils/phone';
import { ParsedMessage } from '../../utils/messageParser';
import { downloadAudioFromBaileys } from '../voice/mediaDownload.service';

function getHelpMenuReply(): string {
    return `🤖 *PANDUAN PERINTAH BOT KEUANGAN* \n\n` +
            `Halo! Berikut adalah daftar perintah yang bisa Anda gunakan:\n\n` +
            `📜 *1. Riwayat Transaksi*\n` +
            `• "Riwayat transaksi"\n\n` +
            `🗑️ *2. Hapus Transaksi (Berdasarkan Nomor/Terakhir)*\n` +
            `• "Hapus 2" (Menghapus transaksi nomor 2)\n` +
            `• "Hapus transaksi terakhir"\n\n` +
            `✏️ *3. Edit Transaksi (Berdasarkan Nomor)*\n` +
            `• "Edit 1 150rb" (Ubah nominal transaksi no 1)\n` +
            `• "Edit 1 Jual Buket Spesial" (Ubah deskripsi)\n\n` +
            `📅 *4. Laporan & Rekap*\n` +
            `• "Laporan hari ini" | "Rekap mingguan"\n\n` +
            `💰 *5. Cek Saldo & Catat Transaksi*\n` +
            `• "Uang saya sisa berapa?"\n` +
            `• "Pemasukan jual buket 100rb"`;
}

export const messageHandlerService = {
  async handleIncomingMessage(
    senderNumber: string, 
    messageText: string, 
    pushName: string = 'Pengguna',
    now: Date = new Date()
  ): Promise<string | null> {
    try {
      const cleanPhone = normalizePhoneNumber(senderNumber);
      const onboardingResult = await onboardingService.getOrCreateUserAndBusiness(cleanPhone, pushName);
      const user = onboardingResult.user;
      
      const businessId = (onboardingResult as any).business?.id || (user as any).businessId;

      const expiryCheck = await stateExpiryHandlerService.checkAndCleanupExpiredState(user.id, now);

      const pending = await pendingTransactionManager.getPendingTransaction(user.id, now);
      if (pending) {
        const confirmationResult = await confirmationHandlerService.handleConfirmationResponse(
          user.id,
          messageText,
          pending.draft
        );
        return confirmationResult.replyMessage;
      }

      if (expiryCheck.wasExpired && parseConfirmationIntent(messageText) !== 'UNKNOWN') {
        return expiryCheck.notificationMessage!;
      }

      const lowerMessage = messageText.toLowerCase().trim();

      // ==========================================
      // 0. DETEKSI BANTUAN / MENU
      // ==========================================
      if (
        lowerMessage === 'bantuan' || 
        lowerMessage === 'menu' || 
        lowerMessage === 'help' || 
        lowerMessage === 'panduan'
      ) {
        const helpText = getHelpMenuReply();
        return expiryCheck.wasExpired ? `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${helpText}` : helpText;
      }

      // ==========================================
      // 0.5. DETEKSI RIWAYAT TRANSAKSI (TRX-004)
      // ==========================================
      const hasHistoryKeyword = /\b(riwayat|daftar|history|catatan|log)\b/i.test(lowerMessage);
      const hasTransactionKeyword = /\b(transaksi|pemasukan|pengeluaran|uang|kas)\b/i.test(lowerMessage);

      if (
        (hasHistoryKeyword && hasTransactionKeyword) || 
        lowerMessage === 'riwayat' || 
        lowerMessage === 'history' || 
        lowerMessage === 'daftar transaksi'
      ) {
        const historyText = await getTransactionHistory(businessId, 10);
        return expiryCheck.wasExpired ? `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${historyText}` : historyText;
      }

      // ==========================================
      // 0.6. DETEKSI PERINTAH HAPUS / BATAL (TRX-006 & INDEX)
      // ==========================================
      const deleteWithNumberMatch = lowerMessage.match(/^(?:hapus|batal|delete|undo|cancel)\s+(\d+)$/i);
      if (deleteWithNumberMatch) {
        const itemNumber = parseInt(deleteWithNumberMatch[1]);
        const result = await deleteTransactionByIndex(businessId, itemNumber);
        return expiryCheck.wasExpired ? `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${result.message}` : result.message;
      }

      const hasCancelKeyword = /\b(batalkan|batal|hapus|delete|undo|cancel)\b/i.test(lowerMessage);
      const hasTxKeyword = /\b(transaksi|terakhir|data|pemasukan|pengeluaran)\b/i.test(lowerMessage);

      if (
        (hasCancelKeyword && hasTxKeyword) || 
        lowerMessage === 'batal' || 
        lowerMessage === 'hapus transaksi' || 
        lowerMessage === 'batalkan transaksi' ||
        lowerMessage === 'hapus'
      ) {
        const deleteResult = await deleteLatestTransaction(businessId);
        return expiryCheck.wasExpired ? `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${deleteResult.message}` : deleteResult.message;
      }

      // ==========================================
      // 0.7. DETEKSI PERINTAH EDIT BERDASARKAN NOMOR (TRX-007)
      // ==========================================
      const editMatch = messageText.match(/^edit\s+(\d+)\s+(.+)$/i);
      if (editMatch) {
        const itemNumber = parseInt(editMatch[1]);
        const newContent = editMatch[2].trim();
        const lowerNewContent = newContent.toLowerCase();

        let updatePayload: { amount?: number; description?: string } = {};

        const amountMatch = lowerNewContent.match(/^(\d+[\d\.,]*(?:rb|k|jt|juta)?)$/i);

        if (amountMatch) {
          let rawAmount = amountMatch[1].toLowerCase();
          let multiplier = 1;
          if (rawAmount.includes('rb') || rawAmount.includes('k')) {
            multiplier = 1000;
            rawAmount = rawAmount.replace(/rb|k/g, '');
          } else if (rawAmount.includes('jt') || rawAmount.includes('juta')) {
            multiplier = 1000000;
            rawAmount = rawAmount.replace(/jt|juta/g, '');
          }
          const cleanNum = parseFloat(rawAmount.replace(/\./g, '').replace(',', '.'));
          if (!isNaN(cleanNum)) {
            updatePayload.amount = cleanNum * multiplier;
          }
        } else {
          updatePayload.description = newContent;
        }

        const updateResult = await updateTransactionByIndex(businessId, itemNumber, updatePayload);
        return expiryCheck.wasExpired ? `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${updateResult.message}` : updateResult.message;
      }

      // ==========================================
      // 1. PARSER LAPORAN FLEKSIBEL & BOLAK-BALIK (LOKAL)
      // ==========================================
      const hasMinggu = /\b(minggu|mingguan|7_hari|sepekan)\b/i.test(lowerMessage);
      const hasReportKeyword = /\b(rekap|laporan|cek|lihat|tampilkan|minta|tolong|data|omzet)\b/i.test(lowerMessage);
      
      if (hasMinggu && (hasReportKeyword || lowerMessage === 'mingguan')) {
        const weeklyReportText = await generateWeeklyReport(businessId);
        return expiryCheck.wasExpired ? `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${weeklyReportText}` : weeklyReportText;
      }

      const monthMap: { [key: string]: number } = {
        'januari': 0, 'februari': 1, 'maret': 2, 'april': 3,
        'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7,
        'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5,
        'jul': 6, 'agu': 7, 'aug': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11, 'dec': 11
      };

      let foundMonthIndex = -1;
      for (const [monthName, index] of Object.entries(monthMap)) {
        const regex = new RegExp(`\\b${monthName}\\b`, 'i');
        if (regex.test(lowerMessage)) {
          foundMonthIndex = index;
          break;
        }
      }

      if (foundMonthIndex !== -1 && (hasReportKeyword || /\b(bulan|pengeluaran|pemasukan|omzet)\b/i.test(lowerMessage))) {
        const currentYear = now.getFullYear();
        const monthlyReportText = await generateMonthlyReportByMonthIndex(businessId, foundMonthIndex, currentYear);
        return expiryCheck.wasExpired ? `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${monthlyReportText}` : monthlyReportText;
      }

      const hasBulanIni = /\b(bulan\s*ini|bulanan)\b/i.test(lowerMessage);
      if (hasBulanIni && hasReportKeyword) {
        const monthlyReportText = await generateMonthlyReport(businessId);
        return expiryCheck.wasExpired ? `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${monthlyReportText}` : monthlyReportText;
      }

      const hasHariIni = /\b(hari\s*ini|harian|sekarang)\b/i.test(lowerMessage);
      if ((hasHariIni && hasReportKeyword) || lowerMessage === 'rekap' || lowerMessage === 'total' || lowerMessage === 'harian') {
        const dailyReportText = await generateDailyReport(businessId, now);
        return expiryCheck.wasExpired ? `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${dailyReportText}` : dailyReportText;
      }

      const hasSaldoOrUang = /\b(sisa|saldo|uang|dompet|kas)\b/i.test(lowerMessage);
      const hasTanyaBerapa = /\b(berapa|sisa|ada)\b/i.test(lowerMessage);
      if (hasSaldoOrUang && hasTanyaBerapa) {
        const balanceText = await getRemainingBalance(businessId);
        return expiryCheck.wasExpired ? `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${balanceText}` : balanceText;
      }

      if (lowerMessage.startsWith('laporan ') || lowerMessage.startsWith('rekap ')) {
        const queryPart = lowerMessage.replace('laporan ', '').replace('rekap ', '').trim();
        const parsedDate = new Date(queryPart);
        
        if (!isNaN(parsedDate.getTime())) {
          const customReportText = await generateDailyReport(businessId, parsedDate);
          return expiryCheck.wasExpired ? `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${customReportText}` : customReportText;
        }
      }

      // ==========================================
      // LANJUT KE PARSER TRANSAKSI BIASA
      // ==========================================
      const parsedItems = await parseMultiTransactions(messageText);
      const validation = validateMultiTransactions(messageText, parsedItems);

      if (!validation.isValid) {
        const helpHint = `\n\n_Ketik *menu* atau *bantuan* untuk melihat daftar panduan perintah._`;
        const fullReply = validation.replyMessage + helpHint;

        if (expiryCheck.wasExpired) {
          return `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${fullReply}`;
        }
        return fullReply;
      }

      const items = validation.data!;
      let confirmPrompt = '';

      if (items.length > 1) {
        const payloadList: PendingTransactionPayload[] = items.map((tx) => ({
          type: tx.type,
          amount: tx.amount!,
          category: tx.category,
          description: tx.description,
          transactionDate: tx.transactionDate,
        }));

        await pendingTransactionManager.saveBatchPendingTransactions(user.id, payloadList);
        confirmPrompt = formatBatchConfirmationPrompt(payloadList);
      } else {
        const tx = items[0];
        const payload: PendingTransactionPayload = {
          type: tx.type,
          amount: tx.amount!,
          category: tx.category,
          description: tx.description,
          transactionDate: tx.transactionDate,
        };

        await pendingTransactionManager.savePendingTransaction(user.id, payload);

        const formattedAmount = `Rp ${tx.amount!.toLocaleString('id-ID')}`;
        confirmPrompt = 
          `📋 *Konfirmasi Transaksi*\n` +
          `• Tipe: ${tx.type === 'INCOME' ? 'Pemasukan (INCOME)' : 'Pengeluaran (EXPENSE)'}\n` +
          `• Kategori: ${tx.category}\n` +
          `• Deskripsi: ${tx.description}\n` +
          `• Nominal: ${formattedAmount}\n` +
          `• Tanggal: ${tx.transactionDate}\n\n` +
          `Ketik *YA* untuk menyimpan transaksi atau *BATAL* untuk membatalkan.`;
      }

      if (expiryCheck.wasExpired) {
        return `${expiryCheck.notificationMessage}\n\n----------------------------------------\n\n${confirmPrompt}`;
      }

      return confirmPrompt;
    } catch (error) {
      console.error('[messageHandlerService] Error processing incoming message:', error);
      return 'Maaf, terjadi kesalahan saat memproses transaksi Anda.';
    }
  }
};

/**
 * Fungsi wrapper agar webhookProcessor.service.ts bisa mengimpor handleIncomingMessage secara langsung
 */
export async function handleIncomingMessage(msg: any): Promise<string | null> {
  // DEBUGGING: Cek struktur asli pesan yang masuk
  console.log('[DEBUG] Struktur msg masuk:', JSON.stringify(msg, null, 2));

  // Deteksi apakah pesan berupa audio / ptt (voice note)
  const messageContent = msg.message || msg.rawMessage?.message;
  
  if (messageContent?.audioMessage || messageContent?.pttMessage) {
    try {
      const targetMsg = msg.rawMessage || msg;
      const audioPath = await downloadAudioFromBaileys(targetMsg);
      
      console.log('[handleIncomingMessage] Voice note berhasil diunduh ke:', audioPath);
      return '🎙️ Pesan suara diterima dan sedang diproses...';
    } catch (err) {
      console.error('[handleIncomingMessage] Gagal mengunduh voice note:', err);
      return 'Maaf, gagal mengunduh file suara Anda.';
    }
  }

  const senderNumber = msg.from;
  const messageText = msg.textBody || '';
  const pushName = msg.name || 'Pengguna';
  
  return await messageHandlerService.handleIncomingMessage(senderNumber, messageText, pushName);
}