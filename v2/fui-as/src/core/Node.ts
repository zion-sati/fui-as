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
import { HostContext } from "./Platform";
import { bind0, bind1, bind2, bindResult0, bindResult1 } from "./bind";
import {
  CursorStyle,
  fui_release_pointer_capture,
  fui_set_pointer_capture,
  HandleValue,
  KeyEventType,
  KeyModifier,
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

export enum WheelDeltaMode {
  Pixel = 0,
  Line = 1,
  Page = 2,
}

export enum PointerType {
  Unknown = 0,
  Mouse = 1,
  Touch = 2,
  Pen = 3,
}

export enum PointerButton {
  None = -1,
  Primary = 0,
  Auxiliary = 1,
  Secondary = 2,
  Back = 3,
  Forward = 4,
}

export enum PointerButtons {
  None = 0,
  Primary = 1 << 0,
  Secondary = 1 << 1,
  Auxiliary = 1 << 2,
  Back = 1 << 3,
  Forward = 1 << 4,
}

function isPrimaryActivationPointer(event: PointerEventArgs): bool {
  return event.button == PointerButton.Primary || event.pointerType == PointerType.Touch || event.pointerType == PointerType.Pen;
}

export enum GestureIntent {
  None = 0,
  Pan = 1,
  Pinch = 2,
  PanAndPinch = 3,
}

export enum GestureEventPhase {
  Begin = 1,
  Update = 2,
  End = 3,
  Cancel = 4,
}

export enum GestureEventKind {
  None = 0,
  Pan = 1,
  Pinch = 2,
}

export class GestureEventArgs {
  readonly phase: GestureEventPhase;
  readonly kind: GestureEventKind;
  readonly sceneX: f32;
  readonly sceneY: f32;
  readonly deltaX: f32;
  readonly deltaY: f32;
  readonly scale: f32;
  readonly pointerCount: i32;
  x: f32;
  y: f32;
  handled: bool = false;

  constructor(
    phase: GestureEventPhase,
    kind: GestureEventKind,
    sceneX: f32,
    sceneY: f32,
    deltaX: f32,
    deltaY: f32,
    scale: f32,
    pointerCount: i32,
  ) {
    this.phase = phase;
    this.kind = kind;
    this.sceneX = sceneX;
    this.sceneY = sceneY;
    this.deltaX = deltaX;
    this.deltaY = deltaY;
    this.scale = scale;
    this.pointerCount = pointerCount;
    this.x = sceneX;
    this.y = sceneY;
  }
}

export type PanGestureEventArgs = GestureEventArgs;
export type PinchGestureEventArgs = GestureEventArgs;

export const DEFAULT_LONG_PRESS_MINIMUM_DURATION_MS: i32 = 500;
export const DEFAULT_LONG_PRESS_MOVEMENT_TOLERANCE: f32 = 10.0;

export class LongPressEventArgs {
  readonly sceneX: f32;
  readonly sceneY: f32;
  readonly pointerId: i32;
  readonly pointerType: PointerType;
  readonly modifiers: KeyModifier;
  readonly durationMs: i32;
  x: f32;
  y: f32;
  handled: bool = false;

  constructor(
    sceneX: f32,
    sceneY: f32,
    pointerId: i32,
    pointerType: PointerType,
    modifiers: KeyModifier,
    durationMs: i32,
  ) {
    this.sceneX = sceneX;
    this.sceneY = sceneY;
    this.x = sceneX;
    this.y = sceneY;
    this.pointerId = pointerId;
    this.pointerType = pointerType;
    this.modifiers = modifiers;
    this.durationMs = durationMs;
  }
}

export class LongPressGesture {
  private minimumDurationMsValue: i32 = DEFAULT_LONG_PRESS_MINIMUM_DURATION_MS;
  private movementToleranceValue: f32 = DEFAULT_LONG_PRESS_MOVEMENT_TOLERANCE;
  private recognizedCallback: ((event: LongPressEventArgs) => void) | null = null;
  private recognizedBinding: Callback1<LongPressEventArgs> | null = null;

  static create(): LongPressGesture {
    return new LongPressGesture();
  }

  minimumDuration(ms: i32): LongPressGesture {
    this.minimumDurationMsValue = ms < 0 ? 0 : ms;
    return this;
  }

  movementTolerance(px: f32): LongPressGesture {
    this.movementToleranceValue = px < 0.0 ? 0.0 : px;
    return this;
  }

  onRecognized(cb: ((event: LongPressEventArgs) => void) | null): LongPressGesture {
    this.recognizedCallback = cb;
    this.recognizedBinding = null;
    return this;
  }

  onRecognizedWith<Owner>(owner: Owner, handler: Handler1<Owner, LongPressEventArgs>): LongPressGesture {
    this.recognizedCallback = null;
    this.recognizedBinding = bind1<Owner, LongPressEventArgs>(owner, handler);
    return this;
  }

  get minimumDurationMs(): i32 {
    return this.minimumDurationMsValue;
  }

  get movementTolerancePx(): f32 {
    return this.movementToleranceValue;
  }

  get callback(): ((event: LongPressEventArgs) => void) | null {
    return this.recognizedCallback;
  }

  get binding(): Callback1<LongPressEventArgs> | null {
    return this.recognizedBinding;
  }

  get hasHandler(): bool {
    return this.recognizedCallback !== null || this.recognizedBinding !== null;
  }
}

export class PointerEventArgs {
  readonly eventType: PointerEventType;
  readonly sceneX: f32;
  readonly sceneY: f32;
  readonly pointerId: i32;
  readonly pointerType: PointerType;
  readonly button: PointerButton;
  readonly buttons: PointerButtons;
  readonly modifiers: KeyModifier;
  readonly pressure: f32;
  readonly width: f32;
  readonly height: f32;
  readonly clickCount: i32;
  x: f32;
  y: f32;
  handled: bool = false;

  constructor(
    eventType: PointerEventType,
    sceneX: f32,
    sceneY: f32,
    modifiers: KeyModifier = 0,
    pointerId: i32 = -1,
    pointerType: PointerType = PointerType.Unknown,
    button: PointerButton = PointerButton.None,
    buttons: PointerButtons = PointerButtons.None,
    pressure: f32 = 0.0,
    width: f32 = 0.0,
    height: f32 = 0.0,
    clickCount: i32 = 0,
  ) {
    this.eventType = eventType;
    this.sceneX = sceneX;
    this.sceneY = sceneY;
    this.x = sceneX;
    this.y = sceneY;
    this.modifiers = modifiers;
    this.pointerId = pointerId;
    this.pointerType = pointerType;
    this.button = button;
    this.buttons = buttons;
    this.pressure = pressure;
    this.width = width;
    this.height = height;
    this.clickCount = clickCount;
  }
}

export class PointerClickEventArgs {
  readonly sceneX: f32;
  readonly sceneY: f32;
  readonly pointerType: PointerType;
  readonly button: PointerButton;
  readonly buttons: PointerButtons;
  readonly modifiers: KeyModifier;
  readonly clickCount: i32;
  x: f32;
  y: f32;
  handled: bool = false;

  constructor(
    sceneX: f32,
    sceneY: f32,
    pointerType: PointerType = PointerType.Unknown,
    button: PointerButton = PointerButton.None,
    buttons: PointerButtons = PointerButtons.None,
    modifiers: KeyModifier = 0,
    clickCount: i32 = 0,
  ) {
    this.sceneX = sceneX;
    this.sceneY = sceneY;
    this.x = sceneX;
    this.y = sceneY;
    this.pointerType = pointerType;
    this.button = button;
    this.buttons = buttons;
    this.modifiers = modifiers;
    this.clickCount = clickCount;
  }
}

export class ClickEventArgs {
  static readonly Empty: ClickEventArgs = new ClickEventArgs();
}

export class KeyEventArgs {
  readonly eventType: KeyEventType;
  readonly key: string;
  readonly modifiers: KeyModifier;
  handled: bool = false;

  constructor(
    eventType: KeyEventType,
    key: string,
    modifiers: KeyModifier = 0,
  ) {
    this.eventType = eventType;
    this.key = key;
    this.modifiers = modifiers;
  }
}

export class FocusChangedEventArgs {
  readonly focused: bool;

  constructor(focused: bool) {
    this.focused = focused;
  }
}

export class HoverChangedEventArgs {
  readonly hovered: bool;

  constructor(hovered: bool) {
    this.hovered = hovered;
  }
}

export class TextChangedEventArgs {
  readonly text: string;

  constructor(text: string) {
    this.text = text;
  }
}

export class SelectionChangedEventArgs {
  readonly start: u32;
  readonly end: u32;

  constructor(start: u32, end: u32) {
    this.start = start;
    this.end = end;
  }
}

export class CheckboxChangedEventArgs {
  readonly state: SemanticCheckedState;
  readonly checked: bool;

  constructor(state: SemanticCheckedState) {
    this.state = state;
    this.checked = state == SemanticCheckedState.True;
  }
}

export class SwitchChangedEventArgs {
  readonly checked: bool;

  constructor(checked: bool) {
    this.checked = checked;
  }
}

export class RadioButtonChangedEventArgs {
  readonly checked: bool;

  constructor(checked: bool) {
    this.checked = checked;
  }
}

export class RadioGroupChangedEventArgs {
  readonly value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class SliderChangedEventArgs {
  readonly value: f32;

  constructor(value: f32) {
    this.value = value;
  }
}

export class DropdownChangedEventArgs<TItem> {
  readonly item: TItem;
  readonly index: i32;

  constructor(item: TItem, index: i32) {
    this.item = item;
    this.index = index;
  }
}

export class ComboBoxChangedEventArgs<TItem> {
  readonly item: TItem;
  readonly index: i32;

  constructor(item: TItem, index: i32) {
    this.item = item;
    this.index = index;
  }
}

export class DragCompletedEventArgs {
  readonly effect: DragDropEffects;

  constructor(effect: DragDropEffects) {
    this.effect = effect;
  }
}

export class ContextMenuEventArgs {
  readonly target: Node | null;
  readonly x: f32;
  readonly y: f32;
  readonly host: HostContext;

  constructor(target: Node | null, x: f32, y: f32, host: HostContext) {
    this.target = target;
    this.x = x;
    this.y = y;
    this.host = host;
  }
}

export class VisibilityChangedEventArgs {
  readonly visible: bool;

  constructor(visible: bool) {
    this.visible = visible;
  }
}

export class WheelEventArgs {
  readonly sceneX: f32;
  readonly sceneY: f32;
  readonly deltaX: f32;
  readonly deltaY: f32;
  readonly deltaMode: WheelDeltaMode;
  readonly modifiers: KeyModifier;
  x: f32;
  y: f32;
  handled: bool = false;

  constructor(
    sceneX: f32,
    sceneY: f32,
    deltaX: f32,
    deltaY: f32,
    deltaMode: WheelDeltaMode,
    modifiers: KeyModifier,
  ) {
    this.sceneX = sceneX;
    this.sceneY = sceneY;
    this.x = sceneX;
    this.y = sceneY;
    this.deltaX = deltaX;
    this.deltaY = deltaY;
    this.deltaMode = deltaMode;
    this.modifiers = modifiers;
  }
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
  private completedCallback: ((event: DragCompletedEventArgs) => void) | null = null;
  private completedBinding: Callback1<DragCompletedEventArgs> | null = null;

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

  onCompleted(cb: ((event: DragCompletedEventArgs) => void) | null): DragSession {
    this.completedCallback = cb;
    this.completedBinding = null;
    return this;
  }

  onCompletedWith<Owner>(owner: Owner, handler: Handler1<Owner, DragCompletedEventArgs>): DragSession {
    this.completedCallback = null;
    this.completedBinding = bind1<Owner, DragCompletedEventArgs>(owner, handler);
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
    const event = new DragCompletedEventArgs(effect);
    const callback = this.completedCallback;
    if (callback !== null) {
      callback(event);
      return;
    }
    const binding = this.completedBinding;
    if (binding !== null) {
      binding.invoke(event);
    }
  }
}

export class DragEventArgs {
  readonly session: DragSession;
  readonly x: f32;
  readonly y: f32;
  readonly modifiers: KeyModifier;

  constructor(session: DragSession, x: f32, y: f32, modifiers: KeyModifier) {
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
  readonly modifiers: KeyModifier;
  readonly items: Array<ExternalDropItemInfo>;

  constructor(x: f32, y: f32, modifiers: KeyModifier, items: Array<ExternalDropItemInfo>) {
    this.x = x;
    this.y = y;
    this.modifiers = modifiers;
    this.items = items;
  }
}

export abstract class Node implements DragGestureHost, Disposable {
  protected static pendingPointerEventArgs: PointerEventArgs | null = null;
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
  private pointerClickCallback: ((event: PointerClickEventArgs) => void) | null = null;
  private pointerClickBinding: Callback1<PointerClickEventArgs> | null = null;
  private pointerDoubleClickCallback: ((event: PointerClickEventArgs) => void) | null = null;
  private pointerDoubleClickBinding: Callback1<PointerClickEventArgs> | null = null;
  private pointerTripleClickCallback: ((event: PointerClickEventArgs) => void) | null = null;
  private pointerTripleClickBinding: Callback1<PointerClickEventArgs> | null = null;
  private pointerDownEventCallback: ((event: PointerEventArgs) => void) | null = null;
  private pointerDownEventBinding: Callback1<PointerEventArgs> | null = null;
  private pointerMoveEventCallback: ((event: PointerEventArgs) => void) | null = null;
  private pointerMoveEventBinding: Callback1<PointerEventArgs> | null = null;
  private pointerUpEventCallback: ((event: PointerEventArgs) => void) | null = null;
  private pointerUpEventBinding: Callback1<PointerEventArgs> | null = null;
  private pointerEnterEventCallback: ((event: PointerEventArgs) => void) | null = null;
  private pointerEnterEventBinding: Callback1<PointerEventArgs> | null = null;
  private pointerLeaveEventCallback: ((event: PointerEventArgs) => void) | null = null;
  private pointerLeaveEventBinding: Callback1<PointerEventArgs> | null = null;
  private pointerCancelEventCallback: ((event: PointerEventArgs) => void) | null = null;
  private pointerCancelEventBinding: Callback1<PointerEventArgs> | null = null;
  private wheelCallback: ((event: WheelEventArgs) => void) | null = null;
  private wheelBinding: Callback1<WheelEventArgs> | null = null;
  private gestureIntentValue: GestureIntent = GestureIntent.None;
  private panGestureCallback: ((event: PanGestureEventArgs) => void) | null = null;
  private panGestureBinding: Callback1<PanGestureEventArgs> | null = null;
  private pinchGestureCallback: ((event: PinchGestureEventArgs) => void) | null = null;
  private pinchGestureBinding: Callback1<PinchGestureEventArgs> | null = null;
  private longPressGestureCallback: ((event: LongPressEventArgs) => void) | null = null;
  private longPressGestureBinding: Callback1<LongPressEventArgs> | null = null;
  private longPressMinimumDurationMsValue: i32 = DEFAULT_LONG_PRESS_MINIMUM_DURATION_MS;
  private longPressMovementToleranceValue: f32 = DEFAULT_LONG_PRESS_MOVEMENT_TOLERANCE;
  private dragDataCallback: (() => DragDataObject | null) | null = null;
  private dragDataBinding: ResultCallback0<DragDataObject | null> | null = null;
  private dragAllowedEffectsValue: DragDropEffects = DragDropEffects.Copy;
  private dragCompletedCallback: ((event: DragCompletedEventArgs) => void) | null = null;
  private dragCompletedBinding: Callback1<DragCompletedEventArgs> | null = null;
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
  private dragClickPendingCount: i32 = 0;
  private clickPending: bool = false;
  private clickPendingCount: i32 = 0;
  private contextMenuCallback: ((event: ContextMenuEventArgs) => void) | null = null;
  private contextMenuDisabledValue: bool = false;
  private focusableFlag: bool = false;
  private focusableTabIndex: i32 = 0;
  private focusChangedCb: ((event: FocusChangedEventArgs) => void) | null = null;
  private focusChangedBinding: Callback1<FocusChangedEventArgs> | null = null;
  private keyDownCb: ((event: KeyEventArgs) => void) | null = null;
  private keyDownBinding: Callback1<KeyEventArgs> | null = null;
  private keyUpCb: ((event: KeyEventArgs) => void) | null = null;
  private keyUpBinding: Callback1<KeyEventArgs> | null = null;
  private hasPointerCallbacks: bool = false;
  private preserveSelectionOnPointerDownValue: bool = false;
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

  get isSelectableText(): bool {
    return false;
  }

  get isEditableText(): bool {
    return false;
  }

  get contextMenuHandler(): ((event: ContextMenuEventArgs) => void) | null {
    return this.contextMenuCallback;
  }

  get gestureIntentValueForRouting(): GestureIntent {
    return this.gestureIntentValue;
  }

  get hasLongPressGestureForRouting(): bool {
    return this.longPressGestureCallback !== null || this.longPressGestureBinding !== null || this._hasDragSource();
  }

  get longPressContinuesPointerEventsForRouting(): bool {
    return this._hasDragSource();
  }

  get longPressMinimumDurationMsForRouting(): i32 {
    return this.longPressMinimumDurationMsValue;
  }

  get longPressMovementToleranceForRouting(): f32 {
    return this.longPressMovementToleranceValue;
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

  onPointerClick(cb: (event: PointerClickEventArgs) => void): this {
    this.pointerClickCallback = cb;
    this.pointerClickBinding = null;
    this.requireInteractive();
    return this;
  }

  bindPointerClick<Owner>(owner: Owner, handler: Handler1<Owner, PointerClickEventArgs>): this {
    this.pointerClickCallback = null;
    this.pointerClickBinding = bind1<Owner, PointerClickEventArgs>(owner, handler);
    this.requireInteractive();
    return this;
  }

  onPointerClickWith<Owner>(owner: Owner, handler: Handler1<Owner, PointerClickEventArgs>): this {
    this.bindPointerClick(owner, handler);
    return this;
  }

  onPointerDoubleClick(cb: (event: PointerClickEventArgs) => void): this {
    this.pointerDoubleClickCallback = cb;
    this.pointerDoubleClickBinding = null;
    this.requireInteractive();
    return this;
  }

  bindPointerDoubleClick<Owner>(owner: Owner, handler: Handler1<Owner, PointerClickEventArgs>): this {
    this.pointerDoubleClickCallback = null;
    this.pointerDoubleClickBinding = bind1<Owner, PointerClickEventArgs>(owner, handler);
    this.requireInteractive();
    return this;
  }

  onPointerDoubleClickWith<Owner>(owner: Owner, handler: Handler1<Owner, PointerClickEventArgs>): this {
    this.bindPointerDoubleClick(owner, handler);
    return this;
  }

  onPointerTripleClick(cb: (event: PointerClickEventArgs) => void): this {
    this.pointerTripleClickCallback = cb;
    this.pointerTripleClickBinding = null;
    this.requireInteractive();
    return this;
  }

  bindPointerTripleClick<Owner>(owner: Owner, handler: Handler1<Owner, PointerClickEventArgs>): this {
    this.pointerTripleClickCallback = null;
    this.pointerTripleClickBinding = bind1<Owner, PointerClickEventArgs>(owner, handler);
    this.requireInteractive();
    return this;
  }

  onPointerTripleClickWith<Owner>(owner: Owner, handler: Handler1<Owner, PointerClickEventArgs>): this {
    this.bindPointerTripleClick(owner, handler);
    return this;
  }

  onPointerDown(cb: (event: PointerEventArgs) => void): this {
    this.pointerDownEventCallback = cb;
    this.pointerDownEventBinding = null;
    this.requireInteractive();
    return this;
  }

  onPointerDownWith<Owner>(owner: Owner, handler: Handler1<Owner, PointerEventArgs>): this {
    this.pointerDownEventCallback = null;
    this.pointerDownEventBinding = bind1<Owner, PointerEventArgs>(owner, handler);
    this.requireInteractive();
    return this;
  }

  onPointerMove(cb: (event: PointerEventArgs) => void): this {
    this.pointerMoveEventCallback = cb;
    this.pointerMoveEventBinding = null;
    this.requireInteractive();
    return this;
  }

  onPointerMoveWith<Owner>(owner: Owner, handler: Handler1<Owner, PointerEventArgs>): this {
    this.pointerMoveEventCallback = null;
    this.pointerMoveEventBinding = bind1<Owner, PointerEventArgs>(owner, handler);
    this.requireInteractive();
    return this;
  }

  onPointerUp(cb: (event: PointerEventArgs) => void): this {
    this.pointerUpEventCallback = cb;
    this.pointerUpEventBinding = null;
    this.requireInteractive();
    return this;
  }

  onPointerUpWith<Owner>(owner: Owner, handler: Handler1<Owner, PointerEventArgs>): this {
    this.pointerUpEventCallback = null;
    this.pointerUpEventBinding = bind1<Owner, PointerEventArgs>(owner, handler);
    this.requireInteractive();
    return this;
  }

  onPointerEnter(cb: (event: PointerEventArgs) => void): this {
    this.pointerEnterEventCallback = cb;
    this.pointerEnterEventBinding = null;
    this.requireInteractive();
    return this;
  }

  onPointerEnterWith<Owner>(owner: Owner, handler: Handler1<Owner, PointerEventArgs>): this {
    this.pointerEnterEventCallback = null;
    this.pointerEnterEventBinding = bind1<Owner, PointerEventArgs>(owner, handler);
    this.requireInteractive();
    return this;
  }

  onPointerLeave(cb: (event: PointerEventArgs) => void): this {
    this.pointerLeaveEventCallback = cb;
    this.pointerLeaveEventBinding = null;
    this.requireInteractive();
    return this;
  }

  onPointerLeaveWith<Owner>(owner: Owner, handler: Handler1<Owner, PointerEventArgs>): this {
    this.pointerLeaveEventCallback = null;
    this.pointerLeaveEventBinding = bind1<Owner, PointerEventArgs>(owner, handler);
    this.requireInteractive();
    return this;
  }

  onPointerCancel(cb: (event: PointerEventArgs) => void): this {
    this.pointerCancelEventCallback = cb;
    this.pointerCancelEventBinding = null;
    this.requireInteractive();
    return this;
  }

  onPointerCancelWith<Owner>(owner: Owner, handler: Handler1<Owner, PointerEventArgs>): this {
    this.pointerCancelEventCallback = null;
    this.pointerCancelEventBinding = bind1<Owner, PointerEventArgs>(owner, handler);
    this.requireInteractive();
    return this;
  }

  onWheel(cb: (event: WheelEventArgs) => void): this {
    this.wheelCallback = cb;
    this.wheelBinding = null;
    this.requireInteractive();
    return this;
  }

  bindWheel<Owner>(owner: Owner, handler: Handler1<Owner, WheelEventArgs>): this {
    this.wheelCallback = null;
    this.wheelBinding = bind1<Owner, WheelEventArgs>(owner, handler);
    this.requireInteractive();
    return this;
  }

  onWheelWith<Owner>(owner: Owner, handler: Handler1<Owner, WheelEventArgs>): this {
    this.bindWheel(owner, handler);
    return this;
  }

  panGesture(cb: ((event: PanGestureEventArgs) => void) | null): this {
    this.panGestureCallback = cb;
    this.panGestureBinding = null;
    this.updateRecognizerGestureIntent();
    return this;
  }

  panGestureWith<Owner>(owner: Owner, handler: Handler1<Owner, PanGestureEventArgs>): this {
    this.panGestureCallback = null;
    this.panGestureBinding = bind1<Owner, PanGestureEventArgs>(owner, handler);
    this.updateRecognizerGestureIntent();
    return this;
  }

  pinchGesture(cb: ((event: PinchGestureEventArgs) => void) | null): this {
    this.pinchGestureCallback = cb;
    this.pinchGestureBinding = null;
    this.updateRecognizerGestureIntent();
    return this;
  }

  pinchGestureWith<Owner>(owner: Owner, handler: Handler1<Owner, PinchGestureEventArgs>): this {
    this.pinchGestureCallback = null;
    this.pinchGestureBinding = bind1<Owner, PinchGestureEventArgs>(owner, handler);
    this.updateRecognizerGestureIntent();
    return this;
  }

  longPressGesture(cb: ((event: LongPressEventArgs) => void) | null): this {
    this.longPressGestureCallback = cb;
    this.longPressGestureBinding = null;
    this.longPressMinimumDurationMsValue = DEFAULT_LONG_PRESS_MINIMUM_DURATION_MS;
    this.longPressMovementToleranceValue = DEFAULT_LONG_PRESS_MOVEMENT_TOLERANCE;
    if (cb !== null) {
      this.requireInteractive();
    }
    return this;
  }

  longPressGestureWith<Owner>(owner: Owner, handler: Handler1<Owner, LongPressEventArgs>): this {
    this.longPressGestureCallback = null;
    this.longPressGestureBinding = bind1<Owner, LongPressEventArgs>(owner, handler);
    this.longPressMinimumDurationMsValue = DEFAULT_LONG_PRESS_MINIMUM_DURATION_MS;
    this.longPressMovementToleranceValue = DEFAULT_LONG_PRESS_MOVEMENT_TOLERANCE;
    this.requireInteractive();
    return this;
  }

  longPressRecognizer(gesture: LongPressGesture | null): this {
    if (gesture === null) {
      this.longPressGestureCallback = null;
      this.longPressGestureBinding = null;
      this.longPressMinimumDurationMsValue = DEFAULT_LONG_PRESS_MINIMUM_DURATION_MS;
      this.longPressMovementToleranceValue = DEFAULT_LONG_PRESS_MOVEMENT_TOLERANCE;
      return this;
    }
    this.longPressGestureCallback = gesture.callback;
    this.longPressGestureBinding = gesture.binding;
    this.longPressMinimumDurationMsValue = gesture.minimumDurationMs;
    this.longPressMovementToleranceValue = gesture.movementTolerancePx;
    if (gesture.hasHandler) {
      this.requireInteractive();
    }
    return this;
  }

  private updateRecognizerGestureIntent(): void {
    let intent = GestureIntent.None;
    if (this.panGestureCallback !== null || this.panGestureBinding !== null) {
      intent = <GestureIntent>(<u32>intent | <u32>GestureIntent.Pan);
    }
    if (this.pinchGestureCallback !== null || this.pinchGestureBinding !== null) {
      intent = <GestureIntent>(<u32>intent | <u32>GestureIntent.Pinch);
    }
    this.gestureIntentValue = intent;
    if (intent != GestureIntent.None) {
      this.requireInteractive();
    }
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

  onDragCompleted(cb: ((event: DragCompletedEventArgs) => void) | null): this {
    this.dragCompletedCallback = cb;
    this.dragCompletedBinding = null;
    return this;
  }

  onDragCompletedWith<Owner>(owner: Owner, handler: Handler1<Owner, DragCompletedEventArgs>): this {
    this.dragCompletedCallback = null;
    this.dragCompletedBinding = bind1<Owner, DragCompletedEventArgs>(owner, handler);
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

  preserveSelectionOnPointerDown(preserve: bool = true): this {
    if (this.preserveSelectionOnPointerDownValue == preserve) {
      return this;
    }
    this.preserveSelectionOnPointerDownValue = preserve;
    if (this.hasBuiltHandle()) {
      ui.setPreserveSelectionOnPointerDown(this.handle, preserve);
      this.notifyRetainedMutation();
    }
    return this;
  }

  get preservesSelectionOnPointerDownForRouting(): bool {
    return this.preserveSelectionOnPointerDownValue;
  }

  toolTipText(text: string): this {
    this.toolTip(ToolTip.text(text));
    return this;
  }

  clearToolTip(): this {
    this.toolTip(null);
    return this;
  }

  onContextMenu(cb: ((event: ContextMenuEventArgs) => void) | null): this {
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

  onFocusChanged(cb: (event: FocusChangedEventArgs) => void): this {
    this.focusChangedCb = cb;
    this.focusChangedBinding = null;
    return this;
  }

  bindFocusChanged<Owner>(owner: Owner, handler: Handler1<Owner, FocusChangedEventArgs>): this {
    this.focusChangedCb = null;
    this.focusChangedBinding = bind1<Owner, FocusChangedEventArgs>(owner, handler);
    return this;
  }

  onFocusChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, FocusChangedEventArgs>): this {
    this.bindFocusChanged(owner, handler);
    return this;
  }

  onKeyDown(cb: (event: KeyEventArgs) => void): this {
    this.keyDownCb = cb;
    this.keyDownBinding = null;
    return this;
  }

  bindKeyDown<Owner>(owner: Owner, handler: Handler1<Owner, KeyEventArgs>): this {
    this.keyDownCb = null;
    this.keyDownBinding = bind1<Owner, KeyEventArgs>(owner, handler);
    return this;
  }

  onKeyDownWith<Owner>(owner: Owner, handler: Handler1<Owner, KeyEventArgs>): this {
    this.bindKeyDown(owner, handler);
    return this;
  }

  onKeyUp(cb: (event: KeyEventArgs) => void): this {
    this.keyUpCb = cb;
    this.keyUpBinding = null;
    return this;
  }

  bindKeyUp<Owner>(owner: Owner, handler: Handler1<Owner, KeyEventArgs>): this {
    this.keyUpCb = null;
    this.keyUpBinding = bind1<Owner, KeyEventArgs>(owner, handler);
    return this;
  }

  onKeyUpWith<Owner>(owner: Owner, handler: Handler1<Owner, KeyEventArgs>): this {
    this.bindKeyUp(owner, handler);
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

  /// Removes `node` from this parent.  Does NOT call `dispose()` — the C++ handle
  /// stays alive so callers can re-parent with `addChildNode()`.
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
    this.lastEffectiveEnabled = this.isEnabled;
    this.lastEffectiveVisibility = this.effectiveVisibility();
    EventRouter.register(this.handle, this);
    if (this.focusableFlag && this.isEnabled && this.isVisible) {
      ui.setFocusable(this.handle, this.focusableFlag, this.focusableTabIndex);
    }
    if (this.hasPointerCallbacks && this.isEnabled && this.isVisible) {
      ui.setInteractive(this.handle, true);
    }
    if (this.preserveSelectionOnPointerDownValue) {
      ui.setPreserveSelectionOnPointerDown(this.handle, true);
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
    const event = new DragCompletedEventArgs(effect);
    const callback = this.dragCompletedCallback;
    if (callback !== null) {
      callback(event);
    } else {
      const binding = this.dragCompletedBinding;
      if (binding !== null) {
        binding.invoke(event);
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

  _debugNodeId(): string | null {
    return this.nodeIdValue;
  }

  _debugTreePath(): string {
    const segments = new Array<i32>();
    let current: Node | null = this;
    while (current !== null) {
      const parent = current.retainedParent;
      if (parent === null) {
        break;
      }
      let childIndex = -1;
      for (let index = 0; index < parent.childNodes.length; ++index) {
        if (unchecked(parent.childNodes[index]) === current) {
          childIndex = index;
          break;
        }
      }
      if (childIndex < 0) {
        break;
      }
      segments.push(childIndex);
      current = parent;
    }
    let path = "root";
    for (let index = segments.length - 1; index >= 0; --index) {
      path += "/" + unchecked(segments[index]).toString();
    }
    return path;
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

  _requiredFontIds(): Array<u32> {
    return new Array<u32>();
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

  private fireClick(count: i32, event: PointerEventArgs): void {
    const clickEvent = new PointerClickEventArgs(
      event.sceneX,
      event.sceneY,
      event.pointerType,
      event.button,
      event.buttons,
      event.modifiers,
      count > 0 ? count : 1,
    );
    clickEvent.x = event.x;
    clickEvent.y = event.y;
    const callback = this.pointerClickCallback;
    if (callback !== null) {
      callback(clickEvent);
    } else {
      const binding = this.pointerClickBinding;
      if (binding !== null) {
        binding.invoke(clickEvent);
      }
    }
    if (clickEvent.clickCount == 2) {
      const doubleCallback = this.pointerDoubleClickCallback;
      if (doubleCallback !== null) {
        doubleCallback(clickEvent);
      } else {
        const doubleBinding = this.pointerDoubleClickBinding;
        if (doubleBinding !== null) {
          doubleBinding.invoke(clickEvent);
        }
      }
    } else if (clickEvent.clickCount == 3) {
      const tripleCallback = this.pointerTripleClickCallback;
      if (tripleCallback !== null) {
        tripleCallback(clickEvent);
      } else {
        const tripleBinding = this.pointerTripleClickBinding;
        if (tripleBinding !== null) {
          tripleBinding.invoke(clickEvent);
        }
      }
    }
    event.handled = clickEvent.handled;
  }

  private hasPointerClickHandler(): bool {
    return this.pointerClickCallback !== null
      || this.pointerClickBinding !== null
      || this.pointerDoubleClickCallback !== null
      || this.pointerDoubleClickBinding !== null
      || this.pointerTripleClickCallback !== null
      || this.pointerTripleClickBinding !== null;
  }

  private cancelDragState(): void {
    this.dragClickPending = false;
    this.dragClickPendingCount = 0;
    this.clickPending = false;
    this.clickPendingCount = 0;
    const gesture = this.dragGestureValue;
    if (gesture !== null) {
      gesture.cancel();
    }
  }

  _handlePointerEvent(eventType: PointerEventType, _x: f32, _y: f32, _modifiers: u32 = 0): void {
    const pending = Node.pendingPointerEventArgs;
    let event = pending !== null
      ? changetype<PointerEventArgs>(pending)
      : new PointerEventArgs(eventType, _x, _y, _modifiers);
    if (pending === event) {
      Node.pendingPointerEventArgs = null;
    }
    this.handlePointerEventCore(event);
  }

  _handlePointerEventWithArgs(event: PointerEventArgs): void {
    this.handlePointerEventCore(event);
  }

  _handleBubbledPointerEvent(event: PointerEventArgs): bool {
    if (!this.isEnabled || !this.isVisible) {
      return false;
    }
    const nodeX: f32 = this.hasBuiltHandle() ? (event.sceneX - this.getBounds()[0]) : event.sceneX;
    const nodeY: f32 = this.hasBuiltHandle() ? (event.sceneY - this.getBounds()[1]) : event.sceneY;
    event.x = nodeX;
    event.y = nodeY;
    this.invokePointerEventCallback(event);
    if (!event.handled) {
      if (event.eventType == PointerEventType.Down) {
        const isPrimaryButton = isPrimaryActivationPointer(event);
        this.clickPending = isPrimaryButton && this.hasPointerClickHandler();
        this.clickPendingCount = event.clickCount;
      } else if (event.eventType == PointerEventType.Up) {
        if (this.clickPending) {
          this.fireClick(this.clickPendingCount, event);
        }
        this.clickPending = false;
        this.clickPendingCount = 0;
      } else if (event.eventType == PointerEventType.Leave || event.eventType == PointerEventType.Cancel) {
        this.clickPending = false;
        this.clickPendingCount = 0;
      }
    }
    return event.handled;
  }

  static _dispatchPointerEventWithArgs(node: Node, event: PointerEventArgs): void {
    Node.pendingPointerEventArgs = event;
    node._handlePointerEvent(event.eventType, event.sceneX, event.sceneY, event.modifiers);
    if (Node.pendingPointerEventArgs === event) {
      Node.pendingPointerEventArgs = null;
    }
  }

  private handlePointerEventCore(event: PointerEventArgs): void {
    if (!this.isEnabled || !this.isVisible) {
      return;
    }
    const _x = event.sceneX;
    const _y = event.sceneY;
    const _modifiers = event.modifiers;
    const nodeX: f32 = this.hasBuiltHandle() ? (_x - this.getBounds()[0]) : _x;
    const nodeY: f32 = this.hasBuiltHandle() ? (_y - this.getBounds()[1]) : _y;
    event.x = nodeX;
    event.y = nodeY;
    const eventType = event.eventType;
    if (eventType == PointerEventType.Down) {
      ToolTipManager.handlePointerDown(this);
      this.invokePointerEventCallback(event);
      if (event.handled) {
        return;
      }
      const dragGesture = this._hasDragSource() ? this.dragGestureValue : null;
      const isPrimaryButton = isPrimaryActivationPointer(event);
      if (dragGesture !== null && isPrimaryButton) {
        const waitForLongPress = event.pointerType == PointerType.Touch || event.pointerType == PointerType.Pen;
        dragGesture.handlePointerDown(nodeX, nodeY, _modifiers, waitForLongPress);
        this.dragClickPending = this.hasPointerClickHandler();
        this.dragClickPendingCount = event.clickCount;
        this.clickPending = false;
        this.clickPendingCount = 0;
      } else {
        this.dragClickPending = false;
        this.dragClickPendingCount = 0;
        this.clickPending = isPrimaryButton && this.hasPointerClickHandler();
        this.clickPendingCount = event.clickCount;
      }
      return;
    }
    if (eventType == PointerEventType.Move) {
      ToolTipManager.handlePointerMove(this, _x, _y);
      this.invokePointerEventCallback(event);
      if (event.handled) {
        return;
      }
      const dragGesture = this.dragGestureValue;
      if (dragGesture !== null && (this._hasDragSource() || dragGesture.isDragging)) {
        dragGesture.handlePointerMove(nodeX, nodeY, _modifiers);
      }
      return;
    }
    if (eventType == PointerEventType.Up) {
      this.invokePointerEventCallback(event);
      if (event.handled) {
        this.dragClickPending = false;
        this.dragClickPendingCount = 0;
        this.clickPending = false;
        this.clickPendingCount = 0;
        return;
      }
      const dragGesture = this.dragGestureValue;
      const dragGestureActive = dragGesture !== null && (this._hasDragSource() || dragGesture.isDragging);
      const canFirePendingClick = this.dragClickPending && (!dragGestureActive || !changetype<DragGesture>(dragGesture).isDragging);
      const canFireClick = this.clickPending;
      if (dragGestureActive) {
        changetype<DragGesture>(dragGesture).handlePointerUp(nodeX, nodeY, _modifiers);
      }
      if (canFireClick) {
        this.fireClick(this.clickPendingCount, event);
      }
      this.clickPending = false;
      this.clickPendingCount = 0;
      if (canFirePendingClick) {
        this.fireClick(this.dragClickPendingCount, event);
      }
      this.dragClickPending = false;
      this.dragClickPendingCount = 0;
      return;
    }
    if (eventType == PointerEventType.Enter) {
      this.invokePointerEventCallback(event);
      if (event.handled) {
        return;
      }
      ToolTipManager.handlePointerEnter(this, this.toolTipValue, _x, _y);
      return;
    }
    if (eventType == PointerEventType.Leave) {
      this.invokePointerEventCallback(event);
      if (event.handled) {
        this.dragClickPending = false;
        this.clickPending = false;
        this.clickPendingCount = 0;
        ToolTipManager.handlePointerLeave(this);
        return;
      }
      this.dragClickPending = false;
      this.clickPending = false;
      this.clickPendingCount = 0;
      ToolTipManager.handlePointerLeave(this);
      return;
    }
    if (eventType == PointerEventType.Cancel) {
      this.invokePointerEventCallback(event);
      if (event.handled) {
        this.cancelDragState();
        ToolTipManager.handlePointerLeave(this);
        return;
      }
      this.cancelDragState();
      ToolTipManager.handlePointerLeave(this);
    }
  }

  private invokePointerEventCallback(event: PointerEventArgs): void {
    if (event.eventType == PointerEventType.Down) {
      const callback = this.pointerDownEventCallback;
      if (callback !== null) {
        callback(event);
      }
      const binding = this.pointerDownEventBinding;
      if (binding !== null) {
        binding.invoke(event);
      }
      return;
    }
    if (event.eventType == PointerEventType.Move) {
      const callback = this.pointerMoveEventCallback;
      if (callback !== null) {
        callback(event);
      }
      const binding = this.pointerMoveEventBinding;
      if (binding !== null) {
        binding.invoke(event);
      }
      return;
    }
    if (event.eventType == PointerEventType.Up) {
      const callback = this.pointerUpEventCallback;
      if (callback !== null) {
        callback(event);
      }
      const binding = this.pointerUpEventBinding;
      if (binding !== null) {
        binding.invoke(event);
      }
      return;
    }
    if (event.eventType == PointerEventType.Enter) {
      const callback = this.pointerEnterEventCallback;
      if (callback !== null) {
        callback(event);
      }
      const binding = this.pointerEnterEventBinding;
      if (binding !== null) {
        binding.invoke(event);
      }
      return;
    }
    if (event.eventType == PointerEventType.Leave) {
      const callback = this.pointerLeaveEventCallback;
      if (callback !== null) {
        callback(event);
      }
      const binding = this.pointerLeaveEventBinding;
      if (binding !== null) {
        binding.invoke(event);
      }
      return;
    }
    if (event.eventType == PointerEventType.Cancel) {
      const callback = this.pointerCancelEventCallback;
      if (callback !== null) {
        callback(event);
      }
      const binding = this.pointerCancelEventBinding;
      if (binding !== null) {
        binding.invoke(event);
      }
    }
  }

  _handleWheelEvent(event: WheelEventArgs): bool {
    if (!this.isEnabled || !this.isVisible) {
      return false;
    }
    const bounds = this.hasBuiltHandle() ? this.getBounds() : new Float32Array(4);
    event.x = event.sceneX - unchecked(bounds[0]);
    event.y = event.sceneY - unchecked(bounds[1]);
    const callback = this.wheelCallback;
    if (callback !== null) {
      callback(event);
    }
    const binding = this.wheelBinding;
    if (binding !== null) {
      binding.invoke(event);
    }
    return event.handled;
  }

  _handleGestureEvent(event: GestureEventArgs): bool {
    if (!this.isEnabled || !this.isVisible) {
      return false;
    }
    const bounds = this.hasBuiltHandle() ? this.getBounds() : new Float32Array(4);
    event.x = event.sceneX - unchecked(bounds[0]);
    event.y = event.sceneY - unchecked(bounds[1]);
    if (event.kind == GestureEventKind.Pan) {
      const panCallback = this.panGestureCallback;
      if (panCallback !== null) {
        panCallback(event);
      }
      const panBinding = this.panGestureBinding;
      if (panBinding !== null) {
        panBinding.invoke(event);
      }
    } else if (event.kind == GestureEventKind.Pinch) {
      const pinchCallback = this.pinchGestureCallback;
      if (pinchCallback !== null) {
        pinchCallback(event);
      }
      const pinchBinding = this.pinchGestureBinding;
      if (pinchBinding !== null) {
        pinchBinding.invoke(event);
      }
    }
    return event.handled;
  }

  _handleBubbledGestureEvent(event: GestureEventArgs): bool {
    return this._handleGestureEvent(event);
  }

  static _dispatchGestureEventWithArgs(node: Node, event: GestureEventArgs): void {
    node._handleGestureEvent(event);
  }

  _handleLongPressEvent(event: LongPressEventArgs): bool {
    if (!this.isEnabled || !this.isVisible) {
      return false;
    }
    const bounds = this.hasBuiltHandle() ? this.getBounds() : new Float32Array(4);
    event.x = event.sceneX - unchecked(bounds[0]);
    event.y = event.sceneY - unchecked(bounds[1]);
    const callback = this.longPressGestureCallback;
    if (callback !== null) {
      callback(event);
    }
    const binding = this.longPressGestureBinding;
    if (binding !== null) {
      binding.invoke(event);
    }
    if (!event.handled && (event.pointerType == PointerType.Touch || event.pointerType == PointerType.Pen)) {
      const dragGesture = this._hasDragSource() ? this.dragGestureValue : null;
      if (dragGesture !== null) {
        event.handled = dragGesture.handleLongPress(event.x, event.y, event.modifiers);
      }
    }
    return event.handled;
  }

  _handleBubbledLongPressEvent(event: LongPressEventArgs): bool {
    return this._handleLongPressEvent(event);
  }

  static _dispatchLongPressEventWithArgs(node: Node, event: LongPressEventArgs): void {
    node._handleLongPressEvent(event);
  }

  _handleFocusChanged(focused: bool): void {
    const event = new FocusChangedEventArgs(focused);
    const callback = this.focusChangedCb;
    if (callback !== null) {
      callback(event);
    }
    const binding = this.focusChangedBinding;
    if (binding !== null) {
      binding.invoke(event);
    }
    ToolTipManager.handleFocusChanged(this, this.toolTipValue, focused);
  }

  _handleKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    if (!this.isEnabled || !this.isVisible) {
      return false;
    }
    const event = new KeyEventArgs(eventType, key, modifiers);
    if (eventType == KeyEventType.Down) {
      const callback = this.keyDownCb;
      if (callback !== null) {
        callback(event);
        return true;
      }
      const binding = this.keyDownBinding;
      if (binding !== null) {
        binding.invoke(event);
        return true;
      }
      return false;
    }
    if (eventType == KeyEventType.Up) {
      const callback = this.keyUpCb;
      if (callback !== null) {
        callback(event);
        return true;
      }
      const binding = this.keyUpBinding;
      if (binding !== null) {
        binding.invoke(event);
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
    if (this.hasBuiltHandle() && this.isEnabled && this.isVisible) {
      ui.setInteractive(this.handle, true);
      this.notifyRetainedMutation();
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
