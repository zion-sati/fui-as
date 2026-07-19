import { rgba } from "../../color";
import { HandlerAction } from "../../core/Action";
import { Callback1, Handler1 } from "../../core/BoundCallback";
import { bind1 } from "../../core/bind";
import { Disposable, disposeAll } from "../../core/Disposable";
import { FocusAdornerManager } from "../../core/FocusAdornerManager";
import { keyboardFocusVisible } from "../../core/FocusVisibility";
import { ClickEventArgs, Node } from "../../core/Node";
import {
  AlignItems,
  CursorStyle,
  FlexDirection,
  KeyEventType,
  PointerEventType,
  SemanticRole,
  Unit,
} from "../../core/ffi";
import { Theme, activeTheme } from "../../core/Theme";
import { FlexBox, TextCore } from "../../nodes";
import { LabeledControlColors } from "../LabeledControlColors";

const TRANSPARENT: u32 = rgba(0x00, 0x00, 0x00, 0x00);

function isSpaceKey(key: string): bool {
  return key == " " || key == "Spacebar";
}

export class PressableLabeledControl extends FlexBox {
  private indicatorRoot: FlexBox;
  protected readonly labelNode: TextCore;
  private readonly gapNode: FlexBox;
  private readonly labelHost: FlexBox;
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private disposed: bool = false;
  private labelFontSizeOverride: f32 = 0.0;
  protected colorsValue: LabeledControlColors | null = null;
  protected hoveredState: bool = false;
  protected pressedState: bool = false;
  protected focusedState: bool = false;
  private keyPressedState: bool = false;
  private pointerPressedState: bool = false;
  private clickCallback: ((event: ClickEventArgs) => void) | null = null;
  private clickBinding: Callback1<ClickEventArgs> | null = null;

  constructor(role: SemanticRole, label: string, indicatorPresenterRoot: FlexBox) {
    super();
    this.indicatorRoot = indicatorPresenterRoot;
    this.labelNode = new TextCore(label);
    this.gapNode = new FlexBox()
      .width(activeTheme.value.spacing.sm, Unit.Pixel)
      .height(1.0, Unit.Pixel);
    this.labelHost = new FlexBox();
    this.labelHost.child(this.labelNode);

    this.semanticRole(role);
    this.semanticLabel(label);
    this.focusable(true);
    this.requireInteractive();
    this.reflectSemanticDisabledFromEnabled();
    this.flexDirection(FlexDirection.Row);
    this.alignItems(AlignItems.Center);
    this.child(indicatorPresenterRoot);
    this.child(this.gapNode);
    this.child(this.labelHost);
    this.track(activeTheme.addAction(new HandlerAction<PressableLabeledControl, Theme>(this, (control: PressableLabeledControl, _theme: Theme): void => {
      control.handleThemeChanged();
    })));
    this.track(keyboardFocusVisible.addAction(new HandlerAction<PressableLabeledControl, bool>(this, (control: PressableLabeledControl, _visible: bool): void => {
      control.handleThemeChanged();
    })));
    this.syncBaseTheme(activeTheme.value);
  }

  protected updateLabel(label: string): this {
    this.semanticLabel(label);
    this.labelNode.text(label);
    return this;
  }

  dispose(): void {
    this.disposeControl();
    super.dispose();
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32): void {
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
      this.pointerPressedState = false;
      this.pressedState = false;
      this.syncVisualState();
      return;
    }
    if (eventType == PointerEventType.Down) {
      this.pointerPressedState = true;
      this.pressedState = true;
      this.syncVisualState();
      return;
    }
    if (eventType == PointerEventType.Up && this.pointerPressedState) {
      this.pointerPressedState = false;
      this.pressedState = false;
      this.syncVisualState();
      this.handleActivated();
      this.fireSemanticClick();
    }
  }

  _handleKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    const callbackHandled = super._handleKeyEvent(eventType, key, modifiers);
    if (!this.isEnabled || !isSpaceKey(key) || modifiers != 0) {
      return callbackHandled;
    }
    if (eventType == KeyEventType.Down) {
      this.keyPressedState = true;
      this.pressedState = true;
      this.syncVisualState();
      return true;
    }
    if (eventType == KeyEventType.Up && this.keyPressedState) {
      this.keyPressedState = false;
      this.pressedState = false;
      this.syncVisualState();
      this.handleActivated();
      this.fireSemanticClick();
      return true;
    }
    return callbackHandled;
  }

  _handleFocusChanged(focused: bool): void {
    super._handleFocusChanged(focused);
    if (this.focusedState == focused) {
      return;
    }
    this.focusedState = focused;
    if (!focused) {
      this.keyPressedState = false;
      this.pressedState = false;
    }
    this.syncBaseTheme(activeTheme.value);
    this.syncVisualState();
  }

  protected _onEffectiveEnabledChanged(_isEnabled: bool): void {
    this.pointerPressedState = false;
    this.keyPressedState = false;
    this.pressedState = false;
    if (!this.isEnabled) {
      this.hoveredState = false;
    }
    this.syncBaseTheme(activeTheme.value);
    this.syncVisualState();
  }

  protected handleActivated(): void {}

  onClick(callback: (event: ClickEventArgs) => void): this {
    this.clickCallback = callback;
    this.clickBinding = null;
    return this;
  }

  bindClick<Owner>(owner: Owner, handler: Handler1<Owner, ClickEventArgs>): this {
    this.clickCallback = null;
    this.clickBinding = bind1<Owner, ClickEventArgs>(owner, handler);
    return this;
  }

  onClickWith<Owner>(owner: Owner, handler: Handler1<Owner, ClickEventArgs>): this {
    this.bindClick(owner, handler);
    return this;
  }

  protected syncVisualState(): void {}

  protected replaceIndicatorRoot(nextRoot: FlexBox): void {
    if (nextRoot === this.indicatorRoot) {
      return;
    }
    const previousRoot = this.indicatorRoot;
    this.indicatorRoot = nextRoot;
    const children = new Array<Node>();
    children.push(nextRoot);
    children.push(this.gapNode);
    children.push(this.labelHost);
    this.replaceChildren(children);
    previousRoot.dispose();
  }

  protected setLabelFontSizeOverride(fontSize: f32): void {
    this.labelFontSizeOverride = fontSize > 0.0 ? fontSize : 0.0;
    this.syncBaseTheme(activeTheme.value);
  }

  colors(colors: LabeledControlColors | null): this {
    this.colorsValue = colors;
    this.syncBaseTheme(activeTheme.value);
    this.syncVisualState();
    return this;
  }

  protected syncBaseTheme(theme: Theme): void {
    this.cursor(this.isEnabled ? CursorStyle.Pointer : CursorStyle.Default);
    this.cornerRadius(theme.spacing.sm);
    this.border(
      2.0,
      TRANSPARENT
    );
    this.padding(theme.spacing.xs, theme.spacing.xs, theme.spacing.xs, theme.spacing.xs);
    this.opacity(this.isEnabled ? 1.0 : 0.6);
    this.gapNode.width(theme.spacing.sm, Unit.Pixel);
    this.labelNode
      .fontFamily(theme.fonts.bodyFamily)
      .fontSize(this.labelFontSizeOverride > 0.0 ? this.labelFontSizeOverride : theme.fonts.sizeBody);
    const colors = this.colorsValue;
    let labelColor: u32;
    if (this.isEnabled) {
      if (colors !== null && colors.hasTextPrimary) {
        labelColor = colors.textPrimaryColor;
      } else {
        labelColor = theme.colors.textPrimary;
      }
    } else {
      if (colors !== null && colors.hasTextMuted) {
        labelColor = colors.textMutedColor;
      } else {
        labelColor = theme.colors.textMuted;
      }
    }
    this.labelNode.textColor(labelColor);
    this.syncFocusChrome(theme);
  }

  protected handleThemeChanged(): void {
    if (this.disposed) {
      return;
    }
    this.syncBaseTheme(activeTheme.value);
    this.syncVisualState();
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  private disposeControl(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
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

  private fireSemanticClick(): void {
    const callback = this.clickCallback;
    if (callback !== null) {
      callback(ClickEventArgs.Empty);
      return;
    }
    const binding = this.clickBinding;
    if (binding !== null) {
      binding.invoke(ClickEventArgs.Empty);
    }
  }
}
