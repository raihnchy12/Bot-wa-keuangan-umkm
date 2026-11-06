import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateDailyReport(businessId: string, targetDate: Date = new Date()): Promise<string> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
        where: {
            businessId,
            transactionDate: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const transactionLines = transactions.map((tx, index) => {
        const amountNum = tx.amount.toNumber();

        if (tx.type === 'INCOME') {
            totalIncome += amountNum;
        } else {
            totalExpense += amountNum;
        }

        const typeLabel = tx.type === 'INCOME' ? 'PEMASUKAN' : 'PENGELUARAN';
        const formattedAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amountNum);

        return `${index + 1}. *[${typeLabel}]* ${tx.description}\n${formattedAmount} _(${tx.category})_`;
    });

    const netCashFlow = totalIncome - totalExpense;
    const formattedDate = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(targetDate);

    const formattedIncome = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIncome);
    const formattedExpense = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalExpense);
    const formattedNet = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(netCashFlow);

    if (transactions.length === 0) {
        return `📊 *LAPORAN KEUANGAN HARIAN*\n📅 Tanggal: ${formattedDate}\n\n_Belum ada transaksi yang tercatat pada tanggal ini._`;
    }

    return `📊 *LAPORAN KEUANGAN HARIAN*\n📅 Tanggal: ${formattedDate}\n\n` +
            `${transactionLines.join('\n')}\n\n` +
            `──────────────────\n` +
            `📈 *Total Pemasukan:* ${formattedIncome}\n` +
            `📉 *Total Pengeluaran:* ${formattedExpense}\n` +
            `💰 *Sisa Uang:* ${formattedNet}\n\n` +
            `_Tetap semangat mengelola keuangan usaha Anda!_`;
}

export async function generateWeeklyReport(businessId: string): Promise<string> {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
        where: {
            businessId,
            transactionDate: {
                gte: sevenDaysAgo,
                lte: now,
            },
        },
        orderBy: { transactionDate: 'asc' },
    });

    if (transactions.length === 0) {
        return `📊 *REKAP KEUANGAN MINGGUAN*\n📅 Periode: 7 Hari Terakhir\n\n_Belum ada transaksi yang tercatat dalam seminggu terakhir._`;
    }

    let grandTotalIncome = 0;
    let grandTotalExpense = 0;
    let transactionLines: string[] = [];

    for (const [index, tx] of transactions.entries()) {
        const amountNum = tx.amount.toNumber();
        const fmtAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amountNum);
        const typeLabel = tx.type === 'INCOME' ? '🟢 PEMASUKAN' : '🔴 PENGELUARAN';
        const dateStr = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(tx.transactionDate));

        if (tx.type === 'INCOME') {
            grandTotalIncome += amountNum;
        } else {
            grandTotalExpense += amountNum;
        }

        transactionLines.push(
            `${index + 1}. *[${typeLabel}]* (${dateStr})\n` +
            `   • ${tx.description} — *${fmtAmount}* _(${tx.category || 'Umum'})_`
        );
    }

    const netBalance = grandTotalIncome - grandTotalExpense;
    const fmtGrandIncome = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(grandTotalIncome);
    const fmtGrandExpense = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(grandTotalExpense);
    const fmtNetBalance = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(netBalance);

    return `📊 *REKAP KEUANGAN MINGGUAN*\n` +
           `📅 Periode: 7 Hari Terakhir\n\n` +
           `📝 *Daftar Transaksi:*\n` +
           `${transactionLines.join('\n\n')}\n\n` +
           `──────────────────\n` +
           `📈 *Total Pemasukan:* ${fmtGrandIncome}\n` +
           `📉 *Total Pengeluaran:* ${fmtGrandExpense}\n` +
           `💰 *Net Saldo Minggu Ini:* ${fmtNetBalance}\n\n` +
           `_Terus semangat kembangkan usaha Anda!_`;
}

export async function getRemainingBalance(businessId: string): Promise<string> {
    const transactions = await prisma.transaction.findMany({
        where: { businessId },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    for (const tx of transactions) {
        const amountNum = tx.amount.toNumber();
        if (tx.type === 'INCOME') {
            totalIncome += amountNum;
        } else {
            totalExpense += amountNum;
        }
    }

    const remainingBalance = totalIncome - totalExpense;
    const formattedBalance = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(remainingBalance);

    return `sisa uang ada *${formattedBalance}*`;
}

export async function generateMonthlyReport(businessId: string): Promise<string> {
    const now = new Date();
    return generateMonthlyReportByMonthIndex(businessId, now.getMonth(), now.getFullYear());
}

export async function generateMonthlyReportByMonthIndex(businessId: string, monthIndex: number, year: number): Promise<string> {
    const startOfMonth = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
        where: {
            businessId,
            transactionDate: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
        },
        orderBy: { transactionDate: 'asc' },
    });

    const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(startOfMonth);

    if (transactions.length === 0) {
        return `📊 *LAPORAN KEUANGAN BULANAN*\n📅 Periode: ${monthName}\n\n_Belum ada transaksi yang tercatat pada periode ini._`;
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeLines: string[] = [];
    let expenseLines: string[] = [];

    for (const tx of transactions) {
        const amountNum = tx.amount.toNumber();
        const fmtAmount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amountNum);
        const dateStr = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(tx.transactionDate));

        if (tx.type === 'INCOME') {
            totalIncome += amountNum;
            incomeLines.push(`• (${dateStr}) ${tx.description}: *${fmtAmount}* _(${tx.category || 'Umum'})_`);
        } else {
            totalExpense += amountNum;
            expenseLines.push(`• (${dateStr}) ${tx.description}: *${fmtAmount}* _(${tx.category || 'Lain-lain'})_`);
        }
    }

    const netProfitLoss = totalIncome - totalExpense;

    const fmtIncome = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalIncome);
    const fmtExpense = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalExpense);
    const fmtNet = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(netProfitLoss);

    let incomeSection = '';
    if (incomeLines.length > 0) {
        incomeSection = `🟢 *Sumber Pemasukan:*\n${incomeLines.join('\n')}\n`;
    }

    let expenseSection = '';
    if (expenseLines.length > 0) {
        expenseSection = `🔴 *Rincian Pengeluaran:*\n${expenseLines.join('\n')}\n`;
    }

    const statusLabel = netProfitLoss >= 0 ? '🟢 *Laba Bersih:*' : '🔴 *Rugi Bersih:*';

    return `📊 *LAPORAN KEUANGAN BULANAN*\n` +
           `📅 Periode: ${monthName}\n\n` +
           `${incomeSection}\n` +
           `${expenseSection}\n` +
           `──────────────────\n` +
           `📈 *Total Pemasukan:* ${fmtIncome}\n` +
           `📉 *Total Pengeluaran:* ${fmtExpense}\n` +
           `──────────────────\n` +
           `${statusLabel} ${fmtNet}\n\n` +
           `_Laporan dihitung otomatis untuk bulan ${monthName}._`;
}