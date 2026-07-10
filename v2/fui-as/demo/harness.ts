import type { EffinDomCallbacks } from '@effindomv2/runtime';
import { readHostAccentColor } from '../browser/src/shared-browser';
import { demoHostEvents } from './src/host-events';
import { demoHostServices } from './src/host-services';
import { setDemoShellAccentColor, setDemoShellDarkMode, setDemoShellTick } from './src/host-service-state';
import type { HarnessExports, HarnessState } from '../browser/src/shared-browser';
import {
  startRoutedHarness,
  type RoutedHarnessManagerState,
  type RoutedHarnessRoute,
} from '../browser/src/routed-harness';

declare global {
  interface Window {
    __fuiReady?: boolean;
    __fuiError?: string;
    __fuiState?: HarnessState;
    __fuiSelectionText?: string;
    __toggleDemoFoundationsScope?(): void;
    __activateDemoFoundationsScopedAction?(): void;
    __focusDemoFoundationsScopedAction?(): void;
    __openDemoDialog?(): void;
    __closeDemoDialog?(): void;
    __flushRenders?(): void;
    __getAdvancedControlsActionCount?(): number;
    __getAdvancedControlsAnimationTargetCode?(): number;
    __effindomCallbacks?: EffinDomCallbacks;
    __fuiManagerState?: {
      readonly routePath: string;
      readonly activeWasmPath: string;
      readonly routeLoads: Readonly<Record<string, number>>;
    };
  }
}

interface DemoRouteExports extends HarnessExports {
  __runApp(): void;
  __disposeApp?(): void;
  __toggleDemoFoundationsScope?(): void;
  __activateDemoFoundationsScopedAction?(): void;
  __focusDemoFoundationsScopedAction?(): void;
  __openDemoDialog?(): void;
  __closeDemoDialog?(): void;
  __flushRenders?(): void;
  __getAdvancedControlsActionCount?(): number;
  __getAdvancedControlsAnimationTargetCode?(): number;
}

interface DemoRoute extends RoutedHarnessRoute {
  readonly key: 'home' | 'advanced-controls' | 'templated-controls' | 'scrollbar-gutter' | 'immediate-drawing';
}

const wasmVersion = Date.now().toString(36);

function withWasmVersion(path: string): string {
  return `${path}?v=${wasmVersion}`;
}

const SOURCE_HOME_ROUTE = '/v2/fui-as/demo/index.html';
const SOURCE_HOME_MATCH_PATH = '/v2/fui-as/demo/';
const SOURCE_ADVANCED_CONTROLS_ROUTE = '/v2/fui-as/demo/advanced-controls/';
const SOURCE_TEMPLATED_CONTROLS_ROUTE = '/v2/fui-as/demo/templated-controls/';
const ROOT_HOME_ROUTE = '/';
const ROOT_ADVANCED_CONTROLS_ROUTE = '/advanced-controls/';
const ROOT_TEMPLATED_CONTROLS_ROUTE = '/templated-controls/';
const ROOT_IMMEDIATE_DRAWING_ROUTE = '/immediate-drawing/';
const ROUTES: readonly DemoRoute[] = [
  {
    key: 'home',
    routePath: SOURCE_HOME_ROUTE,
    matchPath: SOURCE_HOME_MATCH_PATH,
    wasmPath: withWasmVersion('/v2/fui-as/demo/home.wasm'),
    title: 'Dashboard',
  },
  {
    key: 'advanced-controls',
    routePath: SOURCE_ADVANCED_CONTROLS_ROUTE,
    wasmPath: withWasmVersion('/v2/fui-as/demo/advanced-controls.wasm'),
    title: 'Advanced controls',
  },
  {
    key: 'templated-controls',
    routePath: SOURCE_TEMPLATED_CONTROLS_ROUTE,
    wasmPath: withWasmVersion('/v2/fui-as/demo/templated-controls.wasm'),
    title: 'Templated controls',
  },
  {
    key: 'scrollbar-gutter',
    routePath: '/v2/fui-as/demo/scrollbar-gutter/',
    wasmPath: withWasmVersion('/v2/fui-as/demo/scrollbar-gutter.wasm'),
    title: 'Scrollbar gutter bug',
  },
  {
    key: 'immediate-drawing',
    routePath: '/v2/fui-as/demo/immediate-drawing/',
    wasmPath: withWasmVersion('/v2/fui-as/demo/immediate-drawing.wasm'),
    title: 'Immediate-mode drawing',
  },
  {
    key: 'home',
    routePath: ROOT_HOME_ROUTE,
    wasmPath: withWasmVersion('/home.wasm'),
    title: 'Dashboard',
  },
  {
    key: 'advanced-controls',
    routePath: ROOT_ADVANCED_CONTROLS_ROUTE,
    wasmPath: withWasmVersion('/advanced-controls.wasm'),
    title: 'Advanced controls',
  },
  {
    key: 'templated-controls',
    routePath: ROOT_TEMPLATED_CONTROLS_ROUTE,
    wasmPath: withWasmVersion('/templated-controls.wasm'),
    title: 'Templated controls',
  },
  {
    key: 'immediate-drawing',
    routePath: ROOT_IMMEDIATE_DRAWING_ROUTE,
    wasmPath: withWasmVersion('/immediate-drawing.wasm'),
    title: 'Immediate-mode drawing',
  },
];
const shellId = `fui-demo-${Math.random().toString(36).slice(2, 10)}`;
const workerHostServices = {
  scriptUrl: new URL('./worker-host-services.js', import.meta.url).toString(),
  exportName: 'demoWorkerHostServices',
};

let currentExports: DemoRouteExports | null = null;
let tick = 0;
const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
let darkMode = darkModeQuery.matches;
let demoShellTickTimer: number | null = null;

function syncDemoShellState(): void {
  setDemoShellTick(tick);
  setDemoShellAccentColor(readHostAccentColor());
  setDemoShellDarkMode(darkMode);
}

function stopDemoShellTick(): void {
  if (demoShellTickTimer === null) {
    return;
  }
  clearTimeout(demoShellTickTimer);
  demoShellTickTimer = null;
}

function scheduleDemoShellTick(): void {
  if (demoShellTickTimer !== null || document.hidden) {
    return;
  }
  demoShellTickTimer = window.setTimeout(() => {
    demoShellTickTimer = null;
    if (document.hidden) {
      return;
    }
    tick += 1;
    syncDemoShellState();
    scheduleDemoShellTick();
  }, 1000);
}

function syncDemoShellTickVisibility(): void {
  if (document.hidden) {
    stopDemoShellTick();
    return;
  }
  syncDemoShellState();
  scheduleDemoShellTick();
}

function syncManagerState(state: RoutedHarnessManagerState, route: DemoRoute): void {
  window.__fuiManagerState = {
    routePath: route.routePath,
    activeWasmPath: route.wasmPath,
    routeLoads: { ...state.routeLoads },
  };
}

function installHostCallbacks(): void {
  const callbacks: EffinDomCallbacks = window.__effindomCallbacks ?? {};
  const previousCrossSelectionChanged = callbacks.onCrossSelectionChanged;
  callbacks.onCrossSelectionChanged = (handle, text) => {
    previousCrossSelectionChanged?.(handle, text);
    window.__fuiSelectionText = text;
  };
  window.__effindomCallbacks = callbacks;
  window.__fuiSelectionText = '';

  window.__toggleDemoFoundationsScope = () => {
    currentExports?.__toggleDemoFoundationsScope?.();
  };
  window.__activateDemoFoundationsScopedAction = () => {
    currentExports?.__activateDemoFoundationsScopedAction?.();
  };
  window.__focusDemoFoundationsScopedAction = () => {
    currentExports?.__focusDemoFoundationsScopedAction?.();
  };
  window.__openDemoDialog = () => {
    currentExports?.__openDemoDialog?.();
  };
  window.__closeDemoDialog = () => {
    currentExports?.__closeDemoDialog?.();
  };
  window.__flushRenders = () => {
    currentExports?.__flushRenders?.();
  };
  window.__getAdvancedControlsActionCount = () => {
    return currentExports?.__getAdvancedControlsActionCount?.() ?? -1;
  };
  window.__getAdvancedControlsAnimationTargetCode = () => {
    return currentExports?.__getAdvancedControlsAnimationTargetCode?.() ?? -1;
  };
}

window.__fuiReady = false;
delete window.__fuiError;
installHostCallbacks();
syncDemoShellState();
darkModeQuery.addEventListener('change', (event) => {
  darkMode = event.matches;
  syncDemoShellState();
});
document.addEventListener('visibilitychange', syncDemoShellTickVisibility);
scheduleDemoShellTick();

startRoutedHarness<DemoRouteExports, DemoRoute>({
  shellId,
  routeBase: ROOT_HOME_ROUTE,
  routes: ROUTES,
  devToolsDomMirror: 'on-requested',
  hostEvents: demoHostEvents,
  hostServices: demoHostServices,
  workerHostServices,
  recreateRuntimeOnWarmRouteSwap: true,
  onRouteReady(state, route): void {
    syncManagerState(state, route);
    window.__fuiReady = true;
  },
  onHarnessStateUpdated(state): void {
    window.__fuiState = state;
  },
  run(exports): void {
    currentExports = exports;
    exports.__runApp();
  },
  onDispose(exports): void {
    if (currentExports === exports) {
      currentExports = null;
    }
    exports.__disposeApp?.();
  },
  onHarnessError(error): void {
    window.__fuiError = error instanceof Error ? error.message : String(error);
  },
});
