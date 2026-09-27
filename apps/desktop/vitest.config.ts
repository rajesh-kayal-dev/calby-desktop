import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/**', 'out/**', 'dist/**'],
    testTimeout: 20000,
    // SQLite files are per-project temp dirs; keep files isolated.
    isolate: true
  }
})
