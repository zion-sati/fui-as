import {
  startRoutedHarness as startRuntimeRoutedHarness,
} from '@effindomv2/runtime/routed-harness';
import type { HarnessExports } from '@effindomv2/runtime/managed-harness';
import type {
  RoutedHarnessConfig,
  RoutedHarnessRoute,
} from '@effindomv2/runtime/routed-harness';
import { instantiateAssemblyScriptApp } from './assemblyscript-harness';

export type {
  RoutedHarnessConfig,
  RoutedHarnessManagerState,
  RoutedHarnessRoute,
} from '@effindomv2/runtime/routed-harness';

export function startRoutedHarness<
  TExports extends HarnessExports,
  TRoute extends RoutedHarnessRoute = RoutedHarnessRoute,
>(config: RoutedHarnessConfig<TExports, TRoute>): void {
  startRuntimeRoutedHarness({
    ...config,
    instantiateApp: instantiateAssemblyScriptApp,
  });
}
