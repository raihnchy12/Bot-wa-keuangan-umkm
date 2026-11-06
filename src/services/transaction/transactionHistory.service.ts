import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTransactionHistory(businessId: string, limit: number = 10): Promise<string> {
    const transactions = await prisma.transaction.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' }, // Transaksi yang baru di-input selalu di urutan teratas
        take: limit,
    });

    if (transactions.length === 0) {
        return `📜 *RIWAYAT TRANSAKSI*\n\n_Belum ada riwayat transaksi yang tercatat untuk bisnis Anda._`;
    }

    let historyLines = transactions.map((tx, index) => {
        const amountNum = tx.amount.toNumber();
        const formattedAmount = new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR', 
            maximumFractionDigits: 0 
        }).format(amountNum);

        const typeLabel = tx.type === 'INCOME' ? '🟢 [PEMASUKAN]' : '🔴 [PENGELUARAN]';
        const dateStr = new Intl.DateTimeFormat('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        }).format(new Date(tx.transactionDate));

        return `${index + 1}. *${typeLabel}* — ${dateStr}\n` +
               `   • *${tx.description}*\n` +
               `   • Nominal: ${formattedAmount}\n` +
               `   • Kategori: ${tx.category || 'Umum'}`;
    });

    return `📜 *RIWAYAT TRANSAKSI TERAKHIR*\n` +
           `_Menampilkan ${transactions.length} transaksi terakhir_\n\n` +
           `${historyLines.join('\n\n')}\n\n` +
           `──────────────────\n` +
           `💡 *Cara Ubah / Hapus:*\n` +
           `• *hapus 2* (Hapus transaksi no 2)\n` +
           `• *edit 1 25rb* (Ubah nominal no 1)\n` +
           `• *edit 1 Beli makan* (Ubah nama/deskripsi no 1)\n\n` +
           `_Ketik 'menu' untuk bantuan lainnya._`;
}

// ==========================================
// GET LATEST TRANSACTION (TRX-005)
// ==========================================
export async function getLatestTransaction(businessId: string) {
    const latestTransaction = await prisma.transaction.findFirst({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
    });

    return latestTransaction;
}

// ==========================================
// DELETE LATEST TRANSACTION (TRX-006)
// ==========================================
export async function deleteLatestTransaction(businessId: string) {
    const latestTx = await getLatestTransaction(businessId);

    if (!latestTx) {
        return {
            success: false,
            message: `⚠️ *BATALKAN TRANSAKSI*\n\nTidak ada riwayat transaksi yang ditemukan untuk dibatalkan.`
        };
    }

    await prisma.transaction.delete({
        where: { id: latestTx.id }
    });

    const amountNum = latestTx.amount.toNumber();
    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amountNum);
    const typeLabel = latestTx.type === 'INCOME' ? '🟢 [PEMASUKAN]' : '🔴 [PENGELUARAN]';

    return {
        success: true,
        message: `🗑️ *TRANSAKSI TERAKHIR BERHASIL DIHAPUS*\n\n` +
                 `• Tipe: ${typeLabel}\n` +
                 `• Deskripsi: *${latestTx.description}*\n` +
                 `• Nominal: ${formattedAmount}\n` +
                 `• Kategori: ${latestTx.category || 'Umum'}\n\n` +
                 `_Transaksi di atas telah dihapus dari sistem._`
    };
}

// ==========================================
// DELETE TRANSACTION BY NUMBER / INDEX
// ==========================================
export async function deleteTransactionByIndex(businessId: string, itemNumber: number) {
    const transactions = await prisma.transaction.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: itemNumber, // Ambil sebanyak nomor yang diminta agar indeks ke-(N-1) bisa diakses
    });

    if (transactions.length < itemNumber || itemNumber < 1) {
        return {
            success: false,
            message: `⚠️ *HAPUS GAGAL*\n\nTransaksi nomor *${itemNumber}* tidak ditemukan di daftar riwayat.`
        };
    }

    const targetTx = transactions[itemNumber - 1]; // Index array mulai dari 0

    await prisma.transaction.delete({
        where: { id: targetTx.id }
    });

    const amountNum = targetTx.amount.toNumber();
    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amountNum);
    const typeLabel = targetTx.type === 'INCOME' ? '🟢 [PEMASUKAN]' : '🔴 [PENGELUARAN]';

    return {
        success: true,
        message: `🗑️ *TRANSAKSI NOMOR ${itemNumber} BERHASIL DIHAPUS*\n\n` +
                 `• Tipe: ${typeLabel}\n` +
                 `• Deskripsi: *${targetTx.description}*\n` +
                 `• Nominal: ${formattedAmount}\n` +
                 `• Kategori: ${targetTx.category || 'Umum'}\n\n` +
                 `_Transaksi di atas telah dihapus dari sistem._`
    };
}

// ==========================================
// UPDATE TRANSACTION BY NUMBER / INDEX (TRX-007)
// ==========================================
export interface UpdateTransactionPayload {
    amount?: number;
    category?: string;
    description?: string;
    type?: 'INCOME' | 'EXPENSE';
}

export async function updateTransactionByIndex(businessId: string, itemNumber: number, updates: UpdateTransactionPayload) {
    const transactions = await prisma.transaction.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: itemNumber,
    });

    if (transactions.length < itemNumber || itemNumber < 1) {
        return {
            success: false,
            message: `⚠️ *EDIT GAGAL*\n\nTransaksi nomor *${itemNumber}* tidak ditemukan di daftar riwayat.`
        };
    }

    const targetTx = transactions[itemNumber - 1];

    const updatedTx = await prisma.transaction.update({
        where: { id: targetTx.id },
        data: {
            ...(updates.amount !== undefined && { amount: updates.amount }),
            ...(updates.category !== undefined && { category: updates.category }),
            ...(updates.description !== undefined && { description: updates.description }),
            ...(updates.type !== undefined && { type: updates.type }),
        }
    });

    const amountNum = updatedTx.amount.toNumber();
    const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amountNum);
    const typeLabel = updatedTx.type === 'INCOME' ? '🟢 [PEMASUKAN]' : '🔴 [PENGELUARAN]';
    const dateStr = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(updatedTx.transactionDate));

    return {
        success: true,
        message: `✏️ *TRANSAKSI NOMOR ${itemNumber} BERHASIL DIPERBARUI*\n\n` +
                 `• Tipe: ${typeLabel}\n` +
                 `• Deskripsi: *${updatedTx.description}*\n` +
                 `• Nominal: ${formattedAmount}\n` +
                 `• Kategori: ${updatedTx.category || 'Umum'}\n` +
                 `• Tanggal: ${dateStr}\n\n` +
                 `_Perubahan telah disimpan._`
    };
}