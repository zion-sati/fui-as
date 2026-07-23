// Preserve the complete runtime browser API for FUI-AS consumers. The two
// application mount entry points are explicitly replaced below so
// AssemblyScript apps always receive their language-level imports.
export * from '@effindomv2/runtime/managed-harness';
export * from '@effindomv2/runtime/routed-app-conventions';
export { startHarness, startManagedHarness } from './assemblyscript-harness';
