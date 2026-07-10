import { Application, createManagedApplication } from "../../src/Fui";
import { DashboardController } from "./dashboard/DashboardController";

export * from "../../src/FuiExports";
export * from "./generated/HostEvents";

const demoHarness = createManagedApplication<DashboardController>(
  () => new DashboardController(),
  (dashboard) => dashboard.getRoot(),
  (dashboard) => {
    Application.mount(dashboard.getRoot());
    dashboard.syncStartupScrollMetrics();
  },
  (dashboard) => {
    dashboard.dispose();
    Application.unmount();
  },
);

export function __runDemoApp(): void {
  demoHarness.run();
}

export function __disposeDemoApp(): void {
  demoHarness.dispose();
}

export function __toggleDemoFoundationsScope(): void {
  const dashboard = demoHarness.getActivePage();
  if (dashboard === null) {
    return;
  }
  dashboard.toggleFoundationsScope();
}

export function __activateDemoFoundationsScopedAction(): void {
  const dashboard = demoHarness.getActivePage();
  if (dashboard === null) {
    return;
  }
  dashboard.activateFoundationsScopedAction();
}

export function __focusDemoFoundationsScopedAction(): void {
  const dashboard = demoHarness.getActivePage();
  if (dashboard === null) {
    return;
  }
  dashboard.focusFoundationsScopedAction();
}

export function __openDemoDialog(): void {
  const dashboard = demoHarness.getActivePage();
  if (dashboard === null) {
    return;
  }
  dashboard.openDialogDemo();
}

export function __closeDemoDialog(): void {
  const dashboard = demoHarness.getActivePage();
  if (dashboard === null) {
    return;
  }
  dashboard.closeDialogDemo();
}

export function __getDemoSelectionDebugText(): string {
  const dashboard = demoHarness.getActivePage();
  return dashboard === null ? "" : dashboard.getSelectionDebugText();
}
