import { defineHostServices, hostService } from "../fui/FuiBrowser";

function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export const appHostServices = defineHostServices({
  // Example host service for scaffolded apps:
  // fetch a scalar value on demand from the browser host.
  appClock: {
    nowUnixSeconds: hostService({
      args: [],
      returns: "i32",
      implementation: (): number => nowUnixSeconds(),
    }),
  },
});
