import * as ui from "../bindings/ui";
import {
  AlignItems,
  BorderStyle,
  CursorStyle,
  FlexDirection,
  HandleValue,
  PointerEventType,
  KeyEventType,
  JustifyContent,
  SemanticRole,
} from "../core/ffi";
import { Callback0, Callback1, Handler0, Handler1 } from "../core/BoundCallback";
import { HandlerAction } from "../core/Action";
import { bind0, bind1 } from "../core/bind";
import { Disposable, disposeAll } from "../core/Disposable";
import { FocusAdornerManager } from "../core/FocusAdornerManager";
import { keyboardFocusVisible } from "../core/FocusVisibility";
import { Signal } from "../core/Signal";
import { Theme, activeTheme } from "../core/Theme";
import { FontFamily, FontStyle, FontWeight } from "../core/Typography";
import { FlexBox, TextCore } from "../nodes";
import { getControlTemplates } from "./ControlTemplateSet";
import {
  ButtonPresenter,
  ButtonTemplate,
  ButtonVisualState,
  defaultButtonTemplate,
} from "./internal/ButtonPresenter";

function isSpaceKey(key: string): bool {
  return key == " " || key == "Space" || key == "Spacebar";
}

function isActivationKey(key: string): bool {
  return key == "Enter" || isSpaceKey(key);
}

class ButtonPresenterHostState {
  constructor(
    readonly backgroundOverridden: bool,
    readonly normalBackgroundColorValue: u32,
    readonly cornerRadiusOverridden: bool,
    readonly focusCornerTopLeft: f32,
    readonly focusCornerTopRight: f32,
    readonly focusCornerBottomRight: f32,
    readonly focusCornerBottomLeft: f32,
    readonly borderOverridden: bool,
    readonly borderWidthValue: f32,
    readonly borderColorValue: u32,
    readonly borderStyleValue: BorderStyle,
    readonly borderDashOnValue: f32,
    readonly borderDashOffValue: f32,
    readonly borderDashedValue: bool,
    readonly shadowOverridden: bool,
    readonly shadowColorValue: u32,
    readonly shadowOffsetXValue: f32,
    readonly shadowOffsetYValue: f32,
    readonly shadowBlurValue: f32,
    readonly shadowSpreadValue: f32,
    readonly paddingOverridden: bool,
    readonly paddingLeftValue: f32,
    readonly paddingTopValue: f32,
    readonly paddingRightValue: f32,
    readonly paddingBottomValue: f32,
  ) {}
}

export class Button extends FlexBox {
  private presenter: ButtonPresenter = changetype<ButtonPresenter>(0);
  private labelNode: TextCore = changetype<TextCore>(0);
  private labelValue: string;
  private readonly hovered: Signal<bool> = new Signal<bool>(false);
  private readonly pressed: Signal<bool> = new Signal<bool>(false);
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private action: (() => void) | null = null;
  private actionBinding: Callback0 | null = null;
  private hoverChanged: ((hovered: bool) => void) | null = null;
  private hoverChangedBinding: Callback1<bool> | null = null;
  private disposed: bool = false;
  private focusedState: bool = false;
  private opacityBeforeDisabled: f32 = 1.0;
  private normalBackgroundColorValue: u32 = activeTheme.value.colors.accent;
  private hoverBackgroundColorValue: u32 = activeTheme.value.colors.accentHovered;
  private pressedBackgroundColorValue: u32 = activeTheme.value.colors.accentPressed;
  private backgroundOverridden: bool = false;
  private hoverBackgroundOverridden: bool = false;
  private pressedBackgroundOverridden: bool = false;
  private borderOverridden: bool = false;
  private cornerRadiusOverridden: bool = false;
  private paddingOverridden: bool = false;
  private fontOverridden: bool = false;
  private textColorOverridden: bool = false;
  private shadowOverridden: bool = false;
  private keyboardArmedKey: string | null = null;
  private focusCornerTopLeft: f32 = 0.0;
  private focusCornerTopRight: f32 = 0.0;
  private focusCornerBottomRight: f32 = 0.0;
  private focusCornerBottomLeft: f32 = 0.0;
  private borderWidthValue: f32 = 1.0;
  private borderColorValue: u32 = activeTheme.value.colors.border;
  private borderStyleValue: BorderStyle = BorderStyle.Solid;
  private borderDashOnValue: f32 = 0.0;
  private borderDashOffValue: f32 = 0.0;
  private borderDashedValue: bool = false;
  private paddingLeftValue: f32 = activeTheme.value.spacing.md;
  private paddingTopValue: f32 = activeTheme.value.spacing.sm;
  private paddingRightValue: f32 = activeTheme.value.spacing.md;
  private paddingBottomValue: f32 = activeTheme.value.spacing.sm;
  private fontFamilyValue: FontFamily = activeTheme.value.fonts.bodyFamily;
  private fontWeightValue: FontWeight = FontWeight.Regular;
  private fontStyleValue: FontStyle = FontStyle.Normal;
  private fontSizeValue: f32 = activeTheme.value.fonts.sizeBody;
  private fontIdValue: u32 = 0;
  private hasFontIdOverride: bool = false;
  private textColorValue: u32 = activeTheme.value.colors.textPrimary;
  private shadowColorValue: u32 = 0x00000000;
  private shadowOffsetXValue: f32 = 0.0;
  private shadowOffsetYValue: f32 = 0.0;
  private shadowBlurValue: f32 = 0.0;
  private shadowSpreadValue: f32 = 0.0;
  private templateValue: ButtonTemplate | null = null;
  private presenterNeedsRefresh: bool = false;

  constructor(label: string) {
    super();
    this.labelValue = label;
    this.presenter = this.createPresenter(null);
    this.labelNode = this.presenter.labelNode;
    this.presenter.bindHost(this);
    this.labelNode.text(label);
    this.addChildNode(this.presenter.contentRoot);
    this.track(this.hovered.addAction(new HandlerAction<Button, bool>(this, (button: Button, _value: bool): void => {
      button.handleStateSignalChanged();
    })));
    this.track(this.pressed.addAction(new HandlerAction<Button, bool>(this, (button: Button, _value: bool): void => {
      button.handleStateSignalChanged();
    })));
    this.track(activeTheme.addAction(new HandlerAction<Button, Theme>(this, (button: Button, _value: Theme): void => {
      button.handleThemeSignalChanged();
    })));
    this.track(keyboardFocusVisible.addAction(new HandlerAction<Button, bool>(this, (button: Button, _visible: bool): void => {
      button.syncFocusChrome();
    })));

    this.semanticRole(SemanticRole.Button);
    this.semanticLabel(label);
    this.cursor(CursorStyle.Pointer);
    this.focusable(true);
    this.requireInteractive();
    this.flexDirection(FlexDirection.Row);
    this.justifyContent(JustifyContent.Center);
    this.alignItems(AlignItems.Center);
    this.syncThemeState(activeTheme.value);
    this.applyBackground();
  }

  onClick(cb: () => void): this {
    this.action = cb;
    this.actionBinding = null;
    return this;
  }

  bindClick<Owner>(owner: Owner, handler: Handler0<Owner>): this {
    this.action = null;
    this.actionBinding = bind0<Owner>(owner, handler);
    return this;
  }

  onClickWith<Owner>(owner: Owner, handler: Handler0<Owner>): this {
    this.bindClick(owner, handler);
    return this;
  }

  onHoverChanged(cb: (hovered: bool) => void): this {
    this.hoverChanged = cb;
    this.hoverChangedBinding = null;
    return this;
  }

  bindHoverChanged<Owner>(owner: Owner, handler: Handler1<Owner, bool>): this {
    this.hoverChanged = null;
    this.hoverChangedBinding = bind1<Owner, bool>(owner, handler);
    return this;
  }

  onHoverChangedWith<Owner>(owner: Owner, handler: Handler1<Owner, bool>): this {
    this.bindHoverChanged(owner, handler);
    return this;
  }

  label(label: string): this {
    this.labelValue = label;
    this.semanticLabel(label);
    this.labelNode.text(label);
    return this;
  }

  template(template: ButtonTemplate | null): this {
    this.templateValue = template;
    this.replacePresenter(this.createPresenter(template));
    this.handleThemeSignalChanged();
    return this;
  }

  bgColor(color: u32): this {
    this.backgroundOverridden = true;
    this.normalBackgroundColorValue = color;
    this.applyBackground();
    return this;
  }

  hoverBgColor(color: u32): this {
    this.hoverBackgroundOverridden = true;
    this.hoverBackgroundColorValue = color;
    this.applyBackground();
    return this;
  }

  pressedBgColor(color: u32): this {
    this.pressedBackgroundOverridden = true;
    this.pressedBackgroundColorValue = color;
    this.applyBackground();
    return this;
  }

  cornerRadius(radius: f32): this {
    this.cornerRadiusOverridden = true;
    this.focusCornerTopLeft = radius;
    this.focusCornerTopRight = radius;
    this.focusCornerBottomRight = radius;
    this.focusCornerBottomLeft = radius;
    this.applyCurrentCorners();
    this.syncFocusChrome();
    return this;
  }

  corners(tl: f32, tr: f32, br: f32, bl: f32): this {
    this.cornerRadiusOverridden = true;
    this.focusCornerTopLeft = tl;
    this.focusCornerTopRight = tr;
    this.focusCornerBottomRight = br;
    this.focusCornerBottomLeft = bl;
    this.applyCurrentCorners();
    this.syncFocusChrome();
    return this;
  }

  border(width: f32, color: u32, style: BorderStyle = BorderStyle.Solid): this {
    this.borderOverridden = true;
    this.borderWidthValue = width;
    this.borderColorValue = color;
    this.borderStyleValue = style;
    this.borderDashedValue = false;
    this.applyCurrentBorder();
    return this;
  }

  borderDashed(on: f32, off: f32): this {
    this.borderOverridden = true;
    this.borderDashOnValue = on;
    this.borderDashOffValue = off;
    this.borderDashedValue = true;
    super.borderDashed(on, off);
    return this;
  }

  dropShadow(color: u32, offsetX: f32, offsetY: f32, blur: f32, spread: f32 = 0.0): this {
    this.shadowOverridden = true;
    this.shadowColorValue = color;
    this.shadowOffsetXValue = offsetX;
    this.shadowOffsetYValue = offsetY;
    this.shadowBlurValue = blur;
    this.shadowSpreadValue = spread;
    this.applyCurrentShadow();
    this.syncFocusChrome();
    return this;
  }

  padding(left: f32, top: f32 = left, right: f32 = left, bottom: f32 = top): this {
    this.paddingOverridden = true;
    this.paddingLeftValue = left;
    this.paddingTopValue = top;
    this.paddingRightValue = right;
    this.paddingBottomValue = bottom;
    this.applyCurrentPadding();
    return this;
  }

  font(fontId: u32, size: f32): this {
    this.fontOverridden = true;
    this.hasFontIdOverride = true;
    this.fontIdValue = fontId;
    this.fontSizeValue = size;
    this.labelNode.font(fontId, size);
    return this;
  }

  fontFamily(family: FontFamily): this {
    this.fontOverridden = true;
    this.hasFontIdOverride = false;
    this.fontFamilyValue = family;
    this.labelNode.fontFamily(family);
    return this;
  }

  fontWeight(weight: FontWeight): this {
    this.fontOverridden = true;
    this.hasFontIdOverride = false;
    this.fontWeightValue = weight;
    this.labelNode.fontWeight(weight);
    return this;
  }

  fontStyle(style: FontStyle): this {
    this.fontOverridden = true;
    this.hasFontIdOverride = false;
    this.fontStyleValue = style;
    this.labelNode.fontStyle(style);
    return this;
  }

  fontSize(size: f32): this {
    this.fontOverridden = true;
    this.fontSizeValue = size;
    if (this.hasFontIdOverride) {
      this.labelNode.font(this.fontIdValue, size);
      return this;
    }
    this.labelNode.fontSize(size);
    return this;
  }

  textColor(color: u32): this {
    this.textColorOverridden = true;
    this.textColorValue = color;
    this.labelNode.textColor(color);
    return this;
  }

  _setAction(cb: () => void): void {
    this.action = cb;
    this.actionBinding = null;
  }

  beginPress(): void {
    this.pressed.value = true;
  }

  endPress(fireAction: bool = true): void {
    const wasPressed = this.pressed.value;
    this.pressed.value = false;
    if (!wasPressed || !fireAction) {
      return;
    }
    const callback = this.action;
    if (callback !== null) {
      callback();
    }
    const binding = this.actionBinding;
    if (binding !== null) {
      binding.invoke();
    }
  }

  cancelPress(): void {
    this.pressed.value = false;
  }

  build(): u64 {
    if (this.presenterNeedsRefresh) {
      this.recreatePresenterTree();
    }
    return super.build();
  }

  dispose(): void {
    this.disposeControl();
    super.dispose();
    this.presenterNeedsRefresh = true;
  }

  private disposeControl(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    disposeAll(this.disposables);
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32): void {
    if (!this.isEnabled) {
      return;
    }
    super._handlePointerEvent(eventType, x, y, modifiers);
    if (eventType == PointerEventType.Enter) {
      this.setHovered(true);
      return;
    }
    if (eventType == PointerEventType.Leave) {
      this.setHovered(false);
      if (this.keyboardArmedKey === null) {
        this.cancelPress();
      }
      return;
    }
    if (eventType == PointerEventType.Down) {
      this.setHovered(true);
      this.beginPress();
      return;
    }
    if (eventType == PointerEventType.Up && this.pressed.value) {
      this.endPress(true);
    }
  }

  _handleFocusChanged(focused: bool): void {
    super._handleFocusChanged(focused);
    if (!focused && this.keyboardArmedKey !== null) {
      this.cancelKeyboardPress();
    }
    if (!this.isEnabled) {
      if (this.focusedState) {
        this.focusedState = false;
        this.handleThemeSignalChanged();
      }
      return;
    }
    if (this.focusedState == focused) {
      return;
    }
    this.focusedState = focused;
    this.handleThemeSignalChanged();
  }

  _handleKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    const callbackHandled = super._handleKeyEvent(eventType, key, modifiers);
    if (!this.isEnabled || modifiers != 0 || !isActivationKey(key)) {
      return callbackHandled;
    }
    if (eventType == KeyEventType.Down) {
      if (this.keyboardArmedKey !== null) {
        return true;
      }
      this.keyboardArmedKey = key;
      this.beginPress();
      return true;
    }
    if (eventType == KeyEventType.Up && this.keyboardArmedKey !== null && changetype<string>(this.keyboardArmedKey) == key) {
      this.keyboardArmedKey = null;
      this.endPress(true);
      return true;
    }
    return callbackHandled;
  }

  handleStateSignalChanged(): void {
    if (this.disposed) {
      return;
    }
    this.syncThemeState(activeTheme.value);
    this.applyBackground();
  }

  handleThemeSignalChanged(): void {
    if (this.disposed) {
      return;
    }
    const theme = activeTheme.value;
    this.syncThemeState(theme);
    this.applyBackground();
  }

  private computeBackground(): u32 {
    if (!this.isEnabled) {
      return this.normalBackgroundColorValue;
    }
    if (this.pressed.value) {
      return this.pressedBackgroundColorValue;
    }
    if (this.hovered.value) {
      return this.hoverBackgroundColorValue;
    }
    return this.normalBackgroundColorValue;
  }

  private setHovered(next: bool): void {
    if (!this.hovered.set(next)) {
      return;
    }
    const callback = this.hoverChanged;
    if (callback !== null) {
      callback(next);
    }
    const binding = this.hoverChangedBinding;
    if (binding !== null) {
      binding.invoke(next);
    }
  }

  private syncThemeState(theme: Theme): void {
    if (!this.backgroundOverridden) {
      this.normalBackgroundColorValue = theme.colors.accent;
    }
    if (!this.hoverBackgroundOverridden) {
      this.hoverBackgroundColorValue = theme.colors.accentHovered;
    }
    if (!this.pressedBackgroundOverridden) {
      this.pressedBackgroundColorValue = theme.colors.accentPressed;
    }
    if (!this.cornerRadiusOverridden) {
      this.focusCornerTopLeft = theme.spacing.sm;
      this.focusCornerTopRight = theme.spacing.sm;
      this.focusCornerBottomRight = theme.spacing.sm;
      this.focusCornerBottomLeft = theme.spacing.sm;
    }
    if (!this.borderOverridden) {
      this.borderWidthValue = 1.0;
      this.borderColorValue = theme.colors.border;
      this.borderStyleValue = BorderStyle.Solid;
      this.borderDashedValue = false;
    }
    if (!this.shadowOverridden) {
      this.shadowColorValue = 0x00000000;
      this.shadowOffsetXValue = 0.0;
      this.shadowOffsetYValue = 0.0;
      this.shadowBlurValue = 0.0;
      this.shadowSpreadValue = 0.0;
    }
    if (!this.paddingOverridden) {
      const paddingY = theme.spacing.sm;
      const paddingX = theme.spacing.md;
      this.paddingLeftValue = paddingX;
      this.paddingTopValue = paddingY;
      this.paddingRightValue = paddingX;
      this.paddingBottomValue = paddingY;
    }
    if (!this.fontOverridden) {
      this.hasFontIdOverride = false;
      this.fontFamilyValue = theme.fonts.bodyFamily;
      this.fontWeightValue = FontWeight.Regular;
      this.fontStyleValue = FontStyle.Normal;
      this.fontSizeValue = theme.fonts.sizeBody;
    }
    if (!this.textColorOverridden) {
      this.textColorValue = theme.colors.textPrimary;
    }
    const presenterHostState = new ButtonPresenterHostState(
      this.backgroundOverridden,
      this.normalBackgroundColorValue,
      this.cornerRadiusOverridden,
      this.focusCornerTopLeft,
      this.focusCornerTopRight,
      this.focusCornerBottomRight,
      this.focusCornerBottomLeft,
      this.borderOverridden,
      this.borderWidthValue,
      this.borderColorValue,
      this.borderStyleValue,
      this.borderDashOnValue,
      this.borderDashOffValue,
      this.borderDashedValue,
      this.shadowOverridden,
      this.shadowColorValue,
      this.shadowOffsetXValue,
      this.shadowOffsetYValue,
      this.shadowBlurValue,
      this.shadowSpreadValue,
      this.paddingOverridden,
      this.paddingLeftValue,
      this.paddingTopValue,
      this.paddingRightValue,
      this.paddingBottomValue,
    );
    this.presenter.apply(theme, this.createVisualState());
    this.backgroundOverridden = presenterHostState.backgroundOverridden;
    this.normalBackgroundColorValue = presenterHostState.normalBackgroundColorValue;
    this.cornerRadiusOverridden = presenterHostState.cornerRadiusOverridden;
    this.focusCornerTopLeft = presenterHostState.focusCornerTopLeft;
    this.focusCornerTopRight = presenterHostState.focusCornerTopRight;
    this.focusCornerBottomRight = presenterHostState.focusCornerBottomRight;
    this.focusCornerBottomLeft = presenterHostState.focusCornerBottomLeft;
    this.borderOverridden = presenterHostState.borderOverridden;
    this.borderWidthValue = presenterHostState.borderWidthValue;
    this.borderColorValue = presenterHostState.borderColorValue;
    this.borderStyleValue = presenterHostState.borderStyleValue;
    this.borderDashOnValue = presenterHostState.borderDashOnValue;
    this.borderDashOffValue = presenterHostState.borderDashOffValue;
    this.borderDashedValue = presenterHostState.borderDashedValue;
    this.shadowOverridden = presenterHostState.shadowOverridden;
    this.shadowColorValue = presenterHostState.shadowColorValue;
    this.shadowOffsetXValue = presenterHostState.shadowOffsetXValue;
    this.shadowOffsetYValue = presenterHostState.shadowOffsetYValue;
    this.shadowBlurValue = presenterHostState.shadowBlurValue;
    this.shadowSpreadValue = presenterHostState.shadowSpreadValue;
    this.paddingOverridden = presenterHostState.paddingOverridden;
    this.paddingLeftValue = presenterHostState.paddingLeftValue;
    this.paddingTopValue = presenterHostState.paddingTopValue;
    this.paddingRightValue = presenterHostState.paddingRightValue;
    this.paddingBottomValue = presenterHostState.paddingBottomValue;
    this.applyCurrentCorners();
    this.applyCurrentBorder();
    this.applyCurrentShadow();
    this.applyCurrentPadding();
    this.applyCurrentLabelTypography();
    this.applyCurrentLabelTextColor();
    this.syncFocusChrome();
  }

  protected _onEffectiveEnabledChanged(isEnabled: bool): void {
    if (!isEnabled) {
      this.opacityBeforeDisabled = this.currentOpacity;
      this.cancelKeyboardPress();
      this.focusedState = false;
      super.opacity(0.38);
    } else {
      super.opacity(this.opacityBeforeDisabled);
    }
    this.cursor(isEnabled ? CursorStyle.Pointer : CursorStyle.Default);
    this.handleThemeSignalChanged();
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  private cancelKeyboardPress(): void {
    this.keyboardArmedKey = null;
    this.cancelPress();
  }

  private createPresenter(template: ButtonTemplate | null): ButtonPresenter {
    if (template !== null) {
      return template.create();
    }
    const templateSet = getControlTemplates();
    const appTemplate = templateSet !== null ? templateSet.button : null;
    return (appTemplate === null ? defaultButtonTemplate : appTemplate).create();
  }

  private replacePresenter(nextPresenter: ButtonPresenter): void {
    nextPresenter.bindHost(this);
    nextPresenter.labelNode.text(this.labelValue);
    const previousPresenter = this.presenter;
    this.presenter = nextPresenter;
    this.labelNode = nextPresenter.labelNode;
    if (previousPresenter === nextPresenter) {
      return;
    }
    this.addChildNode(nextPresenter.contentRoot);
    this.removeChildNode(previousPresenter.contentRoot);
    previousPresenter.contentRoot.dispose();
  }

  private recreatePresenterTree(): void {
    this.presenter = this.createPresenter(this.templateValue);
    this.presenter.bindHost(this);
    this.labelNode = this.presenter.labelNode;
    this.labelNode.text(this.labelValue);
    this.addChildNode(this.presenter.contentRoot);
    this.presenterNeedsRefresh = false;
    this.syncThemeState(activeTheme.value);
    this.applyBackground();
  }

  private createVisualState(): ButtonVisualState {
    return new ButtonVisualState(
      this.hovered.value,
      this.pressed.value,
      this.focusedState,
      this.isEnabled,
    );
  }

  private applyBackground(): void {
    const color = this.computeBackground();
    super.bgColor(color);
    if (this.builtHandle != <u64>HandleValue.Invalid) {
      ui.setBackgroundColor(this.builtHandle, color);
    }
  }

  private applyCurrentCorners(): void {
    super.corners(
      this.focusCornerTopLeft,
      this.focusCornerTopRight,
      this.focusCornerBottomRight,
      this.focusCornerBottomLeft,
    );
  }

  private applyCurrentBorder(): void {
    super.border(this.borderWidthValue, this.borderColorValue, this.borderStyleValue);
    if (this.borderDashedValue) {
      super.borderDashed(this.borderDashOnValue, this.borderDashOffValue);
    }
  }

  private applyCurrentPadding(): void {
    super.padding(
      this.paddingLeftValue,
      this.paddingTopValue,
      this.paddingRightValue,
      this.paddingBottomValue,
    );
  }

  private applyCurrentShadow(): void {
    super.dropShadow(
      this.shadowColorValue,
      this.shadowOffsetXValue,
      this.shadowOffsetYValue,
      this.shadowBlurValue,
      this.shadowSpreadValue,
    );
  }

  private applyCurrentLabelTypography(): void {
    if (this.hasFontIdOverride) {
      this.labelNode.font(this.fontIdValue, this.fontSizeValue);
      return;
    }
    this.labelNode
      .fontFamily(this.fontFamilyValue)
      .fontWeight(this.fontWeightValue)
      .fontStyle(this.fontStyleValue)
      .fontSize(this.fontSizeValue);
  }

  private applyCurrentLabelTextColor(): void {
    this.labelNode.textColor(this.textColorValue);
  }

  private syncFocusChrome(): void {
    if (this.disposed) {
      return;
    }
    if (this.focusedState && this.isEnabled && keyboardFocusVisible.value) {
      FocusAdornerManager.showStandardCorners(
        this,
        this.focusCornerTopLeft,
        this.focusCornerTopRight,
        this.focusCornerBottomRight,
        this.focusCornerBottomLeft,
      );
      return;
    }
    FocusAdornerManager.hideOwner(this);
  }
}
