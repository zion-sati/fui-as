import * as ui from "../bindings/ui";
import { allocateAttachedPropertyKey, applyAttachedProperties } from "./AttachedProperties";
import {
  Callback0,
  Callback1,
  Callback2,
  Handler0,
  Handler1,
  Handler2,
  ResultCallback0,
  ResultCallback1,
  ResultHandler0,
  ResultHandler1,
} from "./BoundCallback";
import { DragCompletedEvent, DragGesture, DragGestureHost, DragStartedEvent } from "./DragGesture";
import { EventRouter } from "./EventRouter";
import { BrowserFile } from "./File";
import { FocusAdornerManager } from "./FocusAdornerManager";
import { markNeedsCommit } from "./FrameScheduler";
import { Disposable } from "./Disposable";
import { PersistedStateAdapter } from "./PersistedState";
import { storePersistedTextState, tryLoadPersistedTextState } from "./PersistedUiState";
import { ToolTip } from "./ToolTip";
import { ToolTipManager } from "./ToolTipManager";
import { throwNullArgument } from "./Errors";
import { bind0, bind1, bind2, bindResult0, bindResult1 } from "./bind";
import {
  CursorStyle,
  fui_release_pointer_capture,
  fui_set_pointer_capture,
  HandleValue,
  KeyEventType,
  Orientation,
  PointerEventType,
  SemanticCheckedState,
  SemanticRole,
  Visibility,
} from "./ffi";

export enum DragDropEffects {
  None = 0,
  Copy = 1,
  Move = 2,
  Link = 4,
}

const DRAG_DROP_TEXT_FORMAT = "text/plain";

export class DragDataObject {
  private readonly formats: Map<string, string> = new Map<string, string>();

  setText(value: string): DragDataObject {
    this.formats.set(DRAG_DROP_TEXT_FORMAT, value);
    return this;
  }

  setFormat(format: string, value: string): DragDataObject {
    this.formats.set(format, value);
    return this;
  }

  hasFormat(format: string): bool {
    return this.formats.has(format);
  }

  getText(): string | null {
    return this.getFormat(DRAG_DROP_TEXT_FORMAT);
  }

  getFormat(format: string): string | null {
    if (!this.formats.has(format)) {
      return null;
    }
    return this.formats.get(format);
  }

}

export class DropProposal {
  readonly effect: DragDropEffects;
  readonly showInsertionMarker: bool;

  constructor(effect: DragDropEffects = DragDropEffects.None, showInsertionMarker: bool = false) {
    this.effect = effect;
    this.showInsertionMarker = showInsertionMarker;
  }

  static none(): DropProposal {
    return new DropProposal();
  }
}

export class DragSession {
  readonly source: Node;
  readonly data: DragDataObject;
  readonly allowedEffects: DragDropEffects;
  private currentEffectValue: DragDropEffects = DragDropEffects.None;
  private activeValue: bool = true;
  private completedCallback: ((effect: DragDropEffects) => void) | null = null;
  private completedBinding: Callback1<DragDropEffects> | null = null;

  constructor(source: Node, data: DragDataObject, allowedEffects: DragDropEffects) {
    this.source = source;
    this.data = data;
    this.allowedEffects = allowedEffects;
  }

  get currentEffect(): DragDropEffects {
    return this.currentEffectValue;
  }

  get isActive(): bool {
    return this.activeValue;
  }

  onCompleted(cb: ((effect: DragDropEffects) => void) | null): DragSession {
    this.completedCallback = cb;
    this.completedBinding = null;
    return this;
  }

  onCompletedWith<Owner>(owner: Owner, handler: Handler1<Owner, DragDropEffects>): DragSession {
    this.completedCallback = null;
    this.completedBinding = bind1<Owner, DragDropEffects>(owner, handler);
    return this;
  }

  cancel(): void {
    if (!this.activeValue) {
      return;
    }
    EventRouter.cancelDragSession(this);
  }

  _setCurrentEffect(effect: DragDropEffects): void {
    this.currentEffectValue = effect;
  }

  _complete(effect: DragDropEffects): void {
    if (!this.activeValue) {
      return;
    }
    this.activeValue = false;
    this.currentEffectValue = effect;
    const callback = this.completedCallback;
    if (callback !== null) {
      callback(effect);
      return;
    }
    const binding = this.completedBinding;
    if (binding !== null) {
      binding.invoke(effect);
    }
  }
}

export class DragEventArgs {
  readonly session: DragSession;
  readonly x: f32;
  readonly y: f32;
  readonly modifiers: u32;

  constructor(session: DragSession, x: f32, y: f32, modifiers: u32) {
    this.session = session;
    this.x = x;
    this.y = y;
    this.modifiers = modifiers;
  }
}

export enum ExternalDropItemKind {
  File = 1,
  Text = 2,
  Uri = 3,
}

export class ExternalDropItemInfo {
  readonly id: string;
  readonly kind: ExternalDropItemKind;
  readonly name: string;
  readonly mimeType: string | null;
  readonly sizeBytes: f64;
  readonly file: BrowserFile | null;

  constructor(
    id: string,
    kind: ExternalDropItemKind,
    name: string,
    mimeType: string | null = null,
    sizeBytes: f64 = 0.0,
    file: BrowserFile | null = null,
  ) {
    this.id = id;
    this.kind = kind;
    this.name = name;
    this.mimeType = mimeType;
    this.sizeBytes = sizeBytes;
    this.file = file;
  }
}

export class ExternalDropEventArgs {
  readonly x: f32;
  readonly y: f32;
  readonly modifiers: u32;
  readonly items: Array<ExternalDropItemInfo>;

  constructor(x: f32, y: f32, modifiers: u32, items: Array<ExternalDropItemInfo>) {
    this.x = x;
    this.y = y;
    this.modifiers = modifiers;
    this.items = items;
  }
}

export abstract class Node implements DragGestureHost, Disposable {
  protected handle: u64 = <u64>HandleValue.Invalid;
  protected childNodes: Array<Node> = new Array<Node>();
  protected retainedParent: Node | null = null;
  private readonly attachedPropertyKey: u32 = allocateAttachedPropertyKey();
  private disposedValue: bool = false;

  private nodeIdValue: string | null = null;
  private semanticRoleValue: SemanticRole = SemanticRole.None;
  private hasSemanticRole: bool = false;
  private defaultSemanticRoleValue: SemanticRole = SemanticRole.None;
  private hasDefaultSemanticRole: bool = false;
  private semanticLabelValue: string | null = null;
  private hasSemanticLabel: bool = false;
  private defaultSemanticLabelValue: string | null = null;
  private hasDefaultSemanticLabel: bool = false;
  private semanticCheckedStateValue: SemanticCheckedState = SemanticCheckedState.None;
  private hasSemanticSelected: bool = false;
  private semanticSelectedValue: bool = false;
  private hasSemanticExpanded: bool = false;
  private semanticExpandedValue: bool = false;
  private hasSemanticDisabled: bool = false;
  private semanticDisabledValue: bool = false;
  private trackSemanticDisabledFromEnabled: bool = false;
  private hasSemanticValueRange: bool = false;
  private semanticValueNow: f32 = 0.0;
  private semanticValueMin: f32 = 0.0;
  private semanticValueMax: f32 = 0.0;
  private semanticOrientationValue: Orientation = Orientation.None;
  private portalFlag: bool = false;
  private clickCallback: (() => void) | null = null;
  private clickBinding: Callback0 | null = null;
  private pointerDownCallback: ((x: f32, y: f32) => void) | null = null;
  private pointerMoveCallback: ((x: f32, y: f32) => void) | null = null;
  private pointerUpCallback: ((x: f32, y: f32) => void) | null = null;
  private pointerEnterCallback: (() => void) | null = null;
  private pointerLeaveCallback: (() => void) | null = null;
  private dragDataCallback: (() => DragDataObject | null) | null = null;
  private dragDataBinding: ResultCallback0<DragDataObject | null> | null = null;
  private dragAllowedEffectsValue: DragDropEffects = DragDropEffects.Copy;
  private dragCompletedCallback: ((effect: DragDropEffects) => void) | null = null;
  private dragCompletedBinding: Callback1<DragDropEffects> | null = null;
  private dropAllowedValue: bool = false;
  private dragEnterCallback: ((args: DragEventArgs) => DropProposal) | null = null;
  private dragEnterBinding: ResultCallback1<DragEventArgs, DropProposal> | null = null;
  private dragOverCallback: ((args: DragEventArgs) => DropProposal) | null = null;
  private dragOverBinding: ResultCallback1<DragEventArgs, DropProposal> | null = null;
  private dragLeaveCallback: ((args: DragEventArgs) => void) | null = null;
  private dragLeaveBinding: Callback1<DragEventArgs> | null = null;
  private dropCallback: ((args: DragEventArgs) => void) | null = null;
  private dropBinding: Callback1<DragEventArgs> | null = null;
  private externalDropAllowedValue: bool = false;
  private externalDragEnterCallback: ((args: ExternalDropEventArgs) => DropProposal) | null = null;
  private externalDragEnterBinding: ResultCallback1<ExternalDropEventArgs, DropProposal> | null = null;
  private externalDragOverCallback: ((args: ExternalDropEventArgs) => DropProposal) | null = null;
  private externalDragOverBinding: ResultCallback1<ExternalDropEventArgs, DropProposal> | null = null;
  private externalDragLeaveCallback: ((args: ExternalDropEventArgs) => void) | null = null;
  private externalDragLeaveBinding: Callback1<ExternalDropEventArgs> | null = null;
  private externalDropCallback: ((args: ExternalDropEventArgs) => void) | null = null;
  private externalDropBinding: Callback1<ExternalDropEventArgs> | null = null;
  private dragGestureValue: DragGesture | null = null;
  private dragClickPending: bool = false;
  private contextMenuCallback: ((target: Node | null, x: f32, y: f32) => void) | null = null;
  private contextMenuDisabledValue: bool = false;
  private focusableFlag: bool = false;
  private focusableTabIndex: i32 = 0;
  private focusChangedCb: ((focused: bool) => void) | null = null;
  private focusChangedBinding: Callback1<bool> | null = null;
  private keyDownCb: ((key: string, mods: u32) => void) | null = null;
  private keyDownBinding: Callback2<string, u32> | null = null;
  private keyUpCb: ((key: string, mods: u32) => void) | null = null;
  private hasPointerCallbacks: bool = false;
  private cursorValue: CursorStyle = CursorStyle.Default;
  private ownEnabled: bool = true;
  private inheritedEnabled: bool = true;
  private lastEffectiveEnabled: bool = true;
  private ownVisibility: Visibility = Visibility.Normal;
  private inheritedVisibility: Visibility = Visibility.Normal;
  private lastEffectiveVisibility: Visibility = Visibility.Normal;
  private scrollProxyTargetHandle: u64 = <u64>HandleValue.Invalid;
  private toolTipValue: ToolTip | null = null;
  private persistedStateAdapters: Array<PersistedStateAdapter> = new Array<PersistedStateAdapter>();


  get builtHandle(): u64 {
    return this.handle;
  }

  get childCount(): i32 {
    return this.childNodes.length;
  }

  get parentNode(): Node | null {
    return this.retainedParent;
  }

  get attachedToolTip(): ToolTip | null {
    return this.toolTipValue;
  }

  get isDisposed(): bool {
    return this.disposedValue;
  }

  getBounds(): Float32Array {
    if (!this.hasBuiltHandle()) {
      return new Float32Array(4);
    }
    const bounds = ui.tryGetBounds(this.handle);
    if (bounds !== null) {
      return bounds;
    }
    return new Float32Array(4);
  }

  absoluteToLocalPosition(absoluteX: f32, absoluteY: f32): Float32Array {
    const bounds = this.getBounds();
    const point = new Float32Array(2);
    unchecked(point[0] = absoluteX - unchecked(bounds[0]));
    unchecked(point[1] = absoluteY - unchecked(bounds[1]));
    return point;
  }

  localToAbsolutePosition(localX: f32, localY: f32): Float32Array {
    const bounds = this.getBounds();
    const point = new Float32Array(2);
    unchecked(point[0] = localX + unchecked(bounds[0]));
    unchecked(point[1] = localY + unchecked(bounds[1]));
    return point;
  }

  get cursorStyle(): CursorStyle {
    return this.cursorValue;
  }

  get isEnabled(): bool {
    return this.ownEnabled && this.inheritedEnabled;
  }

  get isVisible(): bool {
    return this.effectiveVisibility() == Visibility.Normal;
  }

  get isSelectionBarrier(): bool {
    return false;
  }

  get isContextMenuDisabled(): bool {
    return this.contextMenuDisabledValue;
  }

  get contextMenuHandler(): ((target: Node | null, x: f32, y: f32) => void) | null {
    return this.contextMenuCallback;
  }

  getChildAt(index: i32): Node | null {
    if (index < 0 || index >= this.childNodes.length) {
      return null;
    }
    return unchecked(this.childNodes[index]);
  }

  cursor(style: CursorStyle): this {
    this.cursorValue = style;
    EventRouter.handleCursorStyleChanged(this);
    return this;
  }

  nodeId(id: string): this {
    this.nodeIdValue = id;
    if (this.hasBuiltHandle()) {
      ui.setNodeId(this.handle, id);
      this.notifyRetainedMutation();
    }
    return this;
  }

  persistState(adapter: PersistedStateAdapter): this {
    if (adapter == null) {
      throwNullArgument("Node.persistState", "adapter");
    }
    for (let index = 0; index < this.persistedStateAdapters.length; ++index) {
      if (unchecked(this.persistedStateAdapters[index]).kind == adapter.kind) {
        unchecked(this.persistedStateAdapters[index] = adapter);
        return this;
      }
    }
    this.persistedStateAdapters.push(adapter);
    return this;
  }

  protected getNodeId(): string | null {
    return this.nodeIdValue;
  }

  semanticRole(role: SemanticRole): this {
    this.semanticRoleValue = role;
    this.hasSemanticRole = true;
    if (this.hasBuiltHandle()) {
      this.applyResolvedSemanticRole();
      this.notifyRetainedMutation();
    }
    return this;
  }

  semanticLabel(label: string): this {
    this.semanticLabelValue = label;
    this.hasSemanticLabel = true;
    if (this.hasBuiltHandle()) {
      this.applyResolvedSemanticLabel();
      this.notifyRetainedMutation();
    }
    return this;
  }

  protected hasExplicitSemanticRole(): bool {
    return this.hasSemanticRole;
  }

  protected hasExplicitSemanticLabel(): bool {
    return this.hasSemanticLabel;
  }

  protected setDefaultSemanticRole(role: SemanticRole): void {
    if (this.hasDefaultSemanticRole == (role != SemanticRole.None) && this.defaultSemanticRoleValue == role) {
      return;
    }
    this.defaultSemanticRoleValue = role;
    this.hasDefaultSemanticRole = role != SemanticRole.None;
    if (this.hasBuiltHandle() && !this.hasSemanticRole) {
      this.applyResolvedSemanticRole();
      this.notifyRetainedMutation();
    }
  }

  protected setDefaultSemanticLabel(label: string): void {
    if (this.hasDefaultSemanticLabel && this.defaultSemanticLabelValue !== null && changetype<string>(this.defaultSemanticLabelValue) == label) {
      return;
    }
    this.defaultSemanticLabelValue = label;
    this.hasDefaultSemanticLabel = true;
    if (this.hasBuiltHandle() && !this.hasSemanticLabel) {
      this.applyResolvedSemanticLabel();
      this.notifyRetainedMutation();
    }
  }

  protected clearDefaultSemanticRole(): void {
    if (!this.hasDefaultSemanticRole && this.defaultSemanticRoleValue == SemanticRole.None) {
      return;
    }
    this.defaultSemanticRoleValue = SemanticRole.None;
    this.hasDefaultSemanticRole = false;
    if (this.hasBuiltHandle() && !this.hasSemanticRole) {
      this.applyResolvedSemanticRole();
      this.notifyRetainedMutation();
    }
  }

  protected clearDefaultSemanticLabel(): void {
    if (!this.hasDefaultSemanticLabel && this.defaultSemanticLabelValue === null) {
      return;
    }
    this.defaultSemanticLabelValue = null;
    this.hasDefaultSemanticLabel = false;
    if (this.hasBuiltHandle() && !this.hasSemanticLabel) {
      this.applyResolvedSemanticLabel();
      this.notifyRetainedMutation();
    }
  }

  semanticChecked(state: SemanticCheckedState): this {
    this.semanticCheckedStateValue = state;
    if (this.hasBuiltHandle()) {
      ui.setSemanticChecked(this.handle, <u32>state);
      this.notifyRetainedMutation();
    }
    return this;
  }

  semanticDisabled(flag: bool): this {
    this.trackSemanticDisabledFromEnabled = false;
    this.hasSemanticDisabled = true;
    this.semanticDisabledValue = flag;
    if (this.hasBuiltHandle()) {
      ui.setSemanticDisabled(this.handle, true, flag);
      this.notifyRetainedMutation();
    }
    return this;
  }

  clearSemanticDisabled(): this {
    this.trackSemanticDisabledFromEnabled = false;
    this.hasSemanticDisabled = false;
    this.semanticDisabledValue = false;
    if (this.hasBuiltHandle()) {
      ui.setSemanticDisabled(this.handle, false, false);
      this.notifyRetainedMutation();
    }
    return this;
  }

  semanticSelected(flag: bool): this {
    this.hasSemanticSelected = true;
    this.semanticSelectedValue = flag;
    if (this.hasBuiltHandle()) {
      ui.setSemanticSelected(this.handle, true, flag);
      this.notifyRetainedMutation();
    }
    return this;
  }

  clearSemanticSelected(): this {
    this.hasSemanticSelected = false;
    this.semanticSelectedValue = false;
    if (this.hasBuiltHandle()) {
      ui.setSemanticSelected(this.handle, false, false);
      this.notifyRetainedMutation();
    }
    return this;
  }

  semanticExpanded(flag: bool): this {
    this.hasSemanticExpanded = true;
    this.semanticExpandedValue = flag;
    if (this.hasBuiltHandle()) {
      ui.setSemanticExpanded(this.handle, true, flag);
      this.notifyRetainedMutation();
    }
    return this;
  }

  clearSemanticExpanded(): this {
    this.hasSemanticExpanded = false;
    this.semanticExpandedValue = false;
    if (this.hasBuiltHandle()) {
      ui.setSemanticExpanded(this.handle, false, false);
      this.notifyRetainedMutation();
    }
    return this;
  }

  semanticValueRange(valueNow: f32, valueMin: f32, valueMax: f32): this {
    this.hasSemanticValueRange = true;
    this.semanticValueNow = valueNow;
    this.semanticValueMin = valueMin;
    this.semanticValueMax = valueMax;
    if (this.hasBuiltHandle()) {
      ui.setSemanticValueRange(this.handle, true, valueNow, valueMin, valueMax);
      this.notifyRetainedMutation();
    }
    return this;
  }

  clearSemanticValueRange(): this {
    this.hasSemanticValueRange = false;
    this.semanticValueNow = 0.0;
    this.semanticValueMin = 0.0;
    this.semanticValueMax = 0.0;
    if (this.hasBuiltHandle()) {
      ui.setSemanticValueRange(this.handle, false, 0.0, 0.0, 0.0);
      this.notifyRetainedMutation();
    }
    return this;
  }

  semanticOrientation(orientation: Orientation): this {
    this.semanticOrientationValue = orientation;
    if (this.hasBuiltHandle()) {
      ui.setSemanticOrientation(this.handle, <u32>orientation);
      this.notifyRetainedMutation();
    }
    return this;
  }

  requestSemanticAnnouncement(): this {
    if (this.hasBuiltHandle()) {
      ui.requestSemanticAnnouncement(this.handle);
    }
    return this;
  }

  onClick(cb: () => void): this {
    this.clickCallback = cb;
    this.clickBinding = null;
    this.requireInteractive();
    return this;
  }

  bindClick<Owner>(owner: Owner, handler: Handler0<Owner>): this {
    this.clickCallback = null;
    this.clickBinding = bind0<Owner>(owner, handler);
    this.requireInteractive();
    return this;
  }

  onClickWith<Owner>(owner: Owner, handler: Handler0<Owner>): this {
    this.bindClick(owner, handler);
    return this;
  }

  onPointerDown(cb: (x: f32, y: f32) => void): this {
    this.pointerDownCallback = cb;
    this.requireInteractive();
    return this;
  }

  onPointerMove(cb: (x: f32, y: f32) => void): this {
    this.pointerMoveCallback = cb;
    this.requireInteractive();
    return this;
  }

  onPointerUp(cb: (x: f32, y: f32) => void): this {
    this.pointerUpCallback = cb;
    this.requireInteractive();
    return this;
  }

  onPointerEnter(cb: () => void): this {
    this.pointerEnterCallback = cb;
    this.requireInteractive();
    return this;
  }

  onPointerLeave(cb: () => void): this {
    this.pointerLeaveCallback = cb;
    this.requireInteractive();
    return this;
  }

  dragAllowedEffects(effects: DragDropEffects): this {
    this.dragAllowedEffectsValue = effects;
    return this;
  }

  dragData(cb: (() => DragDataObject | null) | null): this {
    this.dragDataCallback = cb;
    this.dragDataBinding = null;
    if (cb !== null) {
      this.requireInteractive();
      this.ensureDragGesture();
    }
    return this;
  }

  bindDragData<Owner>(owner: Owner, handler: ResultHandler0<Owner, DragDataObject | null>): this {
    this.dragDataCallback = null;
    this.dragDataBinding = bindResult0<Owner, DragDataObject | null>(owner, handler);
    this.requireInteractive();
    this.ensureDragGesture();
    return this;
  }

  allowDrop(flag: bool = true): this {
    this.dropAllowedValue = flag;
    if (flag) {
      this.requireInteractive();
    }
    return this;
  }

  onDragCompleted(cb: ((effect: DragDropEffects) => void) | null): this {
    this.dragCompletedCallback = cb;
    this.dragCompletedBinding = null;
    return this;
  }

  onDragCompletedWith<Owner>(owner: Owner, handler: Handler1<Owner, DragDropEffects>): this {
    this.dragCompletedCallback = null;
    this.dragCompletedBinding = bind1<Owner, DragDropEffects>(owner, handler);
    return this;
  }

  onDragEnter(cb: ((args: DragEventArgs) => DropProposal) | null): this {
    this.dragEnterCallback = cb;
    this.dragEnterBinding = null;
    if (cb !== null) {
      this.allowDrop(true);
    }
    return this;
  }

  onDragEnterWith<Owner>(owner: Owner, handler: ResultHandler1<Owner, DragEventArgs, DropProposal>): this {
    this.dragEnterCallback = null;
    this.dragEnterBinding = bindResult1<Owner, DragEventArgs, DropProposal>(owner, handler);
    this.allowDrop(true);
    return this;
  }

  onDragOver(cb: ((args: DragEventArgs) => DropProposal) | null): this {
    this.dragOverCallback = cb;
    this.dragOverBinding = null;
    if (cb !== null) {
      this.allowDrop(true);
    }
    return this;
  }

  onDragOverWith<Owner>(owner: Owner, handler: ResultHandler1<Owner, DragEventArgs, DropProposal>): this {
    this.dragOverCallback = null;
    this.dragOverBinding = bindResult1<Owner, DragEventArgs, DropProposal>(owner, handler);
    this.allowDrop(true);
    return this;
  }

  onDragLeave(cb: ((args: DragEventArgs) => void) | null): this {
    this.dragLeaveCallback = cb;
    this.dragLeaveBinding = null;
    if (cb !== null) {
      this.allowDrop(true);
    }
    return this;
  }

  onDragLeaveWith<Owner>(owner: Owner, handler: Handler1<Owner, DragEventArgs>): this {
    this.dragLeaveCallback = null;
    this.dragLeaveBinding = bind1<Owner, DragEventArgs>(owner, handler);
    this.allowDrop(true);
    return this;
  }

  onDrop(cb: ((args: DragEventArgs) => void) | null): this {
    this.dropCallback = cb;
    this.dropBinding = null;
    if (cb !== null) {
      this.allowDrop(true);
    }
    return this;
  }

  onDropWith<Owner>(owner: Owner, handler: Handler1<Owner, DragEventArgs>): this {
    this.dropCallback = null;
    this.dropBinding = bind1<Owner, DragEventArgs>(owner, handler);
    this.allowDrop(true);
    return this;
  }

  allowExternalDrop(flag: bool = true): this {
    this.externalDropAllowedValue = flag;
    if (flag) {
      this.requireInteractive();
    }
    return this;
  }

  onExternalDragEnter(cb: ((args: ExternalDropEventArgs) => DropProposal) | null): this {
    this.externalDragEnterCallback = cb;
    this.externalDragEnterBinding = null;
    if (cb !== null) {
      this.allowExternalDrop(true);
    }
    return this;
  }

  onExternalDragEnterWith<Owner>(owner: Owner, handler: ResultHandler1<Owner, ExternalDropEventArgs, DropProposal>): this {
    this.externalDragEnterCallback = null;
    this.externalDragEnterBinding = bindResult1<Owner, ExternalDropEventArgs, DropProposal>(owner, handler);
    this.allowExternalDrop(true);
    return this;
  }

  onExternalDragOver(cb: ((args: ExternalDropEventArgs) => DropProposal) | null): this {
    this.externalDragOverCallback = cb;
    this.externalDragOverBinding = null;
    if (cb !== null) {
      this.allowExternalDrop(true);
    }
    return this;
  }

  onExternalDragOverWith<Owner>(owner: Owner, handler: ResultHandler1<Owner, ExternalDropEventArgs, DropProposal>): this {
    this.externalDragOverCallback = null;
    this.externalDragOverBinding = bindResult1<Owner, ExternalDropEventArgs, DropProposal>(owner, handler);
    this.allowExternalDrop(true);
    return this;
  }

  onExternalDragLeave(cb: ((args: ExternalDropEventArgs) => void) | null): this {
    this.externalDragLeaveCallback = cb;
    this.externalDragLeaveBinding = null;
    if (cb !== null) {
      this.allowExternalDrop(true);
    }
    return this;
  }

  onExternalDragLeaveWith<Owner>(owner: Owner, handler: Handler1<Owner, ExternalDropEventArgs>): this {
    this.externalDragLeaveCallback = null;
    this.externalDragLeaveBinding = bind1<Owner, ExternalDropEventArgs>(owner, handler);
    this.allowExternalDrop(true);
    return this;
  }

  onExternalDrop(cb: ((args: ExternalDropEventArgs) => void) | null): this {
    this.externalDropCallback = cb;
    this.externalDropBinding = null;
    if (cb !== null) {
      this.allowExternalDrop(true);
    }
    return this;
  }

  onExternalDropWith<Owner>(owner: Owner, handler: Handler1<Owner, ExternalDropEventArgs>): this {
    this.externalDropCallback = null;
    this.externalDropBinding = bind1<Owner, ExternalDropEventArgs>(owner, handler);
    this.allowExternalDrop(true);
    return this;
  }

  toolTip(toolTip: ToolTip | null): this {
    this.toolTipValue = toolTip;
    if (toolTip !== null) {
      this.requireInteractive();
      if (this.hasBuiltHandle() && this.isEnabled && this.isVisible) {
        ui.setInteractive(this.handle, true);
        this.notifyRetainedMutation();
      }
    }
    ToolTipManager.handleToolTipChanged(this, toolTip);
    return this;
  }

  toolTipText(text: string): this {
    this.toolTip(ToolTip.text(text));
    return this;
  }

  clearToolTip(): this {
    this.toolTip(null);
    return this;
  }

  onContextMenu(cb: ((target: Node | null, x: f32, y: f32) => void) | null): this {
    this.contextMenuCallback = cb;
    return this;
  }

  disableContextMenu(flag: bool = true): this {
    this.contextMenuDisabledValue = flag;
    return this;
  }

  focusable(flag: bool, tabIndex: i32 = 0): this {
    this.focusableFlag = flag;
    this.focusableTabIndex = tabIndex;
    if (flag) {
      this.requireInteractive();
    }
    if (this.hasBuiltHandle()) {
      ui.setFocusable(this.handle, this.isEnabled && this.isVisible && flag, tabIndex);
      if (this.hasPointerCallbacks) {
        ui.setInteractive(this.handle, this.isEnabled && this.isVisible);
      }
      this.notifyRetainedMutation();
    }
    return this;
  }

  enabled(flag: bool): this {
    if (this.ownEnabled == flag) {
      return this;
    }
    this.ownEnabled = flag;
    if (!flag) {
      this.cancelDragState();
    }
    this.applyEnabledChanged();
    return this;
  }

  visibility(value: Visibility): this {
    if (this.ownVisibility == value) {
      return this;
    }
    this.ownVisibility = value;
    if (value != Visibility.Normal) {
      this.cancelDragState();
    }
    this.applyVisibilityChanged();
    return this;
  }

  onFocusChanged(cb: (focused: bool) => void): this {
    this.focusChangedCb = cb;
    this.focusChangedBinding = null;
    return this;
  }

  bindFocusChanged<Owner>(owner: Owner, handler: Handler1<Owner, bool>): this {
    this.focusChangedCb = null;
    this.focusChangedBinding = bind1<Owner, bool>(owner, handler);
    return this;
  }

  onFocusChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, bool>): this {
    this.bindFocusChanged(owner, handler);
    return this;
  }

  onKeyDown(cb: (key: string, mods: u32) => void): this {
    this.keyDownCb = cb;
    this.keyDownBinding = null;
    return this;
  }

  bindKeyDown<Owner>(owner: Owner, handler: Handler2<Owner, string, u32>): this {
    this.keyDownCb = null;
    this.keyDownBinding = bind2<Owner, string, u32>(owner, handler);
    return this;
  }

  onKeyDownWith<Owner>(owner: Owner, handler: Handler2<Owner, string, u32>): this {
    this.bindKeyDown(owner, handler);
    return this;
  }

  onKeyUp(cb: (key: string, mods: u32) => void): this {
    this.keyUpCb = cb;
    return this;
  }

  focusNow(): this {
    if (this.hasBuiltHandle()) {
      ui.requestFocus(this.handle);
    }
    return this;
  }

  abstract build(): u64;

  dispose(): void {
    this.disposeTree();
  }

  protected setPortalFlag(flag: bool): void {
    this.portalFlag = flag;
  }

  protected appendChild(node: Node): void {
    this.addChildNode(node);
  }

  protected replaceChildren(nodes: Array<Node>): void {
    while (this.childNodes.length > 0) {
      const child = unchecked(this.childNodes[this.childNodes.length - 1]);
      this.removeChildNode(child);
    }
    for (let i = 0; i < nodes.length; ++i) {
      const node = unchecked(nodes[i]);
      if (node == null) {
        throwNullArgument("Node.replaceChildren", "nodes[" + i.toString() + "]");
      }
      this.addChildNode(node);
    }
  }

  addChildNode(node: Node): this {
    if (node === this || this.indexOfChild(node) >= 0) {
      return this;
    }
    const previousParent = node.retainedParent;
    if (previousParent !== null) {
      previousParent.removeChildNode(node);
    }
    node.retainedParent = this;
    node.onRetainedParentChanged();
    this.childNodes.push(node);
    node._setInheritedEnabled(this.isEnabled);
    node._setInheritedVisibility(this.effectiveVisibility());
    if (this.hasBuiltHandle()) {
      ui.addChild(this.handle, node.build());
      this.notifyRetainedMutation();
      this.onRetainedChildLayoutChanged();
    }
    return this;
  }

  removeChildNode(node: Node): this {
    const index = this.indexOfChild(node);
    if (index < 0) {
      return this;
    }
    if (this.hasBuiltHandle() && node.hasBuiltHandle()) {
      ui.removeChild(this.handle, node.handle);
    }
    for (let cursor = index; cursor < this.childNodes.length - 1; ++cursor) {
      unchecked(this.childNodes[cursor] = unchecked(this.childNodes[cursor + 1]));
    }
    this.childNodes.length = this.childNodes.length - 1;
    node.retainedParent = null;
    node.onRetainedParentChanged();
    node._setInheritedEnabled(true);
    node._setInheritedVisibility(Visibility.Normal);
    if (this.hasBuiltHandle()) {
      this.notifyRetainedMutation();
      this.onRetainedChildLayoutChanged();
    }
    return this;
  }

  protected applyNodeMetadata(): void {
    if (this.nodeIdValue !== null) {
      ui.setNodeId(this.handle, changetype<string>(this.nodeIdValue));
    }
    if (this.hasSemanticRole || this.hasDefaultSemanticRole) {
      this.applyResolvedSemanticRole();
    }
    if (this.hasSemanticLabel || this.hasDefaultSemanticLabel) {
      this.applyResolvedSemanticLabel();
    }
    ui.setSemanticChecked(this.handle, <u32>this.semanticCheckedStateValue);
    ui.setSemanticSelected(this.handle, this.hasSemanticSelected, this.semanticSelectedValue);
    ui.setSemanticExpanded(this.handle, this.hasSemanticExpanded, this.semanticExpandedValue);
    ui.setSemanticDisabled(this.handle, this.hasSemanticDisabled, this.semanticDisabledValue);
    ui.setSemanticValueRange(
      this.handle,
      this.hasSemanticValueRange,
      this.semanticValueNow,
      this.semanticValueMin,
      this.semanticValueMax,
    );
    ui.setSemanticOrientation(this.handle, <u32>this.semanticOrientationValue);
    if (this.portalFlag) {
      ui.setIsPortal(this.handle, true);
    }
    ui.setVisibility(this.handle, <u32>this.effectiveVisibility());
    applyAttachedProperties(this.attachedPropertyKey, this.handle);
    if (Node.isBuiltHandle(this.scrollProxyTargetHandle)) {
      ui.setScrollProxyTarget(this.handle, this.scrollProxyTargetHandle);
    }
  }

  private resolvedSemanticRole(): SemanticRole {
    if (this.hasSemanticRole) {
      return this.semanticRoleValue;
    }
    if (this.hasDefaultSemanticRole) {
      return this.defaultSemanticRoleValue;
    }
    return SemanticRole.None;
  }

  private resolvedSemanticLabel(): string | null {
    if (this.hasSemanticLabel) {
      return this.semanticLabelValue;
    }
    if (this.hasDefaultSemanticLabel) {
      return this.defaultSemanticLabelValue;
    }
    return null;
  }

  private applyResolvedSemanticRole(): void {
    ui.setSemanticRole(this.handle, <u32>this.resolvedSemanticRole());
  }

  private applyResolvedSemanticLabel(): void {
    const label = this.resolvedSemanticLabel();
    if (label === null) {
      ui.setSemanticLabel(this.handle, "");
      return;
    }
    ui.setSemanticLabel(this.handle, changetype<string>(label));
  }

  protected finishBuild(): void {
    this.disposedValue = false;
    EventRouter.register(this.handle, this);
    if (this.focusableFlag && this.isEnabled && this.isVisible) {
      ui.setFocusable(this.handle, this.focusableFlag, this.focusableTabIndex);
    }
    if (this.hasPointerCallbacks && this.isEnabled && this.isVisible) {
      ui.setInteractive(this.handle, true);
    }
  }

  protected buildChildren(): void {
    for (let i = 0; i < this.childNodes.length; ++i) {
      const child = unchecked(this.childNodes[i]);
      ui.addChild(this.handle, child.build());
    }
  }

  protected disposeTree(): void {
    if (this.disposedValue) {
      return;
    }
    this.disposedValue = true;
    const destroyedHandle = this.handle;
    this.cancelDragState();
    FocusAdornerManager.handleOwnerDestroyed(this);
    ToolTipManager.handleOwnerDestroyed(this);
    for (let i = this.childNodes.length - 1; i >= 0; --i) {
      unchecked(this.childNodes[i]).dispose();
    }
    this.childNodes.length = 0;
    if (this.hasBuiltHandle()) {
      EventRouter.unregister(this.handle);
      ui.deleteNode(this.handle);
      this.handle = <u64>HandleValue.Invalid;
      if (Node.isBuiltHandle(destroyedHandle)) {
        markNeedsCommit();
      }
    }
  }

  protected notifyRetainedMutation(): void {
    if (!this.hasBuiltHandle()) {
      return;
    }
    markNeedsCommit();
  }

  protected notifyRetainedLayoutMutation(): void {
    this.notifyRetainedMutation();
    const parent = this.retainedParent;
    if (parent !== null && parent.hasBuiltHandle()) {
      parent.onRetainedChildLayoutChanged();
    }
  }

  protected onRetainedParentChanged(): void {}

  protected onRetainedChildLayoutChanged(): void {}

  protected static isBuiltHandle(handle: u64): bool {
    return handle != <u64>HandleValue.Invalid;
  }

  protected hasBuiltHandle(): bool {
    return Node.isBuiltHandle(this.handle);
  }

  protected capturePersistedState(): void {
    if (this.persistedStateAdapters.length == 0) {
      return;
    }
    const nodeId = this.getNodeId();
    if (nodeId === null || nodeId.length == 0) {
      return;
    }
    for (let index = 0; index < this.persistedStateAdapters.length; ++index) {
      const adapter = unchecked(this.persistedStateAdapters[index]);
      const payload = adapter.capture(this);
      if (payload === null) {
        continue;
      }
      storePersistedTextState(nodeId, adapter.kind, adapter.version, payload);
    }
  }

  protected restorePersistedState(): void {
    if (this.persistedStateAdapters.length == 0) {
      return;
    }
    const nodeId = this.getNodeId();
    if (nodeId === null || nodeId.length == 0) {
      return;
    }
    for (let index = 0; index < this.persistedStateAdapters.length; ++index) {
      const adapter = unchecked(this.persistedStateAdapters[index]);
      const persisted = tryLoadPersistedTextState(nodeId, adapter.kind);
      if (persisted === null) {
        continue;
      }
      adapter.restore(this, persisted.payload, persisted.version);
    }
  }

  _hasDragSource(): bool {
    return this.dragDataCallback !== null || this.dragDataBinding !== null;
  }

  _createDragDataObject(): DragDataObject | null {
    const callback = this.dragDataCallback;
    if (callback !== null) {
      return callback();
    }
    const binding = this.dragDataBinding;
    if (binding !== null) {
      return binding.invoke();
    }
    return null;
  }

  _getDragAllowedEffects(): DragDropEffects {
    return this.dragAllowedEffectsValue;
  }

  _notifyDragCompleted(effect: DragDropEffects): void {
    const callback = this.dragCompletedCallback;
    if (callback !== null) {
      callback(effect);
    } else {
      const binding = this.dragCompletedBinding;
      if (binding !== null) {
        binding.invoke(effect);
      }
    }
  }

  _allowsDrop(): bool {
    return this.dropAllowedValue;
  }

  _hasDragEnterHandler(): bool {
    return this.dragEnterCallback !== null || this.dragEnterBinding !== null;
  }

  _hasDragOverHandler(): bool {
    return this.dragOverCallback !== null || this.dragOverBinding !== null;
  }

  _handleDragEnter(args: DragEventArgs): DropProposal {
    const callback = this.dragEnterCallback;
    if (callback !== null) {
      return callback(args);
    }
    const binding = this.dragEnterBinding;
    if (binding !== null) {
      return binding.invoke(args);
    }
    return DropProposal.none();
  }

  _handleDragOver(args: DragEventArgs): DropProposal {
    const callback = this.dragOverCallback;
    if (callback !== null) {
      return callback(args);
    }
    const binding = this.dragOverBinding;
    if (binding !== null) {
      return binding.invoke(args);
    }
    return DropProposal.none();
  }

  _handleDragLeave(args: DragEventArgs): void {
    const callback = this.dragLeaveCallback;
    if (callback !== null) {
      callback(args);
    } else {
      const binding = this.dragLeaveBinding;
      if (binding !== null) {
        binding.invoke(args);
      }
    }
  }

  _handleDropEvent(args: DragEventArgs): void {
    const callback = this.dropCallback;
    if (callback !== null) {
      callback(args);
    } else {
      const binding = this.dropBinding;
      if (binding !== null) {
        binding.invoke(args);
      }
    }
  }

  _allowsExternalDrop(): bool {
    return this.externalDropAllowedValue;
  }

  _hasExternalDragEnterHandler(): bool {
    return this.externalDragEnterCallback !== null || this.externalDragEnterBinding !== null;
  }

  _hasExternalDragOverHandler(): bool {
    return this.externalDragOverCallback !== null || this.externalDragOverBinding !== null;
  }

  _handleExternalDragEnter(args: ExternalDropEventArgs): DropProposal {
    const callback = this.externalDragEnterCallback;
    if (callback !== null) {
      return callback(args);
    }
    const binding = this.externalDragEnterBinding;
    if (binding !== null) {
      return binding.invoke(args);
    }
    return DropProposal.none();
  }

  _handleExternalDragOver(args: ExternalDropEventArgs): DropProposal {
    const callback = this.externalDragOverCallback;
    if (callback !== null) {
      return callback(args);
    }
    const binding = this.externalDragOverBinding;
    if (binding !== null) {
      return binding.invoke(args);
    }
    return DropProposal.none();
  }

  _handleExternalDragLeave(args: ExternalDropEventArgs): void {
    const callback = this.externalDragLeaveCallback;
    if (callback !== null) {
      callback(args);
    } else {
      const binding = this.externalDragLeaveBinding;
      if (binding !== null) {
        binding.invoke(args);
      }
    }
  }

  _handleExternalDropEvent(args: ExternalDropEventArgs): void {
    const callback = this.externalDropCallback;
    if (callback !== null) {
      callback(args);
    } else {
      const binding = this.externalDropBinding;
      if (binding !== null) {
        binding.invoke(args);
      }
    }
  }

  _debugMainAxisPercentValue(_isHorizontal: bool): f32 {
    return -1.0;
  }

  _debugIsAbsolutelyPositioned(): bool {
    return false;
  }

  protected capturePointer(): void {
    if (!this.hasBuiltHandle()) {
      return;
    }
    const handle = this.handle;
    EventRouter.capturePointer(handle);
    fui_set_pointer_capture(handle);
  }

  protected releasePointer(): void {
    if (!this.hasBuiltHandle()) {
      return;
    }
    const handle = this.handle;
    EventRouter.releasePointer(handle);
    fui_release_pointer_capture();
  }

  _captureDragPointer(): void {
    this.capturePointer();
  }

  _releaseDragPointer(): void {
    this.releasePointer();
  }

  _bindRegisteredHandle(handle: u64): void {
    this.handle = handle;
  }

  _resolvedSemanticRole(): SemanticRole {
    return this.resolvedSemanticRole();
  }

  _attachedPropertyKey(): u32 {
    return this.attachedPropertyKey;
  }

  _capturePersistedStateTree(): void {
    this.capturePersistedState();
    for (let index = 0; index < this.childNodes.length; ++index) {
      unchecked(this.childNodes[index])._capturePersistedStateTree();
    }
  }

  _restorePersistedStateTree(): void {
    for (let index = 0; index < this.childNodes.length; ++index) {
      unchecked(this.childNodes[index])._restorePersistedStateTree();
    }
    this.restorePersistedState();
  }

  private indexOfChild(target: Node): i32 {
    for (let index = 0; index < this.childNodes.length; ++index) {
      if (unchecked(this.childNodes[index]) === target) {
        return index;
      }
    }
    return -1;
  }

  private ensureDragGesture(): DragGesture {
    let gesture = this.dragGestureValue;
    if (gesture !== null) {
      return gesture;
    }
    gesture = new DragGesture(this).threshold(4.0);
    gesture.started.bind(this, (owner: Node, event: DragStartedEvent): void => {
      owner.handleDragGestureStarted(event);
    });
    gesture.completed.bind(this, (owner: Node, event: DragCompletedEvent): void => {
      owner.handleDragGestureCompleted(event);
    });
    this.dragGestureValue = gesture;
    return gesture;
  }

  private handleDragGestureStarted(_event: DragStartedEvent): void {
    if (!EventRouter.beginDragSession(this)) {
      const gesture = this.dragGestureValue;
      if (gesture !== null) {
        gesture.cancel();
      }
    }
  }

  private handleDragGestureCompleted(event: DragCompletedEvent): void {
    this.dragClickPending = false;
    if (event.cancelled) {
      EventRouter.cancelDragSessionForSource(this);
    }
  }

  private fireClick(): void {
    const callback = this.clickCallback;
    if (callback !== null) {
      callback();
      return;
    }
    const binding = this.clickBinding;
    if (binding !== null) {
      binding.invoke();
    }
  }

  private cancelDragState(): void {
    this.dragClickPending = false;
    const gesture = this.dragGestureValue;
    if (gesture !== null) {
      gesture.cancel();
    }
  }

  _handlePointerEvent(eventType: PointerEventType, _x: f32, _y: f32, _modifiers: u32 = 0): void {
    if (!this.isEnabled || !this.isVisible) {
      return;
    }
    if (eventType == PointerEventType.Down) {
      ToolTipManager.handlePointerDown(this);
      const dragGesture = this._hasDragSource() ? this.dragGestureValue : null;
      if (dragGesture !== null) {
        dragGesture.handlePointerDown(_x, _y, _modifiers);
        this.dragClickPending = this.clickCallback !== null || this.clickBinding !== null;
      } else {
        this.dragClickPending = false;
      }
      const pointerDown = this.pointerDownCallback;
      if (pointerDown !== null) {
        pointerDown(_x, _y);
      }
      if (dragGesture === null) {
        this.fireClick();
      }
      return;
    }
    if (eventType == PointerEventType.Move) {
      ToolTipManager.handlePointerMove(this, _x, _y);
      const dragGesture = this.dragGestureValue;
      if (dragGesture !== null && (this._hasDragSource() || dragGesture.isDragging)) {
        dragGesture.handlePointerMove(_x, _y, _modifiers);
      }
      const callback = this.pointerMoveCallback;
      if (callback !== null) {
        callback(_x, _y);
      }
      return;
    }
    if (eventType == PointerEventType.Up) {
      const dragGesture = this.dragGestureValue;
      const dragGestureActive = dragGesture !== null && (this._hasDragSource() || dragGesture.isDragging);
      const canFirePendingClick = this.dragClickPending && (!dragGestureActive || !changetype<DragGesture>(dragGesture).isDragging);
      if (dragGestureActive) {
        changetype<DragGesture>(dragGesture).handlePointerUp(_x, _y, _modifiers);
      }
      const callback = this.pointerUpCallback;
      if (callback !== null) {
        callback(_x, _y);
      }
      if (canFirePendingClick) {
        this.fireClick();
      }
      this.dragClickPending = false;
      return;
    }
    if (eventType == PointerEventType.Enter) {
      const callback = this.pointerEnterCallback;
      if (callback !== null) {
        callback();
      }
      ToolTipManager.handlePointerEnter(this, this.toolTipValue, _x, _y);
      return;
    }
    if (eventType == PointerEventType.Leave) {
      const callback = this.pointerLeaveCallback;
      if (callback !== null) {
        callback();
      }
      this.dragClickPending = false;
      ToolTipManager.handlePointerLeave(this);
    }
  }

  _handleFocusChanged(focused: bool): void {
    const callback = this.focusChangedCb;
    if (callback !== null) {
      callback(focused);
    }
    const binding = this.focusChangedBinding;
    if (binding !== null) {
      binding.invoke(focused);
    }
    ToolTipManager.handleFocusChanged(this, this.toolTipValue, focused);
  }

  _handleKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    if (!this.isEnabled || !this.isVisible) {
      return false;
    }
    if (eventType == KeyEventType.Down) {
      const callback = this.keyDownCb;
      if (callback !== null) {
        callback(key, modifiers);
        return true;
      }
      const binding = this.keyDownBinding;
      if (binding !== null) {
        binding.invoke(key, modifiers);
        return true;
      }
      return false;
    }
    if (eventType == KeyEventType.Up) {
      const callback = this.keyUpCb;
      if (callback !== null) {
        callback(key, modifiers);
        return true;
      }
    }
    return false;
  }

  _handleScroll(
    _offsetX: f32,
    _offsetY: f32,
    _contentWidth: f32,
    _contentHeight: f32,
    _viewportWidth: f32,
    _viewportHeight: f32,
  ): void {}

  _handleTextChanged(_text: string): void {}

  _handleTextReplaced(_start: u32, _end: u32, _text: string): void {}

  _handleSelectionChanged(_start: u32, _end: u32): void {}

  _handleCrossSelectionChanged(_text: string): void {}

  protected requireInteractive(): void {
    if (!this.hasPointerCallbacks) {
      this.hasPointerCallbacks = true;
    }
  }

  _bindScrollProxyTarget(handle: u64): void {
    this.scrollProxyTargetHandle = handle;
    if (this.hasBuiltHandle()) {
      ui.setScrollProxyTarget(this.handle, handle);
      this.notifyRetainedMutation();
    }
  }

  _notifyRetainedLayoutMutation(): void {
    this.notifyRetainedLayoutMutation();
  }

  protected reflectSemanticDisabledFromEnabled(): void {
    this.trackSemanticDisabledFromEnabled = true;
    this.hasSemanticDisabled = true;
    this.semanticDisabledValue = !this.isEnabled;
    if (this.hasBuiltHandle()) {
      ui.setSemanticDisabled(this.handle, true, this.semanticDisabledValue);
      this.notifyRetainedMutation();
    }
  }

  protected _onEffectiveEnabledChanged(_isEnabled: bool): void {}

  protected _onEffectiveVisibilityChanged(_visibility: Visibility): void {}

  private _setInheritedEnabled(flag: bool): void {
    if (this.inheritedEnabled == flag) {
      return;
    }
    this.inheritedEnabled = flag;
    this.applyEnabledChanged();
  }

  private _setInheritedVisibility(value: Visibility): void {
    if (this.inheritedVisibility == value) {
      return;
    }
    this.inheritedVisibility = value;
    this.applyVisibilityChanged();
  }

  private effectiveVisibility(): Visibility {
    if (this.inheritedVisibility != Visibility.Normal) {
      return this.inheritedVisibility;
    }
    return this.ownVisibility;
  }

  private applyEnabledChanged(): void {
    const effective = this.isEnabled;
    if (this.lastEffectiveEnabled == effective) {
      return;
    }
    this.lastEffectiveEnabled = effective;

    let updatedHandle = false;
    if (this.hasBuiltHandle()) {
      const interactiveEffective = effective && this.isVisible;
      if (this.hasPointerCallbacks) {
        ui.setInteractive(this.handle, interactiveEffective);
        updatedHandle = true;
      }
      if (this.focusableFlag) {
        ui.setFocusable(this.handle, interactiveEffective && this.focusableFlag, this.focusableTabIndex);
        updatedHandle = true;
      }
      if (this.trackSemanticDisabledFromEnabled) {
        this.semanticDisabledValue = !effective;
        ui.setSemanticDisabled(this.handle, true, this.semanticDisabledValue);
        updatedHandle = true;
      }
      if (updatedHandle) {
        this.notifyRetainedMutation();
      }
    }

    this._onEffectiveEnabledChanged(effective);
    if (!effective) {
      this.cancelDragState();
    }
    for (let i = 0; i < this.childNodes.length; ++i) {
      unchecked(this.childNodes[i])._setInheritedEnabled(effective);
    }
  }

  private applyVisibilityChanged(): void {
    const effective = this.effectiveVisibility();
    if (this.lastEffectiveVisibility == effective) {
      return;
    }
    this.lastEffectiveVisibility = effective;

    let updatedHandle = false;
    if (this.hasBuiltHandle()) {
      ui.setVisibility(this.handle, <u32>effective);
      updatedHandle = true;
      const interactiveEffective = this.isEnabled && this.isVisible;
      if (this.hasPointerCallbacks) {
        ui.setInteractive(this.handle, interactiveEffective);
      }
      if (this.focusableFlag) {
        ui.setFocusable(this.handle, interactiveEffective && this.focusableFlag, this.focusableTabIndex);
      }
      if (updatedHandle) {
        this.notifyRetainedMutation();
      }
    }

    this._onEffectiveVisibilityChanged(effective);
    if (effective != Visibility.Normal) {
      this.cancelDragState();
    }
    for (let i = 0; i < this.childNodes.length; ++i) {
      unchecked(this.childNodes[i])._setInheritedVisibility(effective);
    }
  }

}
