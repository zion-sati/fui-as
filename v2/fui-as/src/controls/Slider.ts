import * as ui from "../bindings/ui";
import { HandlerAction } from "../core/Action";
import { Callback1, Handler1 } from "../core/BoundCallback";
import { Disposable, disposeAll } from "../core/Disposable";
import { DragCompletedEvent, DragDeltaEvent, DragGesture, DragGestureHost, DragStartedEvent } from "../core/DragGesture";
import { FocusAdornerManager } from "../core/FocusAdornerManager";
import { keyboardFocusVisible } from "../core/FocusVisibility";
import {
  CursorStyle,
  KeyEventType,
  Orientation,
  PointerEventType,
  SemanticRole,
  Unit,
} from "../core/ffi";
import { Theme, activeTheme } from "../core/Theme";
import { warn } from "../core/Logger";
import { PersistedFloat32Codec, PersistedValueState } from "../core/PersistedState";
import { Node, SliderChangedEventArgs } from "../core/Node";
import { FlexBox } from "../nodes";
import { bind1 } from "../core/bind";
import { SliderSizing } from "./ControlSizing";
import { SliderColors } from "./SliderColors";
import { getControlTemplates } from "./ControlTemplateSet";
import {
  createDefaultSliderPresenter,
  SliderPresenter,
  SliderTemplate,
  SliderVisualState,
} from "./internal/SliderPresenter";

const SLIDER_PERSISTED_CODEC = new PersistedFloat32Codec();

class PersistedSliderState extends PersistedValueState<Slider, f32> {
  constructor() {
    super("slider-value", SLIDER_PERSISTED_CODEC, 1);
  }

  protected captureValue(node: Slider): f32 {
    return node.value;
  }

  protected restoreValue(node: Slider, value: f32): void {
    node._applyPersistedValue(value);
  }
}

const SLIDER_PERSISTED_STATE = new PersistedSliderState();

function clamp(value: f32, min: f32, max: f32): f32 {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

const SLIDER_FOCUS_BORDER_WIDTH: f32 = 2.0;
const SLIDER_PADDING: f32 = 2.0;
const SLIDER_CHROME_INSET: f32 = SLIDER_FOCUS_BORDER_WIDTH + SLIDER_PADDING;
const SLIDER_CONTENT_INSET: f32 = 1.0;
const SLIDER_OUTER_INSET: f32 = SLIDER_CHROME_INSET + SLIDER_CONTENT_INSET;
const SLIDER_CHILD_INSET: f32 = SLIDER_PADDING + SLIDER_CONTENT_INSET;

function createSliderPresenter(template: SliderTemplate | null, sizing: SliderSizing | null = null): SliderPresenter {
  if (template !== null) {
    return template.create(sizing);
  }
  const templateSet = getControlTemplates();
  const appTemplate = templateSet !== null ? templateSet.slider : null;
  return appTemplate === null
    ? createDefaultSliderPresenter(sizing)
    : appTemplate.create(sizing);
}

export class Slider extends FlexBox implements DragGestureHost {
  private sliderPresenter: SliderPresenter = createSliderPresenter(null, null);
  private templateOverride: SliderTemplate | null = null;
  private sizingValue: SliderSizing | null = null;
  private colorsValue: SliderColors | null = null;
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private readonly dragGesture!: DragGesture;
  private changedCallback: ((event: SliderChangedEventArgs) => void) | null = null;
  private changedBinding: Callback1<SliderChangedEventArgs> | null = null;
  private disposed: bool = false;
  private focusedState: bool = false;
  private hoveredState: bool = false;
  private minValue: f32 = 0.0;
  private maxValue: f32 = 100.0;
  private stepValue: f32 = 1.0;
  private currentValue: f32 = 0.0;
  private lengthValue: f32 = 180.0;
  private orientationValue: Orientation = Orientation.Horizontal;

  constructor(value: f32 = 0.0) {
    super();
    this.dragGesture = new DragGesture(this).threshold(0.0);
    this.semanticRole(SemanticRole.Slider);
    this.syncSemanticLabel();
    this.focusable(true);
    this.requireInteractive();
    this.reflectSemanticDisabledFromEnabled();
    this.cursor(CursorStyle.Pointer);
    this.child(this.sliderPresenter.root.positionAbsolute());
    this.track(activeTheme.addAction(new HandlerAction<Slider, Theme>(this, (slider: Slider, _theme: Theme): void => {
      slider.handleThemeChanged();
    })));
    this.track(keyboardFocusVisible.addAction(new HandlerAction<Slider, bool>(this, (slider: Slider, _visible: bool): void => {
      slider.handleThemeChanged();
    })));
    this.track(this.dragGesture.started.bind(this, (slider: Slider, event: DragStartedEvent): void => {
      slider.handleDragStarted(event);
    }));
    this.track(this.dragGesture.delta.bind(this, (slider: Slider, event: DragDeltaEvent): void => {
      slider.handleDragDelta(event);
    }));
    this.track(this.dragGesture.completed.bind(this, (slider: Slider, event: DragCompletedEvent): void => {
      slider.handleDragCompleted(event);
    }));
    this.setValue(value, false);
    this.semanticOrientation(this.orientationValue);
    this.handleThemeChanged();
    this.persistState(SLIDER_PERSISTED_STATE);
  }

  get value(): f32 {
    return this.currentValue;
  }

  min(value: f32): this {
    this.minValue = value;
    if (this.maxValue < value) {
      this.maxValue = value;
    }
    this.setValue(this.currentValue, true, false);
    return this;
  }

  max(value: f32): this {
    this.maxValue = value;
    if (this.minValue > value) {
      this.minValue = value;
    }
    this.setValue(this.currentValue, true, false);
    return this;
  }

  step(value: f32): this {
    if (value <= 0.0) {
      warn("Layout", "Slider.step() received " + value.toString() + "; clamping to 1.0.");
    }
    this.stepValue = value > 0.0 ? value : 1.0;
    this.setValue(this.currentValue, true, false);
    return this;
  }

  length(value: f32): this {
    const thumbSize = this.sliderPresenter.metrics.thumbSize;
    if (value <= thumbSize) {
      warn(
        "Layout",
        "Slider.length() received " + value.toString() + "; clamping to a value above the thumb size.",
      );
    }
    this.lengthValue = value > thumbSize ? value : thumbSize + 1.0;
    this.syncPresentation();
    return this;
  }

  orientation(value: Orientation): this {
    this.orientationValue = value == Orientation.Vertical ? Orientation.Vertical : Orientation.Horizontal;
    this.semanticOrientation(this.orientationValue);
    this.syncSemanticLabel();
    this.syncPresentation();
    return this;
  }

  sizing(sizing: SliderSizing | null): this {
    this.sizingValue = sizing;
    this.replacePresenter(createSliderPresenter(this.templateOverride, this.sizingValue));
    const thumbSize = this.sliderPresenter.metrics.thumbSize;
    if (this.lengthValue <= thumbSize) {
      this.lengthValue = thumbSize + 1.0;
    }
    this.syncPresentation();
    return this;
  }

  colors(colors: SliderColors | null): this {
    this.colorsValue = colors;
    this.syncPresentation();
    return this;
  }

  template(template: SliderTemplate | null): this {
    this.templateOverride = template;
    const nextPresenter = createSliderPresenter(this.templateOverride, this.sizingValue);
    this.replacePresenter(nextPresenter);
    const thumbSize = this.sliderPresenter.metrics.thumbSize;
    if (this.lengthValue <= thumbSize) {
      warn(
        "Layout",
        "Slider.template() increased the thumb size beyond the current slider length; clamping length to stay interactive.",
      );
      this.lengthValue = thumbSize + 1.0;
    }
    this.syncPresentation();
    return this;
  }

  onChanged(callback: ((event: SliderChangedEventArgs) => void) | null): this {
    this.changedCallback = callback;
    this.changedBinding = null;
    return this;
  }

  bindChanged<Owner>(owner: Owner, handler: Handler1<Owner, SliderChangedEventArgs>): this {
    this.changedCallback = null;
    this.changedBinding = bind1<Owner, SliderChangedEventArgs>(owner, handler);
    return this;
  }

  onChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, SliderChangedEventArgs>): this {
    this.bindChanged(owner, handler);
    return this;
  }

  dispose(): void {
    this.disposeControl();
    super.dispose();
  }

  _captureDragPointer(): void {
    this.capturePointer();
  }

  _releaseDragPointer(): void {
    this.releasePointer();
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    super._handlePointerEvent(eventType, x, y, modifiers);
    if (!this.isEnabled) {
      return;
    }
    if (eventType == PointerEventType.Enter) {
      this.hoveredState = true;
      this.syncVisualState();
      return;
    }
    if (eventType == PointerEventType.Leave) {
      this.hoveredState = false;
      if (!this.dragGesture.isDragging) {
        this.syncVisualState();
      }
      return;
    }
    if (eventType == PointerEventType.Down) {
      this.dragGesture.handlePointerDown(x, y, modifiers);
      return;
    }
    if (eventType == PointerEventType.Move) {
      this.dragGesture.handlePointerMove(x, y, modifiers);
      return;
    }
    if (eventType == PointerEventType.Up) {
      this.dragGesture.handlePointerUp(x, y, modifiers);
    }
  }

  _handleKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    const callbackHandled = super._handleKeyEvent(eventType, key, modifiers);
    if (!this.isEnabled || eventType != KeyEventType.Down || modifiers != 0) {
      return callbackHandled;
    }
    if (key == "Home") {
      this.setValue(this.minValue, true);
      return true;
    }
    if (key == "End") {
      this.setValue(this.maxValue, true);
      return true;
    }
    let delta: f32 = 0.0;
    if (this.orientationValue == Orientation.Vertical) {
      if (key == "ArrowUp") {
        delta = this.stepValue;
      } else if (key == "ArrowDown") {
        delta = -this.stepValue;
      }
    } else {
      if (key == "ArrowRight") {
        delta = this.stepValue;
      } else if (key == "ArrowLeft") {
        delta = -this.stepValue;
      }
    }
    if (delta != 0.0) {
      this.setValue(this.currentValue + delta, true);
      return true;
    }
    return callbackHandled;
  }

  _handleFocusChanged(focused: bool): void {
    super._handleFocusChanged(focused);
    this.focusedState = focused;
    this.handleThemeChanged();
  }

  protected _onEffectiveEnabledChanged(_isEnabled: bool): void {
    if (!this.isEnabled) {
      this.dragGesture.cancel();
    }
    this.handleThemeChanged();
  }

  _applyPersistedValue(value: f32): void {
    this.setValue(value, true, false);
  }

  private normalizeValue(value: f32): f32 {
    const clamped = clamp(value, this.minValue, this.maxValue);
    if (this.stepValue <= 0.0) {
      return clamped;
    }
    const snapped = <f32>Math.round((clamped - this.minValue) / this.stepValue) * this.stepValue;
    return clamp(this.minValue + snapped, this.minValue, this.maxValue);
  }

  private setValue(value: f32, emit: bool, announce: bool = emit): void {
    const normalized = this.normalizeValue(value);
    if (normalized == this.currentValue) {
      this.syncPresentation();
      return;
    }
    this.currentValue = normalized;
    this.semanticValueRange(this.currentValue, this.minValue, this.maxValue);
    this.syncPresentation();
    if (emit) {
      if (announce) {
        this.requestSemanticAnnouncement();
      }
      const event = new SliderChangedEventArgs(this.currentValue);
      const callback = this.changedCallback;
      if (callback !== null) {
        callback(event);
      }
      const binding = this.changedBinding;
      if (binding !== null) {
        binding.invoke(event);
      }
    }
  }

  private updateValueFromPointer(x: f32, y: f32, emit: bool): void {
    let localX = x;
    let localY = y;
    if (this.builtHandle != 0) {
      const bounds = ui.tryGetBounds(this.builtHandle);
      if (bounds !== null) {
        localX = x - unchecked(bounds[0]);
        localY = y - unchecked(bounds[1]);
      }
    }
    const thumbSize = this.sliderPresenter.metrics.thumbSize;
    const available = this.lengthValue - thumbSize;
    if (available <= 0.0) {
      return;
    }
    const leadingInset = SLIDER_OUTER_INSET + (thumbSize * 0.5);
    const offset = this.orientationValue == Orientation.Vertical
      ? available - clamp(localY - leadingInset, 0.0, available)
      : clamp(localX - leadingInset, 0.0, available);
    const fraction = clamp(offset / available, 0.0, 1.0);
    this.setValue(this.minValue + ((this.maxValue - this.minValue) * fraction), emit);
  }

  private syncGeometryWithState(state: SliderVisualState): void {
    const metrics = this.sliderPresenter.metrics;
    if (this.orientationValue == Orientation.Vertical) {
      this.width(metrics.thumbSize + (SLIDER_OUTER_INSET * 2.0) + metrics.crossAxisExtra, Unit.Pixel);
      this.height(this.lengthValue + (SLIDER_OUTER_INSET * 2.0), Unit.Pixel);
    } else {
      this.width(this.lengthValue + (SLIDER_OUTER_INSET * 2.0), Unit.Pixel);
      this.height(metrics.thumbSize + (SLIDER_OUTER_INSET * 2.0) + metrics.crossAxisExtra, Unit.Pixel);
    }
    this.sliderPresenter.root
      .positionAbsolute()
      .position(SLIDER_CHILD_INSET, SLIDER_CHILD_INSET);
    this.sliderPresenter.layout(state, this.lengthValue);
    this.semanticValueRange(this.currentValue, this.minValue, this.maxValue);
    this.syncSemanticLabel();
  }

  private syncVisualStateWithState(state: SliderVisualState): void {
    const theme = activeTheme.value;
    this.cornerRadius(theme.spacing.sm);
    this.border(
      SLIDER_FOCUS_BORDER_WIDTH,
      theme.colors.background
    );
    this.padding(SLIDER_PADDING, SLIDER_PADDING, SLIDER_PADDING, SLIDER_PADDING);
    this.opacity(this.isEnabled ? 1.0 : 0.6);
    this.sliderPresenter.apply(theme, state, this.colorsValue);
  }

  private syncVisualState(): void {
    this.syncVisualStateWithState(this.createVisualState());
  }

  private syncPresentation(): void {
    const state = this.createVisualState();
    this.syncGeometryWithState(state);
    this.syncVisualStateWithState(state);
  }

  private createVisualState(): SliderVisualState {
    const normalizedValue = this.maxValue > this.minValue
      ? clamp((this.currentValue - this.minValue) / (this.maxValue - this.minValue), 0.0, 1.0)
      : 0.0;
    return new SliderVisualState(
      this.currentValue,
      this.minValue,
      this.maxValue,
      normalizedValue,
      this.orientationValue,
      this.hoveredState,
      this.dragGesture.isDragging,
      this.focusedState,
      this.isEnabled,
    );
  }

  private handleDragStarted(event: DragStartedEvent): void {
    this.updateValueFromPointer(event.x, event.y, true);
    this.syncVisualState();
  }

  private handleDragDelta(event: DragDeltaEvent): void {
    this.updateValueFromPointer(event.x, event.y, true);
  }

  private handleDragCompleted(event: DragCompletedEvent): void {
    this.updateValueFromPointer(event.x, event.y, true);
    this.syncVisualState();
  }

  private syncSemanticLabel(): void {
    const baseLabel = this.orientationValue == Orientation.Vertical ? "Vertical slider" : "Slider";
    this.setDefaultSemanticLabel(baseLabel);
  }

  private handleThemeChanged(): void {
    if (this.disposed) {
      return;
    }
    this.cursor(this.isEnabled ? CursorStyle.Pointer : CursorStyle.Default);
    this.syncPresentation();
    this.syncFocusChrome(activeTheme.value);
  }

  private replacePresenter(nextPresenter: SliderPresenter): void {
    const previousRoot = this.sliderPresenter.root;
    this.sliderPresenter = nextPresenter;
    const children = new Array<Node>();
    children.push(nextPresenter.root.positionAbsolute());
    this.replaceChildren(children);
    previousRoot.dispose();
  }

  private usesDefaultPresenter(): bool {
    if (this.templateOverride !== null) {
      return false;
    }
    const templateSet = getControlTemplates();
    return templateSet === null || templateSet.slider === null;
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  private disposeControl(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.dragGesture.cancel();
    disposeAll(this.disposables);
    FocusAdornerManager.hideOwner(this);
  }

  private syncFocusChrome(theme: Theme): void {
    if (this.focusedState && this.isEnabled && keyboardFocusVisible.value) {
      FocusAdornerManager.showStandard(this, theme.spacing.sm);
      return;
    }
    FocusAdornerManager.hideOwner(this);
  }
}
