import { defineHostEvents, hostEvent } from "../fui/FuiBrowser";

function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export const appHostEvents = defineHostEvents({
  // Example host event for scaffolded apps:
  // push a timer tick from browser host into AssemblyScript.
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
