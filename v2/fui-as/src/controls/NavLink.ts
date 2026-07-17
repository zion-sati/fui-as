import {
  CursorStyle,
  KeyEventType,
  KeyModifier,
  PointerEventType,
  SemanticRole,
  fui_hide_url_preview,
  fui_show_url_preview,
} from "../core/ffi";
import { HandlerAction } from "../core/Action";
import { Disposable, disposeAll } from "../core/Disposable";
import { FocusAdornerManager } from "../core/FocusAdornerManager";
import { keyboardFocusVisible } from "../core/FocusVisibility";
import { navigateTo } from "../core/Navigation";
import { PointerButton, PointerEventArgs, PointerType } from "../core/Node";
import { hasPrimaryShortcutModifier } from "../core/Platform";
import { Theme, activeTheme } from "../core/Theme";
import { FlexBox, Text } from "../nodes";

export class NavigateEventArgs {
  readonly path: string;

  constructor(path: string) {
    this.path = path;
  }
}

export class NavLink extends FlexBox {
  private static activePreviewOwner: NavLink | null = null;
  private hrefValue: string;
  private openInNewTabValue: bool;
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private navigateCallback: ((event: NavigateEventArgs) => void) | null = null;
  private pointerPressed: bool = false;
  private pointerPressedOpenInNewTab: bool = false;
  private enterPressed: bool = false;
  private enterPressedOpenInNewTab: bool = false;
  private hovered: bool = false;
  private focused: bool = false;
  private previewVisible: bool = false;
  private previewPinnedForContextMenu: bool = false;
  private disposed: bool = false;
  private textColorValue: u32;
  readonly labelNode: Text;

  constructor(href: string, label: string = href, openInNewTab: bool = false) {
    super();
    const theme = activeTheme.value;
    this.hrefValue = href;
    this.openInNewTabValue = openInNewTab;
    this.textColorValue = theme.colors.accent;
    this.labelNode = new Text(label)
      .fontFamily(theme.fonts.bodyFamily)
      .fontSize(15.0)
      .textColor(theme.colors.accent)
      .selectable(false)
      .cursor(CursorStyle.Pointer) as Text;
    this.semanticRole(SemanticRole.Link);
    this.semanticLabel(label);
    this.cursor(CursorStyle.Pointer);
    this.focusable(true);
    this.child(this.labelNode);
    this.track(activeTheme.addAction(new HandlerAction<NavLink, Theme>(this, (link: NavLink, _theme: Theme): void => {
      link.syncVisualState();
      link.syncFocusChrome();
    })));
    this.track(keyboardFocusVisible.addAction(new HandlerAction<NavLink, bool>(this, (link: NavLink, _visible: bool): void => {
      link.syncFocusChrome();
    })));
    this.syncFocusChrome();
  }

  get href(): string {
    return this.hrefValue;
  }

  hrefTo(nextHref: string): this {
    this.hrefValue = nextHref;
    if (this.previewVisible) {
      this.showPreview();
    }
    return this;
  }

  onNavigate(cb: (event: NavigateEventArgs) => void): this {
    this.navigateCallback = cb;
    return this;
  }

  text(value: string): this {
    this.semanticLabel(value);
    this.labelNode.text(value);
    return this;
  }

  textColor(color: u32): this {
    this.textColorValue = color;
    this.syncVisualState();
    return this;
  }

  dispose(): void {
    this.hidePreview();
    if (!this.disposed) {
      this.disposed = true;
      disposeAll(this.disposables);
    }
    super.dispose();
  }

  _handlePointerEvent(eventType: PointerEventType, x: f32, y: f32, modifiers: u32 = 0): void {
    const pending = NavLink.pendingPointerEventArgs;
    const isActivation = pending !== null
      ? this.isActivationPointer(changetype<PointerEventArgs>(pending))
      : true;
    const isMiddleClick = pending !== null
      ? this.isMiddleMouseButton(changetype<PointerEventArgs>(pending))
      : false;
    super._handlePointerEvent(eventType, x, y, modifiers);
    if (eventType == PointerEventType.Enter) {
      this.hovered = true;
      this.syncVisualState();
      this.showPreview();
      return;
    }
    if (eventType == PointerEventType.Leave) {
      this.hovered = false;
      this.pointerPressed = false;
      this.pointerPressedOpenInNewTab = false;
      this.syncVisualState();
      if (!this.previewPinnedForContextMenu && !this.focused) {
        this.hidePreview();
      }
      return;
    }
    if (eventType == PointerEventType.Down) {
      if (!isActivation) {
        this.pointerPressed = false;
        this.pointerPressedOpenInNewTab = false;
        return;
      }
      this.pointerPressed = true;
      this.pointerPressedOpenInNewTab = isMiddleClick || this.shouldOpenInNewTab(modifiers);
      return;
    }
    if (eventType == PointerEventType.Up && this.pointerPressed && isActivation) {
      this.pointerPressed = false;
      this.activate(isMiddleClick || this.pointerPressedOpenInNewTab || this.shouldOpenInNewTab(modifiers));
      this.pointerPressedOpenInNewTab = false;
    }
  }

  _handleFocusChanged(focused: bool): void {
    super._handleFocusChanged(focused);
    this.focused = focused;
    this.syncFocusChrome();
    if (focused) {
      this.showPreview();
    }
    if (!focused) {
      this.enterPressed = false;
      this.enterPressedOpenInNewTab = false;
      if (!this.hovered && !this.previewPinnedForContextMenu) {
        this.hidePreview();
      }
    }
  }

  _handleKeyEvent(eventType: KeyEventType, key: string, modifiers: u32): bool {
    const callbackHandled = super._handleKeyEvent(eventType, key, modifiers);
    if (key != "Enter") {
      return callbackHandled;
    }
    if (modifiers != 0 && !hasPrimaryShortcutModifier(<KeyModifier>modifiers)) {
      return callbackHandled;
    }
    if (eventType == KeyEventType.Down) {
      this.enterPressed = true;
      this.enterPressedOpenInNewTab = this.shouldOpenInNewTab(modifiers);
      return true;
    }
    if (eventType == KeyEventType.Up && this.enterPressed) {
      this.enterPressed = false;
      this.activate(this.enterPressedOpenInNewTab || this.shouldOpenInNewTab(modifiers));
      this.enterPressedOpenInNewTab = false;
      return true;
    }
    return callbackHandled;
  }

  private activate(openInNewTab: bool): void {
    navigateTo(this.hrefValue, openInNewTab);
    const callback = this.navigateCallback;
    if (callback !== null) {
      callback(new NavigateEventArgs(this.hrefValue));
    }
  }

  private shouldOpenInNewTab(modifiers: u32): bool {
    return this.openInNewTabValue || hasPrimaryShortcutModifier(<KeyModifier>modifiers);
  }

  private isMiddleMouseButton(event: PointerEventArgs): bool {
    return event.pointerType == PointerType.Mouse && event.button == PointerButton.Auxiliary;
  }

  private isActivationPointer(event: PointerEventArgs): bool {
    return event.button == PointerButton.Primary || this.isMiddleMouseButton(event) || event.pointerType == PointerType.Touch || event.pointerType == PointerType.Pen;
  }

  pinPreviewForContextMenu(): void {
    this.previewPinnedForContextMenu = true;
    this.showPreview();
  }

  releasePreviewForContextMenu(): void {
    if (!this.previewPinnedForContextMenu) {
      return;
    }
    this.previewPinnedForContextMenu = false;
    if (!this.hovered && !this.focused) {
      this.hidePreview();
    }
  }

  get isFocused(): bool {
    return this.focused;
  }

  private showPreview(): void {
    const previousOwner = NavLink.activePreviewOwner;
    if (previousOwner !== null && previousOwner !== this) {
      previousOwner.previewVisible = false;
    }
    const bytes = Uint8Array.wrap(String.UTF8.encode(this.hrefValue, false));
    fui_show_url_preview(bytes.length > 0 ? bytes.dataStart : 0, <u32>bytes.length);
    this.previewVisible = true;
    NavLink.activePreviewOwner = this;
  }

  private hidePreview(): void {
    if (!this.previewVisible && NavLink.activePreviewOwner !== this) {
      return;
    }
    this.previewVisible = false;
    if (NavLink.activePreviewOwner !== this) {
      return;
    }
    NavLink.activePreviewOwner = null;
    fui_hide_url_preview();
  }

  private syncFocusChrome(): void {
    if (this.disposed) {
      return;
    }
    if (this.focused && keyboardFocusVisible.value) {
      FocusAdornerManager.showStandard(this, activeTheme.value.spacing.xs);
      return;
    }
    FocusAdornerManager.hideOwner(this);
  }

  private syncVisualState(): void {
    this.labelNode.textColor(this.hovered ? activeTheme.value.colors.accentHovered : this.textColorValue);
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }
}
