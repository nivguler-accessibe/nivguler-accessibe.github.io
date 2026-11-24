import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  outputDir: 'test-results',
  globalTeardown: require.resolve('@acsbe/accessflow-sdk/dist/src/playwright/global-teardown'),
});
