import { Application } from "../../src/core/Application";
import { __disposeApp, __flushRenders, __runApp } from "../../src/FuiExports";
import { AlignItems, HandleValue, JustifyContent, PointerEventType, Unit } from "../../src/core/ffi";
import { EventRouter } from "../../src/core/EventRouter";
import { ClickEventArgs, Node } from "../../src/core/Node";
import { activeTheme, defaultDarkTheme, defaultLightTheme, useCustomTheme } from "../../src/core/Theme";
import { Button } from "../../src/controls";
import { FlexBox, Text } from "../../src/nodes";
import { Column } from "../../src/nodes/helpers";

let activeFixture: SampleFixture | null = null;

function buildPageForFixture(): Node {
  return activeFixture!.buildPage();
}

class SampleFixture {
  darkMode: bool = true;
  toggleButton: Button | null = null;
  root: FlexBox | null = null;

  constructor() {
    activeFixture = this;
    Application.register((app) => {
      app
        .page(buildPageForFixture)
        .theme(defaultDarkTheme);
    });
  }

  buildPage(): Node {
    const button = new Button("Toggle light / dark");
    button.onClickWith(this, (fixture, _event: ClickEventArgs) => {
      fixture.toggleTheme();
    });
    this.toggleButton = button;
    const centered = new FlexBox()
      .width(100.0, Unit.Percent)
      .height(100.0, Unit.Percent)
      .justifyContent(JustifyContent.Center)
      .alignItems(AlignItems.Center)
      .child(
        Column(
          new Text("Hello EffinDom").fontSize(24.0),
          button,
        ),
      );
    this.root = centered;
    return centered;
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    useCustomTheme(this.darkMode ? defaultDarkTheme : defaultLightTheme);
  }
}

describe("Sample app entrypoint", () => {
  it("runs with centered layout sample and toggles theme from button click", () => {
    EventRouter.reset();
    const fixture = new SampleFixture();

    __runApp();

    expect<bool>(fixture.toggleButton !== null).toBe(true);
    expect<bool>(fixture.root !== null).toBe(true);
    const button = fixture.toggleButton!;
    expect<u64>(button.builtHandle).not.toBe(<u64>HandleValue.Invalid);
    expect<u32>(activeTheme.value.colors.background).toBe(defaultDarkTheme.colors.background);

    button._handlePointerEvent(PointerEventType.Down, 0.0, 0.0, 0);
    button._handlePointerEvent(PointerEventType.Up, 0.0, 0.0, 0);
    __flushRenders();

    expect<u32>(activeTheme.value.colors.background).toBe(defaultLightTheme.colors.background);

    __disposeApp();
    expect<u64>(button.builtHandle).toBe(<u64>HandleValue.Invalid);
    Application.unmount();
  });
});
