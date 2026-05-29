import { CursorStyle, PointerEventType } from "./ffi";
import { DragDropEffects, DragEventArgs, DragSession, DropProposal, Node } from "./Node";

function normalizeEffect(candidate: DragDropEffects, allowed: DragDropEffects): DragDropEffects {
  const masked = <i32>candidate & <i32>allowed;
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

export class DragDropManager {
  private static activeSession: DragSession | null = null;
  private static activeTarget: Node | null = null;

  static cursorOverrideStyle(): CursorStyle {
    const session = this.activeSession;
    if (session === null || !session.isActive) {
      return CursorStyle.Default;
    }
    return session.currentEffect == DragDropEffects.None ? CursorStyle.Grabbing : CursorStyle.Move;
  }

  static beginSession(source: Node): bool {
    const existing = this.activeSession;
    if (existing !== null) {
      this.finishSession(existing, DragDropEffects.None, 0.0, 0.0, 0, true);
    }
    if (!source._hasDragSource()) {
      return false;
    }
    const data = source._createDragDataObject();
    if (data === null) {
      return false;
    }
    const allowed = source._getDragAllowedEffects();
    if (<i32>allowed == 0) {
      return false;
    }
    this.activeTarget = null;
    this.activeSession = new DragSession(source, data, allowed);
    return true;
  }

  static cancelSession(session: DragSession): void {
    if (this.activeSession !== session) {
      return;
    }
    this.finishSession(session, DragDropEffects.None, 0.0, 0.0, 0, true);
  }

  static cancelSessionForSource(source: Node): void {
    const session = this.activeSession;
    if (session === null || session.source !== source) {
      return;
    }
    this.finishSession(session, DragDropEffects.None, 0.0, 0.0, 0, true);
  }

  static handleNodeDestroyed(node: Node): void {
    const session = this.activeSession;
    if (session !== null && session.source === node) {
      this.finishSession(session, DragDropEffects.None, 0.0, 0.0, 0, true);
      return;
    }
    if (this.activeTarget === node) {
      this.activeTarget = null;
      if (session !== null) {
        session._setCurrentEffect(DragDropEffects.None);
      }
    }
  }

  static handlePointerEvent(pointedNode: Node | null, eventType: PointerEventType, x: f32, y: f32, modifiers: u32): void {
    const session = this.activeSession;
    if (session === null || !session.isActive) {
      return;
    }
    if (
      eventType == PointerEventType.Down ||
      eventType == PointerEventType.Enter ||
      eventType == PointerEventType.Move ||
      eventType == PointerEventType.Leave
    ) {
      this.updateTarget(pointedNode, session, x, y, modifiers);
      return;
    }
    if (eventType != PointerEventType.Up) {
      return;
    }
    const effect = this.updateTarget(pointedNode, session, x, y, modifiers);
    const target = this.activeTarget;
    if (target !== null && effect != DragDropEffects.None) {
      target._handleDropEvent(new DragEventArgs(session, x, y, modifiers));
    }
    if (this.activeSession === session && session.isActive) {
      this.finishSession(session, effect, x, y, modifiers, true);
    }
  }

  static reset(): void {
    this.activeSession = null;
    this.activeTarget = null;
  }

  private static updateTarget(pointedNode: Node | null, session: DragSession, x: f32, y: f32, modifiers: u32): DragDropEffects {
    const target = this.resolveDropTarget(pointedNode);
    const args = new DragEventArgs(session, x, y, modifiers);
    let proposal = DropProposal.none();
    if (target !== this.activeTarget) {
      const previousTarget = this.activeTarget;
      if (previousTarget !== null) {
        previousTarget._handleDragLeave(args);
      }
      this.activeTarget = target;
      if (target !== null && target._hasDragEnterHandler()) {
        proposal = target._handleDragEnter(args);
      }
    }
    if (target === null) {
      session._setCurrentEffect(DragDropEffects.None);
      return DragDropEffects.None;
    }
    if (target._hasDragOverHandler()) {
      proposal = target._handleDragOver(args);
    } else if (target === this.activeTarget && isDefaultProposal(proposal)) {
      return session.currentEffect;
    }
    const effect = normalizeEffect(proposal.effect, session.allowedEffects);
    session._setCurrentEffect(effect);
    return effect;
  }

  private static resolveDropTarget(pointedNode: Node | null): Node | null {
    let current = pointedNode;
    while (current !== null) {
      if (current._allowsDrop()) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  private static finishSession(
    session: DragSession,
    effect: DragDropEffects,
    x: f32,
    y: f32,
    modifiers: u32,
    notifyTargetLeave: bool,
  ): void {
    if (this.activeSession !== session) {
      return;
    }
    const target = this.activeTarget;
    this.activeSession = null;
    this.activeTarget = null;
    session._setCurrentEffect(effect);
    if (notifyTargetLeave && target !== null) {
      target._handleDragLeave(new DragEventArgs(session, x, y, modifiers));
    }
    session._complete(effect);
    session.source._notifyDragCompleted(effect);
  }
}
