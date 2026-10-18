import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['packages/promptkit/tests/**/*.test.{ts,tsx}'], testTimeout: 15000 } });
