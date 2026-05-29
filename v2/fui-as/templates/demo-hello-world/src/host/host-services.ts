import { defineHostServices, hostService } from "../fui/FuiBrowser";

function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export const appHostServices = defineHostServices({
  // Host services are request/response calls from AssemblyScript -> browser host.
  // Keep names domain-oriented so generated wrappers read naturally:
  // appClock.nowUnixSeconds() -> appClockNowUnixSeconds().
  appClock: {
    nowUnixSeconds: hostService({
      args: [],
      returns: "i32",
      implementation: (): number => nowUnixSeconds(),
    }),
  },
});
