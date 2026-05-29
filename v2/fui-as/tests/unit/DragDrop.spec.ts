import {
  DragDataObject,
  DragDropEffects,
  DragEventArgs,
  DragSession,
  DropProposal,
  FlexBox,
  PointerEventType,
} from "../../src/Fui";
import { EventRouter } from "../../src/core/EventRouter";

function makeHandle(index: u32, generation: u32): u64 {
  return (<u64>generation << 32) | <u64>index;
}

class DragDropHarness {
  dragDataCalls: i32 = 0;
  sourceClickCount: i32 = 0;
  targetEnterCount: i32 = 0;
  targetOverCount: i32 = 0;
  targetLeaveCount: i32 = 0;
  dropCount: i32 = 0;
  completedCount: i32 = 0;
  sessionCompletedCount: i32 = 0;
  lastCompletedEffect: DragDropEffects = DragDropEffects.None;
  lastSessionEffect: DragDropEffects = DragDropEffects.None;
  lastDroppedText: string | null = null;
  proposalEffect: DragDropEffects = DragDropEffects.Move;
  sessionValue: DragSession | null = null;

  provideDragData(): DragDataObject {
    this.dragDataCalls += 1;
    return new DragDataObject()
      .setText("payload")
      .setFormat("application/x-effindom-id", "row-7");
  }

  handleSourceClick(): void {
    this.sourceClickCount += 1;
  }

  handleTargetEnter(args: DragEventArgs): DropProposal {
    this.targetEnterCount += 1;
    this.sessionValue = args.session.onCompletedWith<DragDropHarness>(this, (owner: DragDropHarness, effect: DragDropEffects): void => {
      owner.sessionCompletedCount += 1;
      owner.lastSessionEffect = effect;
    });
    return new DropProposal(this.proposalEffect, false);
  }

  handleTargetOver(_args: DragEventArgs): DropProposal {
    this.targetOverCount += 1;
    return new DropProposal(this.proposalEffect, false);
  }

  handleTargetLeave(_args: DragEventArgs): void {
    this.targetLeaveCount += 1;
  }

  handleDrop(args: DragEventArgs): void {
    this.dropCount += 1;
    this.lastDroppedText = args.session.data.getText();
  }

  handleDragCompleted(effect: DragDropEffects): void {
    this.completedCount += 1;
    this.lastCompletedEffect = effect;
  }
}

describe("DragDrop", () => {
  it("starts lazily, suppresses click, and completes drops with the negotiated effect", () => {
    EventRouter.reset();

    const owner = new DragDropHarness();
    const root = new FlexBox();
    const source = new FlexBox()
      .onClickWith<DragDropHarness>(owner, (current: DragDropHarness): void => current.handleSourceClick())
      .bindDragData<DragDropHarness>(owner, (current: DragDropHarness): DragDataObject => current.provideDragData())
      .dragAllowedEffects(DragDropEffects.Copy | DragDropEffects.Move)
      .onDragCompletedWith<DragDropHarness>(owner, (current: DragDropHarness, effect: DragDropEffects): void =>
        current.handleDragCompleted(effect)
      );
    const target = new FlexBox()
      .allowDrop(true)
      .onDragEnterWith<DragDropHarness>(owner, (current: DragDropHarness, args: DragEventArgs): DropProposal =>
        current.handleTargetEnter(args)
      )
      .onDragOverWith<DragDropHarness>(owner, (current: DragDropHarness, args: DragEventArgs): DropProposal =>
        current.handleTargetOver(args)
      )
      .onDragLeaveWith<DragDropHarness>(owner, (current: DragDropHarness, args: DragEventArgs): void =>
        current.handleTargetLeave(args)
      )
      .onDropWith<DragDropHarness>(owner, (current: DragDropHarness, args: DragEventArgs): void => current.handleDrop(args));

    root.child(source).child(target);

    EventRouter.register(makeHandle(1, 1), root);
    EventRouter.register(makeHandle(2, 1), source);
    EventRouter.register(makeHandle(3, 1), target);

    EventRouter.dispatchPointerEvent(source.builtHandle, PointerEventType.Down, 4.0, 4.0, 0);
    EventRouter.dispatchPointerEvent(source.builtHandle, PointerEventType.Move, 6.0, 4.0, 0);

    expect<i32>(owner.dragDataCalls).toBe(0);
    expect<i32>(owner.sourceClickCount).toBe(0);
    expect<i32>(owner.targetEnterCount).toBe(0);

    EventRouter.dispatchPointerEvent(target.builtHandle, PointerEventType.Move, 12.0, 8.0, 0);
    EventRouter.dispatchPointerEvent(target.builtHandle, PointerEventType.Up, 12.0, 8.0, 0);

    expect<i32>(owner.dragDataCalls).toBe(1);
    expect<i32>(owner.sourceClickCount).toBe(0);
    expect<i32>(owner.targetEnterCount).toBe(1);
    expect<i32>(owner.targetOverCount).toBe(2);
    expect<i32>(owner.targetLeaveCount).toBe(1);
    expect<i32>(owner.dropCount).toBe(1);
    expect<string | null>(owner.lastDroppedText).toBe("payload");
    expect<i32>(owner.completedCount).toBe(1);
    expect<DragDropEffects>(owner.lastCompletedEffect).toBe(DragDropEffects.Move);
    expect<i32>(owner.sessionCompletedCount).toBe(1);
    expect<DragDropEffects>(owner.lastSessionEffect).toBe(DragDropEffects.Move);
  });

  it("routes leave and enter as the pointed target changes under capture", () => {
    EventRouter.reset();

    const ownerA = new DragDropHarness();
    ownerA.proposalEffect = DragDropEffects.Copy;
    const ownerB = new DragDropHarness();
    ownerB.proposalEffect = DragDropEffects.Move;

    const root = new FlexBox();
    const source = new FlexBox().bindDragData<DragDropHarness>(
      ownerA,
      (current: DragDropHarness): DragDataObject => current.provideDragData(),
    );
    const targetA = new FlexBox()
      .allowDrop(true)
      .onDragEnterWith<DragDropHarness>(ownerA, (current: DragDropHarness, args: DragEventArgs): DropProposal =>
        current.handleTargetEnter(args)
      )
      .onDragLeaveWith<DragDropHarness>(ownerA, (current: DragDropHarness, args: DragEventArgs): void =>
        current.handleTargetLeave(args)
      );
    const targetB = new FlexBox()
      .allowDrop(true)
      .onDragEnterWith<DragDropHarness>(ownerB, (current: DragDropHarness, args: DragEventArgs): DropProposal =>
        current.handleTargetEnter(args)
      )
      .onDragOverWith<DragDropHarness>(ownerB, (current: DragDropHarness, args: DragEventArgs): DropProposal =>
        current.handleTargetOver(args)
      )
      .onDragLeaveWith<DragDropHarness>(ownerB, (current: DragDropHarness, args: DragEventArgs): void =>
        current.handleTargetLeave(args)
      );

    root.child(source).child(targetA).child(targetB);

    EventRouter.register(makeHandle(11, 1), root);
    EventRouter.register(makeHandle(12, 1), source);
    EventRouter.register(makeHandle(13, 1), targetA);
    EventRouter.register(makeHandle(14, 1), targetB);

    EventRouter.dispatchPointerEvent(source.builtHandle, PointerEventType.Down, 0.0, 0.0, 0);
    EventRouter.dispatchPointerEvent(targetA.builtHandle, PointerEventType.Move, 6.0, 0.0, 0);
    EventRouter.dispatchPointerEvent(targetB.builtHandle, PointerEventType.Move, 12.0, 0.0, 0);
    EventRouter.dispatchPointerEvent(targetB.builtHandle, PointerEventType.Up, 12.0, 0.0, 0);

    expect<i32>(ownerA.targetEnterCount).toBe(1);
    expect<i32>(ownerA.targetLeaveCount).toBe(1);
    expect<i32>(ownerB.targetEnterCount).toBe(1);
    expect<i32>(ownerB.targetOverCount).toBe(2);
    expect<i32>(ownerB.targetLeaveCount).toBe(1);
  });

  it("drops with no effect when the target requests a disallowed operation", () => {
    EventRouter.reset();

    const owner = new DragDropHarness();
    owner.proposalEffect = DragDropEffects.Move;

    const root = new FlexBox();
    const source = new FlexBox()
      .bindDragData<DragDropHarness>(owner, (current: DragDropHarness): DragDataObject => current.provideDragData())
      .dragAllowedEffects(DragDropEffects.Copy)
      .onDragCompletedWith<DragDropHarness>(owner, (current: DragDropHarness, effect: DragDropEffects): void =>
        current.handleDragCompleted(effect)
      );
    const target = new FlexBox()
      .allowDrop(true)
      .onDragOverWith<DragDropHarness>(owner, (current: DragDropHarness, args: DragEventArgs): DropProposal =>
        current.handleTargetOver(args)
      )
      .onDropWith<DragDropHarness>(owner, (current: DragDropHarness, args: DragEventArgs): void => current.handleDrop(args));

    root.child(source).child(target);

    EventRouter.register(makeHandle(21, 1), root);
    EventRouter.register(makeHandle(22, 1), source);
    EventRouter.register(makeHandle(23, 1), target);

    EventRouter.dispatchPointerEvent(source.builtHandle, PointerEventType.Down, 0.0, 0.0, 0);
    EventRouter.dispatchPointerEvent(target.builtHandle, PointerEventType.Move, 6.0, 0.0, 0);
    EventRouter.dispatchPointerEvent(target.builtHandle, PointerEventType.Up, 6.0, 0.0, 0);

    expect<i32>(owner.dropCount).toBe(0);
    expect<i32>(owner.completedCount).toBe(1);
    expect<DragDropEffects>(owner.lastCompletedEffect).toBe(DragDropEffects.None);
  });
});
