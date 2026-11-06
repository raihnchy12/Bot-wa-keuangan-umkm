/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Tambahkan baris ini agar Jest mentransformasi Baileys yang berbasis ESM
  transformIgnorePatterns: [
    'node_modules/(?!(@whiskeysockets/baileys)/)'
  ],
};