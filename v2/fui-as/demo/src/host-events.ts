import { defineHostEvents, hostEvent } from "../../browser/src/host-events";
import {
  readDemoShellState,
  subscribeDemoShellClockTick,
  subscribeDemoShellDarkMode,
  subscribeDemoShellHue,
} from "./host-service-state";

export const demoHostEvents = defineHostEvents({
  demoShell: {
    clockTickChanged: hostEvent({
      args: ["i32"] as const,
      subscribe(emit) {
        emit(readDemoShellState().tick);
        return subscribeDemoShellClockTick((value) => emit(value));
      },
    }),
    hueChanged: hostEvent({
      args: ["i32"] as const,
      subscribe(emit) {
        emit(readDemoShellState().hue);
        return subscribeDemoShellHue((value) => emit(value));
      },
    }),
    darkModeChanged: hostEvent({
      args: ["bool"] as const,
      subscribe(emit) {
        emit(readDemoShellState().darkMode);
        return subscribeDemoShellDarkMode((value) => emit(value));
      },
    }),
  },
});
