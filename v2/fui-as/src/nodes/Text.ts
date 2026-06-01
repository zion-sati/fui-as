import { SemanticRole } from "../core/ffi";
import { FontFamily } from "../core/Typography";
import { TextCore, TextProps } from "./TextCore";

export { TextProps } from "./TextCore";

export class Text extends TextCore {
  constructor(content: string = "") {
    super(content);
    this.selectable();
  }

  static from(props: TextProps): Text {
    const text = new Text(props.content);
    if (props.hasWidth) {
      text.width(props.widthValue, props.widthUnit);
    }
    if (props.hasFillWidth) {
      text.fillWidth();
    }
    if (props.hasHeight) {
      text.height(props.heightValue, props.heightUnit);
    }
    if (props.hasFillHeight) {
      text.fillHeight();
    }
    if (props.hasFontFamily) {
      const family = props.fontFamilyValue;
      if (family !== null) {
        text.fontFamily(changetype<FontFamily>(family));
      }
    }
    if (props.hasFont && props.hasFontFamily) {
      text.fontSize(props.fontSize);
    } else if (props.hasFont) {
      text.font(props.fontId, props.fontSize);
    }
    if (props.hasFontWeight) {
      text.fontWeight(props.fontWeightValue);
    }
    if (props.hasFontStyle) {
      text.fontStyle(props.fontStyleValue);
    }
    if (props.hasLineHeight) {
      text.lineHeight(props.lineHeightValue);
    }
    if (props.hasColor) {
      text.textColor(props.color);
    }
    if (props.hasTextAlign) {
      text.textAlign(props.textAlignValue);
    }
    if (props.hasVerticalAlign) {
      text.verticalAlign(props.verticalAlignValue);
    }
    if (props.hasLimits) {
      text.textLimits(props.maxChars, props.maxLines);
    }
    if (props.hasOverflow) {
      text.overflow(props.overflowValue);
    }
    if (props.hasOverflowFade) {
      text.overflowFade(props.overflowFadeHorizontalValue, props.overflowFadeVerticalValue);
    }
    if (props.hasObscured) {
      text.obscured(props.obscuredValue);
    }
    if (props.hasEditable) {
      text.editable(props.editableValue);
    }
    if (props.hasCaretColor) {
      text.caretColor(props.caretColorValue);
    }
    if (props.hasSelectable) {
      text.selectable(props.selectableValue, props.selectionColor);
    }
    return text;
  }

  text(content: string): this {
    super.text(content);
    this.syncDefaultSemantics();
    return this;
  }

  overflowFade(horizontal: bool = true, vertical: bool = false): this {
    this.setOverflowFade(horizontal, vertical);
    return this;
  }

  semanticLabel(label: string): this {
    if (!this.hasExplicitSemanticRole()) {
      this.setDefaultSemanticRole(SemanticRole.StaticText);
    }
    super.semanticLabel(label);
    return this;
  }

  build(): u64 {
    this.syncDefaultSemantics();
    return super.build();
  }

  _handleTextChanged(text: string): void {
    super._handleTextChanged(text);
    this.syncDefaultSemantics();
  }

  _handleTextReplaced(start: u32, end: u32, text: string): void {
    super._handleTextReplaced(start, end, text);
    this.syncDefaultSemantics();
  }

  protected onRetainedParentChanged(): void {
    this.syncDefaultSemantics();
  }

  private syncDefaultSemantics(): void {
    if (this.hasExplicitSemanticRole()) {
      this.clearDefaultSemanticLabel();
      this.clearDefaultSemanticRole();
      return;
    }
    if (this.hasExplicitSemanticLabel()) {
      this.clearDefaultSemanticLabel();
      this.setDefaultSemanticRole(SemanticRole.StaticText);
      return;
    }
    if (!this.shouldApplyDefaultSemantics()) {
      this.clearDefaultSemanticLabel();
      this.clearDefaultSemanticRole();
      return;
    }
    this.setDefaultSemanticRole(SemanticRole.StaticText);
    this.setDefaultSemanticLabel(this.content);
  }

  private shouldApplyDefaultSemantics(): bool {
    if (this.content.length == 0) {
      return false;
    }
    let ancestor = this.parentNode;
    while (ancestor !== null) {
      if (ancestor._resolvedSemanticRole() != SemanticRole.None) {
        return false;
      }
      ancestor = ancestor.parentNode;
    }
    return true;
  }
}
