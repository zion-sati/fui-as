import {
  Application,
  FlexBox,
  HandleValue,
  Node,
  Row,
  SemanticRole,
  Signal,
  Text,
  Worker,
  createManagedApplication,
  rgb,
} from "../../../src/Fui";
export * from "../../../src/FuiExports";

const FONT_REGULAR: u32 = 1;
const PANEL_TEXT: u32 = rgb(0xe2, 0xe8, 0xf0);

enum SmokeWorkerPhase {
  Idle = 0,
  Progress = 1,
  Complete = 2,
  Error = 3,
}

class SmokeApp {
  private readonly spacing: Signal<f32>;
  private readonly spacer: FlexBox;
  private readonly root: FlexBox;
  private activeWorker: Worker | null = null;
  private workerProgressCount: i32 = 0;
  private workerCompleteCount: i32 = 0;
  private workerErrorCount: i32 = 0;
  private workerPhase: SmokeWorkerPhase = SmokeWorkerPhase.Idle;

  constructor() {
    const spacing = new Signal<f32>(32.0);
    const spacer = new FlexBox().height(1.0);
    const left = new Text("left")
      .font(FONT_REGULAR, 28.0)
      .textColor(PANEL_TEXT)
      .semanticRole(SemanticRole.Heading)
      .semanticLabel("left") as Text;

    const right = new Text("right")
      .font(FONT_REGULAR, 28.0)
      .textColor(PANEL_TEXT)
      .semanticRole(SemanticRole.Heading)
      .semanticLabel("right") as Text;

    spacer.width(spacing.value);
    this.spacing = spacing;
    this.spacer = spacer;
    this.root = Row(
      left,
      spacer,
      right,
    )
      .padding(24.0, 24.0, 24.0, 24.0);
  }

  getRoot(): FlexBox {
    return this.root;
  }

  dispose(): void {
    const worker = this.activeWorker;
    if (worker !== null) {
      worker.dispose();
      this.activeWorker = null;
    }
  }

  setSpacing(next: f32): void {
    this.spacing.value = next;
    this.spacer.width(this.spacing.value);
  }

  private resetWorkerState(): void {
    const worker = this.activeWorker;
    if (worker !== null) {
      worker.dispose();
    }
    this.activeWorker = null;
    this.workerProgressCount = 0;
    this.workerCompleteCount = 0;
    this.workerErrorCount = 0;
    this.workerPhase = SmokeWorkerPhase.Idle;
  }

  private startWorker(entryName: string, input: string): void {
    this.resetWorkerState();
    const worker = Worker.start(entryName)
      .onProgress(this, (app, _progress) => {
        app.workerProgressCount += 1;
        app.workerPhase = SmokeWorkerPhase.Progress;
      })
      .onComplete(this, (app, _result) => {
        app.workerCompleteCount += 1;
        app.workerPhase = SmokeWorkerPhase.Complete;
        app.activeWorker = null;
      })
      .onError(this, (app, _message) => {
        app.workerErrorCount += 1;
        app.workerPhase = SmokeWorkerPhase.Error;
        app.activeWorker = null;
      });
    this.activeWorker = worker;
    worker.sendString(input);
  }

  startEchoWorker(): void {
    this.startWorker("smokeEchoWorker", "alpha");
  }

  startFailWorker(): void {
    this.startWorker("smokeFailWorker", "boom");
  }

  startMissingWorker(): void {
    this.startWorker("missingSmokeWorker", "missing");
  }

  startCancelableWorker(): void {
    this.startWorker("smokeCancelableWorker", "cancel");
  }

  cancelActiveWorker(): void {
    const worker = this.activeWorker;
    if (worker !== null) {
      worker.cancel();
    }
  }

  getWorkerProgressCount(): i32 {
    return this.workerProgressCount;
  }

  getWorkerCompleteCount(): i32 {
    return this.workerCompleteCount;
  }

  getWorkerErrorCount(): i32 {
    return this.workerErrorCount;
  }

  getWorkerPhase(): i32 {
    return <i32>this.workerPhase;
  }
}

const smokeHarness = createManagedApplication<SmokeApp>(
  () => new SmokeApp(),
  (app) => app.getRoot(),
  null,
  (app) => app.dispose(),
);

export function __runSmokeApp(): void {
  smokeHarness.run();
}

export function __setSmokeSpacing(next: f32): void {
  const app = smokeHarness.getActivePage();
  if (app === null) {
    return;
  }
  app.setSpacing(next);
}

export function __runSmokeAppWithNullChild(): void {
  const spacer = new FlexBox();
  spacer.child(changetype<Node>(0));
}

export function __startSmokeEchoWorker(): void {
  const app = smokeHarness.getActivePage();
  if (app === null) {
    return;
  }
  app.startEchoWorker();
}

export function __startSmokeFailWorker(): void {
  const app = smokeHarness.getActivePage();
  if (app === null) {
    return;
  }
  app.startFailWorker();
}

export function __startSmokeMissingWorker(): void {
  const app = smokeHarness.getActivePage();
  if (app === null) {
    return;
  }
  app.startMissingWorker();
}

export function __startSmokeCancelableWorker(): void {
  const app = smokeHarness.getActivePage();
  if (app === null) {
    return;
  }
  app.startCancelableWorker();
}

export function __cancelSmokeWorker(): void {
  const app = smokeHarness.getActivePage();
  if (app === null) {
    return;
  }
  app.cancelActiveWorker();
}

export function __getSmokeWorkerProgressCount(): i32 {
  const app = smokeHarness.getActivePage();
  return app === null ? 0 : app.getWorkerProgressCount();
}

export function __getSmokeWorkerCompleteCount(): i32 {
  const app = smokeHarness.getActivePage();
  return app === null ? 0 : app.getWorkerCompleteCount();
}

export function __getSmokeWorkerErrorCount(): i32 {
  const app = smokeHarness.getActivePage();
  return app === null ? 0 : app.getWorkerErrorCount();
}

export function __getSmokeWorkerPhase(): i32 {
  const app = smokeHarness.getActivePage();
  return app === null ? 0 : app.getWorkerPhase();
}
