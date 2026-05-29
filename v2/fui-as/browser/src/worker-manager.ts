import type {
  WorkerBootstrapInboundMessage,
  WorkerBootstrapOutboundMessage,
  WorkerHostServicesBundleConfig,
  WorkerManifest,
} from './worker-types';

interface WorkerHarnessExports {
  __fui_on_worker_progress(workerId: number, textPtr: number, textLen: number): void;
  __fui_on_worker_complete(workerId: number, textPtr: number, textLen: number): void;
  __fui_on_worker_error(workerId: number, textPtr: number, textLen: number): void;
}

export interface WorkerHarnessSession {
  readonly exports: WorkerHarnessExports;
  readonly memory: WebAssembly.Memory;
  readonly textBufferPtr: number;
  readonly textBufferSize: number;
}

interface WorkerTextSession {
  readonly memory: WebAssembly.Memory;
  readonly textBufferPtr: number;
  readonly textBufferSize: number;
}

interface WorkerRecord {
  worker: Worker | null;
  cancelled: boolean;
}

export interface WorkerManager {
  startString(workerId: number, entryName: string, input: string): void;
  cancel(workerId: number): void;
  terminateAll(): void;
}

interface WorkerManagerOptions {
  readonly scriptBaseUrl: string;
  readonly getCurrentSession: () => WorkerHarnessSession | null;
  readonly getCurrentWorkerHostServices: () => WorkerHostServicesBundleConfig | undefined;
  readonly writeTextCallbackPayload: (session: WorkerTextSession, text: string, context: string) => number;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function validateManifest(value: unknown): WorkerManifest {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Malformed worker manifest: expected an object.');
  }
  const candidate = value as { version?: unknown; entries?: unknown; };
  if (candidate.version !== 1) {
    throw new Error('Malformed worker manifest: expected version 1.');
  }
  if (typeof candidate.entries !== 'object' || candidate.entries === null) {
    throw new Error('Malformed worker manifest: expected an entries object.');
  }
  for (const [entryName, entryUrl] of Object.entries(candidate.entries as Record<string, unknown>)) {
    if (typeof entryName !== 'string' || entryName.length === 0 || typeof entryUrl !== 'string' || entryUrl.length === 0) {
      throw new Error('Malformed worker manifest: each entry must map a non-empty name to a non-empty URL.');
    }
  }
  return candidate as WorkerManifest;
}

export function createWorkerManager(options: WorkerManagerOptions): WorkerManager {
  const workerBootstrapUrl = new URL('./worker-bootstrap.js', options.scriptBaseUrl).toString();
  const workerManifestUrl = new URL('./worker-manifest.json', options.scriptBaseUrl).toString();
  const records = new Map<number, WorkerRecord>();
  let manifestPromise: Promise<WorkerManifest> | null = null;

  function emitToSession(workerId: number, kind: 'progress' | 'complete' | 'error', text: string): void {
    const session = options.getCurrentSession();
    if (session === null) {
      return;
    }
    try {
      const textLength = options.writeTextCallbackPayload(session, text, `Worker ${kind} payload`);
      const textPtr = textLength > 0 ? session.textBufferPtr : 0;
      if (kind === 'progress') {
        session.exports.__fui_on_worker_progress(workerId, textPtr, textLength);
        return;
      }
      if (kind === 'complete') {
        session.exports.__fui_on_worker_complete(workerId, textPtr, textLength);
        return;
      }
      session.exports.__fui_on_worker_error(workerId, textPtr, textLength);
    } catch (error: unknown) {
      console.error(`[fui-worker] failed to deliver ${kind} payload for worker ${String(workerId)}: ${describeError(error)}`);
      if (kind !== 'error') {
        emitToSession(workerId, 'error', `Worker ${kind} delivery failed: ${describeError(error)}`);
      }
    }
  }

  function finishWorker(workerId: number): void {
    const record = records.get(workerId);
    if (record === undefined) {
      return;
    }
    record.worker?.terminate();
    records.delete(workerId);
  }

  function handleWorkerMessage(workerId: number, message: WorkerBootstrapOutboundMessage): void {
    const record = records.get(workerId);
    if (record === undefined) {
      return;
    }
    if (message.type === 'progress') {
      if (!record.cancelled) {
        emitToSession(workerId, 'progress', message.text);
      }
      return;
    }
    if (message.type === 'complete') {
      emitToSession(workerId, 'complete', message.text);
      finishWorker(workerId);
      return;
    }
    emitToSession(workerId, 'error', message.text);
    finishWorker(workerId);
  }

  function loadManifest(): Promise<WorkerManifest> {
    if (manifestPromise !== null) {
      return manifestPromise;
    }
    manifestPromise = fetch(workerManifestUrl, {
      cache: 'no-store',
      credentials: 'same-origin',
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to load worker manifest from ${workerManifestUrl}.`);
      }
      return validateManifest(await response.json());
    });
    return manifestPromise;
  }

  async function startWorkerAsync(workerId: number, entryName: string, input: string): Promise<void> {
    const record = records.get(workerId);
    if (record === undefined) {
      return;
    }
    try {
      const manifest = await loadManifest();
      if (records.get(workerId) !== record) {
        return;
      }
      const workerModuleUrl = manifest.entries[entryName];
      if (typeof workerModuleUrl !== 'string' || workerModuleUrl.length === 0) {
        emitToSession(workerId, 'error', `Unknown worker entry "${entryName}".`);
        finishWorker(workerId);
        return;
      }
      const worker = new Worker(workerBootstrapUrl);
      if (records.get(workerId) !== record) {
        worker.terminate();
        return;
      }
      record.worker = worker;
      worker.addEventListener('message', (event: MessageEvent<WorkerBootstrapOutboundMessage>) => {
        handleWorkerMessage(workerId, event.data);
      });
      worker.addEventListener('error', (event: ErrorEvent) => {
        const active = records.get(workerId);
        if (active === undefined) {
          return;
        }
        emitToSession(workerId, 'error', event.message.length > 0 ? event.message : 'Worker bootstrap crashed.');
        finishWorker(workerId);
      });
      const message: WorkerBootstrapInboundMessage = {
        type: 'start',
        workerId,
        wasmUrl: new URL(workerModuleUrl, workerManifestUrl).toString(),
        entryName,
        input,
        workerHostServices: options.getCurrentWorkerHostServices(),
      };
      worker.postMessage(message);
      if (record.cancelled) {
        worker.postMessage({
          type: 'cancel',
          workerId,
        });
      }
    } catch (error: unknown) {
      emitToSession(workerId, 'error', describeError(error));
      finishWorker(workerId);
    }
  }

  return {
    startString(workerId: number, entryName: string, input: string): void {
      if (records.has(workerId)) {
        emitToSession(workerId, 'error', 'Worker already started.');
        return;
      }
      records.set(workerId, {
        worker: null,
        cancelled: false,
      });
      void startWorkerAsync(workerId, entryName, input);
    },
    cancel(workerId: number): void {
      const record = records.get(workerId);
      if (record === undefined) {
        return;
      }
      record.cancelled = true;
      if (record.worker !== null) {
        record.worker.postMessage({
          type: 'cancel',
          workerId,
        });
      }
    },
    terminateAll(): void {
      for (const record of records.values()) {
        record.worker?.terminate();
      }
      records.clear();
    },
  };
}
