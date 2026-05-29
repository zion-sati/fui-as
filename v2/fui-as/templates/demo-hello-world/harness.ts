import { startHarness } from './src/fui/FuiBrowser';
import { appHostEvents } from './src/host/host-events';
import { appHostServices } from './src/host/host-services';

startHarness({
  wasmPath: './app.wasm',
  hostEvents: appHostEvents,
  hostServices: appHostServices,
});
