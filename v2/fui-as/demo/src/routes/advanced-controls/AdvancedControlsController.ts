import { AnimationTiming, Easings, ScrollBarVisibility, SemanticCheckedState, Theme, Visibility, Worker, activeTheme } from "../../../../src/Fui";
import { RoutePageLifecycleOwner, RoutePageSection } from "../../design-system";
import { AdvancedControlsModel } from "./AdvancedControlsModel";
import { ExternalDropDemoSection } from "./external-drop/ExternalDropDemoSection";
import { FetchDemoSection } from "./fetch/FetchDemoSection";
import {
  AdvancedControlsView,
  ANIMATION_SCROLL_LOGICAL_CONTENT_HEIGHT_PX,
  ANIMATION_SCROLL_ROW_HEIGHT_PX,
  ANIMATION_SCROLL_VIEWPORT_HEIGHT_PX,
  FIXED_LINE_HEIGHT_PX,
} from "./AdvancedControlsView";
import { ReorderDemoSection } from "./reorder/ReorderDemoSection";

const ANIMATION_SCROLL_TIMING: AnimationTiming = new AnimationTiming(260.0, Easings.cubicOut);
const ANIMATION_SCROLL_MIDDLE_OFFSET: f32 = ANIMATION_SCROLL_ROW_HEIGHT_PX * 6.0;
const ANIMATION_SCROLL_FINAL_OFFSET: f32 = ANIMATION_SCROLL_ROW_HEIGHT_PX * 12.0;
const ANIMATION_SCROLL_LOGICAL_TAIL_OFFSET: f32 = ANIMATION_SCROLL_LOGICAL_CONTENT_HEIGHT_PX - ANIMATION_SCROLL_VIEWPORT_HEIGHT_PX;

function clampPercent(value: i32): i32 {
  if (value < 0) {
    return 0;
  }
  if (value > 100) {
    return 100;
  }
  return value;
}

function parseLeadingPercent(text: string): i32 {
  let value = 0;
  let sawDigit = false;
  for (let i = 0, len = text.length; i < len; i += 1) {
    const code = text.charCodeAt(i);
    if (code >= 48 && code <= 57) {
      sawDigit = true;
      value = (value * 10) + (code - 48);
      continue;
    }
    if (sawDigit) {
      break;
    }
  }
  return sawDigit ? clampPercent(value) : 0;
}

export class AdvancedControlsController implements RoutePageLifecycleOwner {
  readonly model: AdvancedControlsModel = new AdvancedControlsModel();
  readonly view: AdvancedControlsView = new AdvancedControlsView();
  readonly reorderDemo: ReorderDemoSection = new ReorderDemoSection();
  readonly fetchDemo: FetchDemoSection = new FetchDemoSection();
  readonly externalDropDemo: ExternalDropDemoSection = new ExternalDropDemoSection();

  constructor() {
    this.view.readOnlyToggle.onChangedWith(this, (controller, state) => {
      controller.view.textArea.readOnly(state != SemanticCheckedState.False);
      controller.syncStatus();
    });
    this.view.wrappingToggle.onChangedWith(this, (controller, state) => {
      const enabled = state != SemanticCheckedState.False;
      controller.view.textArea.wrapping(enabled);
      if (enabled) {
        controller.view.horizontalPolicyGroup.selectIndex(0);
      }
      controller.syncHorizontalPolicy();
      controller.syncStatus();
    });
    this.view.alwaysVerticalToggle.onChangedWith(this, (controller, state) => {
      if (state != SemanticCheckedState.False) {
        controller.view.neverVerticalToggle.check(false);
      }
      controller.syncVerticalPolicyFromCheckboxes();
    });
    this.view.neverVerticalToggle.onChangedWith(this, (controller, state) => {
      if (state != SemanticCheckedState.False) {
        controller.view.alwaysVerticalToggle.check(false);
      }
      controller.syncVerticalPolicyFromCheckboxes();
    });
    this.view.alwaysHorizontalToggle.onChangedWith(this, (controller, state) => {
      if (state != SemanticCheckedState.False) {
        controller.view.neverHorizontalToggle.check(false);
      }
      controller.syncHorizontalPolicyFromCheckboxes();
    });
    this.view.neverHorizontalToggle.onChangedWith(this, (controller, state) => {
      if (state != SemanticCheckedState.False) {
        controller.view.alwaysHorizontalToggle.check(false);
      }
      controller.syncHorizontalPolicyFromCheckboxes();
    });
    this.view.textArea.onFocusChangedWith(this, (controller, _focused) => {
      controller.syncStatus();
    });
    this.view.textArea.onSelectionChangedWith(this, (controller, _start, _end) => {
      controller.syncStatus();
    });
    this.view.textArea.onChangedWith(this, (controller, _text) => {
      controller.syncStatus();
    });
    this.view.verticalPolicyGroup.onChangedWith(this, (controller, _value) => {
      controller.syncVerticalPolicy();
    });
    this.view.horizontalPolicyGroup.onChangedWith(this, (controller, _value) => {
      controller.syncHorizontalPolicy();
    });
    this.view.lineHeightGroup.onChangedWith(this, (controller, _value) => {
      controller.syncLineHeight();
    });
    this.view.fontModeGroup.onChangedWith(this, (controller, _value) => {
      controller.syncFontMode();
    });
    this.view.visibilityDropdown.onChangedWith(this, (controller, _item, _index) => {
      controller.syncVisibility();
    });
    this.view.animationPreviewCalmButton.onClickWith(this, (controller) => {
      controller.setAnimationPreview(false);
    });
    this.view.animationPreviewEmphasisButton.onClickWith(this, (controller) => {
      controller.setAnimationPreview(true);
    });
    this.view.animationScrollTopButton.onClickWith(this, (controller) => {
      controller.animateScrollSamples("top", 0.0);
    });
    this.view.animationScrollMiddleButton.onClickWith(this, (controller) => {
      controller.animateScrollSamples("midpoint", ANIMATION_SCROLL_MIDDLE_OFFSET);
    });
    this.view.animationScrollBottomButton.onClickWith(this, (controller) => {
      controller.animateScrollSamples("final", ANIMATION_SCROLL_FINAL_OFFSET);
    });
    this.view.animationScrollTailButton.onClickWith(this, (controller) => {
      controller.animateScrollSamples("logical tail", ANIMATION_SCROLL_LOGICAL_TAIL_OFFSET);
    });
    this.view.workerStartButton.onClickWith(this, (controller) => {
      controller.startLargestPrimeCalculator();
    });
    this.view.workerCancelButton.onClickWith(this, (controller) => {
      controller.cancelLargestPrimeCalculator();
    });
    this.syncFontMode();
    this.syncVerticalPolicy();
    this.syncHorizontalPolicy();
    this.syncLineHeight();
    this.syncVisibility();
    this.syncAnimationShowcase();
    this.syncWorkerUi();
    this.syncStatus();
  }

  buildSections(): Array<RoutePageSection> {
    const sections = this.view.buildSections();
    const reordered = new Array<RoutePageSection>();
    reordered.push(unchecked(sections[0]));
    reordered.push(unchecked(sections[1]));
    reordered.push(this.reorderDemo.buildSection());
    reordered.push(unchecked(sections[2]));
    reordered.push(this.fetchDemo.buildSection());
    for (let index = 3; index < sections.length; index += 1) {
      reordered.push(unchecked(sections[index]));
    }
    reordered.push(this.externalDropDemo.buildSection());
    return reordered;
  }

  applyTheme(theme: Theme): void {
    this.view.applyTheme(theme);
    this.reorderDemo.applyTheme(theme);
    this.fetchDemo.applyTheme(theme);
    this.externalDropDemo.applyTheme(theme);
    this.syncFontMode();
    this.view.setAnimationPreviewState(this.model.animationPreviewEmphasized, theme);
    this.syncAnimationShowcase();
  }

  dispose(): void {
    this.reorderDemo.dispose();
    this.fetchDemo.dispose();
    this.externalDropDemo.dispose();
    const worker = this.model.activeWorker;
    if (worker === null) {
      return;
    }
    worker.dispose();
    this.model.activeWorker = null;
  }

  animationTargetCode(): i32 {
    const label = this.model.animationScrollTargetLabel;
    if (label == "midpoint") {
      return 1;
    }
    if (label == "final") {
      return 2;
    }
    if (label == "logical tail") {
      return 3;
    }
    return 0;
  }

  private syncVerticalPolicyFromCheckboxes(): void {
    if (this.view.neverVerticalToggle.checked) {
      this.view.verticalPolicyGroup.selectIndex(2);
    } else if (this.view.alwaysVerticalToggle.checked) {
      this.view.verticalPolicyGroup.selectIndex(1);
    } else {
      this.view.verticalPolicyGroup.selectIndex(0);
    }
    this.syncVerticalPolicy();
    this.syncStatus();
  }

  private syncHorizontalPolicyFromCheckboxes(): void {
    if (this.view.neverHorizontalToggle.checked) {
      this.view.horizontalPolicyGroup.selectIndex(2);
    } else if (this.view.alwaysHorizontalToggle.checked) {
      this.view.horizontalPolicyGroup.selectIndex(1);
    } else {
      this.view.horizontalPolicyGroup.selectIndex(0);
    }
    this.syncHorizontalPolicy();
    this.syncStatus();
  }

  private syncVerticalPolicy(): void {
    const value = this.view.verticalPolicyGroup.selectedValue;
    if (value == "never") {
      this.view.textArea.verticalScrollbarVisibility(ScrollBarVisibility.Never);
      this.view.alwaysVerticalToggle.check(false);
      this.view.neverVerticalToggle.check(true);
      return;
    }
    if (value == "always") {
      this.view.textArea.verticalScrollbarVisibility(ScrollBarVisibility.Always);
      this.view.alwaysVerticalToggle.check(true);
      this.view.neverVerticalToggle.check(false);
      return;
    }
    this.view.textArea.verticalScrollbarVisibility(ScrollBarVisibility.Auto);
    this.view.alwaysVerticalToggle.check(false);
    this.view.neverVerticalToggle.check(false);
  }

  private syncHorizontalPolicy(): void {
    const value = this.view.horizontalPolicyGroup.selectedValue;
    if (value == "never") {
      this.view.textArea.horizontalScrollbarVisibility(ScrollBarVisibility.Never);
      this.view.alwaysHorizontalToggle.check(false);
      this.view.neverHorizontalToggle.check(true);
      return;
    }
    if (value == "always") {
      this.view.textArea.horizontalScrollbarVisibility(ScrollBarVisibility.Always);
      this.view.alwaysHorizontalToggle.check(true);
      this.view.neverHorizontalToggle.check(false);
      return;
    }
    this.view.textArea.horizontalScrollbarVisibility(ScrollBarVisibility.Auto);
    this.view.alwaysHorizontalToggle.check(false);
    this.view.neverHorizontalToggle.check(false);
  }

  private syncLineHeight(): void {
    const value = this.view.lineHeightGroup.selectedValue;
    if (value == "fixed-28") {
      this.view.textArea.lineHeight(FIXED_LINE_HEIGHT_PX);
    } else {
      this.view.textArea.lineHeight(0.0);
      this.view.lineHeightGroup.selectIndex(0);
    }
    this.syncStatus();
  }

  private syncFontMode(): void {
    const themeFonts = activeTheme.value.fonts;
    if (this.view.fontModeGroup.selectedValue == "mono") {
      this.view.textArea.fontFamily(themeFonts.monoFamily);
      this.view.textArea.fontSize(themeFonts.sizeMono);
      this.syncStatus();
      return;
    }
    this.view.textArea.fontFamily(themeFonts.bodyFamily);
    this.view.textArea.fontSize(themeFonts.sizeBody);
    this.view.fontModeGroup.selectIndex(0);
    this.syncStatus();
  }

  private syncVisibility(): void {
    const index = this.view.visibilityDropdown.selectedIndex;
    if (index == 1) {
      this.view.textArea.visibility(Visibility.Hidden);
      this.syncStatus();
      return;
    }
    if (index == 2) {
      this.view.textArea.visibility(Visibility.Collapsed);
      this.syncStatus();
      return;
    }
    this.view.textArea.visibility(Visibility.Normal);
    this.view.visibilityDropdown.selectIndex(0);
    this.syncStatus();
  }

  private visibilitySummaryLabel(): string {
    const index = this.view.visibilityDropdown.selectedIndex;
    if (index == 1) {
      return "hidden";
    }
    if (index == 2) {
      return "collapsed";
    }
    return "normal";
  }

  private setAnimationPreview(emphasized: bool): void {
    this.model.animationPreviewEmphasized = emphasized;
    this.view.setAnimationPreviewState(emphasized, activeTheme.value);
    this.syncAnimationShowcase();
  }

  private animateScrollSamples(targetLabel: string, offsetY: f32): void {
    this.model.animationScrollTargetLabel = targetLabel;
    this.view.animationScrollBox.scrollToAnimated(0.0, offsetY, ANIMATION_SCROLL_TIMING);
    this.syncAnimationShowcase();
  }

  private startLargestPrimeCalculator(): void {
    if (this.model.activeWorker !== null) {
      return;
    }
    this.model.workerProgressPercent = 0;
    this.model.workerStateLabel = "running";
    this.view.workerProgressBar.value(0.0);
    this.view.workerDetailText.text("Largest-prime calculator is running for 5 seconds and yields once per second.");
    const worker = Worker.start("largestPrimeCalculatorWorker")
      .onProgress(this, (controller, message) => {
        controller.handleWorkerProgress(message);
      })
      .onComplete(this, (controller, result) => {
        controller.handleWorkerComplete(result);
      })
      .onError(this, (controller, message) => {
        controller.handleWorkerError(message);
      });
    this.model.activeWorker = worker;
    this.syncWorkerUi();
    worker.sendString("advanced-controls-demo");
  }

  private cancelLargestPrimeCalculator(): void {
    const worker = this.model.activeWorker;
    if (worker === null) {
      return;
    }
    this.model.workerStateLabel = "cancelling";
    this.view.workerDetailText.text("Cancellation requested. Waiting for the worker to yield.");
    this.syncWorkerUi();
    worker.cancel();
  }

  private handleWorkerProgress(message: string): void {
    this.model.workerProgressPercent = parseLeadingPercent(message);
    this.model.workerStateLabel = "running";
    this.view.workerProgressBar.value(<f32>this.model.workerProgressPercent);
    this.view.workerDetailText.text("Prime search progress: " + this.model.workerProgressPercent.toString() + "%.");
    this.syncWorkerUi();
  }

  private handleWorkerComplete(result: string): void {
    this.model.activeWorker = null;
    this.model.workerProgressPercent = 100;
    this.model.workerStateLabel = "complete";
    this.view.workerProgressBar.value(100.0);
    this.view.workerDetailText.text("Largest prime after 5s: " + result);
    this.syncWorkerUi();
  }

  private handleWorkerError(message: string): void {
    this.model.activeWorker = null;
    if (message.indexOf("cancelled:") == 0) {
      const cancelledPercent = parseLeadingPercent(message);
      if (cancelledPercent > this.model.workerProgressPercent) {
        this.model.workerProgressPercent = cancelledPercent;
      }
      this.model.workerStateLabel = "cancelled";
      this.view.workerDetailText.text(
        "Prime search cancelled after yielding at " + this.model.workerProgressPercent.toString() + "%.",
      );
    } else {
      this.model.workerStateLabel = "error";
      this.view.workerDetailText.text("Worker error: " + message);
    }
    this.view.workerProgressBar.value(<f32>this.model.workerProgressPercent);
    this.syncWorkerUi();
  }

  private syncWorkerUi(): void {
    this.view.workerStartButton.enabled(this.model.activeWorker === null);
    this.view.workerCancelButton.enabled(this.model.activeWorker !== null && this.model.workerStateLabel != "cancelling");
    this.view.workerStatusText.text(
      "Worker status: " + this.model.workerStateLabel + " • Progress: " + this.model.workerProgressPercent.toString() + "%",
    );
  }

  private syncAnimationShowcase(): void {
    this.view.animationPreviewStatusText.text(
      "Preview state: " + (this.model.animationPreviewEmphasized ? "emphasized" : "calm") +
      " • Transition slots: bgColor + opacity",
    );
    this.view.animationScrollStatusText.text(
      "Smooth scroll target: " + this.model.animationScrollTargetLabel +
      " • API: scrollToAnimated(0, offset, cubicOut)" +
      " • scrollContentSize(-1, " + (<i32>ANIMATION_SCROLL_LOGICAL_CONTENT_HEIGHT_PX).toString() + ")",
    );
  }

  private syncStatus(): void {
    const text = this.view.textArea.value;
    this.view.focusStatusText.text("Focus: " + (this.view.textArea.isFocused ? "focused" : "blurred") + " • Text length: " + text.length.toString());
    this.view.selectionStatusText.text(
      "Selection: " + this.view.textArea.selectionStart.toString() + "-" + this.view.textArea.selectionEnd.toString(),
    );
    const summary =
      "Read-only: " + (this.view.textArea.isReadOnly ? "on" : "off") +
      " • Wrapping: " + (this.view.wrappingToggle.checked ? "on" : "off") +
      " • Visibility: " + this.visibilitySummaryLabel() +
      " • Vertical: " + this.view.verticalPolicyGroup.selectedValue +
      " • Horizontal: " + this.view.horizontalPolicyGroup.selectedValue +
      " • Line height: " + (this.view.lineHeightGroup.selectedValue == "fixed-28" ? "fixed 28px" : "normal") +
      " • Font: " + (this.view.fontModeGroup.selectedValue == "mono" ? "monospace" : "variable");
    this.view.settingsStatusText.text(summary);
  }
}
