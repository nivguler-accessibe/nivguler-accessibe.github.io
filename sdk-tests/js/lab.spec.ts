import { test } from '@playwright/test';
import AccessFlowSDK from '@acsbe/accessflow-sdk';
test('lab', async ({ page }) => {
  await page.goto('https://nivguler-accessibe.github.io/');
  const sdk = new AccessFlowSDK(page);
  await sdk.generateReport(await sdk.audit(), 'json');
});
