import {
  Column,
  FlexBox,
  ScrollBarVisibility,
  ScrollBox,
  SelectionArea,
  Text,
  Theme,
  Unit,
  activeTheme,
} from "../../../../src/Fui";
import {
  DemoScrollBox,
  DemoText,
  DemoTextRecipe,
  demoCardBackground,
} from "../../design-system";
import { ScrollbarGutterBugModel } from "./ScrollbarGutterBugModel";

function verticalSpacer(height: f32): FlexBox {
  return new FlexBox().fillWidth().height(height, Unit.Pixel);
}

export class ScrollbarGutterBugView {
  readonly root: SelectionArea;

  constructor(_model: ScrollbarGutterBugModel) {
    // Inner scroll content — overflows vertically
    const innerContent = new FlexBox().fillWidth();
    for (let i = 0; i < 6; i += 1) {
      const row = new FlexBox()
        .fillWidth()
        .height(48.0, Unit.Pixel)
        .cornerRadius(4.0)
        .bgColor(demoCardBackground(activeTheme.value))
        .child(
          new DemoText("Inner row " + (i + 1).toString(), DemoTextRecipe.Body) as Text,
        ) as FlexBox;
      innerContent.child(row);
      if (i < 5) innerContent.child(verticalSpacer(4.0));
    }

    const innerScrollBox = new DemoScrollBox()
      .nodeId("innerBugScrollBox")
      .scrollEnabledX(false)
      .scrollEnabledY(true)
      .verticalScrollbarVisibility(ScrollBarVisibility.Auto)
      .fillWidth()
      .height(140.0, Unit.Pixel)
      .child(innerContent) as ScrollBox;

    // Content blocks to fill the column
    const innerColumn = Column(
      new DemoText("Scrollbar Gutter Bug Repro", DemoTextRecipe.SectionTitle) as Text,
      verticalSpacer(12.0),
      innerScrollBox,
      verticalSpacer(12.0),
    )
      .fillSize()
      .minWidth(800.0, Unit.Pixel)
      .minHeight(600.0, Unit.Pixel)
      .padding(24.0, 24.0, 24.0, 24.0);

    // Add extra blocks to force outer vertical overflow on shorter windows
    for (let i = 0; i < 8; i += 1) {
      const block = new FlexBox()
        .fillWidth()
        .height(56.0, Unit.Pixel)
        .cornerRadius(4.0)
        .bgColor(demoCardBackground(activeTheme.value))
        .child(
          new DemoText("Block " + (i + 1).toString(), DemoTextRecipe.Body) as Text,
        ) as FlexBox;
      innerColumn.child(block);
      innerColumn.child(verticalSpacer(6.0));
    }

    // Outer ScrollBox — wraps the Column
    const outerScrollBox = new DemoScrollBox()
      .nodeId("outerBugScrollBox")
      .scrollEnabledX(true)
      .scrollEnabledY(true)
      .horizontalScrollbarVisibility(ScrollBarVisibility.Auto)
      .verticalScrollbarVisibility(ScrollBarVisibility.Auto)
      .child(innerColumn)
      .fillSize() as ScrollBox;

    this.root = new SelectionArea()
      .fillSize()
      .child(outerScrollBox) as SelectionArea;
  }

  getRoot(): SelectionArea {
    return this.root;
  }
}
