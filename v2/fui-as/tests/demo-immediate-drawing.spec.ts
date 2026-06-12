import { test, expect } from '@playwright/test';
import * as demo from './demo-test-support';

test('immediate-drawing demo page loads and renders a gauge', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/immediate-drawing/`);

  // Wait for the ready flag
  await page.waitForFunction(
    () => (window as unknown as Record<string, unknown>).__fuiAsReady === true,
    { timeout: 5000 },
  );

  // Wait for at least one frame to render
  await page.waitForTimeout(500);

  // Sample the canvas to verify the gauge rendered (non-blank)
  const sample = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const ctx = (canvas as HTMLCanvasElement).getContext('2d');
    if (!ctx) return null;

    // Sample a 10x10 region near the center where the gauge should be
    // The gauge draws at (24 + 5, 24 + 5) through (24+215, 24+215) approx
    const cx = 135; // approximate center x (24 + 110)
    const cy = 135; // approximate center y
    const data = ctx.getImageData(cx - 5, cy - 5, 10, 10);
    let nonZeroCount = 0;
    for (let i = 3; i < data.data.length; i += 4) {
      if (data.data[i] > 0) nonZeroCount++;
    }
    return { width: canvas.width, height: canvas.height, nonZeroPixels: nonZeroCount };
  });

  expect(sample).not.toBeNull();
  expect(sample!.width).toBeGreaterThan(0);
  expect(sample!.height).toBeGreaterThan(0);
  // At least some pixels should be non-transparent in the gauge area
  expect(sample!.nonZeroPixels).toBeGreaterThan(0);
});

test('immediate-drawing demo has no runtime errors', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/immediate-drawing/`);

  await page.waitForFunction(
    () => (window as unknown as Record<string, unknown>).__fuiAsReady === true,
    { timeout: 5000 },
  );

  const error = await page.evaluate(() => (window as unknown as Record<string, unknown>).__fuiAsError);
  expect(error).toBeUndefined();
});
