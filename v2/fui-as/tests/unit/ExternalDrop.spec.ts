import {
  DragDropEffects,
  DropProposal,
  ExternalDropEventArgs,
  ExternalDropItemInfo,
  ExternalDropItemKind,
  FlexBox,
} from "../../src/Fui";
import { EventRouter } from "../../src/core/EventRouter";
import { ExternalDragEventType } from "../../src/core/ExternalDropManager";

function makeHandle(index: u32, generation: u32): u64 {
  return (<u64>generation << 32) | <u64>index;
}

class ExternalDropHarness {
  enterCount: i32 = 0;
  overCount: i32 = 0;
  leaveCount: i32 = 0;
  dropCount: i32 = 0;
  proposalEffect: DragDropEffects = DragDropEffects.Copy;
  lastName: string | null = null;
  lastMimeType: string | null = null;
  lastSizeBytes: f64 = 0.0;

  handleEnter(args: ExternalDropEventArgs): DropProposal {
    this.enterCount += 1;
    this.capture(args);
    return new DropProposal(this.proposalEffect, false);
  }

  handleOver(args: ExternalDropEventArgs): DropProposal {
    this.overCount += 1;
    this.capture(args);
    return new DropProposal(this.proposalEffect, false);
  }

  handleLeave(_args: ExternalDropEventArgs): void {
    this.leaveCount += 1;
  }

  handleDrop(args: ExternalDropEventArgs): void {
    this.dropCount += 1;
    this.capture(args);
  }

  private capture(args: ExternalDropEventArgs): void {
    if (args.items.length == 0) {
      this.lastName = null;
      this.lastMimeType = null;
      this.lastSizeBytes = 0.0;
      return;
    }
    const item = unchecked(args.items[0]);
    this.lastName = item.name;
    this.lastMimeType = item.mimeType;
    this.lastSizeBytes = item.sizeBytes;
  }
}

function createItems(): Array<ExternalDropItemInfo> {
  const items = new Array<ExternalDropItemInfo>();
  items.push(new ExternalDropItemInfo("external-drop-1", ExternalDropItemKind.File, "todo.txt", "text/plain", 10.0));
  return items;
}

describe("ExternalDrop", () => {
  it("routes metadata-first external file drops through enter over leave and drop", () => {
    EventRouter.reset();

    const owner = new ExternalDropHarness();
    const root = new FlexBox();
    const target = new FlexBox()
      .allowExternalDrop(true)
      .onExternalDragEnterWith<ExternalDropHarness>(owner, (current: ExternalDropHarness, args: ExternalDropEventArgs): DropProposal =>
        current.handleEnter(args)
      )
      .onExternalDragOverWith<ExternalDropHarness>(owner, (current: ExternalDropHarness, args: ExternalDropEventArgs): DropProposal =>
        current.handleOver(args)
      )
      .onExternalDragLeaveWith<ExternalDropHarness>(owner, (current: ExternalDropHarness, args: ExternalDropEventArgs): void =>
        current.handleLeave(args)
      )
      .onExternalDropWith<ExternalDropHarness>(owner, (current: ExternalDropHarness, args: ExternalDropEventArgs): void =>
        current.handleDrop(args)
      );
    root.child(target);

    EventRouter.register(makeHandle(1, 1), root);
    EventRouter.register(makeHandle(2, 1), target);

    const items = createItems();
    const enterEffect = EventRouter.dispatchExternalDropEvent(target.builtHandle, ExternalDragEventType.Enter, 12.0, 18.0, 0, items);
    const overEffect = EventRouter.dispatchExternalDropEvent(target.builtHandle, ExternalDragEventType.Over, 14.0, 19.0, 0, items);
    const dropEffect = EventRouter.dispatchExternalDropEvent(target.builtHandle, ExternalDragEventType.Drop, 16.0, 20.0, 0, items);

    expect<DragDropEffects>(enterEffect).toBe(DragDropEffects.Copy);
    expect<DragDropEffects>(overEffect).toBe(DragDropEffects.Copy);
    expect<DragDropEffects>(dropEffect).toBe(DragDropEffects.Copy);
    expect<i32>(owner.enterCount).toBe(1);
    expect<i32>(owner.overCount).toBe(3);
    expect<i32>(owner.leaveCount).toBe(1);
    expect<i32>(owner.dropCount).toBe(1);
    expect<string | null>(owner.lastName).toBe("todo.txt");
    expect<string | null>(owner.lastMimeType).toBe("text/plain");
    expect<f64>(owner.lastSizeBytes).toBe(10.0);
  });

  it("resolves the nearest external-drop ancestor and retargets as the pointer moves", () => {
    EventRouter.reset();

    const ownerA = new ExternalDropHarness();
    ownerA.proposalEffect = DragDropEffects.Copy;
    const ownerB = new ExternalDropHarness();
    ownerB.proposalEffect = DragDropEffects.Move;

    const root = new FlexBox();
    const targetA = new FlexBox()
      .allowExternalDrop(true)
      .onExternalDragEnterWith<ExternalDropHarness>(ownerA, (current: ExternalDropHarness, args: ExternalDropEventArgs): DropProposal =>
        current.handleEnter(args)
      )
      .onExternalDragLeaveWith<ExternalDropHarness>(ownerA, (current: ExternalDropHarness, args: ExternalDropEventArgs): void =>
        current.handleLeave(args)
      ) as FlexBox;
    const childA = new FlexBox();
    targetA.child(childA);
    const targetB = new FlexBox()
      .allowExternalDrop(true)
      .onExternalDragEnterWith<ExternalDropHarness>(ownerB, (current: ExternalDropHarness, args: ExternalDropEventArgs): DropProposal =>
        current.handleEnter(args)
      )
      .onExternalDragOverWith<ExternalDropHarness>(ownerB, (current: ExternalDropHarness, args: ExternalDropEventArgs): DropProposal =>
        current.handleOver(args)
      )
      .onExternalDragLeaveWith<ExternalDropHarness>(ownerB, (current: ExternalDropHarness, args: ExternalDropEventArgs): void =>
        current.handleLeave(args)
      );

    root.child(targetA).child(targetB);

    EventRouter.register(makeHandle(11, 1), root);
    EventRouter.register(makeHandle(12, 1), targetA);
    EventRouter.register(makeHandle(13, 1), childA);
    EventRouter.register(makeHandle(14, 1), targetB);

    const items = createItems();
    const effectA = EventRouter.dispatchExternalDropEvent(childA.builtHandle, ExternalDragEventType.Enter, 5.0, 5.0, 0, items);
    const effectB = EventRouter.dispatchExternalDropEvent(targetB.builtHandle, ExternalDragEventType.Over, 22.0, 8.0, 0, items);
    EventRouter.dispatchExternalDropEvent(0, ExternalDragEventType.Leave, 40.0, 12.0, 0, items);

    expect<DragDropEffects>(effectA).toBe(DragDropEffects.Copy);
    expect<DragDropEffects>(effectB).toBe(DragDropEffects.Move);
    expect<i32>(ownerA.enterCount).toBe(1);
    expect<i32>(ownerA.leaveCount).toBe(1);
    expect<i32>(ownerB.enterCount).toBe(1);
    expect<i32>(ownerB.overCount).toBe(1);
    expect<i32>(ownerB.leaveCount).toBe(1);
  });
});
