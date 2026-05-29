export interface WorkerManifest {
  readonly version: 1;
  readonly entries: Readonly<Record<string, string>>;
}

export interface WorkerHostServicesBundleConfig {
  readonly scriptUrl: string;
  readonly exportName: string;
}

export interface WorkerBootstrapStartMessage {
  readonly type: "start";
  readonly workerId: number;
  readonly wasmUrl: string;
  readonly entryName: string;
  readonly input: string;
  readonly workerHostServices?: WorkerHostServicesBundleConfig;
}

export interface WorkerBootstrapCancelMessage {
  readonly type: "cancel";
  readonly workerId: number;
}

export type WorkerBootstrapInboundMessage =
  | WorkerBootstrapStartMessage
  | WorkerBootstrapCancelMessage;

export interface WorkerBootstrapProgressMessage {
  readonly type: "progress";
  readonly workerId: number;
  readonly text: string;
}

export interface WorkerBootstrapCompleteMessage {
  readonly type: "complete";
  readonly workerId: number;
  readonly text: string;
}

export interface WorkerBootstrapErrorMessage {
  readonly type: "error";
  readonly workerId: number;
  readonly text: string;
}

export type WorkerBootstrapOutboundMessage =
  | WorkerBootstrapProgressMessage
  | WorkerBootstrapCompleteMessage
  | WorkerBootstrapErrorMessage;
