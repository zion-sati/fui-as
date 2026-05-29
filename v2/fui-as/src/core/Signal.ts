import { Action, CallbackAction, HandlerAction, SignalHandler } from "./Action";
import { markNeedsCommit } from "./FrameScheduler";
import { describeValue, log } from "./Logger";

export class Signal<T> {
  private currentValue: T;
  private head: Action<T> | null = null;

  constructor(initial: T) {
    this.currentValue = initial;
  }

  get value(): T {
    return this.currentValue;
  }

  set value(next: T) {
    this.set(next);
  }

  set(next: T): bool {
    if (this.currentValue === next) {
      return false;
    }
    this.currentValue = next;
    log("Signal", "value changed to " + describeValue<T>(next));
    const notified = this.head !== null;
    let current = this.head;
    while (current !== null) {
      const nextAction = current.next;
      log("Action", current.debugName() + " invoked with " + describeValue<T>(next));
      changetype<Action<T>>(current).invoke(next);
      current = nextAction;
    }
    if (notified) {
      markNeedsCommit();
    }
    return true;
  }

  hasListeners(): bool {
    return this.head !== null;
  }

  addAction(action: Action<T>): Action<T> {
    if (action._isAttachedTo(this)) {
      return action;
    }
    action.dispose();
    action.next = null;
    if (this.head === null) {
      this.head = action;
    } else {
      let current = changetype<Action<T>>(this.head);
      while (current.next !== null) {
        current = changetype<Action<T>>(current.next);
      }
      current.next = action;
    }
    action._attach(this);
    return action;
  }

  bind<Owner>(owner: Owner, handler: SignalHandler<Owner, T>): Action<T> {
    return this.addAction(new HandlerAction<Owner, T>(owner, handler));
  }

  subscribe(callback: () => void): Action<T> {
    return this.addAction(new CallbackAction<T>(callback));
  }

  removeAction(target: Action<T>): void {
    let previous: Action<T> | null = null;
    let current = this.head;
    while (current !== null) {
      if (current === target) {
        if (previous === null) {
          this.head = current.next;
        } else {
          previous.next = current.next;
        }
        target._detach();
        return;
      }
      previous = current;
      current = current.next;
    }
  }
}
