import {
  AnimationTiming,
  BorderStyle,
  Column,
  Easings,
  FlexBox,
  FontFace,
  FontFamily,
  FontStack,
  FontWeight,
  NodeTransitions,
  RichText,
  Row,
  ScrollBarVisibility,
  ScrollBox,
  Text,
  Theme,
  Unit,
  activeTheme,
  rgb,
  span,
} from "../../../../src/Fui";
import {
  DemoButton,
  DemoButtonTone,
  DemoCheckbox,
  DemoDropdown,
  DemoDropdownItem,
  DemoScrollBox,
  DemoProgressBar,
  DemoRadioButton,
  DemoRadioGroup,
  DemoText,
  DemoTextRecipe,
  DemoTextArea,
  RoutePageSection,
  applyDemoScrollBoxTheme,
  createRoutePageSection,
  demoCardBackground,
  demoCardBackgroundAlt,
  demoDividerColor,
  demoMutedText,
  demoPrimaryText,
  demoTextRecipeColor,
  demoSharedFontUrl,
} from "../../design-system";

const FONT_REGULAR: u32 = 1;
export const FIXED_LINE_HEIGHT_PX: f32 = 28.0;
export const ANIMATION_SCROLL_ROW_HEIGHT_PX: f32 = 80.0;
const ANIMATION_SCROLL_ROW_COUNT: i32 = 18;
export const ANIMATION_SCROLL_VIEWPORT_HEIGHT_PX: f32 = 280.0;
const ANIMATION_SCROLL_LOGICAL_TAIL_PX: f32 = 240.0;
export const ANIMATION_SCROLL_LOGICAL_CONTENT_HEIGHT_PX: f32 =
  (<f32>ANIMATION_SCROLL_ROW_COUNT * ANIMATION_SCROLL_ROW_HEIGHT_PX) + ANIMATION_SCROLL_LOGICAL_TAIL_PX;

function verticalSpacer(height: f32): FlexBox {
  return new FlexBox().width(100.0, Unit.Percent).height(height, Unit.Pixel);
}

function createFullWidthCheckbox(label: string, checked: bool = false): DemoCheckbox {
  return (checked
    ? new DemoCheckbox(label, true).check(true)
    : new DemoCheckbox(label, true)) as DemoCheckbox;
}

function createStatusText(): Text {
  return new DemoText("", DemoTextRecipe.StatusValue)
    .font(FONT_REGULAR, 15.0) as Text;
}

function createSupportingStatusText(): Text {
  return new DemoText("", DemoTextRecipe.StatusSupporting)
    .font(FONT_REGULAR, 15.0) as Text;
}

function createVerticalPolicyGroup(): DemoRadioGroup {
  return new DemoRadioGroup(true)
    .addOptions([
      new DemoRadioButton("auto", "Vertical scrollbar: Auto", true),
      new DemoRadioButton("always", "Vertical scrollbar: Always", true),
      new DemoRadioButton("never", "Vertical scrollbar: Never", true),
    ])
    .selectIndex(0) as DemoRadioGroup;
}

function createHorizontalPolicyGroup(): DemoRadioGroup {
  return new DemoRadioGroup(true)
    .addOptions([
      new DemoRadioButton("auto", "Horizontal scrollbar: Auto", true),
      new DemoRadioButton("always", "Horizontal scrollbar: Always", true),
      new DemoRadioButton("never", "Horizontal scrollbar: Never", true),
    ])
    .selectIndex(0) as DemoRadioGroup;
}

function createLineHeightGroup(): DemoRadioGroup {
  return new DemoRadioGroup(true)
    .addOptions([
      new DemoRadioButton("normal", "Line height: Normal", true),
      new DemoRadioButton("fixed-28", "Line height: Fixed 28 px", true),
    ])
    .selectIndex(0) as DemoRadioGroup;
}

function createFontModeGroup(): DemoRadioGroup {
  return new DemoRadioGroup(true)
    .addOptions([
      new DemoRadioButton("variable", "Text font: Variable width", true),
      new DemoRadioButton("mono", "Text font: Monospace", true),
    ])
    .selectIndex(0) as DemoRadioGroup;
}

function createVisibilityDropdown(): DemoDropdown {
  return new DemoDropdown()
    .items([
      new DemoDropdownItem("normal", "Visibility: Normal - keep layout reserved and content rendered"),
      new DemoDropdownItem("hidden", "Visibility: Hidden - keep layout reserved but stop painting content"),
      new DemoDropdownItem("collapsed", "Visibility: Collapsed - remove layout space and hide the content"),
    ])
    .selectIndex(0)
    .width(100.0, Unit.Percent) as DemoDropdown;
}

export class AdvancedControlsView {
  readonly textArea: DemoTextArea = new DemoTextArea(
    "Line one\nLine two\nLine three\nLonger content so scrollbar policy is easy to spot.",
  )
    .placeholder("Type notes here or paste sample content. Use the controls below to reconfigure the TextArea live.")
    .width(100.0, Unit.Percent)
    .height(220.0, Unit.Pixel)
    .nodeId("demo-advanced-controls:text-area") as DemoTextArea;
  readonly readOnlyToggle: DemoCheckbox = createFullWidthCheckbox("Read-only")
    .nodeId("demo-advanced-controls:read-only-toggle") as DemoCheckbox;
  readonly wrappingToggle: DemoCheckbox = createFullWidthCheckbox("Wrapping", true)
    .nodeId("demo-advanced-controls:wrapping-toggle") as DemoCheckbox;
  readonly alwaysVerticalToggle: DemoCheckbox = createFullWidthCheckbox("Always show vertical scrollbar")
    .nodeId("demo-advanced-controls:always-vertical-toggle") as DemoCheckbox;
  readonly neverVerticalToggle: DemoCheckbox = createFullWidthCheckbox("Hide vertical scrollbar")
    .nodeId("demo-advanced-controls:never-vertical-toggle") as DemoCheckbox;
  readonly alwaysHorizontalToggle: DemoCheckbox = createFullWidthCheckbox("Always show horizontal scrollbar")
    .nodeId("demo-advanced-controls:always-horizontal-toggle") as DemoCheckbox;
  readonly neverHorizontalToggle: DemoCheckbox = createFullWidthCheckbox("Hide horizontal scrollbar")
    .nodeId("demo-advanced-controls:never-horizontal-toggle") as DemoCheckbox;
  readonly focusStatusText: Text = createStatusText();
  readonly selectionStatusText: Text = createStatusText();
  readonly settingsStatusText: Text = createSupportingStatusText();
  readonly workerProgressBar: DemoProgressBar = new DemoProgressBar(0.0)
    .length(320.0) as DemoProgressBar;
  readonly workerStartButton: DemoButton = new DemoButton("Start prime worker")
    .width(170.0, Unit.Pixel) as DemoButton;
  readonly workerCancelButton: DemoButton = new DemoButton("Cancel prime worker")
    .width(170.0, Unit.Pixel) as DemoButton;
  readonly workerStatusText: Text = createStatusText();
  readonly workerDetailText: Text = createSupportingStatusText();
  readonly verticalPolicyGroup: DemoRadioGroup = createVerticalPolicyGroup()
    .nodeId("demo-advanced-controls:vertical-policy-group") as DemoRadioGroup;
  readonly horizontalPolicyGroup: DemoRadioGroup = createHorizontalPolicyGroup()
    .nodeId("demo-advanced-controls:horizontal-policy-group") as DemoRadioGroup;
  readonly lineHeightGroup: DemoRadioGroup = createLineHeightGroup()
    .nodeId("demo-advanced-controls:line-height-group") as DemoRadioGroup;
  readonly fontModeGroup: DemoRadioGroup = createFontModeGroup()
    .nodeId("demo-advanced-controls:font-mode-group") as DemoRadioGroup;
  readonly visibilityDropdown: DemoDropdown = createVisibilityDropdown()
    .nodeId("demo-advanced-controls:visibility-dropdown") as DemoDropdown;
  readonly textAreaHint: Text = new DemoText(
    "Use the quick toggles for common changes, or the radio groups when you want an exact scrollbar or line-height setting.",
    DemoTextRecipe.Hint,
  )
    .font(FONT_REGULAR, 15.0)
    .maxLines(3) as Text;
  readonly workerHintText: Text = new DemoText(
    "This sample connects the Worker API to a retained ProgressBar. Start runs a 5-second prime search with once-per-second yields; cancel waits for the next yield and then reports cooperative cancellation.",
    DemoTextRecipe.Hint,
  )
    .font(FONT_REGULAR, 15.0)
    .maxLines(4) as Text;
  readonly richTextContainerHintText: Text = new DemoText(
    "Compare container-level typography with a monospace override applied to one span.",
    DemoTextRecipe.Hint,
  )
    .font(FONT_REGULAR, 15.0)
    .maxLines(2) as Text;
  readonly richTextHelperHintText: Text = new DemoText(
    "This example combines helper-span decorations with a color emoji face.",
    DemoTextRecipe.Hint,
  )
    .font(FONT_REGULAR, 15.0)
    .maxLines(2) as Text;
  readonly richTextContainerText!: RichText;
  readonly richTextHelperText!: RichText;
  readonly customFontHeadingText!: Text;
  readonly customFontBodyText!: Text;
  readonly customFontDirectStackText!: Text;
  readonly customFontComparisonText!: Text;
  readonly animationPreviewCard!: FlexBox;
  readonly animationPreviewTitleText!: Text;
  readonly animationPreviewBodyText!: Text;
  readonly animationPreviewCalmButton: DemoButton = new DemoButton("Set calm preview")
    .width(170.0, Unit.Pixel) as DemoButton;
  readonly animationPreviewEmphasisButton: DemoButton = new DemoButton("Emphasize preview card", DemoButtonTone.Primary)
    .width(190.0, Unit.Pixel) as DemoButton;
  readonly animationScrollTopButton: DemoButton = new DemoButton("Scroll to first sample")
    .width(180.0, Unit.Pixel) as DemoButton;
  readonly animationScrollMiddleButton: DemoButton = new DemoButton("Scroll to 7th sample")
    .width(190.0, Unit.Pixel) as DemoButton;
  readonly animationScrollBottomButton: DemoButton = new DemoButton("Scroll to 13th sample", DemoButtonTone.Primary)
    .width(180.0, Unit.Pixel) as DemoButton;
  readonly animationScrollTailButton: DemoButton = new DemoButton("Scroll to logical tail")
    .width(170.0, Unit.Pixel) as DemoButton;
  readonly animationPreviewStatusText: Text = createStatusText();
  readonly animationScrollStatusText: Text = createSupportingStatusText();
  readonly animationHintText: Text = new DemoText(
    "Use the preview buttons to drive typed bgColor/opacity transitions, then jump the retained ScrollBox with scrollToAnimated(...). The logical-tail button proves scrollContentSize(...) can extend the range beyond the mounted subtree.",
    DemoTextRecipe.Hint,
  )
    .font(FONT_REGULAR, 15.0)
    .maxLines(4) as Text;
  readonly animationScrollBox!: ScrollBox;
  readonly animationScrollContent!: FlexBox;
  private readonly animationRowCards: Array<FlexBox> = new Array<FlexBox>();
  private readonly animationRowTitleTexts: Array<Text> = new Array<Text>();
  private readonly animationRowDetailTexts: Array<Text> = new Array<Text>();
  readonly customEmojiFace: FontFace;
  readonly customBodyStack: FontStack;
  readonly customHeadingStack: FontStack;
  readonly proofMonoStack: FontStack;
  readonly proofMonoBoldStack: FontStack;
  readonly customFamily: FontFamily;
  readonly proofMonoFamily: FontFamily;

  constructor() {
    const customEmojiFace = FontFace.load(demoSharedFontUrl("NotoColorEmoji.ttf"));
    const customBodyStack = FontStack.load(demoSharedFontUrl("DejaVuSans.ttf"))
      .fallbackFace(customEmojiFace);
    const customHeadingStack = FontStack.load(demoSharedFontUrl("DejaVuSans-Bold.ttf"))
      .fallbackFace(customEmojiFace);
    const proofMonoStack = FontStack.load(demoSharedFontUrl("NotoSansMono-Regular.ttf")).fallbackFace(customEmojiFace);
    const proofMonoBoldStack = FontStack.load(demoSharedFontUrl("NotoSansMono-Bold.ttf")).fallbackFace(customEmojiFace);
    this.customEmojiFace = customEmojiFace;
    this.customBodyStack = customBodyStack;
    this.customHeadingStack = customHeadingStack;
    this.proofMonoStack = proofMonoStack;
    this.proofMonoBoldStack = proofMonoBoldStack;
    this.customFamily = FontFamily.regularBoldStacks(customBodyStack, customHeadingStack);
    this.proofMonoFamily = FontFamily.regularBoldStacks(proofMonoStack, proofMonoBoldStack);
    this.customFontHeadingText = new DemoText("Custom DejaVu FontStack sample 🌍", DemoTextRecipe.Accent)
      .fontFamily(this.customFamily)
      .fontWeight(FontWeight.Bold)
      .fontSize(22.0) as Text;
    this.customFontBodyText = new DemoText(
      "Load DejaVu Sans through FontStack.load(...), use DejaVu Bold for heavier text, and keep color emoji fallback without dropping to bridge-specific APIs.",
      DemoTextRecipe.Supporting,
    )
      .fontFamily(this.customFamily)
      .fontSize(16.0)
      .maxLines(4) as Text;
    this.customFontDirectStackText = new DemoText("Apply a stack directly: Text.fontStack(customBodyStack, 17) ✨", DemoTextRecipe.Supporting)
      .fontStack(this.customBodyStack, 17.0) as Text;
    this.customFontComparisonText = new DemoText("Bold family resolution stays intact: DejaVu Bold + emoji fallback 😄", DemoTextRecipe.Body)
      .fontFamily(this.customFamily)
      .fontWeight(FontWeight.Bold)
      .fontSize(18.0) as Text;
    this.richTextContainerText = new RichText()
      .fontFamily(this.customFamily)
      .fontWeight(FontWeight.Bold)
      .fontSize(20.0)
      .lineHeight(28.0)
      .maxLines(1)
      .width(100.0, Unit.Percent) as RichText;
    this.richTextHelperText = new RichText()
      .fontFamily(this.customFamily)
      .fontWeight(FontWeight.Bold)
      .fontSize(18.0)
      .lineHeight(26.0)
      .maxLines(1)
      .width(100.0, Unit.Percent) as RichText;
    this.animationPreviewTitleText = new DemoText("Calm transition target", DemoTextRecipe.SectionTitle)
      .font(FONT_REGULAR, 18.0) as Text;
    this.animationPreviewBodyText = new DemoText(
      "Opacity and background transitions stay on the same retained node while the control layer keeps behavior ownership elsewhere.",
      DemoTextRecipe.Supporting,
    )
      .font(FONT_REGULAR, 15.0)
      .maxLines(3) as Text;
    this.animationPreviewCard = new FlexBox()
      .width(100.0, Unit.Percent)
      .height(144.0, Unit.Pixel)
      .padding(20.0, 18.0, 20.0, 18.0)
      .cornerRadius(20.0)
      .child(
        Column(
          this.animationPreviewTitleText,
          verticalSpacer(8.0),
          this.animationPreviewBodyText,
        ).width(100.0, Unit.Percent),
      )
      .transitions(
        new NodeTransitions()
          .bgColor(new AnimationTiming(440.0, Easings.cubicOut))
          .opacity(new AnimationTiming(360.0, Easings.cubicOut)),
      ) as FlexBox;
    const animationScrollContent = new FlexBox()
      .width(100.0, Unit.Percent);
    for (let index = 0; index < ANIMATION_SCROLL_ROW_COUNT; index += 1) {
      const label = "Animation sample row " + (index + 1).toString();
      const title = new DemoText(label, DemoTextRecipe.Body)
        .font(FONT_REGULAR, 16.0) as Text;
      const detail = new DemoText(
        index == ANIMATION_SCROLL_ROW_COUNT - 1
          ? "The final target proves retained smooth scrolling can drive to the far end of the viewport."
          : "Retained content stays pooled and composable while the viewport animates independently.",
        DemoTextRecipe.Hint,
      )
        .font(FONT_REGULAR, 14.0)
        .maxLines(2) as Text;
      const rowCard = new FlexBox()
        .width(100.0, Unit.Percent)
        .height(ANIMATION_SCROLL_ROW_HEIGHT_PX, Unit.Pixel)
        .padding(16.0, 12.0, 16.0, 12.0)
        .cornerRadius(14.0)
        .child(
          Column(
            title,
            verticalSpacer(4.0),
            detail,
          ).width(100.0, Unit.Percent),
        ) as FlexBox;
      animationScrollContent.child(rowCard);
      this.animationRowCards.push(rowCard);
      this.animationRowTitleTexts.push(title);
      this.animationRowDetailTexts.push(detail);
    }
    this.animationScrollContent = animationScrollContent;
    this.animationScrollBox = new DemoScrollBox()
      .scrollEnabledX(false)
      .scrollEnabledY(true)
      .verticalScrollbarVisibility(ScrollBarVisibility.Always)
      .horizontalScrollbarVisibility(ScrollBarVisibility.Never)
      .scrollContentSize(-1.0, ANIMATION_SCROLL_LOGICAL_CONTENT_HEIGHT_PX)
      .width(100.0, Unit.Percent)
      .height(ANIMATION_SCROLL_VIEWPORT_HEIGHT_PX, Unit.Pixel)
      .child(animationScrollContent) as ScrollBox;
    this.wrappingToggle.check(true);
    this.workerDetailText.text("Press Start prime worker to compute primes for 5 seconds in the background.");
    this.setAnimationPreviewState(false, activeTheme.value);
    this.applyTheme(activeTheme.value);
  }

  buildSections(): Array<RoutePageSection> {
    return [
      this.buildTextAreaSection(),
      this.buildAnimationSection(),
      this.buildWorkerSection(),
      this.buildRichTextSection(),
      this.buildCustomFontSection(),
    ];
  }

  applyTheme(theme: Theme): void {
    this.syncRichTextTheme(theme);
    this.syncAnimationTheme(theme);
  }

  setAnimationPreviewState(emphasized: bool, theme: Theme): void {
    this.animationPreviewTitleText.text(emphasized ? "Emphasized transition target" : "Calm transition target");
    this.animationPreviewBodyText.text(
      emphasized
        ? "The preview card now drives both opacity and background transitions together from one typed slot set."
        : "Opacity and background transitions stay on the same retained node while the control layer keeps behavior ownership elsewhere.",
    );
    this.animationPreviewCard
      .bgColor(emphasized ? theme.colors.accentHovered : demoCardBackground(theme))
      .opacity(emphasized ? 1.0 : 0.7);
  }

  private buildTextAreaSection(): RoutePageSection {
    const checkboxColumn = Column(
      this.readOnlyToggle,
      verticalSpacer(8.0),
      this.wrappingToggle,
      verticalSpacer(8.0),
      this.alwaysVerticalToggle,
      verticalSpacer(8.0),
      this.neverVerticalToggle,
      verticalSpacer(8.0),
      this.alwaysHorizontalToggle,
      verticalSpacer(8.0),
      this.neverHorizontalToggle,
    )
      .width(0.0, Unit.Pixel)
      .flexGrow(1.0);

    const policyColumn = Column(
      this.verticalPolicyGroup,
      verticalSpacer(12.0),
      this.horizontalPolicyGroup,
      verticalSpacer(12.0),
      this.lineHeightGroup,
      verticalSpacer(12.0),
      this.fontModeGroup,
      verticalSpacer(12.0),
      this.visibilityDropdown,
    )
      .width(0.0, Unit.Pixel)
      .flexGrow(1.0);

    const body = Column(
      this.textArea,
      verticalSpacer(14.0),
      this.textAreaHint,
      verticalSpacer(14.0),
      Row(
        checkboxColumn,
        new FlexBox().width(18.0, Unit.Pixel).height(1.0, Unit.Pixel),
        policyColumn,
      ).width(100.0, Unit.Percent),
      verticalSpacer(14.0),
      this.focusStatusText,
      verticalSpacer(6.0),
      this.selectionStatusText,
      verticalSpacer(6.0),
      this.settingsStatusText,
    ).width(100.0, Unit.Percent);

    return createRoutePageSection(
      "Advanced controls",
      "Configure a TextArea live to explore wrapping, read-only mode, scrollbar policy, line height, font family, and visibility.",
      body,
    );
  }

  private buildAnimationSection(): RoutePageSection {
    const previewButtonRow = Row(
      this.animationPreviewCalmButton,
      new FlexBox().width(12.0, Unit.Pixel).height(1.0, Unit.Pixel),
      this.animationPreviewEmphasisButton,
    ).width(100.0, Unit.Percent);
    const scrollButtonRow = Row(
      this.animationScrollTopButton,
      new FlexBox().width(12.0, Unit.Pixel).height(1.0, Unit.Pixel),
      this.animationScrollMiddleButton,
      new FlexBox().width(12.0, Unit.Pixel).height(1.0, Unit.Pixel),
      this.animationScrollBottomButton,
    ).width(100.0, Unit.Percent);
    const logicalTailButtonRow = Row(
      this.animationScrollTailButton,
    ).width(100.0, Unit.Percent);
    const sectionBody = Column(
      this.animationPreviewCard,
      verticalSpacer(14.0),
      previewButtonRow,
      verticalSpacer(14.0),
      this.animationScrollBox,
      verticalSpacer(14.0),
      scrollButtonRow,
      verticalSpacer(10.0),
      logicalTailButtonRow,
      verticalSpacer(10.0),
      this.animationPreviewStatusText,
      verticalSpacer(6.0),
      this.animationScrollStatusText,
      verticalSpacer(10.0),
      this.animationHintText,
    ).width(100.0, Unit.Percent);
    return createRoutePageSection(
      "Transitions + scroll surfaces",
      "Drive the shipped animation APIs live: typed bgColor/opacity transitions plus smooth scroll and explicit scroll-content sizing on a retained ScrollBox.",
      sectionBody,
    );
  }

  private buildCustomFontSection(): RoutePageSection {
    const sectionBody = Column(
      this.customFontHeadingText,
      verticalSpacer(10.0),
      this.customFontBodyText,
      verticalSpacer(10.0),
      this.customFontDirectStackText,
      verticalSpacer(8.0),
      this.customFontComparisonText,
    ).width(100.0, Unit.Percent);

    return createRoutePageSection(
      "App-authored custom fonts",
      "Use FontStack.load(...) and FontFamily helpers to register app-authored fonts with emoji-capable fallback.",
      sectionBody,
    );
  }

  private syncRichTextTheme(theme: Theme): void {
    const primary = demoTextRecipeColor(theme, DemoTextRecipe.Body);
    this.richTextContainerText
      .textColor(primary)
      .fragmentsValue([
        span("Base family ").underline().color(primary),
        span("with ").color(primary),
        span("MONO OVERRIDE")
          .fontFamily(this.proofMonoFamily)
          .strikethrough(),
      ]);
    this.richTextHelperText
      .textColor(primary)
      .fragmentsValue([
        span("Rich ").bold().color(primary),
        span("text ").italic().color(rgb(96, 165, 250)),
        span("underline ").underline().color(rgb(251, 191, 36)),
        span("strike ").strikethrough().color(rgb(248, 113, 113)),
        span("emoji- ")
          .bgColor(rgb(30, 41, 59))
          .color(rgb(167, 243, 208)),
        span("😄")
          .fontFamily(FontFamily.withRegularFace(this.customEmojiFace))
          .bgColor(rgb(30, 41, 59))
          .color(rgb(167, 243, 208)),
        span(" ")
          .bgColor(rgb(30, 41, 59))
          .color(rgb(167, 243, 208)),
        span("helpers").bold().italic().underline().strikethrough().color(rgb(203, 213, 225)),
      ]);
  }

  private syncAnimationTheme(theme: Theme): void {
    this.animationPreviewTitleText.textColor(demoPrimaryText(theme));
    this.animationPreviewBodyText.textColor(demoMutedText(theme));
    this.animationPreviewCard.border(1.0, demoDividerColor(theme), BorderStyle.Solid);
    applyDemoScrollBoxTheme(changetype<ScrollBox>(this.animationScrollBox), theme);
    for (let index = 0; index < this.animationRowCards.length; index += 1) {
      const rowCard = unchecked(this.animationRowCards[index]);
      const rowTitle = unchecked(this.animationRowTitleTexts[index]);
      const rowDetail = unchecked(this.animationRowDetailTexts[index]);
      rowCard
        .bgColor((index & 1) == 0 ? demoCardBackground(theme) : demoCardBackgroundAlt(theme))
        .border(1.0, demoDividerColor(theme), BorderStyle.Solid);
      rowTitle.textColor(demoPrimaryText(theme));
      rowDetail.textColor(demoMutedText(theme));
    }
  }

  private buildWorkerSection(): RoutePageSection {
    const buttonRow = Row(
      this.workerStartButton,
      new FlexBox().width(12.0, Unit.Pixel).height(1.0, Unit.Pixel),
      this.workerCancelButton,
    ).width(100.0, Unit.Percent);

    const sectionBody = Column(
      this.workerProgressBar,
      verticalSpacer(12.0),
      buttonRow,
      verticalSpacer(10.0),
      this.workerStatusText,
      verticalSpacer(6.0),
      this.workerDetailText,
      verticalSpacer(10.0),
      this.workerHintText,
    ).width(100.0, Unit.Percent);

    return createRoutePageSection(
      "ProgressBar + Worker sample",
      "Use a determinate ProgressBar to visualize background work without dropping to raw Web Worker APIs.",
      sectionBody,
    );
  }

  private buildRichTextSection(): RoutePageSection {
    const sectionBody = Column(
      this.richTextContainerText,
      verticalSpacer(10.0),
      this.richTextContainerHintText,
      verticalSpacer(16.0),
      this.richTextHelperText,
      verticalSpacer(10.0),
      this.richTextHelperHintText,
    ).width(100.0, Unit.Percent);

    return createRoutePageSection(
      "Static rich text",
      "Use helper spans to compose inline static styling, and use RichText container defaults when you want the same font family, weight, size, or color across the whole object.",
      sectionBody,
    );
  }
}
