import {
  DragDataObject,
  DragDropEffects,
  DragCompletedEventArgs,
  DragEventArgs,
  DragSession,
  DropProposal,
  FlexBox,
  PointerClickEventArgs,
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
    this.sessionValue = args.session.onCompletedWith<DragDropHarness>(this, handleSessionCompleted);
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

  handleDragCompleted(event: DragCompletedEventArgs): void {
    this.completedCount += 1;
    this.lastCompletedEffect = event.effect;
  }
}

function handleSessionCompleted(owner: DragDropHarness, event: DragCompletedEventArgs): void {
  owner.sessionCompletedCount += 1;
  owner.lastSessionEffect = event.effect;
}

function handleSourceClick(owner: DragDropHarness, _event: PointerClickEventArgs): void {
  owner.handleSourceClick();
}

function provideDragData(owner: DragDropHarness): DragDataObject {
  return owner.provideDragData();
}

function handleTargetEnter(owner: DragDropHarness, args: DragEventArgs): DropProposal {
  return owner.handleTargetEnter(args);
}

function handleTargetOver(owner: DragDropHarness, args: DragEventArgs): DropProposal {
  return owner.handleTargetOver(args);
}

function handleTargetLeave(owner: DragDropHarness, args: DragEventArgs): void {
  owner.handleTargetLeave(args);
}

function handleDrop(owner: DragDropHarness, args: DragEventArgs): void {
  owner.handleDrop(args);
}

function handleDragCompleted(owner: DragDropHarness, event: DragCompletedEventArgs): void {
  owner.handleDragCompleted(event);
}

describe("DragDrop", () => {
  it("starts lazily, suppresses click, and completes drops with the negotiated effect", () => {
    EventRouter.reset();

    const owner = new DragDropHarness();
    const root = new FlexBox();
    const source = new FlexBox()
      .onPointerClickWith<DragDropHarness>(owner, handleSourceClick)
      .bindDragData<DragDropHarness>(owner, provideDragData)
      .dragAllowedEffects(DragDropEffects.Copy | DragDropEffects.Move)
      .onDragCompletedWith<DragDropHarness>(owner, handleDragCompleted);
    const target = new FlexBox()
      .allowDrop(true)
      .onDragEnterWith<DragDropHarness>(owner, handleTargetEnter)
      .onDragOverWith<DragDropHarness>(owner, handleTargetOver)
      .onDragLeaveWith<DragDropHarness>(owner, handleTargetLeave)
      .onDropWith<DragDropHarness>(owner, handleDrop);

    root.child(source).child(target);

    const rootHandle = makeHandle(1, 1);
    const sourceHandle = makeHandle(2, 1);
    const targetHandle = makeHandle(3, 1);
    EventRouter.register(rootHandle, root);
    EventRouter.register(sourceHandle, source);
    EventRouter.register(targetHandle, target);

    EventRouter.dispatchPointerEvent(sourceHandle, PointerEventType.Down, 4.0, 4.0, 0);
    EventRouter.dispatchPointerEvent(sourceHandle, PointerEventType.Move, 6.0, 4.0, 0);

    expect<i32>(owner.dragDataCalls).toBe(0);
    expect<i32>(owner.sourceClickCount).toBe(0);
    expect<i32>(owner.targetEnterCount).toBe(0);

    EventRouter.dispatchPointerEvent(targetHandle, PointerEventType.Move, 12.0, 8.0, 0);
    EventRouter.dispatchPointerEvent(targetHandle, PointerEventType.Up, 12.0, 8.0, 0);

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
    const source = new FlexBox().bindDragData<DragDropHarness>(ownerA, provideDragData);
    const targetA = new FlexBox()
      .allowDrop(true)
      .onDragEnterWith<DragDropHarness>(ownerA, handleTargetEnter)
      .onDragLeaveWith<DragDropHarness>(ownerA, handleTargetLeave);
    const targetB = new FlexBox()
      .allowDrop(true)
      .onDragEnterWith<DragDropHarness>(ownerB, handleTargetEnter)
      .onDragOverWith<DragDropHarness>(ownerB, handleTargetOver)
      .onDragLeaveWith<DragDropHarness>(ownerB, handleTargetLeave);

    root.child(source).child(targetA).child(targetB);

    const rootHandle = makeHandle(11, 1);
    const sourceHandle = makeHandle(12, 1);
    const targetAHandle = makeHandle(13, 1);
    const targetBHandle = makeHandle(14, 1);
    EventRouter.register(rootHandle, root);
    EventRouter.register(sourceHandle, source);
    EventRouter.register(targetAHandle, targetA);
    EventRouter.register(targetBHandle, targetB);

    EventRouter.dispatchPointerEvent(sourceHandle, PointerEventType.Down, 0.0, 0.0, 0);
    EventRouter.dispatchPointerEvent(targetAHandle, PointerEventType.Move, 6.0, 0.0, 0);
    EventRouter.dispatchPointerEvent(targetBHandle, PointerEventType.Move, 12.0, 0.0, 0);
    EventRouter.dispatchPointerEvent(targetBHandle, PointerEventType.Up, 12.0, 0.0, 0);

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
      .bindDragData<DragDropHarness>(owner, provideDragData)
      .dragAllowedEffects(DragDropEffects.Copy)
      .onDragCompletedWith<DragDropHarness>(owner, handleDragCompleted);
    const target = new FlexBox()
      .allowDrop(true)
      .onDragOverWith<DragDropHarness>(owner, handleTargetOver)
      .onDropWith<DragDropHarness>(owner, handleDrop);

    root.child(source).child(target);

    const rootHandle = makeHandle(21, 1);
    const sourceHandle = makeHandle(22, 1);
    const targetHandle = makeHandle(23, 1);
    EventRouter.register(rootHandle, root);
    EventRouter.register(sourceHandle, source);
    EventRouter.register(targetHandle, target);

    EventRouter.dispatchPointerEvent(sourceHandle, PointerEventType.Down, 0.0, 0.0, 0);
    EventRouter.dispatchPointerEvent(targetHandle, PointerEventType.Move, 6.0, 0.0, 0);
    EventRouter.dispatchPointerEvent(targetHandle, PointerEventType.Up, 6.0, 0.0, 0);

    expect<i32>(owner.dropCount).toBe(0);
    expect<i32>(owner.completedCount).toBe(1);
    expect<DragDropEffects>(owner.lastCompletedEffect).toBe(DragDropEffects.None);
  });
});
