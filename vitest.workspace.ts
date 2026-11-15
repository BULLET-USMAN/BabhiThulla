import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'shared',
      root: 'packages/shared',
      globals: true,
      environment: 'node',
      include: ['src/**/*.{test,spec}.ts'],
    },
  },
  {
    test: {
      name: 'server',
      root: 'apps/server',
      globals: true,
      environment: 'node',
      include: ['src/**/*.{test,spec}.ts'],
    },
  },
  {
    test: {
      name: 'web',
      root: 'apps/web',
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  },
]);
