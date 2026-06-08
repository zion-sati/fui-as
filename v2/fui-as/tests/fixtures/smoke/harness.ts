import { startHarness, type HarnessExports, type HarnessState } from '../../../browser/src/common-harness';

declare global {
  interface Window {
    __fuiAsReady?: boolean;
    __fuiAsError?: string;
    __fuiAsState?: HarnessState;
  }
}

interface FuiAppExports extends HarnessExports {
  __runSmokeApp(): void;
  __runSmokeAppWithNullChild?(): void;
}

startHarness<FuiAppExports>({
  wasmPath: './app.wasm?v=midnight-2',
  run(exports): void {
    const searchParams = new URL(window.location.href).searchParams;
    if (searchParams.get('debug-null-child') === '1' && exports.__runSmokeAppWithNullChild !== undefined) {
      exports.__runSmokeAppWithNullChild();
      return;
    }
    exports.__runSmokeApp();
  },
  onStateUpdated(state): void {
    window.__fuiAsState = state;
  },
  async onReady({ waitForFrame }): Promise<void> {
    await waitForFrame();
    await waitForFrame();
    window.__fuiAsReady = true;
    delete window.__fuiAsError;
  },
  onError(error): void {
    const message = error instanceof Error ? error.message : String(error);
    window.__fuiAsError = message;
  },
});
