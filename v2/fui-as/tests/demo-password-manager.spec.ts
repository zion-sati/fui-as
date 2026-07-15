import { expect, test, type Page } from '@playwright/test';
import * as demo from './demo-test-support';

demo.registerDemoLifecycle(test);

declare global {
  interface Window {
    __openDemoDialog?(): void;
    __closeDemoDialog?(): void;
    __flushRenders?(): void;
    __effindomTestFocusedHandle?: string | null;
  }
}

interface HiddenEditorMetadataSnapshot {
  readonly tagName: string;
  readonly type: string | null;
  readonly autocomplete: string | null;
  readonly name: string | null;
  readonly id: string | null;
  readonly focused: boolean;
}

interface ProjectedFieldSnapshot {
  readonly handle: string;
  readonly tagName: string;
  readonly type: string | null;
  readonly autocomplete: string | null;
  readonly ariaLabel: string | null;
  readonly ariaReadonly: string | null;
  readonly ariaDisabled: string | null;
  readonly ariaMultiline: string | null;
  readonly dataRole: string | null;
  readonly dataHandle: string | null;
  readonly name: string | null;
  readonly id: string | null;
  readonly value: string;
}

async function readHiddenEditorMetadata(page: Page): Promise<HiddenEditorMetadataSnapshot | null> {
  return await page.evaluate(() => {
    const editor = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement
      ? (document.activeElement.dataset.effindomHiddenEditor === 'true' ? document.activeElement : null)
      : null;
    if (editor === null) {
      return null;
    }
    return {
      tagName: editor.tagName.toLowerCase(),
      type: editor instanceof HTMLInputElement ? editor.type : null,
      autocomplete: editor.getAttribute('autocomplete'),
      name: editor.getAttribute('name'),
      id: editor.getAttribute('id'),
      focused: document.activeElement === editor,
    };
  });
}

async function readSemanticLightDomFields(page: Page): Promise<Record<string, ProjectedFieldSnapshot>> {
  return await page.evaluate(() => {
    const result: Record<string, ProjectedFieldSnapshot> = {};
    const elements = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-effindom-semantic-light-dom-field="true"]'));
    for (const element of elements) {
      const handle = element.dataset.effindomHandle;
      if (handle === undefined) {
        continue;
      }
      result[handle] = {
        handle,
        tagName: element.tagName.toLowerCase(),
        type: element instanceof HTMLInputElement ? element.type : null,
        autocomplete: element.getAttribute('autocomplete'),
        ariaLabel: element.getAttribute('aria-label'),
        ariaReadonly: element.getAttribute('aria-readonly'),
        ariaDisabled: element.getAttribute('aria-disabled'),
        ariaMultiline: element.getAttribute('aria-multiline'),
        dataRole: element.getAttribute('data-role'),
        dataHandle: element.getAttribute('data-handle'),
        name: element.getAttribute('name'),
        id: element.getAttribute('id'),
        value: element.value,
      };
    }
    return result;
  });
}

async function countSemanticTextboxDomNodes(page: Page, handle: string): Promise<number> {
  return await page.evaluate((targetHandle: string) => {
    return document.querySelectorAll(
      `[data-effindom-semantic-node="true"][data-role="textbox"][data-handle="${targetHandle}"]:not([data-effindom-semantic-kind="host-autofill-textbox"])`,
    ).length;
  }, handle);
}

async function scrollUntilSemanticLabelVisible(page: Page, label: string): Promise<void> {
  await expect.poll(async () => {
    const bounds = await demo.findSemanticBounds(page, label);
    if (bounds !== null) {
      return true;
    }
    await page.locator('#fui-canvas').hover();
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(200);
    return false;
  }).toBe(true);
}

async function focusSemanticTextbox(page: Page, label: string): Promise<void> {
  await page.evaluate((targetLabel: string) => {
    const semantic = (window.__bridgeSemanticTree ?? []).find((node) => node.label === targetLabel && node.roleName === 'textbox');
    if (semantic === undefined) {
      throw new Error(`Expected textbox semantic node for "${targetLabel}".`);
    }
    const previousHandle = window.__effindomTestFocusedHandle ?? null;
    if (previousHandle !== null && previousHandle !== semantic.handle) {
      window.__effindomCallbacks?.onFocusChanged?.(BigInt(previousHandle), false);
    }
    window.__effindomCallbacks?.onFocusChanged?.(BigInt(semantic.handle), true);
    window.__effindomTestFocusedHandle = semantic.handle;
  }, label);
}

async function waitForSemanticTextbox(page: Page, label: string): Promise<void> {
  await expect.poll(async () => {
    return (await demo.findSemanticBounds(page, label)) !== null;
  }).toBe(true);
}

async function openDialogAndFlush(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__openDemoDialog?.();
    window.__flushRenders?.();
  });
}

async function closeDialog(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__closeDemoDialog?.();
  });
  await page.evaluate(() => {
    window.__flushRenders?.();
  });
}

test('dashboard password-manager metadata is projected onto the active hidden editor', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/`);
  await demo.waitForDemoReady(page);

  await scrollUntilSemanticLabelVisible(page, 'Type here');
  await focusSemanticTextbox(page, 'Type here');

  await expect.poll(async () => {
    return await readHiddenEditorMetadata(page);
  }).toMatchObject({
    tagName: 'input',
    type: 'text',
    autocomplete: 'username',
    name: 'demo-dashboard:text-input',
    id: 'demo-dashboard:text-input',
    focused: true,
  });

  await scrollUntilSemanticLabelVisible(page, 'Password input');
  await focusSemanticTextbox(page, 'Password input');

  await expect.poll(async () => {
    return await readHiddenEditorMetadata(page);
  }).toMatchObject({
    tagName: 'input',
    type: 'password',
    autocomplete: 'current-password',
    name: 'current-password',
    id: 'current-password',
    focused: true,
  });
});

test('dialog password focus does not leave stale hidden-editor metadata after reopen', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/`);
  await demo.waitForDemoReady(page);

  await openDialogAndFlush(page);
  await waitForSemanticTextbox(page, 'Username');
  await waitForSemanticTextbox(page, 'Password');

  await expect.poll(async () => {
    return Object.values(await readSemanticLightDomFields(page));
  }).toEqual(expect.arrayContaining([
    expect.objectContaining({
      tagName: 'input',
      type: 'text',
      autocomplete: 'username',
      ariaLabel: 'Username',
      ariaReadonly: 'false',
      ariaDisabled: 'false',
      ariaMultiline: null,
      dataRole: 'textbox',
      name: 'username',
      id: 'username',
    }),
    expect.objectContaining({
      tagName: 'input',
      type: 'password',
      autocomplete: 'current-password',
      ariaLabel: 'Password',
      ariaReadonly: 'false',
      ariaDisabled: 'false',
      ariaMultiline: null,
      dataRole: 'textbox',
      name: 'dialog-current-password',
      id: 'dialog-current-password',
    }),
  ]));

  await focusSemanticTextbox(page, 'Password');

  await expect.poll(async () => {
    return await readHiddenEditorMetadata(page);
  }).toMatchObject({
    tagName: 'input',
    type: 'password',
    autocomplete: 'current-password',
    name: 'dialog-current-password',
    id: 'dialog-current-password',
    focused: true,
  });

  await closeDialog(page);

  await expect.poll(async () => {
    return Object.keys(await readSemanticLightDomFields(page)).length;
  }).toBe(0);

  await openDialogAndFlush(page);
  await waitForSemanticTextbox(page, 'Username');
  await waitForSemanticTextbox(page, 'Password');
  await focusSemanticTextbox(page, 'Username');

  await expect.poll(async () => {
    return await readHiddenEditorMetadata(page);
  }).toMatchObject({
    tagName: 'input',
    type: 'text',
    autocomplete: 'username',
    name: 'username',
    id: 'username',
    focused: true,
  });
});

test('host-autofill dialog fields do not emit duplicate semantic textbox DOM nodes', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/`);
  await demo.waitForDemoReady(page);

  await openDialogAndFlush(page);
  await waitForSemanticTextbox(page, 'Username');
  await waitForSemanticTextbox(page, 'Password');

  const fields = await readSemanticLightDomFields(page);
  const username = Object.values(fields).find((field) => field.name === 'username');
  const password = Object.values(fields).find((field) => field.name === 'dialog-current-password');
  if (username === undefined || password === undefined) {
    throw new Error('Expected projected username/password fields.');
  }

  expect(await countSemanticTextboxDomNodes(page, username.handle)).toBe(0);
  expect(await countSemanticTextboxDomNodes(page, password.handle)).toBe(0);
  expect(username.dataRole).toBe('textbox');
  expect(username.dataHandle).toBe(username.handle);
  expect(password.dataRole).toBe('textbox');
  expect(password.dataHandle).toBe(password.handle);
});

test('projected dialog form fields commit sibling autofill updates by their own handles', async ({ page }) => {
  await page.goto(`${demo.baseUrl}/v2/fui-as/demo/`);
  await demo.waitForDemoReady(page);

  await openDialogAndFlush(page);
  await waitForSemanticTextbox(page, 'Username');
  await waitForSemanticTextbox(page, 'Password');
  await focusSemanticTextbox(page, 'Password');

  await page.evaluate(() => {
    const semanticLightDom = Array.from(document.querySelectorAll<HTMLInputElement>('[data-effindom-semantic-light-dom-field="true"]'));
    const username = semanticLightDom.find((candidate) => candidate.getAttribute('name') === 'username');
    const password = semanticLightDom.find((candidate) => candidate.getAttribute('name') === 'dialog-current-password');
    if (username === undefined || password === undefined) {
      throw new Error('Expected projected username/password fields.');
    }
    username.value = 'alice@example.com';
    username.dispatchEvent(new Event('input', { bubbles: true }));
    password.value = 'secret-password';
    password.dispatchEvent(new Event('input', { bubbles: true }));
    window.__flushRenders?.();
  });

  await expect.poll(async () => {
    const fields = Object.values(await readSemanticLightDomFields(page));
    return fields.map((field) => ({ name: field.name, value: field.value }));
  }).toEqual(expect.arrayContaining([
    { name: 'username', value: 'alice@example.com' },
    { name: 'dialog-current-password', value: 'secret-password' },
  ]));
});
