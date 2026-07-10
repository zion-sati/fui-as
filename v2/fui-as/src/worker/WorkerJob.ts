import { Worker } from "./Worker";

export abstract class WorkerJob {
  private started: bool = false;
  private finished: bool = false;

  static resume<T extends WorkerJob>(job: T, input: string = ""): T | null {
    job.ensureStarted(input);
    if (job.finished) {
      return null;
    }
    job.run();
    return job.finished ? null : job;
  }

  protected onStart(input: string): void {}

  abstract run(): void;

  protected reportProgress(progress: string): void {
    if (this.finished) {
      return;
    }
    Worker.reportProgress(progress);
  }

  protected complete(result: string): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    Worker.complete(result);
  }

  protected fail(message: string): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    Worker.fail(message);
  }

  protected isCancelled(): bool {
    return Worker.isCancelled();
  }

  protected yield(delayMs: i32 = 0): bool {
    if (this.finished) {
      return false;
    }
    return Worker.yield(delayMs);
  }

  private ensureStarted(input: string): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.onStart(input);
  }
}
