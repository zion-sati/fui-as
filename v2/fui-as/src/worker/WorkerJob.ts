import { Worker } from "./Worker";

export abstract class WorkerJob {
  private started: bool = false;
  private finished: bool = false;

  static resume<T extends WorkerJob>(job: T): T | null {
    job.ensureStarted();
    if (job.finished) {
      return null;
    }
    job.run();
    return job.finished ? null : job;
  }

  protected onStart(): void {}

  abstract run(): void;

  protected receiveMessage(): string {
    return Worker.receiveMessage();
  }

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

  private ensureStarted(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.onStart();
  }
}
