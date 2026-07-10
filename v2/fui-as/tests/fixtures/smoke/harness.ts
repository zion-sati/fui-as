import { startHarness,type HarnessExports,type HarnessState } from '../../../browser/src/common-harness';

declare global {
  interface Window {
    __fuiReady?: boolean;
    __fuiError?: string;
    __fuiState?: HarnessState;
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
    window.__fuiState = state;
  },
  async onReady({ waitForFrame }): Promise<void> {
    await waitForFrame();
    await waitForFrame();
    window.__fuiReady = true;
    delete window.__fuiError;
  },
  onError(error): void {
    const message = error instanceof Error ? error.message : String(error);
    window.__fuiError = message;
  },
});
