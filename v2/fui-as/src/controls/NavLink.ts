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
import { Callback2, Handler2 } from "../core/Callbacks";
import { Disposable, disposeAll } from "../core/Disposable";
import { FocusAdornerManager } from "../core/FocusAdornerManager";
import { keyboardFocusVisible } from "../core/FocusVisibility";
import { bind2 } from "../core/bind";
import { navigateTo } from "../core/Navigation";
import { PointerButton, PointerEventArgs, PointerType } from "../core/Node";
import { hasPrimaryShortcutModifier } from "../core/Platform";
import { Theme, activeTheme } from "../core/Theme";
import { FlexBox } from "../nodes";

export class NavigateEventArgs {
  readonly path: string;

  constructor(path: string) {
    this.path = path;
  }
}

export class NavLinkInteractionState {
  constructor(
    readonly hovered: bool,
    readonly pressed: bool,
    readonly focused: bool,
    readonly enabled: bool,
  ) {}
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
  private interactionStateCallback: ((state: NavLinkInteractionState, theme: Theme) => void) | null = null;
  private interactionStateBinding: Callback2<NavLinkInteractionState, Theme> | null = null;

  constructor(href: string, openInNewTab: bool = false) {
    super();
    this.hrefValue = href;
    this.openInNewTabValue = openInNewTab;
    this.semanticRole(SemanticRole.Link);
    this.cursor(CursorStyle.Pointer);
    this.focusable(true);
    this.track(activeTheme.addAction(new HandlerAction<NavLink, Theme>(this, (link: NavLink, _theme: Theme): void => {
      link.syncFocusChrome();
      link.notifyInteractionState();
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

  onInteractionStateChanged(cb: (state: NavLinkInteractionState, theme: Theme) => void): this {
    this.interactionStateCallback = cb;
    this.interactionStateBinding = null;
    this.notifyInteractionState();
    return this;
  }

  bindInteractionState<Owner>(
    owner: Owner,
    handler: Handler2<Owner, NavLinkInteractionState, Theme>,
  ): this {
    this.interactionStateCallback = null;
    this.interactionStateBinding = bind2<Owner, NavLinkInteractionState, Theme>(owner, handler);
    this.notifyInteractionState();
    return this;
  }

  enabled(flag: bool): this {
    super.enabled(flag);
    if (!flag) {
      this.hovered = false;
      this.focused = false;
      this.pointerPressed = false;
      this.pointerPressedOpenInNewTab = false;
      this.enterPressed = false;
      this.enterPressedOpenInNewTab = false;
    }
    this.syncFocusChrome();
    this.notifyInteractionState();
    return this;
  }

  dispose(): void {
    this.hidePreview();
    if (!this.disposed) {
      this.disposed = true;
      this.interactionStateCallback = null;
      this.interactionStateBinding = null;
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
      this.notifyInteractionState();
      this.showPreview();
      return;
    }
    if (eventType == PointerEventType.Leave) {
      this.hovered = false;
      this.pointerPressed = false;
      this.pointerPressedOpenInNewTab = false;
      this.notifyInteractionState();
      if (!this.previewPinnedForContextMenu && !this.focused) {
        this.hidePreview();
      }
      return;
    }
    if (eventType == PointerEventType.Down) {
      if (!isActivation) {
        this.pointerPressed = false;
        this.pointerPressedOpenInNewTab = false;
        this.notifyInteractionState();
        return;
      }
      this.pointerPressed = true;
      this.pointerPressedOpenInNewTab = isMiddleClick || this.shouldOpenInNewTab(modifiers);
      this.notifyInteractionState();
      return;
    }
    if (eventType == PointerEventType.Up && this.pointerPressed && isActivation) {
      this.pointerPressed = false;
      this.activate(isMiddleClick || this.pointerPressedOpenInNewTab || this.shouldOpenInNewTab(modifiers));
      this.pointerPressedOpenInNewTab = false;
      this.notifyInteractionState();
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
    this.notifyInteractionState();
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
      this.notifyInteractionState();
      return true;
    }
    if (eventType == KeyEventType.Up && this.enterPressed) {
      this.enterPressed = false;
      this.activate(this.enterPressedOpenInNewTab || this.shouldOpenInNewTab(modifiers));
      this.enterPressedOpenInNewTab = false;
      this.notifyInteractionState();
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

  private notifyInteractionState(): void {
    const state = new NavLinkInteractionState(
      this.hovered,
      this.pointerPressed || this.enterPressed,
      this.focused,
      this.isEnabled,
    );
    const theme = activeTheme.value;
    const callback = this.interactionStateCallback;
    if (callback !== null) {
      callback(state, theme);
      return;
    }
    const binding = this.interactionStateBinding;
    if (binding !== null) {
      binding.invoke(state, theme);
    }
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }
}
