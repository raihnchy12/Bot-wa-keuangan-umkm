# Tahap 1: Build aplikasi
FROM node:20-alpine AS builder

WORKDIR /app

# Salin manajemen dependensi
COPY package.json package-lock.json* ./ 

# Install seluruh dependencies (termasuk devDependencies untuk build)
RUN npm ci

# Salin seluruh source code
COPY . .

# Generate Prisma Client & Build TypeScript ke folder dist/
RUN npx prisma generate
RUN npm run build

# Tahap 2: Runtime produksi yang bersih & ringan
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Salin package dependencies produksi saja
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Salin hasil kompilasi (dist) dan skema database (prisma) dari tahap builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Port aplikasi berjalan (sesuaikan jika port utama berbeda)
EXPOSE 3000

# Perintah untuk menjalankan aplikasi di server produksi
CMD ["npm", "start"]