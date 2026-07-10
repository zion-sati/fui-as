import * as ui from "../bindings/ui";

let needsCommit: bool = false;
let flushScheduled: bool = false;
let didFirstCommit: bool = false;
const nextCommitCallbacks = new Array<() => void>();
export type AfterCommitHandler<Owner> = (owner: Owner) => void;
abstract class NextCommitRegistration {
  abstract invoke(): void;
}

class NextCommitCallbackRegistration extends NextCommitRegistration {
  constructor(private readonly callback: () => void) {
    super();
  }

  invoke(): void {
    this.callback();
  }
}

class NextCommitHandlerRegistration<Owner> extends NextCommitRegistration {
  constructor(
    private readonly owner: Owner,
    private readonly handler: AfterCommitHandler<Owner>,
  ) {
    super();
  }

  invoke(): void {
    this.handler(this.owner);
  }
}

export class LoadedEventArgs {
  static readonly Empty: LoadedEventArgs = new LoadedEventArgs();
}

// WPF-style Loaded event — fires once after the tree is built and mounted.
export type LoadedHandler<Owner> = (owner: Owner, event: LoadedEventArgs) => void;

abstract class LoadedRegistration {
  abstract invoke(): void;
}

class LoadedCallbackRegistration extends LoadedRegistration {
  constructor(private readonly callback: (event: LoadedEventArgs) => void) {
    super();
  }

  invoke(): void {
    this.callback(LoadedEventArgs.Empty);
  }
}

class LoadedHandlerRegistration<Owner> extends LoadedRegistration {
  constructor(
    private readonly owner: Owner,
    private readonly handler: LoadedHandler<Owner>,
  ) {
    super();
  }

  invoke(): void {
    this.handler(this.owner, LoadedEventArgs.Empty);
  }
}

const loadedCallbacks = new Array<LoadedRegistration>();

export function markNeedsCommit(): void {
  needsCommit = true;
  if (flushScheduled) {
    return;
  }
  flushScheduled = true;
  ui.requestRender();
}

/**
 * Register a callback that fires once after the page has been mounted and
 * the first frame has been committed.  Safe to call during `buildPage()` —
 * timers started here survive `cancelAllTimers()` in `Application.mount()`.
 */
export function onLoaded(cb: (event: LoadedEventArgs) => void): void {
  if (didFirstCommit) {
    cb(LoadedEventArgs.Empty);
    return;
  }
  loadedCallbacks.push(new LoadedCallbackRegistration(cb));
}

export function onLoadedWith<Owner>(owner: Owner, handler: LoadedHandler<Owner>): void {
  if (didFirstCommit) {
    handler(owner, LoadedEventArgs.Empty);
    return;
  }
  loadedCallbacks.push(new LoadedHandlerRegistration<Owner>(owner, handler));
}

export function onLoadedFor<Owner>(owner: Owner, handler: LoadedHandler<Owner>): void {
  onLoadedWith<Owner>(owner, handler);
}

export function fireLoadedCallbacks(): void {
  if (didFirstCommit) return;
  didFirstCommit = true;
  for (let i: i32 = 0; i < loadedCallbacks.length; i++) {
    unchecked(loadedCallbacks[i]).invoke();
  }
  loadedCallbacks.length = 0;
}

export function afterNextCommit(callback: () => void): void {
  nextCommitCallbacks.push(callback);
}

const nextCommitRegistrations = new Array<NextCommitRegistration>();

export function afterNextCommitWith<Owner>(owner: Owner, handler: AfterCommitHandler<Owner>): void {
  nextCommitRegistrations.push(new NextCommitHandlerRegistration<Owner>(owner, handler));
}

export function flushCommit(): bool {
  flushScheduled = false;
  if (!needsCommit) {
    return false;
  }
  needsCommit = false;
  ui.commitFrame();
  if (nextCommitCallbacks.length > 0) {
    const callbacks = nextCommitCallbacks.slice();
    nextCommitCallbacks.length = 0;
    for (let i: i32 = 0; i < callbacks.length; i++) {
      unchecked(callbacks[i])();
    }
  }
  if (nextCommitRegistrations.length > 0) {
    const registrations = nextCommitRegistrations.slice();
    nextCommitRegistrations.length = 0;
    for (let i: i32 = 0; i < registrations.length; i++) {
      unchecked(registrations[i]).invoke();
    }
  }
  return true;
}

export function resetCommitState(): void {
  needsCommit = false;
  flushScheduled = false;
  didFirstCommit = false;
  nextCommitCallbacks.length = 0;
  nextCommitRegistrations.length = 0;
}
