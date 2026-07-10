import { Application } from "../../src/core/Application";
import {
  handleWorkerComplete,
  handleWorkerError,
  handleWorkerProgress,
  resetWorkerControllers,
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
  lastWorkerPathEquals,
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
    resetWorkerControllers();
    Application.unmount();
    resetCalls();
  });

  it("starts a one-shot string worker through the host surface", () => {
    new Worker("./workers/test.wasm", "processData").start("userId=42");

    expect<i32>(findCall(CALL_WORKER_START_STRING)).toBeGreaterThan(-1);
    expect<bool>(lastWorkerPathEquals("./workers/test.wasm")).toBe(true);
    expect<bool>(lastWorkerEntryEquals("processData")).toBe(true);
    expect<bool>(lastWorkerInputEquals("userId=42")).toBe(true);
  });

  it("routes progress and completion to owner-bound callbacks", () => {
    const owner = new WorkerOwner();

    new Worker("./workers/test.wasm", "processData")
      .onProgress(owner, (target, value) => {
        target.progressCount += 1;
        target.lastMessage = value.message;
      })
      .onComplete(owner, (target, value) => {
        target.completeCount += 1;
        target.lastMessage = value.result;
      })
      .start("payload");

    handleWorkerProgress(1, "Fetching...");
    handleWorkerComplete(1, "Done!");
    handleWorkerProgress(1, "ignored");

    expect<i32>(owner.progressCount).toBe(1);
    expect<i32>(owner.completeCount).toBe(1);
    expect<string>(owner.lastMessage).toBe("Done!");
  });

  it("routes worker failures to the bound error callback", () => {
    const owner = new WorkerOwner();

    new Worker("./workers/test.wasm", "processData")
      .onError(owner, (target, value) => {
        target.errorCount += 1;
        target.lastMessage = value.message;
      })
      .start("payload");

    handleWorkerError(1, "boom");
    handleWorkerError(1, "ignored");

    expect<i32>(owner.errorCount).toBe(1);
    expect<string>(owner.lastMessage).toBe("boom");
  });

  it("ignores duplicate start calls for one-shot workers", () => {
    const worker = new Worker("./workers/test.wasm", "processData");

    worker.start("first");
    worker.start("second");

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
    new Worker("./workers/test.wasm", "processData").start("payload");

    Application.mount(new FlexBox().child(new Text("root")));
    Application.unmount();

    expect<i32>(findCall(CALL_WORKER_CANCEL)).toBeGreaterThan(-1);
  });

  it("still routes completion when work finishes before a late cancellation takes effect", () => {
    const owner = new WorkerOwner();
    const worker = new Worker("./workers/test.wasm", "processData")
      .onComplete(owner, (target, value) => {
        target.completeCount += 1;
        target.lastMessage = value.result;
      });

    worker.start("payload");
    worker.cancel();
    handleWorkerComplete(1, "Done anyway");

    expect<i32>(owner.completeCount).toBe(1);
    expect<string>(owner.lastMessage).toBe("Done anyway");
  });
});
