import {
  startHarness as startRuntimeHarness,
  startManagedHarness as startRuntimeManagedHarness,
  type HarnessExports,
  type HarnessOptions,
  type ManagedHarnessOptions,
  type WasmAppInstantiator,
} from '@effindomv2/runtime/managed-harness';

/**
 * Instantiates an AssemblyScript application with its language-level abort
 * import. This belongs to FUI-AS rather than the framework-agnostic runtime.
 */
export const instantiateAssemblyScriptApp: WasmAppInstantiator = async (module, imports) => {
  const environment = imports.env;
  return WebAssembly.instantiate(module, {
    ...imports,
    env: {
      ...environment,
      abort(_message?: number, _fileName?: number, line?: number, column?: number): never {
        throw new Error(`AssemblyScript application aborted at ${String(line ?? 0)}:${String(column ?? 0)}.`);
      },
    },
  });
};

export function startHarness<Exports extends HarnessExports>(options: HarnessOptions<Exports>): void {
  startRuntimeHarness({
    ...options,
    instantiateApp: instantiateAssemblyScriptApp,
  });
}

export function startManagedHarness(options: ManagedHarnessOptions): void {
  startRuntimeManagedHarness({
    ...options,
    instantiateApp: instantiateAssemblyScriptApp,
  });
}
