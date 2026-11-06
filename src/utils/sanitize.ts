export function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';

    // Menghapus karakter kontrol tersembunyi namun tetap mempertahankan teks normal dan spasi/newline
    return input
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
        .trim();
}