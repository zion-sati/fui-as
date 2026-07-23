import { expect,test } from '@playwright/test';

import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

test('demo loading overlay hides after startup', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);

  await expect(page.locator('#effindom-loading-overlay')).toBeHidden();
});

test('demo loading overlay tracks built-in font replay during a hot route load', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);

  let releaseFonts: (() => void) | undefined;
  const fontsBlocked = new Promise<void>((resolve) => {
    releaseFonts = resolve;
  });
  await page.route('**/runtime/fonts/*.ttf', async (route) => {
    await fontsBlocked;
    await route.continue();
  });

  await page.evaluate(() => {
    void window.__fui_debug?.navigateTo('/v2/fui-as/demo/advanced-controls/');
  });

  await expect(page.locator('#effindom-loading-overlay')).toBeVisible();
  await expect(page.locator('#effindom-loading-detail')).toHaveText('Built-in fonts 0 / 6');

  releaseFonts?.();
  await demo.waitForDemoReady(page);
  await expect(page).toHaveURL(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await expect(page.locator('#effindom-loading-overlay')).toBeHidden();
});

test('demo loading overlay does not wait for app-authored route fonts', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);

  let releaseFonts: (() => void) | undefined;
  const fontsBlocked = new Promise<void>((resolve) => {
    releaseFonts = resolve;
  });
  await page.route('**/v2/fonts/*.ttf', async (route) => {
    await fontsBlocked;
    await route.continue();
  });

  await page.evaluate(() => {
    void window.__fui_debug?.navigateTo('/v2/fui-as/demo/advanced-controls/');
  });

  await demo.waitForDemoReady(page);
  await expect(page).toHaveURL(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await expect(page.locator('#effindom-loading-overlay')).toBeHidden();
  await expect(page.locator('#effindom-loading-detail')).not.toContainText('Fonts ');
  releaseFonts?.();
});

test('demo loading overlay surfaces popstate route load failures', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);

  await page.route('**/advanced-controls.wasm*', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'application/wasm',
      body: '',
    });
  });

  await page.evaluate(() => {
    const target = new URL('/v2/fui-as/demo/advanced-controls/', window.location.origin);
    const state: { href: string } = { href: target.href };
    window.history.pushState(state, '', target.href);
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  });
  await expect(page).toHaveURL(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);

  await expect.poll(async () => {
    return await page.evaluate(() => window.__fuiError ?? null);
  }).toContain('Failed to load wasm app: /v2/fui-as/demo/advanced-controls.wasm');

  await expect(page.locator('#effindom-loading-overlay')).toBeVisible();
  await expect(page.locator('#effindom-loading-overlay')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#effindom-loading-title')).toHaveText('Loading application');
  await expect(page.locator('#effindom-loading-detail')).toContainText('Failed to load history route /v2/fui-as/demo/advanced-controls/');
  await expect(page.locator('#effindom-loading-detail')).toContainText('/v2/fui-as/demo/advanced-controls/');
  await expect(page.locator('#effindom-loading-detail')).toContainText('advanced-controls.wasm');
});

test('demo dashboard NavLink routes to the advanced controls playground inside the demo shell', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await demo.scrollSemanticLabelIntoView(page, 'Advanced controls');

  await demo.clickSemanticLabel(page, 'Advanced controls');
  await demo.waitForDemoReady(page);

  await expect(page).toHaveURL(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Ping advanced controls');
  }).not.toBeNull();
});

test('demo dashboard NavLink routes to the templated controls playground inside the demo shell', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);
  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'Templated controls');
  }).not.toBeNull();
  await demo.scrollSemanticLabelIntoView(page, 'Templated controls');

  await demo.clickSemanticLabel(page, 'Templated controls');
  await demo.waitForDemoReady(page, 10000);

  await expect(page).toHaveURL(`${demo.baseUrl}/v2/fui-as/demo/templated-controls/`);
  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'House style notifications');
  }).not.toBeNull();
});

test('demo templated controls route boots and keeps templated interactions inside the demo shell', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/templated-controls/`);
  await demo.waitForDemoReady(page, 10000);
  await expect(page).toHaveURL(`${demo.baseUrl}/v2/fui-as/demo/templated-controls/`);
  await expect.poll(async () => {
    return await demo.findSemanticBounds(page, 'House style notifications');
  }).not.toBeNull();

  await demo.scrollSemanticLabelIntoView(page, 'House style notifications');
  await expect.poll(async () => await demo.readSemanticNode(page, 'House style notifications')).toMatchObject({
    roleName: 'checkbox',
    state: { checked: 'false' },
  });

  await demo.clickSemanticLabel(page, 'House style notifications');
  await expect.poll(async () => await demo.readSemanticNode(page, 'House style notifications')).toMatchObject({
    roleName: 'checkbox',
    state: { checked: 'true' },
  });

  await demo.scrollSemanticLabelIntoView(page, 'Accent field');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Accent field')).toMatchObject({
    roleName: 'combobox',
  });
  await demo.clickSemanticLabel(page, 'Accent field');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Minimal field')).toMatchObject({
    roleName: 'listitem',
  });
  await demo.clickSemanticLabel(page, 'Minimal field');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Minimal field')).toMatchObject({
    roleName: 'combobox',
    state: { expanded: false },
  });
});

test('demo Back and Forward restore persisted scroll positions for the home and advanced routes', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);

  const canvasBox = await page.locator('#fui-canvas').boundingBox();
  expect(canvasBox).not.toBeNull();
  if (canvasBox === null) {
    throw new Error('Expected scene canvas bounds.');
  }

  const sidebarHeadingBounds = await demo.findSemanticBounds(page, 'Scrollable list');
  expect(sidebarHeadingBounds).not.toBeNull();
  if (sidebarHeadingBounds === null) {
    throw new Error('Expected scrollable list heading bounds.');
  }

  const initialFirstVisible = await demo.readTopVisibleListItemIndex(page);
  await page.mouse.click(
    canvasBox.x + sidebarHeadingBounds.x + Math.min(sidebarHeadingBounds.width * 0.5, 80),
    canvasBox.y + sidebarHeadingBounds.y + (sidebarHeadingBounds.height * 0.5),
  );
  await page.locator('#fui-canvas').focus();
  for (let index = 0; index < 5; ++index) {
    await page.keyboard.press('ArrowDown');
  }
  await expect.poll(async () => {
    return await demo.readTopVisibleListItemIndex(page);
  }).toBeGreaterThan(initialFirstVisible);
  const expectedFirstVisible = await demo.readTopVisibleListItemIndex(page);

  const homeTargetLabel = 'Nested scroll sandbox';
  const homeInitialBounds = await demo.findSemanticBounds(page, homeTargetLabel);
  if (homeInitialBounds !== null) {
    expect(homeInitialBounds.y + homeInitialBounds.height).toBeGreaterThan(canvasBox.height - 32);
  }

  await demo.scrollSemanticLabelIntoView(page, homeTargetLabel);
  await expect.poll(async () => {
    const bounds = await demo.findSemanticBounds(page, homeTargetLabel);
    return bounds !== null &&
      bounds.y >= 48 &&
      (bounds.y + bounds.height) <= (canvasBox.height - 32);
  }).toBe(true);

  await page.evaluate(async () => {
    await window.__fui_debug?.navigateTo('/v2/fui-as/demo/advanced-controls/');
  });
  await demo.waitForDemoReady(page);
  await expect(page).toHaveURL(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);

  const advancedTargetLabel = 'App-authored custom fonts';
  const advancedInitialBounds = await demo.findSemanticBounds(page, advancedTargetLabel);
  if (advancedInitialBounds !== null) {
    expect(advancedInitialBounds.y + advancedInitialBounds.height).toBeGreaterThan(canvasBox.height - 32);
  }

  await demo.scrollSemanticLabelIntoView(page, advancedTargetLabel);
  await expect.poll(async () => {
    const bounds = await demo.findSemanticBounds(page, advancedTargetLabel);
    return bounds !== null &&
      bounds.y >= 48 &&
      (bounds.y + bounds.height) <= (canvasBox.height - 32);
  }).toBe(true);

  await page.goBack();
  await demo.waitForDemoReady(page);
  await expect(page).toHaveURL(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await expect.poll(async () => {
    return await demo.readTopVisibleListItemIndex(page);
  }).toBe(expectedFirstVisible);
  await expect.poll(async () => {
    const bounds = await demo.findSemanticBounds(page, homeTargetLabel);
    return bounds !== null &&
      bounds.y >= 48 &&
      (bounds.y + bounds.height) <= (canvasBox.height - 32);
  }).toBe(true);

  await page.goForward();
  await demo.waitForDemoReady(page);
  await expect(page).toHaveURL(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await expect.poll(async () => {
    const bounds = await demo.findSemanticBounds(page, advancedTargetLabel);
    return bounds !== null &&
      bounds.y >= 48 &&
      (bounds.y + bounds.height) <= (canvasBox.height - 32);
  }).toBe(true);
});

test('demo Back and Forward restore persisted control state for the home and advanced routes', async ({ page }) => {
  const advancedTextAreaLabel = 'Type notes here or paste sample content. Use the controls below to reconfigure the TextArea live.';
  const advancedTextToken = ' Persisted advanced text';

  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Email updates');
  await demo.clickSemanticLabel(page, 'Email updates');
  await demo.clickSemanticLabel(page, 'Focus mode');
  await demo.scrollSemanticLabelIntoView(page, 'Immersive');
  await demo.clickSemanticLabel(page, 'Immersive');
  await demo.clickSliderThumb(page, 'Slider', 40, 0, 100);
  await page.keyboard.press('ArrowRight');
  await demo.scrollSemanticLabelIntoView(page, 'Balanced');
  await demo.clickSemanticLabel(page, 'Balanced');
  await expect.poll(async () => await demo.readSemanticNode(page, 'Quality first')).toMatchObject({
    roleName: 'listitem',
  });
  await demo.clickSemanticLabel(page, 'Quality first');
  await demo.scrollSemanticLabelIntoView(page, 'Type here');
  await demo.clickSemanticLabel(page, 'Type here');
  await page.keyboard.type('Persisted home input');
  await expect.poll(async () => (await demo.readHiddenTextEditorState(page))?.value ?? null).toBe('Persisted home input');

  await page.evaluate(async () => {
    await window.__fui_debug?.navigateTo('/v2/fui-as/demo/advanced-controls/');
  });
  await demo.waitForDemoReady(page);

  await demo.scrollSemanticLabelIntoView(page, 'Read-only');
  await demo.clickSemanticLabel(page, advancedTextAreaLabel);
  await page.keyboard.type(advancedTextToken);
  await expect.poll(async () => ((await demo.readHiddenTextEditorState(page))?.value ?? '')).toContain(advancedTextToken);
  await demo.scrollSemanticLabelIntoView(page, 'Line height: Fixed 28 px');
  await demo.clickSemanticLabel(page, 'Line height: Fixed 28 px');
  await demo.clickSemanticLabel(page, 'Read-only');

  await page.goBack();
  await demo.waitForDemoReady(page);
  await expect(page).toHaveURL(`${demo.baseUrl}/v2/fui-as/demo/index.html`);
  await expect.poll(async () => await demo.readSemanticNode(page, 'Email updates')).toMatchObject({
    roleName: 'checkbox',
    state: { checked: 'true' },
  });
  await expect.poll(async () => await demo.readSemanticNode(page, 'Focus mode')).toMatchObject({
    roleName: 'switch',
    state: { checked: 'false' },
  });
  await expect.poll(async () => await demo.readSemanticNode(page, 'Immersive')).toMatchObject({
    roleName: 'radio',
    state: { checked: 'true' },
  });
  await expect.poll(async () => await demo.readSemanticNode(page, 'Slider')).toMatchObject({
    roleName: 'slider',
    state: { valueNow: 45 },
  });
  await demo.scrollSemanticLabelIntoView(page, 'Dropdown: Quality first');
  await demo.scrollSemanticLabelIntoView(page, 'Type here');
  await demo.clickSemanticLabel(page, 'Type here');
  await expect.poll(async () => (await demo.readHiddenTextEditorState(page))?.value ?? null).toBe('Persisted home input');

  await page.goForward();
  await demo.waitForDemoReady(page);
  await expect(page).toHaveURL(`${demo.baseUrl}/v2/fui-as/demo/advanced-controls/`);
  await expect.poll(async () => await demo.readSemanticNode(page, 'Read-only')).toMatchObject({
    roleName: 'checkbox',
    state: { checked: 'true' },
  });
  await expect.poll(async () => await demo.readSemanticNode(page, 'Line height: Fixed 28 px')).toMatchObject({
    roleName: 'radio',
    state: { checked: 'true' },
  });
  await demo.scrollSemanticLabelIntoView(page, 'Read-only');
  await demo.clickSemanticLabel(page, advancedTextAreaLabel);
  await expect.poll(async () => ((await demo.readHiddenTextEditorState(page))?.value ?? '')).toContain(advancedTextToken);
});
