import { Worker } from "../../src/worker/Worker";
import { WorkerJob } from "../../src/worker/WorkerJob";
import { demoWorkerClockWallClockSinceEpochMs } from "../../demo/src/generated/WorkerHostServices";
import { __resetWorkerRuntimeForTests, __setWorkerInputForTests } from "../../src/worker/Worker";
import {
  getCallArg,
  findCall,
  CALL_WORKER_YIELD,
  lastWorkerCompleteEquals,
  lastWorkerFailureEquals,
  lastWorkerProgressEquals,
  lastWorkerYieldCount,
  resetCalls,
  setWorkerCancelled,
  setTimerNow,
} from "./FfiTestImports";

class TestWorkerJob extends WorkerJob {
  starts: i32 = 0;
  runs: i32 = 0;
  input: string = "";

  protected onStart(): void {
    this.starts += 1;
    this.input = this.receiveMessage();
  }

  run(): void {
    this.runs += 1;
    this.reportProgress(this.runs.toString());
    if (this.runs == 1) {
      this.yield(25);
      return;
    }
    this.complete(this.input + ":" + this.runs.toString());
  }
}

describe("Worker runtime", () => {
  afterEach(() => {
    __resetWorkerRuntimeForTests();
    __setWorkerInputForTests("");
    setWorkerCancelled(false);
    resetCalls();
  });

  it("reads the inbound worker message once and caches it", () => {
    __setWorkerInputForTests("hello");

    expect<string>(Worker.receiveMessage()).toBe("hello");
    __setWorkerInputForTests("changed");
    expect<string>(Worker.receiveMessage()).toBe("hello");
  });

  it("reports progress and completion through worker host imports", () => {
    Worker.reportProgress("Fetching...");
    Worker.complete("Done!");
    Worker.fail("ignored");

    expect<bool>(lastWorkerProgressEquals("Fetching...")).toBe(true);
    expect<bool>(lastWorkerCompleteEquals("Done!")).toBe(true);
    expect<bool>(lastWorkerFailureEquals("")).toBe(true);
  });

  it("reports failures and exposes the shared cancel flag", () => {
    setWorkerCancelled(true);

    expect<bool>(Worker.isCancelled()).toBe(true);
    Worker.fail("cancelled");

    expect<bool>(lastWorkerFailureEquals("cancelled")).toBe(true);
  });

  it("reads the worker clock through generated host-service bindings", () => {
    setTimerNow(1234.5);
    expect<f64>(demoWorkerClockWallClockSinceEpochMs()).toBe(1234.5);
  });

  it("requests a cooperative yield through the host surface", () => {
    expect<bool>(Worker.yield()).toBe(true);
    expect<i32>(lastWorkerYieldCount()).toBe(1);
  });

  it("can request a delayed cooperative yield through the host surface", () => {
    expect<bool>(Worker.yield(50)).toBe(true);
    expect<i32>(lastWorkerYieldCount()).toBe(1);
    const yieldCall = findCall(CALL_WORKER_YIELD);
    expect<i32>(yieldCall).toBeGreaterThan(-1);
    expect<f64>(getCallArg(yieldCall, 0)).toBe(50.0);
  });

  it("WorkerJob keeps resumable state on one persistent instance", () => {
    __setWorkerInputForTests("hello");
    const job = new TestWorkerJob();

    let active: TestWorkerJob | null = WorkerJob.resume<TestWorkerJob>(job);
    expect<bool>(active !== null).toBe(true);
    expect<i32>(job.starts).toBe(1);
    expect<i32>(job.runs).toBe(1);
    expect<string>(job.input).toBe("hello");
    expect<bool>(lastWorkerProgressEquals("1")).toBe(true);
    expect<i32>(lastWorkerYieldCount()).toBe(1);

    resetCalls();
    active = WorkerJob.resume<TestWorkerJob>(job);
    expect<bool>(active === null).toBe(true);
    expect<i32>(job.starts).toBe(1);
    expect<i32>(job.runs).toBe(2);
    expect<bool>(lastWorkerProgressEquals("2")).toBe(true);
    expect<bool>(lastWorkerCompleteEquals("hello:2")).toBe(true);
  });
});
