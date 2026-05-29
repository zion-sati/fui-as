import { DragDropEffects, DropProposal, ExternalDropEventArgs, ExternalDropItemInfo, Node } from "./Node";

export enum ExternalDragEventType {
  Enter = 1,
  Over = 2,
  Leave = 3,
  Drop = 4,
}

function normalizeEffect(candidate: DragDropEffects): DragDropEffects {
  const masked = <i32>candidate & (<i32>DragDropEffects.Copy | <i32>DragDropEffects.Move | <i32>DragDropEffects.Link);
  if (masked == <i32>DragDropEffects.None) {
    return DragDropEffects.None;
  }
  if ((masked & <i32>DragDropEffects.Move) != 0) {
    return DragDropEffects.Move;
  }
  if ((masked & <i32>DragDropEffects.Copy) != 0) {
    return DragDropEffects.Copy;
  }
  if ((masked & <i32>DragDropEffects.Link) != 0) {
    return DragDropEffects.Link;
  }
  return DragDropEffects.None;
}

function isDefaultProposal(proposal: DropProposal): bool {
  return proposal.effect == DragDropEffects.None && !proposal.showInsertionMarker;
}

export class ExternalDropManager {
  private static activeTarget: Node | null = null;
  private static activeEffect: DragDropEffects = DragDropEffects.None;

  static handleEvent(
    pointedNode: Node | null,
    eventType: ExternalDragEventType,
    x: f32,
    y: f32,
    modifiers: u32,
    items: Array<ExternalDropItemInfo>,
  ): DragDropEffects {
    if (eventType == ExternalDragEventType.Leave) {
      this.finish(x, y, modifiers, items, true);
      return DragDropEffects.None;
    }

    const target = this.resolveDropTarget(pointedNode);
    const args = new ExternalDropEventArgs(x, y, modifiers, items);
    let proposal = DropProposal.none();
    if (target !== this.activeTarget) {
      const previousTarget = this.activeTarget;
      if (previousTarget !== null) {
        previousTarget._handleExternalDragLeave(args);
      }
      this.activeTarget = target;
      this.activeEffect = DragDropEffects.None;
      if (target !== null && target._hasExternalDragEnterHandler()) {
        proposal = target._handleExternalDragEnter(args);
      }
    }

    if (target === null) {
      this.activeEffect = DragDropEffects.None;
      return DragDropEffects.None;
    }

    if (target._hasExternalDragOverHandler()) {
      proposal = target._handleExternalDragOver(args);
    } else if (isDefaultProposal(proposal)) {
      proposal = new DropProposal(this.activeEffect, false);
    }

    const effect = normalizeEffect(proposal.effect);
    this.activeEffect = effect;
    if (eventType == ExternalDragEventType.Drop) {
      if (effect != DragDropEffects.None) {
        target._handleExternalDropEvent(args);
      }
      this.finish(x, y, modifiers, items, true);
    }
    return effect;
  }

  static handleNodeDestroyed(node: Node): void {
    if (this.activeTarget === node) {
      this.activeTarget = null;
      this.activeEffect = DragDropEffects.None;
    }
  }

  static reset(): void {
    this.activeTarget = null;
    this.activeEffect = DragDropEffects.None;
  }

  private static resolveDropTarget(pointedNode: Node | null): Node | null {
    let current = pointedNode;
    while (current !== null) {
      if (current._allowsExternalDrop()) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  private static finish(
    x: f32,
    y: f32,
    modifiers: u32,
    items: Array<ExternalDropItemInfo>,
    notifyTargetLeave: bool,
  ): void {
    const target = this.activeTarget;
    this.activeTarget = null;
    this.activeEffect = DragDropEffects.None;
    if (notifyTargetLeave && target !== null) {
      target._handleExternalDragLeave(new ExternalDropEventArgs(x, y, modifiers, items));
    }
  }
}
