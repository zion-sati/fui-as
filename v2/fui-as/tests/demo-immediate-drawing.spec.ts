import { test, expect } from '@playwright/test';
import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

test('immediate-drawing demo page loads and renders a gauge', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/immediate-drawing/`);

  // Wait for the ready flag
  await page.waitForFunction(
    () => (window as unknown as Record<string, unknown>).__fuiReady === true,
    { timeout: 5000 },
  );

  // Wait for at least one frame to render
  await page.waitForTimeout(500);

  // Sample the canvas to verify the gauge rendered (non-blank)
  const sample = await demo.readSceneRegion(page, 125, 125, 20, 20);
  let nonZeroCount = 0;
  for (let i = 3; i < sample.pixels.length; i += 4) {
    if ((sample.pixels[i] ?? 0) > 0) {
      nonZeroCount += 1;
    }
  }

  expect(sample.width).toBeGreaterThan(0);
  expect(sample.height).toBeGreaterThan(0);
  // At least some pixels should be non-transparent in the gauge area
  expect(nonZeroCount).toBeGreaterThan(0);
});

test('immediate-drawing demo has no runtime errors', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/immediate-drawing/`);

  await page.waitForFunction(
    () => (window as unknown as Record<string, unknown>).__fuiReady === true,
    { timeout: 5000 },
  );

  const error = await page.evaluate(() => (window as unknown as Record<string, unknown>).__fuiError);
  expect(error).toBeUndefined();
});
