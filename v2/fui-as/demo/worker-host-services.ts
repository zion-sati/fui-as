import { demoWorkerHostServices } from "./src/worker-host-services";

declare global {
  var __fuiWorkerHostServicesModule: Record<string, unknown> | undefined;
}

globalThis.__fuiWorkerHostServicesModule = {
  ...(globalThis.__fuiWorkerHostServicesModule ?? {}),
  demoWorkerHostServices,
};
