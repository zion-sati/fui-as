export * from "../../../../src/FuiWorkerExports";

import { WorkerJob, WorkerRuntime as Worker } from "../../../../src/FuiWorker";

const CANCEL_WORK_LIMIT: i32 = 60_000_000;
const CANCEL_WORK_CHUNK: i32 = 250_000;

export function smokeEchoWorker(): void {
  const input = Worker.receiveMessage();
  Worker.reportProgress("started:" + input);
  Worker.complete("done:" + input);
}

export function smokeFailWorker(): void {
  const input = Worker.receiveMessage();
  Worker.reportProgress("started:" + input);
  Worker.fail("failed:" + input);
}

class SmokeCancelableJob extends WorkerJob {
  private input: string = "";
  private checksum: i32 = 0;
  private index: i32 = 0;

  protected onStart(): void {
    this.input = this.receiveMessage();
    this.checksum = 0;
    this.index = 0;
    this.reportProgress("started:" + this.input);
  }

  run(): void {
    if (this.isCancelled()) {
      this.fail("cancelled:" + this.input);
      return;
    }
    const chunkEnd = min<i32>(this.index + CANCEL_WORK_CHUNK, CANCEL_WORK_LIMIT);
    while (this.index < chunkEnd) {
      this.checksum += this.index & 7;
      this.index += 1;
    }
    if (this.index < CANCEL_WORK_LIMIT) {
      if (this.yield()) {
        return;
      }
    }
    this.complete(this.checksum.toString());
  }
}

let smokeCancelableJob: SmokeCancelableJob | null = null;

export function smokeCancelableWorker(): void {
  let activeJob = smokeCancelableJob;
  if (activeJob === null) {
    activeJob = new SmokeCancelableJob();
  }
  smokeCancelableJob = WorkerJob.resume<SmokeCancelableJob>(activeJob);
}
