import * as ui from "../bindings/ui";
import { Callback0, Handler0 } from "../core/BoundCallback";
import { AlignItems, BorderStyle, FlexDirection, JustifyContent, SemanticRole, Unit } from "../core/ffi";
import { bind0 } from "../core/bind";
import { HandlerAction } from "../core/Action";
import { Disposable, disposeAll } from "../core/Disposable";
import { Theme, activeTheme } from "../core/Theme";
import { FlexBox, Portal, TextCore } from "../nodes";
import { Button } from "./Button";
import { Form } from "./Form";

const DIALOG_CARD_WIDTH: f32 = 420.0;
const DIALOG_BACKGROUND_BLUR: f32 = 16.0;
const DIALOG_SHADOW_OFFSET_X: f32 = 0.0;
const DIALOG_SHADOW_OFFSET_Y: f32 = 8.0;
const DIALOG_SHADOW_BLUR: f32 = 10.0;
const DIALOG_SHADOW_SPREAD: f32 = 0.0;

function handleDialogBackdropClick(): void {
  Dialog.cancelActiveDialog();
}

function handleDialogAcceptAction(): void {
  Dialog.acceptActiveDialog();
}

function handleDialogCancelAction(): void {
  Dialog.cancelActiveDialog();
}

function absorbDialogCardPointer(_x: f32, _y: f32): void {}

export class Dialog extends Portal {
  private static activeInstance: Dialog | null = null;

  private readonly titleNode: TextCore = new TextCore("")
    .selectable(false)
    .semanticRole(SemanticRole.Heading) as TextCore;
  private readonly bodyNode: TextCore = new TextCore("")
    .selectable(false)
    .semanticRole(SemanticRole.StaticText) as TextCore;
  private readonly cancelButton: Button = new Button("Cancel")
    .onClick(handleDialogCancelAction)
    .width(108.0, Unit.Pixel) as Button;
  private readonly acceptButton: Button = new Button("OK")
    .onClick(handleDialogAcceptAction)
    .width(108.0, Unit.Pixel) as Button;
  private readonly buttonsRow: FlexBox = new FlexBox()
    .flexDirection(FlexDirection.Row)
    .justifyContent(JustifyContent.End)
    .alignItems(AlignItems.Center)
    .width(100.0, Unit.Percent)
    .child(this.acceptButton)
    .child(new FlexBox().width(12.0, Unit.Pixel).height(1.0, Unit.Pixel))
    .child(this.cancelButton) as FlexBox;
  private readonly form: Form = new Form()
    .defaultBtn(this.acceptButton)
    .cancelBtn(this.cancelButton)
    .width(100.0, Unit.Percent)
    .child(this.buttonsRow) as Form;
  private readonly card: FlexBox = new FlexBox()
    .width(DIALOG_CARD_WIDTH, Unit.Pixel)
    .flexDirection(FlexDirection.Column)
    .child(this.titleNode)
    .child(new FlexBox().width(100.0, Unit.Percent).height(12.0, Unit.Pixel))
    .child(this.bodyNode)
    .child(new FlexBox().width(100.0, Unit.Percent).height(24.0, Unit.Pixel))
    .child(this.form)
    .onPointerDown(absorbDialogCardPointer)
    .semanticRole(SemanticRole.Dialog) as FlexBox;
  private readonly overlay: FlexBox = new FlexBox()
    .width(100.0, Unit.Percent)
    .height(100.0, Unit.Percent)
    .justifyContent(JustifyContent.Center)
    .alignItems(AlignItems.Center)
    .child(this.card)
    .onClick(handleDialogBackdropClick) as FlexBox;
  private isDialogVisible: bool = false;
  private acceptCallback: (() => void) | null = null;
  private acceptBinding: Callback0 | null = null;
  private cancelCallback: (() => void) | null = null;
  private cancelBinding: Callback0 | null = null;
  private semanticScopeToken: u32 = 0;
  private readonly disposables: Array<Disposable> = new Array<Disposable>();
  private backdropColorValue: u32 = activeTheme.value.colors.dialogBackdrop;
  private dialogBackgroundBlurSigmaValue: f32 = DIALOG_BACKGROUND_BLUR;
  private shadowColorValue: u32 = activeTheme.value.colors.dialogShadow;
  private shadowOffsetXValue: f32 = DIALOG_SHADOW_OFFSET_X;
  private shadowOffsetYValue: f32 = DIALOG_SHADOW_OFFSET_Y;
  private shadowBlurSigmaValue: f32 = DIALOG_SHADOW_BLUR;
  private shadowSpreadValue: f32 = DIALOG_SHADOW_SPREAD;
  private cardBackgroundColorValue: u32 = activeTheme.value.colors.surface;
  private cardBorderWidthValue: f32 = 1.0;
  private cardBorderColorValue: u32 = activeTheme.value.colors.border;
  private cardBorderStyleValue: BorderStyle = BorderStyle.Solid;
  private cardCornerRadiusValue: f32 = activeTheme.value.spacing.md;
  private backdropColorOverridden: bool = false;
  private shadowOverridden: bool = false;
  private cardBackgroundOverridden: bool = false;
  private cardBorderOverridden: bool = false;
  private cardCornerRadiusOverridden: bool = false;

  constructor(title: string = "", body: string = "") {
    super();

    this.positionAbsolute();
    this.position(0.0, 0.0);
    this.width(100.0, Unit.Percent);
    this.height(100.0, Unit.Percent);

    this.content(title, body);
    this.track(activeTheme.addAction(new HandlerAction<Dialog, Theme>(this, (dialog: Dialog, theme: Theme): void => {
      dialog.handleThemeChanged(theme);
    })));
    this.applyTheme();
  }

  static acceptActiveDialog(): void {
    const dialog = Dialog.activeInstance;
    if (dialog !== null) {
      dialog.accept();
    }
  }

  static cancelActiveDialog(): void {
    const dialog = Dialog.activeInstance;
    if (dialog !== null) {
      dialog.cancel();
    }
  }

  onAccept(cb: () => void): this {
    this.acceptCallback = cb;
    this.acceptBinding = null;
    return this;
  }

  bindAccept<Owner>(owner: Owner, handler: Handler0<Owner>): this {
    this.acceptCallback = null;
    this.acceptBinding = bind0<Owner>(owner, handler);
    return this;
  }

  onAcceptWith<Owner>(owner: Owner, handler: Handler0<Owner>): this {
    this.bindAccept(owner, handler);
    return this;
  }

  onCancel(cb: () => void): this {
    this.cancelCallback = cb;
    this.cancelBinding = null;
    return this;
  }

  bindCancel<Owner>(owner: Owner, handler: Handler0<Owner>): this {
    this.cancelCallback = null;
    this.cancelBinding = bind0<Owner>(owner, handler);
    return this;
  }

  onCancelWith<Owner>(owner: Owner, handler: Handler0<Owner>): this {
    this.bindCancel(owner, handler);
    return this;
  }

  get titleText(): TextCore {
    return this.titleNode;
  }

  get bodyText(): TextCore {
    return this.bodyNode;
  }

  get acceptActionButton(): Button {
    return this.acceptButton;
  }

  get cancelActionButton(): Button {
    return this.cancelButton;
  }

  backdropColor(color: u32): this {
    this.backdropColorOverridden = true;
    this.backdropColorValue = color;
    this.applyTheme();
    return this;
  }

  backgroundBlur(sigma: f32): this {
    this.dialogBackgroundBlurSigmaValue = sigma;
    this.applyTheme();
    return this;
  }

  cardShadow(color: u32, offsetX: f32, offsetY: f32, blurSigma: f32, spread: f32 = 0.0): this {
    this.shadowOverridden = true;
    this.shadowColorValue = color;
    this.shadowOffsetXValue = offsetX;
    this.shadowOffsetYValue = offsetY;
    this.shadowBlurSigmaValue = blurSigma;
    this.shadowSpreadValue = spread;
    this.applyTheme();
    return this;
  }

  cardColor(color: u32): this {
    this.cardBackgroundOverridden = true;
    this.cardBackgroundColorValue = color;
    this.applyTheme();
    return this;
  }

  cardBorder(width: f32, color: u32, style: BorderStyle = BorderStyle.Solid): this {
    this.cardBorderOverridden = true;
    this.cardBorderWidthValue = width;
    this.cardBorderColorValue = color;
    this.cardBorderStyleValue = style;
    this.applyTheme();
    return this;
  }

  cardCornerRadius(radius: f32): this {
    this.cardCornerRadiusOverridden = true;
    this.cardCornerRadiusValue = radius;
    this.applyTheme();
    return this;
  }

  content(title: string, body: string): this {
    this.titleNode.text(title);
    this.titleNode.semanticLabel(title);
    this.bodyNode.text(body);
    this.bodyNode.semanticLabel(body);
    this.card.semanticLabel(title);
    return this;
  }

  show(): void {
    this.applyTheme();
    if (this.overlay.parentNode === null) {
      this.addChildNode(this.overlay);
    }
    if (this.semanticScopeToken == 0 && this.overlay.builtHandle != 0) {
      this.semanticScopeToken = ui.pushSemanticScope(this.overlay.builtHandle);
    }
    this.form.activate();
    this.acceptButton.focusNow();
    this.isDialogVisible = true;
    Dialog.activeInstance = this;
  }

  hide(): void {
    if (!this.isDialogVisible && this.overlay.parentNode === null) {
      return;
    }
    this.form.deactivate();
    if (this.semanticScopeToken != 0) {
      ui.removeSemanticScope(this.semanticScopeToken);
      this.semanticScopeToken = 0;
    }
    this.removeChildNode(this.overlay);
    this.isDialogVisible = false;
    if (Dialog.activeInstance === this) {
      Dialog.activeInstance = null;
    }
  }

  private disposeControl(): void {
    this.form.deactivate();
    if (this.semanticScopeToken != 0) {
      ui.removeSemanticScope(this.semanticScopeToken);
      this.semanticScopeToken = 0;
    }
    disposeAll(this.disposables);
  }

  dispose(): void {
    this.hide();
    this.disposeControl();
    if (this.overlay.builtHandle != 0) {
      this.overlay.dispose();
    }
    super.dispose();
  }

  private accept(): void {
    const callback = this.acceptCallback;
    this.hide();
    if (callback !== null) {
      callback();
    }
    const binding = this.acceptBinding;
    if (binding !== null) {
      binding.invoke();
    }
  }

  private cancel(): void {
    const callback = this.cancelCallback;
    this.hide();
    if (callback !== null) {
      callback();
    }
    const binding = this.cancelBinding;
    if (binding !== null) {
      binding.invoke();
    }
  }

  private handleThemeChanged(theme: Theme): void {
    if (!this.backdropColorOverridden) {
      this.backdropColorValue = theme.colors.dialogBackdrop;
    }
    if (!this.shadowOverridden) {
      this.shadowColorValue = theme.colors.dialogShadow;
    }
    if (!this.cardBackgroundOverridden) {
      this.cardBackgroundColorValue = theme.colors.surface;
    }
    if (!this.cardBorderOverridden) {
      this.cardBorderWidthValue = 1.0;
      this.cardBorderColorValue = theme.colors.border;
      this.cardBorderStyleValue = BorderStyle.Solid;
    }
    if (!this.cardCornerRadiusOverridden) {
      this.cardCornerRadiusValue = theme.spacing.md;
    }
    this.applyTheme();
  }

  private applyTheme(): void {
    const theme = activeTheme.value;
    this.overlay.bgColor(this.backdropColorValue);
    this.overlay.backgroundBlur(this.dialogBackgroundBlurSigmaValue);
    this.card.bgColor(this.cardBackgroundColorValue);
    this.card.cornerRadius(this.cardCornerRadiusValue);
    this.card.border(this.cardBorderWidthValue, this.cardBorderColorValue, this.cardBorderStyleValue);
    this.card.dropShadow(
      this.shadowColorValue,
      this.shadowOffsetXValue,
      this.shadowOffsetYValue,
      this.shadowBlurSigmaValue,
      this.shadowSpreadValue,
    );
    this.card.padding(24.0, 24.0, 24.0, 24.0);
    this.titleNode.font(theme.fonts.heading, theme.fonts.sizeHeading);
    this.titleNode.textColor(theme.colors.textPrimary);
    this.bodyNode.font(theme.fonts.body, theme.fonts.sizeBody);
    this.bodyNode.textColor(theme.colors.textMuted);
  }

  private track(disposable: Disposable): void {
    this.disposables.push(disposable);
  }
}
