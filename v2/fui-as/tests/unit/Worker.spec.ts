import { Application } from "../../src/core/Application";
import {
  __resetWorkerControllersForTests,
  handleWorkerComplete,
  handleWorkerError,
  handleWorkerProgress,
  Worker,
} from "../../src/core/Worker";
import { FlexBox, Text } from "../../src/nodes";
import {
  CALL_WORKER_CANCEL,
  CALL_WORKER_START_STRING,
  findCall,
  getCallSequence,
  lastWorkerEntryEquals,
  lastWorkerInputEquals,
  resetCalls,
} from "./FfiTestImports";

class WorkerOwner {
  progressCount: i32 = 0;
  completeCount: i32 = 0;
  errorCount: i32 = 0;
  lastMessage: string = "";
}

describe("Worker controller", () => {
  afterEach(() => {
    __resetWorkerControllersForTests();
    Application.unmount();
    resetCalls();
  });

  it("starts a one-shot string worker through the host surface", () => {
    Worker.start("processData").sendString("userId=42");

    expect<i32>(findCall(CALL_WORKER_START_STRING)).toBeGreaterThan(-1);
    expect<bool>(lastWorkerEntryEquals("processData")).toBe(true);
    expect<bool>(lastWorkerInputEquals("userId=42")).toBe(true);
  });

  it("routes progress and completion to owner-bound callbacks", () => {
    const owner = new WorkerOwner();

    Worker.start("processData")
      .onProgress(owner, (target, value) => {
        target.progressCount += 1;
        target.lastMessage = value;
      })
      .onComplete(owner, (target, value) => {
        target.completeCount += 1;
        target.lastMessage = value;
      })
      .sendString("payload");

    handleWorkerProgress(1, "Fetching...");
    handleWorkerComplete(1, "Done!");
    handleWorkerProgress(1, "ignored");

    expect<i32>(owner.progressCount).toBe(1);
    expect<i32>(owner.completeCount).toBe(1);
    expect<string>(owner.lastMessage).toBe("Done!");
  });

  it("routes worker failures to the bound error callback", () => {
    const owner = new WorkerOwner();

    Worker.start("processData")
      .onError(owner, (target, value) => {
        target.errorCount += 1;
        target.lastMessage = value;
      })
      .sendString("payload");

    handleWorkerError(1, "boom");
    handleWorkerError(1, "ignored");

    expect<i32>(owner.errorCount).toBe(1);
    expect<string>(owner.lastMessage).toBe("boom");
  });

  it("ignores duplicate sendString calls for one-shot workers", () => {
    const worker = Worker.start("processData");

    worker.sendString("first");
    worker.sendString("second");

    const sequence = getCallSequence();
    let startCount = 0;
    for (let index = 0; index < sequence.length; ++index) {
      if (unchecked(sequence[index]) == CALL_WORKER_START_STRING) {
        startCount += 1;
      }
    }
    expect<i32>(startCount).toBe(1);
    expect<bool>(lastWorkerInputEquals("first")).toBe(true);
  });

  it("cancels started workers during application teardown", () => {
    Worker.start("processData").sendString("payload");

    Application.mount(new FlexBox().child(new Text("root")));
    Application.unmount();

    expect<i32>(findCall(CALL_WORKER_CANCEL)).toBeGreaterThan(-1);
  });

  it("still routes completion when work finishes before a late cancellation takes effect", () => {
    const owner = new WorkerOwner();
    const worker = Worker.start("processData")
      .onComplete(owner, (target, value) => {
        target.completeCount += 1;
        target.lastMessage = value;
      });

    worker.sendString("payload");
    worker.cancel();
    handleWorkerComplete(1, "Done anyway");

    expect<i32>(owner.completeCount).toBe(1);
    expect<string>(owner.lastMessage).toBe("Done anyway");
  });
});
