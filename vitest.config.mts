import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    hookTimeout: 20000,
    testTimeout: 10000,
    // Test files share one real Postgres database, so they must not run
    // concurrently — otherwise one file's TRUNCATE races another's inserts.
    fileParallelism: false,
    globalSetup: ['./tests/global-setup.ts'],
  },
});
