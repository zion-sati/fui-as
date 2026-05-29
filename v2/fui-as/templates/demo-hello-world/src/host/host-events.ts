import { defineHostEvents, hostEvent } from "../fui/FuiBrowser";

function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export const appHostEvents = defineHostEvents({
  // Host events are push notifications from browser host -> AssemblyScript.
  // subscribe(...) returns an optional disposer used by the harness on teardown.
  appClock: {
    tick: hostEvent({
      args: ["i32"],
      subscribe: (emit) => {
        emit(nowUnixSeconds());
        const timer = setInterval(() => {
          emit(nowUnixSeconds());
        }, 1000);
        return () => clearInterval(timer);
      },
    }),
  },
});
