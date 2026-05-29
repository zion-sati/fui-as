import { Node } from "./Node";
import { Disposable } from "./Disposable";
import { Signal } from "./Signal";

export type SignalHandler<Owner, T> = (owner: Owner, value: T) => void;

export abstract class Action<T> implements Disposable {
  next: Action<T> | null = null;
  private signal: Signal<T> | null = null;

  abstract invoke(value: T): void;

  debugName(): string {
    return "Action";
  }

  dispose(): void {
    const signal = this.signal;
    if (signal !== null) {
      signal.removeAction(this);
    }
  }

  _attach(signal: Signal<T>): void {
    this.signal = signal;
  }

  _detach(): void {
    this.signal = null;
    this.next = null;
  }

  _isAttachedTo(signal: Signal<T>): bool {
    return this.signal === signal;
  }

  detach(): void {
    this.dispose();
  }
}

export class CallbackAction<T> extends Action<T> {
  private readonly callback: () => void;

  constructor(callback: () => void) {
    super();
    this.callback = callback;
  }

  invoke(_value: T): void {
    this.callback();
  }

  debugName(): string {
    return "CallbackAction";
  }
}

export class HandlerAction<Owner, T> extends Action<T> {
  private readonly owner: Owner;
  private readonly handler: SignalHandler<Owner, T>;

  constructor(owner: Owner, handler: SignalHandler<Owner, T>) {
    super();
    this.owner = owner;
    this.handler = handler;
  }

  invoke(value: T): void {
    this.handler(this.owner, value);
  }

  debugName(): string {
    return "HandlerAction";
  }
}


export abstract class NodeAction<T> extends Action<T> {
  protected readonly node: Node;

  constructor(node: Node) {
    super();
    this.node = node;
  }

  protected get handle(): u64 {
    return this.node.builtHandle;
  }

  debugName(): string {
    return "NodeAction";
  }
}
