import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/headers': path.resolve(__dirname, './tests/__mocks__/next-headers.ts'),
    },
  },
});
