import { Callback1, Handler1 } from "./Callbacks";
import { Disposable } from "./Disposable";
import { throwNullArgument } from "./Errors";
import { fui_worker_cancel, fui_worker_start_string } from "./ffi";
import { warn } from "./Logger";
import { bind1 } from "./bind";

const FUNCTION_START = "Worker.start";
const FUNCTION_SEND_STRING = "Worker.sendString";

const activeWorkers = new Map<u32, Worker>();
let nextWorkerId: u32 = 1;

function encodeUtf8(text: string): Uint8Array {
  return Uint8Array.wrap(String.UTF8.encode(text, false));
}

function unregisterWorker(workerId: u32): void {
  activeWorkers.delete(workerId);
}

function findWorker(workerId: u32): Worker | null {
  return activeWorkers.has(workerId) ? unchecked(activeWorkers.get(workerId)) : null;
}

export class Worker implements Disposable {
  private readonly workerId: u32;
  private readonly entryName: string;
  private progressBinding: Callback1<string> | null = null;
  private completeBinding: Callback1<string> | null = null;
  private errorBinding: Callback1<string> | null = null;
  private started: bool = false;
  private finished: bool = false;
  private cancelRequested: bool = false;

  private constructor(workerId: u32, entryName: string) {
    this.workerId = workerId;
    this.entryName = entryName;
  }

  static start(entryName: string): Worker {
    if (changetype<usize>(entryName) == 0) {
      throwNullArgument(FUNCTION_START, "entryName");
    }
    const workerId = nextWorkerId++;
    const worker = new Worker(workerId, entryName);
    activeWorkers.set(workerId, worker);
    return worker;
  }

  onProgress<Owner>(owner: Owner, handler: Handler1<Owner, string>): this {
    this.progressBinding = bind1<Owner, string>(owner, handler);
    return this;
  }

  onProgressWith<Owner>(owner: Owner, handler: Handler1<Owner, string>): this {
    return this.onProgress<Owner>(owner, handler);
  }

  onComplete<Owner>(owner: Owner, handler: Handler1<Owner, string>): this {
    this.completeBinding = bind1<Owner, string>(owner, handler);
    return this;
  }

  onCompleteWith<Owner>(owner: Owner, handler: Handler1<Owner, string>): this {
    return this.onComplete<Owner>(owner, handler);
  }

  onError<Owner>(owner: Owner, handler: Handler1<Owner, string>): this {
    this.errorBinding = bind1<Owner, string>(owner, handler);
    return this;
  }

  onErrorWith<Owner>(owner: Owner, handler: Handler1<Owner, string>): this {
    return this.onError<Owner>(owner, handler);
  }

  sendString(input: string): this {
    if (changetype<usize>(input) == 0) {
      throwNullArgument(FUNCTION_SEND_STRING, "input");
    }
    if (this.finished) {
      warn("Worker", "sendString ignored after the worker already finished.");
      return this;
    }
    if (this.started) {
      warn("Worker", "sendString ignored because one-shot workers only accept one input.");
      return this;
    }
    this.started = true;
    const entryBytes = encodeUtf8(this.entryName);
    const inputBytes = encodeUtf8(input);
    fui_worker_start_string(
      this.workerId,
      entryBytes.length > 0 ? entryBytes.dataStart : 0,
      <u32>entryBytes.length,
      inputBytes.length > 0 ? inputBytes.dataStart : 0,
      <u32>inputBytes.length,
    );
    return this;
  }

  cancel(): void {
    if (!this.started || this.finished || this.cancelRequested) {
      return;
    }
    this.cancelRequested = true;
    fui_worker_cancel(this.workerId);
  }

  dispose(): void {
    if (!this.finished && this.started) {
      fui_worker_cancel(this.workerId);
    }
    this.finish();
  }

  private dispatchProgress(message: string): void {
    if (this.finished || this.cancelRequested) {
      return;
    }
    const binding = this.progressBinding;
    if (binding !== null) {
      binding.invoke(message);
    }
  }

  private dispatchComplete(result: string): void {
    if (this.finished) {
      return;
    }
    const binding = this.completeBinding;
    this.finish();
    if (binding !== null) {
      binding.invoke(result);
    }
  }

  private dispatchError(message: string): void {
    if (this.finished) {
      return;
    }
    const binding = this.errorBinding;
    this.finish();
    if (binding !== null) {
      binding.invoke(message);
    }
  }

  private finish(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.progressBinding = null;
    this.completeBinding = null;
    this.errorBinding = null;
    unregisterWorker(this.workerId);
  }
}

export function handleWorkerProgress(workerId: u32, message: string): void {
  const worker = findWorker(workerId);
  if (worker === null) {
    return;
  }
  worker.dispatchProgress(message);
}

export function handleWorkerComplete(workerId: u32, result: string): void {
  const worker = findWorker(workerId);
  if (worker === null) {
    return;
  }
  worker.dispatchComplete(result);
}

export function handleWorkerError(workerId: u32, message: string): void {
  const worker = findWorker(workerId);
  if (worker === null) {
    return;
  }
  worker.dispatchError(message);
}

export function disposeAllWorkers(): void {
  const workers = activeWorkers.values();
  for (let index = 0; index < workers.length; ++index) {
    unchecked(workers[index]).dispose();
  }
}

export function __resetWorkerControllersForTests(): void {
  disposeAllWorkers();
  nextWorkerId = 1;
}
