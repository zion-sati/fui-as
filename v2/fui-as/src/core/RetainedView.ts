import { Disposable, disposeAll } from "./Disposable";
import { EventRouter } from "./EventRouter";
import { Node } from "./Node";

export type RetainedViewLifecycleHandler = (view: RetainedView) => void;

export class RetainedView implements Disposable {
  private readonly retainedResources: Array<Disposable> = new Array<Disposable>();
  private readonly activationHandlers: Array<RetainedViewLifecycleHandler> = new Array<RetainedViewLifecycleHandler>();
  private readonly deactivationHandlers: Array<RetainedViewLifecycleHandler> = new Array<RetainedViewLifecycleHandler>();
  private readonly disposalHandlers: Array<RetainedViewLifecycleHandler> = new Array<RetainedViewLifecycleHandler>();
  private activeValue: bool = false;
  private disposedValue: bool = false;

  constructor(readonly root: Node) {}

  retain(resource: Disposable): this {
    if (this.disposedValue) {
      resource.dispose();
      return this;
    }
    this.retainedResources.push(resource);
    return this;
  }

  onActivate(handler: RetainedViewLifecycleHandler): this {
    this.activationHandlers.push(handler);
    return this;
  }

  onDeactivate(handler: RetainedViewLifecycleHandler): this {
    this.deactivationHandlers.push(handler);
    return this;
  }

  onDispose(handler: RetainedViewLifecycleHandler): this {
    this.disposalHandlers.push(handler);
    return this;
  }

  get isActive(): bool { return this.activeValue; }
  get isDisposed(): bool { return this.disposedValue; }

  activate(): void {
    if (this.disposedValue || this.activeValue) return;
    this.activeValue = true;
    for (let i = 0; i < this.activationHandlers.length; ++i) unchecked(this.activationHandlers[i])(this);
  }

  deactivate(): void {
    if (this.disposedValue || !this.activeValue) return;
    EventRouter.deactivateSubtree(this.root);
    this.activeValue = false;
    for (let i = 0; i < this.deactivationHandlers.length; ++i) unchecked(this.deactivationHandlers[i])(this);
  }

  dispose(): void {
    if (this.disposedValue) return;
    this.deactivate();
    this.disposedValue = true;
    for (let i = 0; i < this.disposalHandlers.length; ++i) unchecked(this.disposalHandlers[i])(this);
    disposeAll(this.retainedResources);
    this.root.dispose();
    this.activationHandlers.length = 0;
    this.deactivationHandlers.length = 0;
    this.disposalHandlers.length = 0;
  }
}

export function retainedView(root: Node): RetainedView {
  return new RetainedView(root);
}
