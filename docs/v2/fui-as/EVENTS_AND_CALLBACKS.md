# Events and Callbacks (v2 FUI-AS)

This page documents callback behavior contracts for SDK consumers.

## Node-level pointer callbacks

Available on nodes/controls that inherit `Node`:

- `onPointerDown((x, y) => ...)`
- `onPointerMove((x, y) => ...)`
- `onPointerUp((x, y) => ...)`
- `onPointerEnter(() => ...)`
- `onPointerLeave(() => ...)`
- `onClick(() => ...)`

### Ordering and trigger semantics

For pointer-down events:

1. `onPointerDown` callback runs first (if set).
2. `onClick` runs next (if set).

`onClick` is currently **pointer-down based** (not pointer-up based) on base `Node`, except for nodes that opt into drag-data participation. Drag-enabled nodes defer click until pointer-up so the drag gesture can suppress click once the threshold is crossed.

## Node-level focus and key callbacks

- `onFocusChanged((focused) => ...)`
- `onKeyDown((key, modifiers) => ...)`
- `onKeyUp((key, modifiers) => ...)`

### Key handling contract

- If `onKeyDown` is set, key-down returns handled for that node.
- If only `onKeyUp` is set, key-up callback runs on key-up events.
- Disabled nodes do not handle key callbacks.

## Owner-bound callback variants

Many controls expose `...With(owner, handler)` APIs (for example `onChangedWith`, `onFocusChangedWith`, `onSelectionChangedWith`).

Contract:

- direct callback and owner-bound callback are mutually exclusive on the same hook
- setting one replaces the other

## Text callbacks

For text controls (`TextCore`, `TextInput`, `TextArea`):

- text callbacks (`onChanged` / `onTextChanged`) run after internal value state is updated
- selection callbacks (`onSelectionChanged`) run after selection state is updated
- focus callbacks run after control focus state is updated

This gives state-first callback behavior.

## Signal callbacks (`Signal<T>`)

- `Signal` listeners are invoked in registration order.
- `signal.bind(owner, handler)` is the owner-bound shorthand.
- `addAction(...)` / `subscribe(...)` listeners can be disposed.
- No callback runs if the new value is strictly equal to the previous value.

## Drag gesture signals (`DragGesture`)

The shipped phase-1 drag foundation is a low-level `DragGesture` helper for custom node/control authors.

- `drag.started: Signal<DragStartedEvent>`
- `drag.delta: Signal<DragDeltaEvent>`
- `drag.completed: Signal<DragCompletedEvent>`
- `drag.dragging: Signal<bool>`
- `drag.threshold(value)` configures the drag-start threshold.
- `drag.cancel()` ends an active drag and emits a cancelled completion when a drag had already started.

Practical contract:

- `started` fires once the configured threshold is crossed, or immediately when the threshold is `0`.
- `delta` reports both per-step delta and total delta from the drag start point.
- `completed` fires only for drags that actually started; press/release below threshold does not emit a completion.
- The current phase-1 surface is intentionally AssemblyScript-friendly: consumers should prefer `signal.bind(owner, handler)` / `HandlerAction` style wiring instead of captured closures.

## Drag/drop callbacks (`Node` + `DragSession`)

The shipped phase-3 drag/drop surface layers declarative source/target participation on top of `DragGesture`.

- source-side:
  - `dragData(() => DragDataObject | null)`
  - `bindDragData<Owner>(owner, handler)`
  - `dragAllowedEffects(...)`
  - `onDragCompleted(...)`
  - `onDragCompletedWith<Owner>(...)`
- target-side:
  - `allowDrop(true)`
  - `onDragEnter(...)` / `onDragEnterWith(...)`
  - `onDragOver(...)` / `onDragOverWith(...)`
  - `onDragLeave(...)` / `onDragLeaveWith(...)`
  - `onDrop(...)` / `onDropWith(...)`
- session-side:
  - `DragSession.onCompleted(...)`
  - `DragSession.onCompletedWith<Owner>(...)`
  - `DragSession.cancel()`

Practical contract:

- drag data is created lazily once the drag threshold is crossed, not on pointer-down
- the source keeps pointer capture while the router still resolves the currently pointed drop target from the live routed handle
- `onDragEnter` / `onDragOver` return a `DropProposal`; the router masks the requested effect against the source's allowed-effects set before `Drop` / completion observe the result
- `onDragLeave` fires when the active target changes or the session ends
- `onDrop` only fires when the final negotiated effect is not `None`
- owner-bound `...With(...)` forms remain the design-center API for AssemblyScript consumers

## Global key handlers (modal/overlay surfaces)

Controls like `Dialog`, `Dropdown`, and `ContextMenu` can register global key handling while open.

Contract:

- top-most active handler runs first
- handler stack is unwound when overlays close
- `Escape` handling is typically owned by the active modal/menu surface

See [Keyboard policy](./KEYBOARD_POLICY.md) for key maps by control.

## Practical guidance

1. Use `onPointerDown`/`onPointerUp` when you need explicit press/release phases.
2. Use control-level semantic callbacks (`onChanged`, `onAccept`, etc.) over raw pointer/key hooks when available.
3. Prefer owner-bound `...With(...)` callbacks for long-lived controller objects.
4. For custom drag handles, prefer `DragGesture` + owner-bound `Signal.bind(...)` wiring over ad hoc pointer-delta bookkeeping.

## See also

- [SDK docs index](./SDK_INDEX.md)
- [Accessibility and semantics](./ACCESSIBILITY_AND_SEMANTICS.md)
- [Keyboard policy](./KEYBOARD_POLICY.md)
- [Overlays and portals](./OVERLAYS_AND_PORTALS.md)
