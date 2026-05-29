import { Action, HandlerAction } from "../../src/core/Action";
import { Signal } from "../../src/core/Signal";

class CountingAction extends Action<i32> {
  count: i32 = 0;
  lastValue: i32 = -1;

  invoke(value: i32): void {
    this.count += 1;
    this.lastValue = value;
  }
}

describe("Signal", () => {
  it("notifies every attached action", () => {
    const signal = new Signal<i32>(0);
    const first = new CountingAction();
    const second = new CountingAction();

    signal.addAction(first);
    signal.addAction(second);
    signal.value = 7;

    expect<i32>(first.count).toBe(1);
    expect<i32>(first.lastValue).toBe(7);
    expect<i32>(second.count).toBe(1);
    expect<i32>(second.lastValue).toBe(7);
  });

  it("stops notifying disposed actions", () => {
    const signal = new Signal<i32>(0);
    const action = new CountingAction();

    signal.addAction(action);
    signal.value = 4;
    action.dispose();
    signal.value = 9;

    expect<i32>(action.count).toBe(1);
    expect<i32>(action.lastValue).toBe(4);
  });

  it("keeps addAction idempotent for the same signal", () => {
    const signal = new Signal<i32>(0);
    const action = new CountingAction();

    signal.addAction(action);
    signal.addAction(action);
    signal.value = 3;

    expect<i32>(action.count).toBe(1);
  });

  it("can dispatch through a reusable owner handler", () => {
    const signal = new Signal<i32>(0);
    const owner = new CountingAction();

    signal.addAction(new HandlerAction<CountingAction, i32>(owner, (target: CountingAction, value: i32): void => {
      target.invoke(value);
    }));
    signal.value = 12;

    expect<i32>(owner.count).toBe(1);
    expect<i32>(owner.lastValue).toBe(12);
  });

  it("bind attaches a HandlerAction and routes value to owner", () => {
    const signal = new Signal<i32>(0);
    const owner = new CountingAction();

    signal.bind(owner, (target: CountingAction, value: i32): void => {
      target.invoke(value);
    });
    signal.value = 42;

    expect<i32>(owner.count).toBe(1);
    expect<i32>(owner.lastValue).toBe(42);
  });

  it("bind returns a disposable Action that stops firing after dispose", () => {
    const signal = new Signal<i32>(0);
    const owner = new CountingAction();

    const action = signal.bind(owner, (target: CountingAction, value: i32): void => {
      target.invoke(value);
    });
    signal.value = 1;
    action.dispose();
    signal.value = 2;

    expect<i32>(owner.count).toBe(1);
    expect<i32>(owner.lastValue).toBe(1);
  });
});
