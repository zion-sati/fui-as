import { startHarness, type HarnessExports, type HarnessState } from '../../../browser/src/common-harness';

declare global {
  interface Window {
    __fuiAsReady?: boolean;
    __fuiAsError?: string;
    __fuiAsState?: HarnessState;
    __fuiAsSetSmokeSpacing?: (value: number) => void;
    __startSmokeEchoWorker?: () => void;
    __startSmokeFailWorker?: () => void;
    __startSmokeMissingWorker?: () => void;
    __startSmokeCancelableWorker?: () => void;
    __cancelSmokeWorker?: () => void;
    __getSmokeWorkerProgressCount?: () => number;
    __getSmokeWorkerCompleteCount?: () => number;
    __getSmokeWorkerErrorCount?: () => number;
    __getSmokeWorkerPhase?: () => number;
  }
}

interface FuiAppExports extends HarnessExports {
  __runSmokeApp(): void;
  __runSmokeAppWithNullChild?(): void;
  __setSmokeSpacing?(value: number): void;
  __startSmokeEchoWorker?(): void;
  __startSmokeFailWorker?(): void;
  __startSmokeMissingWorker?(): void;
  __startSmokeCancelableWorker?(): void;
  __cancelSmokeWorker?(): void;
  __getSmokeWorkerProgressCount?(): number;
  __getSmokeWorkerCompleteCount?(): number;
  __getSmokeWorkerErrorCount?(): number;
  __getSmokeWorkerPhase?(): number;
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
  async onReady({ exports, waitForFrame }): Promise<void> {
    window.__fuiAsSetSmokeSpacing = (value: number) => {
      exports.__setSmokeSpacing?.(value);
    };
    window.__startSmokeEchoWorker = () => {
      exports.__startSmokeEchoWorker?.();
    };
    window.__startSmokeFailWorker = () => {
      exports.__startSmokeFailWorker?.();
    };
    window.__startSmokeMissingWorker = () => {
      exports.__startSmokeMissingWorker?.();
    };
    window.__startSmokeCancelableWorker = () => {
      exports.__startSmokeCancelableWorker?.();
    };
    window.__cancelSmokeWorker = () => {
      exports.__cancelSmokeWorker?.();
    };
    window.__getSmokeWorkerProgressCount = () => {
      return exports.__getSmokeWorkerProgressCount?.() ?? 0;
    };
    window.__getSmokeWorkerCompleteCount = () => {
      return exports.__getSmokeWorkerCompleteCount?.() ?? 0;
    };
    window.__getSmokeWorkerErrorCount = () => {
      return exports.__getSmokeWorkerErrorCount?.() ?? 0;
    };
    window.__getSmokeWorkerPhase = () => {
      return exports.__getSmokeWorkerPhase?.() ?? 0;
    };
    await waitForFrame();
    await waitForFrame();
    window.__fuiAsReady = true;
    delete window.__fuiAsError;
  },
  onError(error): void {
    const message = error instanceof Error ? error.message : String(error);
    window.__fuiAsError = message;
    delete window.__fuiAsSetSmokeSpacing;
    delete window.__startSmokeEchoWorker;
    delete window.__startSmokeFailWorker;
    delete window.__startSmokeMissingWorker;
    delete window.__startSmokeCancelableWorker;
    delete window.__cancelSmokeWorker;
    delete window.__getSmokeWorkerProgressCount;
    delete window.__getSmokeWorkerCompleteCount;
    delete window.__getSmokeWorkerErrorCount;
    delete window.__getSmokeWorkerPhase;
  },
});
