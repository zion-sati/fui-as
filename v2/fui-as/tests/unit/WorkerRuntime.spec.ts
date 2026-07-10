import { Worker } from "../../src/worker/Worker";
import { WorkerJob } from "../../src/worker/WorkerJob";
import { demoWorkerClockWallClockSinceEpochMs } from "../../demo/src/generated/WorkerHostServices";
import { resetWorkerRuntime } from "../../src/worker/Worker";
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

let lastWorkerRuntimeEntryInput = "";

function captureWorkerRuntimeEntryInput(value: string): void {
  lastWorkerRuntimeEntryInput = value;
}

class TestWorkerJob extends WorkerJob {
  starts: i32 = 0;
  runs: i32 = 0;
  input: string = "";

  protected onStart(input: string): void {
    this.starts += 1;
    this.input = input;
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
    resetWorkerRuntime();
    setWorkerCancelled(false);
    resetCalls();
  });

  it("decodes the inbound worker entry argument", () => {
    const bytes = Uint8Array.wrap(String.UTF8.encode("hello", false));
    lastWorkerRuntimeEntryInput = "";

    Worker.entry(bytes.dataStart, <u32>bytes.length, captureWorkerRuntimeEntryInput);

    expect<string>(lastWorkerRuntimeEntryInput).toBe("hello");
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
    const job = new TestWorkerJob();

    let active: TestWorkerJob | null = WorkerJob.resume<TestWorkerJob>(job, "hello");
    expect<bool>(active !== null).toBe(true);
    expect<i32>(job.starts).toBe(1);
    expect<i32>(job.runs).toBe(1);
    expect<string>(job.input).toBe("hello");
    expect<bool>(lastWorkerProgressEquals("1")).toBe(true);
    expect<i32>(lastWorkerYieldCount()).toBe(1);

    resetCalls();
    active = WorkerJob.resume<TestWorkerJob>(job, "changed");
    expect<bool>(active === null).toBe(true);
    expect<i32>(job.starts).toBe(1);
    expect<i32>(job.runs).toBe(2);
    expect<bool>(lastWorkerProgressEquals("2")).toBe(true);
    expect<bool>(lastWorkerCompleteEquals("hello:2")).toBe(true);
  });
});
