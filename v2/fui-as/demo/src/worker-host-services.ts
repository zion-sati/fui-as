import { defineHostServices, hostService } from "../../browser/src/host-services";

export const demoWorkerHostServices = defineHostServices({
  demoWorkerClock: {
    wallClockSinceEpochMs: hostService({
      args: [] as const,
      returns: "f64",
      implementation() {
        return Date.now();
      },
    }),
  },
});
