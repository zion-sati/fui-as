import { expect, test } from '@playwright/test';

import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

test('advanced controls project semantic control tags in the DevTools DOM mirror', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await demo.waitForDemoReady(page);

  await expect(page.locator('#effindom-devtools-debug-dialog')).toHaveCount(0);
  await page.keyboard.press('Meta+Shift+F12');
  await expect(page.locator('#effindom-devtools-debug-dialog')).toHaveCount(1);
  await expect(page.locator('#effindom-devtools-debug-dialog [data-fui-devtools-dialog-mirror-status="true"]')).toHaveText('Mirror off');

  await page.locator('#effindom-devtools-debug-dialog [data-fui-devtools-dialog-mirror-row="true"]').click();
  await expect(page.locator('#effindom-devtools-debug-dialog [data-fui-devtools-dialog-mirror-status="true"]')).toHaveText('Mirror on');

  await expect(page.locator('#effindom-devtools-dom-mirror')).toHaveCount(1);
  await expect(page.locator('#effindom-devtools-dom-mirror fui-button').first()).toHaveCount(1);
  await expect(page.locator('#effindom-devtools-dom-mirror fui-checkbox').first()).toHaveCount(1);
  await expect(page.locator('#effindom-devtools-dom-mirror fui-radio-group').first()).toHaveCount(1);
  await expect(page.locator('#effindom-devtools-dom-mirror fui-combo-box').first()).toHaveCount(1);

  const controlSummary = await page.evaluate(() => {
    const mirror = document.getElementById('effindom-devtools-dom-mirror');
    if (mirror === null) {
      return [];
    }
    return Array.from(mirror.querySelectorAll<HTMLElement>('[data-fui-semantic-role-name]'))
      .map((element) => ({
        tag: element.localName,
        type: element.getAttribute('data-fui-type'),
        renderType: element.getAttribute('data-fui-render-node-type'),
        role: element.getAttribute('data-fui-semantic-role-name'),
        label: element.getAttribute('data-fui-semantic-label'),
      }));
  });

  expect(controlSummary).toEqual(expect.arrayContaining([
    expect.objectContaining({ tag: 'fui-button', type: 'button', renderType: 'flex-box', role: 'button' }),
    expect.objectContaining({ tag: 'fui-checkbox', type: 'checkbox', renderType: 'flex-box', role: 'checkbox' }),
    expect.objectContaining({ tag: 'fui-radio-group', type: 'radio-group', renderType: 'flex-box', role: 'radio-group' }),
    expect.objectContaining({ tag: 'fui-combo-box', type: 'combo-box', renderType: 'flex-box', role: 'combo-box' }),
  ]));
});
