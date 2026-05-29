import { startRoutedHarness, type HarnessExports, type RoutedHarnessRoute } from './src/fui/FuiBrowser';
import { appHostEvents } from './src/host/host-events';
import { appHostServices } from './src/host/host-services';

type MvcRouteExports = HarnessExports & {
  __runApp(): void;
  __disposeApp?(): void;
};

const routePrefix = window.location.pathname.startsWith('/v2/fui-as/demo-mvc/') ? '/v2/fui-as/demo-mvc' : '';
const routes: readonly RoutedHarnessRoute[] = [
  {
    routePath: `${routePrefix}/mvc-home/`,
    wasmPath: `${routePrefix}/mvc-home.wasm?v=midnight-6`,
    title: 'MVC Home',
  },
  {
    routePath: `${routePrefix}/mvc-settings/`,
    wasmPath: `${routePrefix}/mvc-settings.wasm?v=midnight-6`,
    title: 'MVC Settings',
  },
];

startRoutedHarness<MvcRouteExports>({
  shellId: 'fui-mvc',
  routeBase: routes[0].routePath,
  routes,
  recreateRuntimeOnWarmRouteSwap: true,
  showLoadingOverlay(isWarmRouteSwap): boolean {
    return !isWarmRouteSwap;
  },
  run(exports): void {
    exports.__runApp();
  },
  onDispose(exports): void {
    exports.__disposeApp?.();
  },
  hostEvents: appHostEvents,
  hostServices: appHostServices,
});
