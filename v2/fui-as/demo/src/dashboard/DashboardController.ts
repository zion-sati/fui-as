import {
  AssetLoadState,
  ContextMenuManager,
  Disposable,
  Image,
  KeyEventType,
  SelectionArea,
  SemanticCheckedState,
  Svg,
  Text,
  Theme,
  Unit,
  activeTheme,
  disposeAll,
  hslToColor,
  isDarkMode,
  showKeyboardFocusForKeyEvent,
  useCustomTheme,
  useSystemTheme,
  viewportHeightSignal,
  viewportWidthSignal,
} from "../../../src/Fui";
import { bind1 } from "../../../src/FuiPrimitives";
import {
  clearDemoShellClockTickChanged,
  clearDemoShellDarkModeChanged,
  clearDemoShellHueChanged,
  onDemoShellClockTickChanged,
  onDemoShellDarkModeChanged,
  onDemoShellHueChanged,
} from "../generated/HostEvents";
import { DashboardModel } from "./DashboardModel";
import { DashboardView } from "./DashboardView";
import {
  DemoSurfaceRecipe,
  DemoTextRecipe,
  applyDemoSurfaceRecipe,
  applyDemoTextRecipe,
  generateDemoTheme,
} from "../design-system";

function padTwoDigits(value: i32): string {
  if (value < 10) {
    return "0" + value.toString();
  }
  return value.toString();
}

function formatSelectionCountText(length: i32): string {
  if (length <= 0) {
    return "Selection: ";
  }
  return "Selection: " + length.toString() + (length == 1 ? " char" : " chars");
}

export class DashboardController {
  readonly model: DashboardModel;
  readonly view: DashboardView;
  private readonly disposables: Array<Disposable> = new Array<Disposable>();

  constructor() {
    this.model = new DashboardModel(isDarkMode());
    this.view = new DashboardView();
    onDemoShellClockTickChanged(bind1<DashboardController, i32>(this, (controller, next) => controller.setClockTick(next)));
    onDemoShellHueChanged(bind1<DashboardController, i32>(this, (controller, next) => controller.setHue(next)));
    onDemoShellDarkModeChanged(bind1<DashboardController, bool>(this, (controller, flag) => controller.setDarkMode(flag)));
    this.wireViewEvents();
    ContextMenuManager.setMenu(this.view.contextMenu);
    this.attachListeners();
    this.syncTheme();
    this.refreshStaticState();
  }

  getRoot(): SelectionArea {
    return this.view.getRoot();
  }

  getSelectionDebugText(): string {
    return this.view.root.selectedText.value;
  }

  dispose(): void {
    disposeAll(this.disposables);
    clearDemoShellClockTickChanged();
    clearDemoShellHueChanged();
    clearDemoShellDarkModeChanged();
    this.view.dispose();
    ContextMenuManager.setMenu(null);
    useSystemTheme();
  }

  setClockTick(next: i32): void {
    this.model.clockTick.value = next;
  }

  setHue(next: i32): void {
    let normalized = next % 360;
    if (normalized < 0) {
      normalized += 360;
    }
    this.model.hue.value = normalized;
  }

  setDarkMode(flag: bool): void {
    if (this.model.darkModeValue == flag) {
      return;
    }
    this.model.darkModeValue = flag;
    this.syncTheme();
  }

  syncStartupScrollMetrics(): void {
    const viewport = this.view.mainContentViewport;
    const content = this.view.mainContentColumn;
    if (viewport === null || content === null) {
      return;
    }
    const viewportBounds = viewport.getBounds();
    const contentBounds = content.getBounds();

    this.view.mainContentScrollState.viewportWidth.value = unchecked(viewportBounds[2]);
    this.view.mainContentScrollState.viewportHeight.value = unchecked(viewportBounds[3]);
    this.view.mainContentScrollState.contentWidth.value = unchecked(contentBounds[2]);
    this.view.mainContentScrollState.contentHeight.value = unchecked(contentBounds[3]);
    this.view.mainContentScrollBox.verticalScrollBar.refreshNow();
    this.view.mainContentScrollBox.horizontalScrollBar.refreshNow();

    const nestedViewport = this.view.nestedScrollBox.viewport;
    const nestedViewportBounds = nestedViewport.getBounds();
    const nestedContentBounds = this.view.nestedScrollContent.getBounds();

    this.view.nestedScrollBox.scrollState.viewportWidth.value = unchecked(nestedViewportBounds[2]);
    this.view.nestedScrollBox.scrollState.viewportHeight.value = unchecked(nestedViewportBounds[3]);
    this.view.nestedScrollBox.scrollState.contentWidth.value = unchecked(nestedContentBounds[2]);
    this.view.nestedScrollBox.scrollState.contentHeight.value = unchecked(nestedContentBounds[3]);
    this.view.nestedScrollBox.verticalScrollBar.refreshNow();
    this.view.nestedScrollBox.horizontalScrollBar.refreshNow();
  }

  toggleFoundationsScope(): void {
    this.model.foundationsScopeEnabled.value = !this.model.foundationsScopeEnabled.value;
  }

  activateFoundationsScopedAction(): void {
    if (!this.model.foundationsScopeEnabled.value) {
      return;
    }
    this.model.foundationsScopedActionCount.value += 1;
  }

  focusFoundationsScopedAction(): void {
    if (!this.model.foundationsScopeEnabled.value) {
      return;
    }
    showKeyboardFocusForKeyEvent(KeyEventType.Down, "Tab");
    this.view.foundationsScopedButton.focusNow();
  }

  private wireViewEvents(): void {
    this.view.counterButton.onClickWith(this, (c) => {
      c.model.clickCount.value += 1;
    });
    this.view.counterButton.onHoverChangedWith(this, (c, hovered) => {
      c.model.counterHovered.value = hovered;
    });
    this.view.keyTargetBox.onFocusChangedWith(this, (c, focused) => {
      c.model.keyTargetFocused.value = focused;
    });
    this.view.keyTargetBox.onKeyDownWith(this, (c, key, _mods) => {
      c.model.lastKey.value = key;
    });
    this.view.dialogButton.onClickWith(this, (c) => {
      c.view.dialog.content(
        "Confirm action",
        "Press Enter to accept, Escape to cancel, or click the backdrop to dismiss this dialog.",
      );
      c.updateSemanticText(c.view.dialogStatusText, "Dialog status: open");
      c.view.dialog.show();
    });
    this.view.dialog.onAcceptWith(this, (c) => {
      c.updateSemanticText(c.view.dialogStatusText, "Dialog status: accepted");
    });
    this.view.dialog.onCancelWith(this, (c) => {
      c.updateSemanticText(c.view.dialogStatusText, "Dialog status: cancelled");
    });
    this.view.foundationsToggleButton.onClickWith(this, (c) => c.toggleFoundationsScope());
    this.view.foundationsScopedButton.onClickWith(this, (c) => {
      c.model.foundationsScopedActionCount.value += 1;
    });
    this.view.foundationsScopedButton.onFocusChangedWith(this, (c, focused) => {
      c.model.foundationsScopedFocused.value = focused;
    });
    this.view.commonCheckbox.onChangedWith(this, (c, state) => {
      c.model.commonCheckboxState = state;
      c.updateCommonControlsState();
    });
    this.view.commonTriStateCheckbox.onChangedWith(this, (c, state) => {
      c.model.commonTriStateValue = state;
      c.updateCommonControlsState();
    });
    this.view.commonSwitch.onChangedWith(this, (c, checked) => {
      c.model.commonSwitchValue = checked;
      c.updateCommonControlsState();
    });
    this.view.commonRadioGroup.onChangedWith(this, (c, value) => {
      c.model.commonRadioValue = value;
      c.updateCommonControlsState();
    });
    this.view.commonHorizontalSlider.onChangedWith(this, (c, value) => {
      c.model.commonHorizontalSliderValue = value;
      c.updateCommonControlsState();
    });
    this.view.commonVerticalSlider.onChangedWith(this, (c, value) => {
      c.model.commonVerticalSliderValue = value;
      c.updateCommonControlsState();
    });
    this.view.commonDropdown.onChangedWith(this, (c, item, _index) => {
      c.model.commonDropdownValue = item.label;
      c.updateCommonControlsState();
    });
    this.view.commonTextInput.onChangedWith(this, (c, value) => {
      c.model.commonTextInputValue = value;
      c.updateCommonControlsState();
    });
    this.view.commonTextInput.onSelectionChangedWith(this, (c, start, end) => {
      c.model.commonTextInputSelectionStart = start;
      c.model.commonTextInputSelectionEnd = end;
      c.updateCommonControlsState();
    });
    this.view.commonTextInput.onFocusChangedWith(this, (c, focused) => {
      c.model.commonTextInputFocused = focused;
      c.updateCommonControlsState();
    });
  }

  private attachListeners(): void {
    this.track(this.model.clockTick.bind(this, (c, _value) => c.updateClockState(true)));
    this.track(this.model.hue.bind(this, (c, _value) => c.handleHueChanged()));
    this.track(this.model.clickCount.bind(this, (c, _value) => c.updateClickState(true)));
    this.track(this.model.counterHovered.bind(this, (c, _value) => c.updatePointerState(true)));
    this.track(this.model.keyTargetFocused.bind(this, (c, _value) => c.updateFocusState(true)));
    this.track(this.model.lastKey.bind(this, (c, _value) => c.updateKeyTargetState(true)));
    this.track(this.model.foundationsScopeEnabled.bind(this, (c, _value) => c.updateFoundationsScopeState(true)));
    this.track(this.model.foundationsScopedFocused.bind(this, (c, _value) => c.updateFoundationsScopedFocusState(true)));
    this.track(this.model.foundationsScopedActionCount.bind(this, (c, _value) => c.updateFoundationsScopedActionState(true)));
    this.track(this.view.root.selectedText.bind(this, (c, _value) => c.updateSelectionStatusState(true)));
    this.track(viewportWidthSignal.bind(this, (c, _value) => c.handleViewportChanged()));
    this.track(viewportHeightSignal.bind(this, (c, _value) => c.handleViewportChanged()));
    this.track(this.view.sidebarList.scrollState.offsetY.bind(this, (c, _value) => c.handleListMetricsChanged()));
    this.track(this.view.mediaTextureImage.assetStateSignal().bind(this, (c, _value) => c.updateMediaState(true)));
    this.track(this.view.mediaSvgImage.assetStateSignal().bind(this, (c, _value) => c.updateMediaState(true)));
    this.track(this.view.mediaSecondaryTextureImage.assetStateSignal().bind(this, (c, _value) => c.updateMediaState(true)));
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }

  private refreshStaticState(): void {
    this.updateClockState();
    this.updateHueState();
    this.updateViewportState();
    this.updateClickState();
    this.updatePointerState();
    this.updateKeyTargetState();
    this.updateFocusState();
    this.updateSelectionStatusState();
    this.updateFoundationsScopeState();
    this.updateFoundationsScopedFocusState();
    this.updateFoundationsScopedActionState();
    this.updateCommonControlsState();
    this.updateMediaState();
    this.handleListMetricsChanged(false);
    this.updateSemanticText(this.view.dialogStatusText, "Dialog status: idle");
  }

  private handleHueChanged(): void {
    this.syncTheme();
    this.updateHueState();
    this.updateHeaderState();
  }

  private formatClockText(): string {
    const tick = this.model.clockTick.value;
    const minutes = tick / 60;
    const seconds = tick % 60;
    return "Tick " + minutes.toString() + ":" + padTwoDigits(seconds);
  }

  private formatHueText(): string {
    return "Hue " + this.model.hue.value.toString() + " deg";
  }

  private formatListOffsetText(): string {
    return "List offset " + (<i32>this.view.sidebarList.scrollState.offsetY.value).toString() + " px";
  }

  private formatFirstVisibleText(): string {
    return "First visible item " + this.view.sidebarList.firstVisibleIndex.toString();
  }

  private formatRenderedCountText(): string {
    return "Rendered rows " + this.view.sidebarList.renderedItemCount.toString();
  }

  private formatClickCountText(): string {
    return "Clicks: " + this.model.clickCount.value.toString();
  }

  private formatPointerStatus(): string {
    return this.model.counterHovered.value ? "Pointer hover active" : "Pointer idle";
  }

  private formatFocusStatus(): string {
    return this.model.keyTargetFocused.value ? "Keyboard target focused" : "Keyboard target unfocused";
  }

  private formatViewportText(): string {
    const viewportWidth = <i32>viewportWidthSignal.value;
    const viewportHeight = <i32>viewportHeightSignal.value;
    return "Viewport: " + viewportWidth.toString() + " x " + viewportHeight.toString();
  }

  private formatSelectionStatusText(): string {
    const selectedText = this.view.root.selectedText.value;
    return formatSelectionCountText(selectedText.length);
  }

  private syncTheme(): void {
    useCustomTheme(generateDemoTheme(this.model.darkModeValue, hslToColor(<f32>this.model.hue.value, <f32>0.72, <f32>0.45)));
    this.applyDemoTheme(activeTheme.value);
  }

  private updateSemanticText(node: Text, label: string): void {
    node.text(label);
  }

  private updateHeaderState(_commit: bool = true): void {
    this.updateSemanticText(
      this.view.headerStatusText,
      this.formatClockText() + "  •  " + this.formatHueText() + "  •  " + this.formatFirstVisibleText(),
    );
  }

  private updateClockState(_commit: bool = true): void {
    this.updateSemanticText(this.view.clockText, this.formatClockText());
    this.updateHeaderState(false);
  }

  private updateHueState(_commit: bool = true): void {
    this.updateSemanticText(this.view.hueText, this.formatHueText());
    this.updateHeaderState(false);
  }

  private updateViewportState(_commit: bool = true): void {
    this.updateSemanticText(this.view.viewportText, this.formatViewportText());
  }

  private updateClickState(_commit: bool = true): void {
    this.updateSemanticText(this.view.clickCountText, this.formatClickCountText());
  }

  private updatePointerState(_commit: bool = true): void {
    const theme = activeTheme.value;
    this.updateSemanticText(this.view.pointerStatusText, this.formatPointerStatus());
    applyDemoTextRecipe(
      this.view.pointerStatusText,
      theme,
      this.model.counterHovered.value ? DemoTextRecipe.StatusValue : DemoTextRecipe.Hint,
    );
  }

  private updateKeyTargetState(_commit: bool = true): void {
    this.updateSemanticText(this.view.keyTargetText, "Focus me, then press keys. Last key: " + this.model.lastKey.value);
  }

  private updateFocusState(_commit: bool = true): void {
    const theme = activeTheme.value;
    this.updateSemanticText(this.view.focusStatusText, this.formatFocusStatus());
    applyDemoTextRecipe(
      this.view.focusStatusText,
      theme,
      this.model.keyTargetFocused.value ? DemoTextRecipe.StatusValue : DemoTextRecipe.Hint,
    );
    applyDemoSurfaceRecipe(
      this.view.keyTargetBox,
      theme,
      this.model.keyTargetFocused.value ? DemoSurfaceRecipe.KeyTargetFocused : DemoSurfaceRecipe.KeyTargetIdle,
    );
  }

  private updateSelectionStatusState(_commit: bool = true): void {
    this.updateSemanticText(this.view.selectionStatusText, this.formatSelectionStatusText());
  }

  private updateFoundationsScopeState(_commit: bool = true): void {
    const theme = activeTheme.value;
    const enabled = this.model.foundationsScopeEnabled.value;
    if (!enabled && this.model.foundationsScopedFocused.value) {
      this.model.foundationsScopedFocused.value = false;
    }
    this.updateSemanticText(
      this.view.foundationsStatusText,
      enabled ? "Scoped parent: enabled" : "Scoped parent: disabled via parent container",
    );
    applyDemoTextRecipe(
      this.view.foundationsStatusText,
      theme,
      enabled ? DemoTextRecipe.StatusValue : DemoTextRecipe.Hint,
    );
    this.view.foundationsToggleButton.label(enabled ? "Disable scoped child" : "Enable scoped child");
    this.view.foundationsScopeBox.enabled(enabled);
  }

  private updateFoundationsScopedFocusState(_commit: bool = true): void {
    const theme = activeTheme.value;
    const focused = this.model.foundationsScopedFocused.value;
    this.updateSemanticText(
      this.view.foundationsFocusText,
      focused ? "Scoped child focus: focused" : "Scoped child focus: unfocused",
    );
    applyDemoTextRecipe(
      this.view.foundationsFocusText,
      theme,
      focused ? DemoTextRecipe.StatusValue : DemoTextRecipe.Hint,
    );
  }

  private updateFoundationsScopedActionState(_commit: bool = true): void {
    this.updateSemanticText(
      this.view.foundationsScopedActionText,
      "Scoped child activations " + this.model.foundationsScopedActionCount.value.toString(),
    );
  }

  private updateMediaState(_commit: bool = true): void {
    const theme = activeTheme.value;
    const textureState = this.view.mediaTextureImage.assetState();
    this.applyImageAssetSize(this.view.mediaTextureImage, textureState);
    let textureCaption = "Texture-backed image";
    let textureCaptionRecipe = DemoTextRecipe.Hint;
    if (textureState == AssetLoadState.Loading) {
      textureCaption = "Texture-backed image (loading...)";
      textureCaptionRecipe = DemoTextRecipe.StatusSupporting;
    } else if (textureState == AssetLoadState.Failed) {
      textureCaption = "Texture-backed image failed";
      textureCaptionRecipe = DemoTextRecipe.Error;
    }
    this.updateSemanticText(this.view.mediaTextureCaptionText, textureCaption);
    applyDemoTextRecipe(this.view.mediaTextureCaptionText, theme, textureCaptionRecipe);

    const svgState = this.view.mediaSvgImage.assetState();
    this.applySvgAssetSize(this.view.mediaSvgImage, svgState);
    let svgCaption = "SVG-backed icon";
    let svgCaptionRecipe = DemoTextRecipe.Hint;
    if (svgState == AssetLoadState.Loading) {
      svgCaption = "SVG-backed icon (loading...)";
      svgCaptionRecipe = DemoTextRecipe.StatusSupporting;
    } else if (svgState == AssetLoadState.Failed) {
      svgCaption = "SVG-backed icon failed";
      svgCaptionRecipe = DemoTextRecipe.Error;
    }
    this.updateSemanticText(this.view.mediaSvgCaptionText, svgCaption);
    applyDemoTextRecipe(this.view.mediaSvgCaptionText, theme, svgCaptionRecipe);

    const secondaryTextureState = this.view.mediaSecondaryTextureImage.assetState();
    this.applyImageAssetSize(this.view.mediaSecondaryTextureImage, secondaryTextureState);
    let secondaryTextureCaption = "Second texture-backed image";
    let secondaryTextureCaptionRecipe = DemoTextRecipe.Hint;
    if (secondaryTextureState == AssetLoadState.Loading) {
      secondaryTextureCaption = "Second texture-backed image (loading...)";
      secondaryTextureCaptionRecipe = DemoTextRecipe.StatusSupporting;
    } else if (secondaryTextureState == AssetLoadState.Failed) {
      secondaryTextureCaption = "Second texture-backed image failed";
      secondaryTextureCaptionRecipe = DemoTextRecipe.Error;
    }
    this.updateSemanticText(this.view.mediaSecondaryTextureCaptionText, secondaryTextureCaption);
    applyDemoTextRecipe(this.view.mediaSecondaryTextureCaptionText, theme, secondaryTextureCaptionRecipe);
  }

  private applyImageAssetSize(node: Image, state: AssetLoadState): void {
    if (state != AssetLoadState.Ready) {
      node.width(16.0, Unit.Pixel);
      node.height(16.0, Unit.Pixel);
      return;
    }
    const width = node.assetWidth();
    const height = node.assetHeight();
    node.width(width > 0.0 ? width : 16.0, Unit.Pixel);
    node.height(height > 0.0 ? height : 16.0, Unit.Pixel);
  }

  private applySvgAssetSize(node: Svg, state: AssetLoadState): void {
    if (state != AssetLoadState.Ready) {
      node.width(16.0, Unit.Pixel);
      node.height(16.0, Unit.Pixel);
      return;
    }
    const width = node.assetWidth();
    const height = node.assetHeight();
    node.width(width > 0.0 ? width : 16.0, Unit.Pixel);
    node.height(height > 0.0 ? height : 16.0, Unit.Pixel);
  }

  private handleViewportChanged(): void {
    this.view.syncViewportLayout();
    this.syncStartupScrollMetrics();
    this.updateViewportState(false);
  }

  private handleListMetricsChanged(_commit: bool = true): void {
    this.updateSemanticText(this.view.listOffsetText, this.formatListOffsetText());
    this.updateSemanticText(this.view.firstVisibleText, this.formatFirstVisibleText());
    this.updateSemanticText(this.view.renderedCountText, this.formatRenderedCountText());
    this.updateHeaderState(false);
  }

  private applyDemoTheme(theme: Theme): void {
    this.view.applyTheme(theme);
    this.updatePointerState(false);
    this.updateFocusState(false);
    this.updateFoundationsScopeState(false);
    this.updateFoundationsScopedFocusState(false);
    this.updateFoundationsScopedActionState(false);
    this.updateCommonControlsState(false);
    this.updateMediaState(false);
  }

  private formatCheckedState(state: SemanticCheckedState): string {
    if (state == SemanticCheckedState.True) {
      return "checked";
    }
    if (state == SemanticCheckedState.Mixed) {
      return "mixed";
    }
    return "unchecked";
  }

  private formatSliderValue(value: f32): string {
    return (<i32>value).toString();
  }

  private formatTextInputValue(value: string): string {
    if (value.length == 0) {
      return "<empty>";
    }
    return "\"" + value + "\"";
  }

  private updateCommonControlsState(_commit: bool = true): void {
    this.updateSemanticText(
      this.view.commonToggleStatusText,
      "Checkbox: " + this.formatCheckedState(this.model.commonCheckboxState) +
      " • Tri-state: " + this.formatCheckedState(this.model.commonTriStateValue) +
      " • Switch: " + (this.model.commonSwitchValue ? "on" : "off"),
    );
    this.updateSemanticText(this.view.commonRadioStatusText, "Radio group: " + this.model.commonRadioValue);
    this.updateSemanticText(
      this.view.commonSliderStatusText,
      "Horizontal slider: " + this.formatSliderValue(this.model.commonHorizontalSliderValue) +
      " • Vertical slider: " + this.formatSliderValue(this.model.commonVerticalSliderValue),
    );
    this.updateSemanticText(this.view.commonDropdownStatusText, "Dropdown: " + this.model.commonDropdownValue);
    this.updateSemanticText(
      this.view.commonTextInputStatusText,
      "TextInput: " + this.formatTextInputValue(this.model.commonTextInputValue) +
      " • Selection: " + this.model.commonTextInputSelectionStart.toString() + "-" + this.model.commonTextInputSelectionEnd.toString() +
      " • Focus: " + (this.model.commonTextInputFocused ? "focused" : "blurred"),
    );
  }
}
