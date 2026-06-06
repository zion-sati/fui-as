# FUI-AS Quickstart

This is the full walkthrough for building apps with FUI-AS. The
[README](../README.md) covers the 30-second version — this covers everything
else: project structure, the MVC template, theming, state, controls, and common
patterns.

If you want to work **on the SDK itself**, see
[CONTRIBUTING.md](../CONTRIBUTING.md) instead.

---

## Prerequisites

- **Node.js 24+** and npm
- That's it. The scaffolder handles everything else.

---

## Create a new app

### Simple template

Two files. Good for small tools, prototypes, and learning the API.

```bash
npx @effindomv2/create-fui-as-app my-app
cd my-app
npm install
npm run dev
```

Open `http://localhost:8080`. The dev server watches for changes and
recompiles in the background.

### MVC template

Structured for real apps — multiple pages, routing, explicit separation of
concerns.

```bash
npx @effindomv2/create-fui-as-app my-app --template mvc
cd my-app
npm install
npm run dev
```

---

## Simple template — what you get

```
my-app/
  App.ts          — entry point, registers the app
  HelloWorld.ts   — your first page
  index.html      — shell (you rarely touch this)
  harness.ts      — runtime bridge wiring
  package.json
```

**App.ts** is the entry point. It registers your app with the runtime:

```ts
import { Application } from "@effindomv2/fui-as";
export * from "@effindomv2/fui-as/FuiExports";

import { createHelloWorldPage } from "./HelloWorld";

Application.register((app) => app.page(createHelloWorldPage));
```

**HelloWorld.ts** builds and returns your UI tree:

```ts
import { Button, Column, Text, Unit } from "@effindomv2/fui-as";

export function createHelloWorldPage() {
  return Column(
    new Text("Hello EffinDom").fontSize(24.0),
    new Button("Click me"),
  );
}
```

There is no JSX, no HTML template, no virtual DOM. The layout tree is built
directly in AssemblyScript and compiled to WebAssembly.

---

## Adding state

FUI-AS uses an owner-callback pattern for stateful controls. The `onClickWith`
method passes a typed owner reference into the callback so you don't close
over mutable state:

```ts
class CounterPage {
  private count: i32 = 0;
  private readonly label: Text = new Text("Clicked 0 times").fontSize(20.0);

  build(): SelectionArea {
    const button = new Button("Click me")
      .onClickWith<CounterPage>(this, (owner) => {
        owner.count += 1;
        owner.label.text(
          "Clicked " + owner.count.toString() + " time" +
          (owner.count == 1 ? "" : "s")
        );
      });

    return new SelectionArea()
      .fillWidth()
      .fillHeight()
      .child(Column(this.label, button));
  }
}

export function createCounterPage(): SelectionArea {
  return new CounterPage().build();
}
```

---

## Theming

Apply a theme at the app level in `App.ts`:

```ts
import {
  Application,
  defaultDarkTheme,
  defaultLightTheme,
  useCustomTheme,
} from "@effindomv2/fui-as";

let darkMode = true;

export function toggleTheme(): void {
  darkMode = !darkMode;
  useCustomTheme(darkMode ? defaultDarkTheme : defaultLightTheme);
}

Application.register((app) =>
  app.page(createPage).theme(defaultDarkTheme)
);
```

The theme flows down the entire retained tree automatically — no prop
drilling, no context providers.

---

## Layout

FUI-AS uses Yoga flexbox under the hood. The API maps closely to SwiftUI's
layout model:

```ts
import {
  AlignItems,
  FlexBox,
  JustifyContent,
  Unit,
} from "@effindomv2/fui-as";

const centeredBox = new FlexBox()
  .width(100.0, Unit.Percent)
  .height(100.0, Unit.Percent)
  .justifyContent(JustifyContent.Center)
  .alignItems(AlignItems.Center)
  .child(
    Column(
      new Text("Centred content"),
      new Button("Action"),
    )
  );
```

**`fillWidth()` vs `width(100.0, Unit.Percent)`** — these are not the same.
`fillWidth()` expands to fill available space in the parent's cross axis.
`width(100.0, Unit.Percent)` sets a percentage of the parent's explicit width.
Use `fillWidth()` when you want the node to stretch; use `width(100%)` when
the parent has an explicit size you want to match.

---

## MVC template — what you get

The MVC template scaffolds a structured project with routing between pages:

```
my-app/
  App.ts                  — entry point with router registration
  pages/
    HomePage.ts           — page 1
    SettingsPage.ts       — page 2
  models/                 — your data/state layer
  controllers/            — your logic layer
  index.html
  harness.ts
  package.json
```

Each page is a self-contained class that builds and returns its UI tree.
The router in `App.ts` maps route names to page builders:

```ts
Application.register((app) =>
  app
    .route("/", createHomePage)
    .route("/settings", createSettingsPage)
    .theme(defaultDarkTheme)
);
```

Navigation between pages:

```ts
import { navigate } from "@effindomv2/fui-as";

new Button("Go to settings").onClick(() => navigate("/settings"));
```

---

## Common controls reference

| Control | Notes |
|---|---|
| `new Text("hello")` | Static label. `.fontSize()`, `.textAlign()`, `.width()` |
| `new Button("label")` | `.onClick()`, `.onClickWith()`, `.margin()` |
| `new TextInput()` | Single-line input. `.placeholder()`, `.onChange()` |
| `new TextArea()` | Multi-line. Supports monospaced/variable, wrap/no-wrap, scrollbar states |
| `new Checkbox()` | `.checked()`, `.onChange()` |
| `new RadioButton()` | `.selected()`, `.onChange()` |
| `Column(...children)` | Vertical flex layout |
| `Row(...children)` | Horizontal flex layout |
| `new FlexBox()` | Full flexbox control |
| `new SelectionArea()` | Scrollable container with selection support |
| `new Dialog()` | Modal overlay with Accept/Cancel wiring |
| `new VirtualList()` | Fixed-height virtualised list for large datasets |

Full control docs: **[Controls & Nodes](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/CONTROLS_AND_NODES.md)**

---

## Build commands

```bash
npm run dev          # dev server with watch + recompile
npm run build        # production build
npm run typecheck    # type-check without full build
```

---

## Next steps

- **[API Reference](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/API_REFERENCE.md)**
- **[Control Customization](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/CONTROL_CUSTOMIZATION.md)** — sizing, colors, templating
- **[Theming & Style Matrix](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/THEMING_STYLE_MATRIX.md)**
- **[Accessibility & Semantics](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/ACCESSIBILITY_AND_SEMANTICS.md)**
- **[Events & Callbacks](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/EVENTS_AND_CALLBACKS.md)**
- **[Live demo source](https://github.com/zion-sati/fui-as-demo)** — a real multi-page MVC app using the full control set
