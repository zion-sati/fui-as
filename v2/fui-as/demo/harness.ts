import type { EffinDomCallbacks } from '@effindomv2/runtime';
import { demoHostEvents } from './src/host-events';
import { demoHostServices } from './src/host-services';
import { setDemoShellDarkMode, setDemoShellHue, setDemoShellTick } from './src/host-service-state';
import type { HarnessExports, HarnessState } from '../browser/src/common-harness';
import {
  startRoutedHarness,
  type RoutedHarnessManagerState,
  type RoutedHarnessRoute,
} from '../browser/src/routed-harness';

declare global {
  interface Window {
    __fuiAsReady?: boolean;
    __fuiAsError?: string;
    __fuiAsState?: HarnessState;
    __fuiDemoSelectionText?: string;
    __toggleDemoFoundationsScope?(): void;
    __activateDemoFoundationsScopedAction?(): void;
    __focusDemoFoundationsScopedAction?(): void;
    __getAdvancedControlsActionCount?(): number;
    __getAdvancedControlsAnimationTargetCode?(): number;
    __effindomCallbacks?: EffinDomCallbacks;
    __fuiDemoManagerState?: {
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
  __getAdvancedControlsActionCount?(): number;
  __getAdvancedControlsAnimationTargetCode?(): number;
}

interface DemoRoute extends RoutedHarnessRoute {
  readonly key: 'home' | 'advanced-controls' | 'templated-controls' | 'scrollbar-gutter';
}

const SOURCE_HOME_ROUTE = '/v2/fui-as/demo/index.html';
const SOURCE_HOME_MATCH_PATH = '/v2/fui-as/demo/';
const SOURCE_ADVANCED_CONTROLS_ROUTE = '/v2/fui-as/demo/advanced-controls/';
const SOURCE_TEMPLATED_CONTROLS_ROUTE = '/v2/fui-as/demo/templated-controls/';
const ROOT_HOME_ROUTE = '/';
const ROOT_ADVANCED_CONTROLS_ROUTE = '/advanced-controls/';
const ROOT_TEMPLATED_CONTROLS_ROUTE = '/templated-controls/';
const ROUTES: readonly DemoRoute[] = [
  {
    key: 'home',
    routePath: SOURCE_HOME_ROUTE,
    matchPath: SOURCE_HOME_MATCH_PATH,
    wasmPath: '/v2/fui-as/demo/home.wasm?v=midnight-5',
    title: 'Dashboard',
  },
  {
    key: 'advanced-controls',
    routePath: SOURCE_ADVANCED_CONTROLS_ROUTE,
    wasmPath: '/v2/fui-as/demo/advanced-controls.wasm?v=midnight-5',
    title: 'Advanced controls',
  },
  {
    key: 'templated-controls',
    routePath: SOURCE_TEMPLATED_CONTROLS_ROUTE,
    wasmPath: '/v2/fui-as/demo/templated-controls.wasm?v=midnight-5',
    title: 'Templated controls',
  },
  {
    key: 'scrollbar-gutter',
    routePath: '/v2/fui-as/demo/scrollbar-gutter/',
    wasmPath: '/v2/fui-as/demo/scrollbar-gutter.wasm?v=midnight-5',
    title: 'Scrollbar gutter bug',
  },
  {
    key: 'home',
    routePath: ROOT_HOME_ROUTE,
    wasmPath: '/home.wasm?v=midnight-5',
    title: 'Dashboard',
  },
  {
    key: 'advanced-controls',
    routePath: ROOT_ADVANCED_CONTROLS_ROUTE,
    wasmPath: '/advanced-controls.wasm?v=midnight-5',
    title: 'Advanced controls',
  },
  {
    key: 'templated-controls',
    routePath: ROOT_TEMPLATED_CONTROLS_ROUTE,
    wasmPath: '/templated-controls.wasm?v=midnight-5',
    title: 'Templated controls',
  },
];
const shellId = `fui-demo-${Math.random().toString(36).slice(2, 10)}`;
const workerHostServices = {
  scriptUrl: new URL('./worker-host-services.js', import.meta.url).toString(),
  exportName: 'demoWorkerHostServices',
};

let currentExports: DemoRouteExports | null = null;
let tick = 0;
let hue = 210;
let darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

function syncDemoShellState(): void {
  setDemoShellTick(tick);
  setDemoShellHue(hue);
  setDemoShellDarkMode(darkMode);
}

function updateOutput(id: string, value: string): void {
  const output = document.getElementById(id);
  if (output instanceof HTMLElement) {
    output.textContent = value;
  }
}

function updateThemeControls(): void {
  document.documentElement.dataset.demoTheme = darkMode ? 'dark' : 'light';
  document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  updateOutput('theme-mode-value', darkMode ? 'Dark' : 'Light');
  const themeButton = document.getElementById('toggle-theme-mode');
  if (themeButton instanceof HTMLButtonElement) {
    themeButton.textContent = darkMode ? 'Switch to light mode' : 'Switch to dark mode';
  }
}

function syncManagerState(state: RoutedHarnessManagerState, route: DemoRoute): void {
  window.__fuiDemoManagerState = {
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
    window.__fuiDemoSelectionText = text;
  };
  window.__effindomCallbacks = callbacks;
  window.__fuiDemoSelectionText = '';

  window.__toggleDemoFoundationsScope = () => {
    currentExports?.__toggleDemoFoundationsScope?.();
  };
  window.__activateDemoFoundationsScopedAction = () => {
    currentExports?.__activateDemoFoundationsScopedAction?.();
  };
  window.__focusDemoFoundationsScopedAction = () => {
    currentExports?.__focusDemoFoundationsScopedAction?.();
  };
  window.__getAdvancedControlsActionCount = () => {
    return currentExports?.__getAdvancedControlsActionCount?.() ?? -1;
  };
  window.__getAdvancedControlsAnimationTargetCode = () => {
    return currentExports?.__getAdvancedControlsAnimationTargetCode?.() ?? -1;
  };
}

function installShellControls(): void {
  const hueInput = document.getElementById('hue') as HTMLInputElement | null;
  const pulseButton = document.getElementById('pulse-hue');
  const themeButton = document.getElementById('toggle-theme-mode');

  if (hueInput !== null) {
    hueInput.value = String(hue);
    hueInput.addEventListener('input', () => {
      hue = Number(hueInput.value);
      updateOutput('hue-value', `${String(hue)} deg`);
      syncDemoShellState();
    });
  }

  if (pulseButton instanceof HTMLElement) {
    pulseButton.addEventListener('click', () => {
      hue = (tick * 47 + 120) % 360;
      if (hueInput !== null) {
        hueInput.value = String(hue);
      }
      updateOutput('hue-value', `${String(hue)} deg`);
      syncDemoShellState();
    });
  }

  if (themeButton instanceof HTMLElement) {
    themeButton.addEventListener('click', () => {
      darkMode = !darkMode;
      updateThemeControls();
      syncDemoShellState();
    });
  }

  updateOutput('hue-value', `${String(hue)} deg`);
  updateOutput('tick-value', '0 s');
  updateThemeControls();
  syncDemoShellState();

  window.setInterval(() => {
    tick += 1;
    updateOutput('tick-value', `${String(tick)} s`);
    syncDemoShellState();
  }, 1000);
}

installHostCallbacks();
installShellControls();

startRoutedHarness<DemoRouteExports, DemoRoute>({
  shellId,
  routeBase: ROOT_HOME_ROUTE,
  routes: ROUTES,
  hostEvents: demoHostEvents,
  hostServices: demoHostServices,
  workerHostServices,
  recreateRuntimeOnWarmRouteSwap: true,
  onRouteReady(state, route): void {
    syncManagerState(state, route);
  },
  onHarnessStateUpdated(state): void {
    window.__fuiAsState = state;
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
    window.__fuiAsError = error instanceof Error ? error.message : String(error);
  },
});
