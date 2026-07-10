import { Callback1, Handler1 } from "./Callbacks";
import { Disposable } from "./Disposable";
import { throwNullArgument } from "./Errors";
import { fui_worker_cancel, fui_worker_start_string } from "./ffi";
import { warn } from "./Logger";
import { bind1 } from "./bind";

const FUNCTION_START = "Worker.start";
const FUNCTION_CONSTRUCTOR = "Worker.constructor";
const MAX_WORKER_START_INPUT_BYTES: i32 = 1024 * 1024;

const activeWorkers = new Map<u32, Worker>();
let nextWorkerId: u32 = 1;

function encodeUtf8(text: string): Uint8Array {
  return Uint8Array.wrap(String.UTF8.encode(text, false));
}

function isWorkerStartInputWithinLimit(inputByteLength: i32): bool {
  return inputByteLength <= MAX_WORKER_START_INPUT_BYTES;
}

function unregisterWorker(workerId: u32): void {
  activeWorkers.delete(workerId);
}

function findWorker(workerId: u32): Worker | null {
  return activeWorkers.has(workerId) ? unchecked(activeWorkers.get(workerId)) : null;
}

export class WorkerProgressEventArgs {
  readonly message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class WorkerCompletedEventArgs {
  readonly result: string;

  constructor(result: string) {
    this.result = result;
  }
}

export class WorkerErrorEventArgs {
  readonly message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class Worker implements Disposable {
  private readonly workerId: u32;
  private readonly wasmPath: string;
  private readonly entryName: string;
  private progressBinding: Callback1<WorkerProgressEventArgs> | null = null;
  private completeBinding: Callback1<WorkerCompletedEventArgs> | null = null;
  private errorBinding: Callback1<WorkerErrorEventArgs> | null = null;
  private started: bool = false;
  private finished: bool = false;
  private cancelRequested: bool = false;

  constructor(wasmPath: string, entryName: string) {
    if (changetype<usize>(wasmPath) == 0) {
      throwNullArgument(FUNCTION_CONSTRUCTOR, "wasmPath");
    }
    if (changetype<usize>(entryName) == 0) {
      throwNullArgument(FUNCTION_CONSTRUCTOR, "entryName");
    }
    this.workerId = nextWorkerId++;
    this.wasmPath = wasmPath;
    this.entryName = entryName;
    activeWorkers.set(this.workerId, this);
  }

  onProgress<Owner>(owner: Owner, handler: Handler1<Owner, WorkerProgressEventArgs>): this {
    this.progressBinding = bind1<Owner, WorkerProgressEventArgs>(owner, handler);
    return this;
  }

  onProgressWith<Owner>(owner: Owner, handler: Handler1<Owner, WorkerProgressEventArgs>): this {
    return this.onProgress<Owner>(owner, handler);
  }

  onComplete<Owner>(owner: Owner, handler: Handler1<Owner, WorkerCompletedEventArgs>): this {
    this.completeBinding = bind1<Owner, WorkerCompletedEventArgs>(owner, handler);
    return this;
  }

  onCompleteWith<Owner>(owner: Owner, handler: Handler1<Owner, WorkerCompletedEventArgs>): this {
    return this.onComplete<Owner>(owner, handler);
  }

  onError<Owner>(owner: Owner, handler: Handler1<Owner, WorkerErrorEventArgs>): this {
    this.errorBinding = bind1<Owner, WorkerErrorEventArgs>(owner, handler);
    return this;
  }

  onErrorWith<Owner>(owner: Owner, handler: Handler1<Owner, WorkerErrorEventArgs>): this {
    return this.onError<Owner>(owner, handler);
  }

  start(input: string): this {
    if (changetype<usize>(input) == 0) {
      throwNullArgument(FUNCTION_START, "input");
    }
    if (this.finished) {
      warn("Worker", "start ignored after the worker already finished.");
      return this;
    }
    if (this.started) {
      warn("Worker", "start ignored because one-shot workers only accept one input.");
      return this;
    }
    const wasmPathBytes = encodeUtf8(this.wasmPath);
    const entryBytes = encodeUtf8(this.entryName);
    const inputBytes = encodeUtf8(input);
    if (!isWorkerStartInputWithinLimit(inputBytes.length)) {
      this.started = true;
      this.dispatchError("Worker.start input exceeds the maximum UTF-8 payload size.");
      return this;
    }
    this.started = true;
    fui_worker_start_string(
      this.workerId,
      wasmPathBytes.length > 0 ? wasmPathBytes.dataStart : 0,
      <u32>wasmPathBytes.length,
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
      binding.invoke(new WorkerProgressEventArgs(message));
    }
  }

  private dispatchComplete(result: string): void {
    if (this.finished) {
      return;
    }
    const binding = this.completeBinding;
    this.finish();
    if (binding !== null) {
      binding.invoke(new WorkerCompletedEventArgs(result));
    }
  }

  private dispatchError(message: string): void {
    if (this.finished) {
      return;
    }
    const binding = this.errorBinding;
    this.finish();
    if (binding !== null) {
      binding.invoke(new WorkerErrorEventArgs(message));
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

export function resetWorkerControllers(): void {
  disposeAllWorkers();
  nextWorkerId = 1;
}
