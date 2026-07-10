import { defineHostEvents, hostEvent } from "../../browser/src/shared-browser";
import {
  subscribeDemoShellAccentColor,
  readDemoShellState,
  subscribeDemoShellClockTick,
  subscribeDemoShellDarkMode,
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
    accentColorChanged: hostEvent({
      args: ["u32"] as const,
      subscribe(emit) {
        emit(readDemoShellState().accentColor);
        return subscribeDemoShellAccentColor((value) => emit(value));
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
