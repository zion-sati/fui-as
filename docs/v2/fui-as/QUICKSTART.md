# FUI AssemblyScript Quickstart

Use this page to get running quickly, then jump into the SDK docs index for the full reference set.

## 1. Prerequisites

- [Top-level v2 quickstart](../../QUICKSTART.md)

From the repository root:

```bash
npm ci
npx playwright install chromium
```

## 2. Build and run

From the repository root:

```bash
npm run build:v2:browser-bridge
npm run build:v2:fui-as
npm run test:v2:fui-as:integration
npm run serve
```

Open:

```text
http://127.0.0.1:8080/v2/fui-as/index.html
http://127.0.0.1:8080/v2/fui-as/demo/index.html
http://127.0.0.1:8080/v2/fui-as/demo/advanced-controls/
http://127.0.0.1:8080/v2/fui-as/demo/templated-controls/
```

The advanced-controls route includes the live `ProgressBar` + `Worker` sample
for the first-party worker API and the external-drop/file-bridge sample for the
built-in browser file bridge.

## npm package wiring

- runtime package: `@effindomv2/runtime`
- FUI-AS package: `@effindomv2/fui-as`
- FUI-AS browser harness/runtime helpers now consume the runtime package surface
  instead of repo-private browser-bridge source imports.

The canonical scaffold template sources are:

- `v2/create-fui-as-app/templates/hello/**` (`--template hello`)
- `v2/create-fui-as-app/templates/mvc/**` (`--template mvc`)

## Scaffold a new app

```bash
npm create @effindomv2/fui-as-app@latest my-app
cd my-app
npm install
npm run dev
```

To scaffold the two-page MVC starter:

```bash
npm create @effindomv2/fui-as-app@latest my-mvc-app -- --template mvc
```

The MVC scaffold emits route entrypoints under `src/routes/HomeApp.ts` and
`src/routes/SettingsApp.ts`, page MVC slices under `src/routes/home/**` and
`src/routes/settings/**`, and shared route UI helpers under `src/routes/shared/**`.
The single route manifest lives in `src/route-config.ts` and is consumed by the
routed harness, runtime prep, smoke checks, and wasm build helper, so adding a
page usually means updating one file instead of four.
Route `title` drives the browser tab/window title for each shell, and the
optional `routeHead("name", "content", ...)` helper from
`@effindomv2/fui-as/browser/routed-app-conventions` can collect generic
metadata pairs for description, Open Graph, Twitter, canonical, and other
`<head>` tags when needed.
Those controllers use `createManagedApplication(() => new Controller())` via the
shared `ManagedApplicationController` base.

The generated project includes:

1. `src/App.ts` + `src/HelloWorld.ts` hello-world baseline.
2. minimal `harness.ts` + fullscreen `index.html` with `#fui-canvas`.
3. `src/host/host-events.ts` + `src/host/host-services.ts` app-owned bridge definitions with generated bindings under `src/host/generated/*`.
4. `generate:host*`, `dev`, `build`, and `test` scripts with runtime staging and watch rebuilds (`build`/`test` regenerate host bindings automatically).
5. `tsconfig.json` that extends `assemblyscript/std/assembly.json` so `src/**/*.ts` is treated as AssemblyScript in editor/type tooling.

## Debug retained UI

Generated apps emit `buildMode` into runtime config. Debug builds default the
DevTools DOM Mirror to on-requested, and publish/release builds default it to
disabled. Press `Shift+Meta+F12` to open the debug dialog when the mode allows
it, then enable the mirror or Inspect Mode from there.

See [DevTools DOM Mirror](../browser-bridge/DEVTOOLS_DOM_MIRROR.md) for the
console APIs, DOM shape, and override options.

## 3. Public import barrels

Use only the public barrels when authoring apps, demos, or custom controls:

- `./Fui` - default app surface (controls, nodes, theme, file/fetch/workers, timers).
- `./FuiPrimitives` - low-level custom-control primitives (binding callbacks, retained selection/bounds helpers, host-service result-buffer helpers for strings/arrays).
- `./FuiWorker` - worker-side compatibility barrel.
- `./FuiExports` / `./FuiWorkerExports` - runtime ABI export barrels for entrypoints.

For flex layouts, `AlignItems.None` leaves the parent from forcing a cross-axis
alignment value so children can rely on their own `alignSelf(...)` settings.

Do **not** import from internal paths like `src/core/*`, `src/bindings/*`, or
`src/host-services/*` in app/demo code.

## 4. Minimal app entrypoint

```ts
import { Application, Button, Column, Text } from "./Fui";
export * from "./FuiExports";

function buildPage() {
  return Column(
    new Text("Hello EffinDom"),
    new Button("Click me"),
  );
}

Application.register(app => app.page(buildPage));
```

A runnable two-file starter version lives in
`v2/create-fui-as-app/templates/hello/src/App.ts` and
`v2/create-fui-as-app/templates/hello/src/HelloWorld.ts`. It intentionally avoids MVC
for first-run DX; move to an explicit MVC shape once your app grows.
Its harness is intentionally minimal while still wiring app-owned host registries:
`v2/create-fui-as-app/templates/hello/harness.ts` passes `wasmPath`, `hostEvents`, and `hostServices`, while `startHarness(...)` defaults run/ready/error/state/dispose behavior.

### Custom control templates

The public control-templating surface covers `Button`,
`Checkbox`, `RadioButton`, `Switch`, `Slider`, `Dropdown`, `TextInput`, and
`TextArea` through typed presenter/template contracts.

```ts
import {
  BorderStyle,
  Checkbox,
  CheckboxIndicatorPresenter,
  CheckboxIndicatorTemplate,
  CheckboxIndicatorVisualState,
  FlexBox,
  LabeledControlColors,
  PressableIndicatorMetrics,
  Theme,
  Unit,
} from "./Fui";

class CapsuleCheckboxPresenter extends CheckboxIndicatorPresenter {
  private readonly fillNode: FlexBox;

  constructor() {
    const root = new FlexBox()
      .width(24.0, Unit.Pixel)
      .height(24.0, Unit.Pixel)
      .alignItems(1)
      .justifyContent(1);
    super(root, new PressableIndicatorMetrics(24.0, 24.0));
    this.fillNode = new FlexBox()
      .width(10.0, Unit.Pixel)
      .height(10.0, Unit.Pixel);
    root.child(this.fillNode);
  }

  apply(theme: Theme, state: CheckboxIndicatorVisualState, _colors: LabeledControlColors | null = null): void {
    const accent = state.pressed ? theme.colors.accentPressed : theme.colors.accent;
    this.root.cornerRadius(12.0);
    this.root.border(2.0, accent, BorderStyle.Solid);
    this.root.bgColor(theme.colors.surface);
    this.fillNode.bgColor(accent);
    this.fillNode.opacity(state.checkedState == 0 ? 0.0 : 1.0);
  }
}

class CapsuleCheckboxTemplate extends CheckboxIndicatorTemplate {
  create(): CheckboxIndicatorPresenter {
    return new CapsuleCheckboxPresenter();
  }
}

const rememberMe = new Checkbox("Remember me")
  .template(new CapsuleCheckboxTemplate());
```

The same pattern now applies to buttons through `ButtonPresenter` /
`ButtonTemplate`, to sliders through `SliderPresenter`,
`SliderPresenterMetrics`, `SliderTemplate`, and `SliderVisualState`, to
dropdowns through `DropdownFieldTemplate`, `DropdownChevronTemplate`, and
`DropdownOptionRowTemplate`, and to text entry through `TextInputPresenter` /
`TextInputTemplate`, so apps can replace button, slider, dropdown, or text-entry
chrome without rewriting the built-in behavior.

For app-wide defaults, define a `ControlTemplateSet` once at registration time:

```ts
import {
  Application,
  Checkbox,
  Column,
  ControlTemplateSet,
} from "./Fui";

const templates = new ControlTemplateSet();
templates.checkboxIndicator = new CapsuleCheckboxTemplate();

Application.register(app =>
  app
    .controlTemplates(templates)
    .page(() => Column(
      new Checkbox("Remember me"),
      new Checkbox("Stay signed in"),
    ))
);
```

Per-instance setters like `button.template(...)`, `checkbox.template(...)`, and
`textInput.template(...)` still override the app-level default.

For custom theme-driven controls, `bindTheme(owner, handler)` removes the
`activeTheme` boilerplate: it immediately applies the current theme and returns
the disposable subscription you can keep in your normal cleanup bag.

### Custom control lifecycle guidelines (handles and disposal)

When you author custom controls, assume methods can run while a node is
unbuilt (no retained handle yet) or re-invalidated after reset/dispose.
This is intentional architecture (not a bug): the bridge exposes handle phases explicitly, and FUI-AS chooses to keep node objects usable across those phases.

1. Keep control state in fields; do not treat retained handle state as your source of truth.
2. Make mutators state-first: update fields first, then apply retained updates only when built.
3. If subclass code needs retained-only work, guard with `hasBuiltHandle()` and keep unbuilt behavior as no-op/default.
4. Prefer `getBounds()`, `absoluteToLocalPosition(...)`, and `localToAbsolutePosition(...)` for geometry math because they are safe when unbuilt.
5. Treat `dispose()` as the lifecycle cleanup boundary for custom controls and release owned subscriptions/resources there.
6. Do not cache or persist raw handles; rebuild/reset flows can invalidate them while app code continues running.

See [Node handle lifecycle contract (custom controls)](./API_REFERENCE.md#node-handle-lifecycle-contract-custom-controls) for the full architecture rationale.

## 5. Worker entrypoints

Main-thread code and worker modules now share the same authored SDK barrel:
`./Fui`. Use `Worker` on the app side, and `WorkerJob` / `WorkerRuntime`
inside worker entrypoints. Worker entry files should also re-export
`./FuiWorkerExports` so the browser worker bootstrap ABI stays available the
same way app entrypoints re-export `./FuiExports`.

```ts
// main-thread app code
import { Worker } from "./Fui";

Worker.start("processData")
  .onProgress(this, (owner, progress) => { owner.progress = progress; })
  .onComplete(this, (owner, result) => { owner.result = result; })
  .onError(this, (owner, error) => { owner.error = error; })
  .sendString("userId=42");
```

```ts
// src/workers/DataProcessor.ts
export * from "../FuiWorkerExports";

import { WorkerJob } from "../Fui";
import { workerClockWallClockSinceEpochMs } from "../generated/WorkerHostServices";

class ProcessDataJob extends WorkerJob {
  private input: string = "";
  private startedAtMs: f64 = 0.0;
  private deadlineMs: f64 = 0.0;

  protected onStart(): void {
    this.input = this.receiveMessage();
    this.startedAtMs = workerClockWallClockSinceEpochMs();
    this.deadlineMs = this.startedAtMs + 5000.0;
  }

  run(): void {
    if (this.isCancelled()) {
      this.fail("cancelled");
      return;
    }

    const now = workerClockWallClockSinceEpochMs();
    const progress = <i32>(((now - this.startedAtMs) * 100.0) / 5000.0);
    this.reportProgress(progress.toString());

    if (now < this.deadlineMs) {
      this.yield(1000);
      return;
    }

    this.complete(this.input);
  }
}

let processDataJob: ProcessDataJob | null = null;

export function processData(): void {
  if (processDataJob === null) {
    processDataJob = new ProcessDataJob();
  }
  processDataJob = WorkerJob.resume<ProcessDataJob>(processDataJob);
}
```

Worker entry files live under `src/workers/*.ts`. Re-export
`./FuiWorkerExports` from each entry file, then let the FUI-AS build stage:

- `workers/*.wasm`
- `worker-manifest.json`
- `worker-bootstrap.js`

alongside each harness root under `public/v2/fui-as/**`.

Cancellation is cooperative and chunked. The recommended pattern is
`WorkerJob`: keep only a single nullable job reference at module scope, store
in-flight state on instance fields, and return after calling `yield(delayMs)`.
On the next invocation, the same job instance resumes and can check
`isCancelled()` again before continuing work.

Use generated worker host-service bindings for worker-side wall-clock or other
JS-owned data reads. Raw JavaScript APIs like `Date.now()` are not directly
available in AssemblyScript worker code.

## 6. Browser file bridge

`File` is the first-class SDK surface for browser-owned file pick/open,
chunked reads, chunked writes, dropped-file unification, and the
Worker-backed chunk-processing flow.

```ts
import {
  BrowserFile,
  File,
  FileWorkerProcessProgress,
  FileWorkerProcessResult,
} from "./Fui";

class FileCopyController {
  file: BrowserFile | null = null;
  status: string = "idle";

  beginCopy(): void {
    const file = this.file;
    if (file === null) {
      this.status = "drop or pick a file first";
      return;
    }
    File.processFileInWorker(file)
      .saveToPickedFile("copy-" + file.name)
      .chunkBytes(64 * 1024)
      .onProgressWith<FileCopyController>(this, (owner, progress: FileWorkerProcessProgress) => {
        owner.status =
          "copying " +
          progress.processedBytes.toString() +
          " / " +
          progress.totalBytes.toString() +
          " bytes";
      })
      .onCompleteWith<FileCopyController>(this, (owner, result: FileWorkerProcessResult) => {
        owner.status = "copied to " + (result.outputFileName === null ? "(stream)" : result.outputFileName);
      })
      .onErrorWith<FileCopyController>(this, (owner, message) => {
        owner.status = "failed: " + message;
      })
      .start();
  }
}
```

`BrowserFile` is the shared abstraction for both picker/open results and
external drop items. For large-file flows, use chunked reads:

```ts
file.readBytesChunkWith(this, 0, 64 * 1024, (owner, chunk) => {
  owner.status = "read " + chunk.nextOffsetBytes.toString() + " bytes";
});
```

Supported behavior:

- `File.processFileInWorker(file)` is the built-in worker-backed chunk
  processing path
- `.saveToPickedFile(...)` opt-ins the native save-picker sink
- without `.saveToPickedFile(...)`, use `onChunk(...)` to receive worker-read
  chunks back in AssemblyScript for upload/search/indexing-style flows
- arbitrary user-defined binary transforms inside the AssemblyScript
  `Worker` / `WorkerJob` runtime do not support arbitrary user-defined binary
  transforms because that transport is still string-message based

## 7. Browser fetch bridge

`Fetch` is the first-class SDK surface for browser `fetch(...)` calls from
both the main app and AssemblyScript worker modules.

```ts
import { Fetch } from "./Fui";

class UploadController {
  status: string = "idle";

  uploadChunk(bytes: Uint8Array): void {
    Fetch.request("/upload")
      .method("POST")
      .header("Content-Type", "application/octet-stream")
      .bodyBytes(bytes)
      .onCompleteWith<UploadController>(this, (owner, response) => {
        owner.status =
          (response.ok ? "uploaded" : "failed") +
          " (" +
          response.status.toString() +
          " " +
          response.statusText +
          ")";
      })
      .onErrorWith<UploadController>(this, (owner, message) => {
        owner.status = "network error: " + message;
      })
      .start();
  }
}
```

Supported behavior:

- the same API is exported from `./FuiWorker` for worker modules
- the main app and multiple workers can all issue requests concurrently
- Worker support is assumed by the runtime, so fetch does not expose a separate
  worker-availability capability check
- this API returns response metadata only; response-body helpers can
  layer on later without changing the callback model

## 8. JS host services and host events

FUI-AS now has two complementary JS interop paths:

1. **Host services** for synchronous pull-style reads or imperative calls.
2. **Host events** for pushed DOM/shell changes that should call back into
   AssemblyScript when the browser state changes.

The release path is:

1. Define browser-side pull services with `defineHostServices(...)` /
   `hostService(...)`.
2. Define browser-side push events with `defineHostEvents(...)` /
   `hostEvent(...)` when JS should drive callbacks into the app.
3. Generate AssemblyScript bindings with `scripts/generate-host-services.ts`
   and `scripts/generate-host-events.ts`.
4. Pass `hostServices` and/or `hostEvents` into the browser harness config.
5. For worker modules, bundle the worker-side service registry into a
   browser-loadable script and point the harness at that bundle with
   `workerHostServices`.
6. Import the generated wrappers from your app or worker instead of writing raw
   `@external(...)` declarations yourself. Generated wrappers use public
   primitives from `./FuiPrimitives` and should not be rewritten to internal
   imports.

Supported host value types include scalar primitives (`bool`, `i32`, `u32`,
`i64`, `u64`, `f64`, `string`, `void`) plus binary/array payloads (`bytes`,
`i32_array`, `u32_array`, `i64_array`, `u64_array`, `f64_array`).

In this repo, the demo sample lives in:

- `v2/fui-as/demo/src/host-services.ts`
- `v2/fui-as/demo/src/generated/HostServices.ts`
- `v2/fui-as/demo/src/host-events.ts`
- `v2/fui-as/demo/src/generated/HostEvents.ts`
- `v2/fui-as/demo/src/worker-host-services.ts`
- `v2/fui-as/demo/src/generated/WorkerHostServices.ts`
- `v2/fui-as/demo/worker-host-services.ts`

The routed home sample uses the app host-service bindings to show browser-owned
shell data inside AssemblyScript, the dashboard demo uses host events to react
to pushed hue/tick/dark-mode changes from the outer DOM shell, and
`demo/src/workers/advanced_controls_workers.ts` uses the worker bindings for its
wall-clock reads inside a worker module.

## 9. SDK docs map

- [SDK docs index](./SDK_INDEX.md)
- [API reference](./API_REFERENCE.md)
- [Controls and nodes](./CONTROLS_AND_NODES.md)
- [Core layout concept (`width(100%)` vs `fillWidth()`)](./CONTROLS_AND_NODES.md#core-layout-concept)
- [Layout sizing guide (`fill*` vs `Unit.Percent`)](./CONTROLS_AND_NODES.md#layout-sizing-guide-fill-vs-unitpercent)
- [Accessibility and semantics](./ACCESSIBILITY_AND_SEMANTICS.md)
- [Per-type reference](./reference/README.md)
- [Events and callbacks](./EVENTS_AND_CALLBACKS.md)
- [Theming and style matrix](./THEMING_STYLE_MATRIX.md)
- [Keyboard policy](./KEYBOARD_POLICY.md)
- [Overlays and portals](./OVERLAYS_AND_PORTALS.md)
- [Text input behavior guide](./TEXT_INPUT_DESIGN.md)
- [Text input reference](./TEXT_INPUT_REFERENCE.md)

## 10. Keyed persisted state

The routed/browser host provides two persistence layers:

1. **Built-in scroll persistence** for `ScrollView`, `ScrollBox`, and
   `VirtualList` via `nodeId(...).persistScroll()`.
2. **Built-in control persistence** for `Checkbox`, `Switch`, `Slider`,
   `Dropdown`, `RadioGroup`, `TextInput`, and `TextArea` whenever the control
   owns a stable `nodeId(...)`.
3. **User-defined persisted state** via `Node.persistState(...)`.

Restore is intentionally narrow:

- browser **Back/Forward** restores persisted state for the matching history
  entry,
- **duplicated tabs** may restore from the cloned history entry,
- **fresh entry / pasted URL / reload / hard reload** start fresh.

Example built-in control persistence:

```ts
import { Checkbox, Dropdown, DropdownItem, TextArea, Unit } from "./Fui";

const notifications = new Checkbox("Email updates")
  .nodeId("settings-email-updates");

const density = new Dropdown()
  .items([
    new DropdownItem("comfortable", "Comfortable"),
    new DropdownItem("compact", "Compact"),
  ])
  .selectIndex(0)
  .nodeId("settings-density");

const notes = new TextArea()
  .fillWidth()
  .height(180.0, Unit.Pixel)
  .nodeId("settings-notes");
```

The generic API is class-based so it stays AssemblyScript-friendly without
closures:

```ts
import {
  PersistedBoolCodec,
  PersistedValueState,
  SelectionArea,
} from "./Fui";

class PersistedExpandedState extends PersistedValueState<ExpandablePanel, bool> {
  constructor() {
    super("panel-expanded", new PersistedBoolCodec(), 1);
  }

  protected captureValue(node: ExpandablePanel): bool {
    return node.isExpanded;
  }

  protected restoreValue(node: ExpandablePanel, value: bool): void {
    node.setExpanded(value);
  }
}

class ExpandablePanel extends SelectionArea {
  isExpanded: bool = false;

  constructor() {
    super();
    this.nodeId("settings-panel")
      .persistState(new PersistedExpandedState());
  }

  setExpanded(value: bool): void {
    this.isExpanded = value;
  }
}
```

Keep custom persisted payloads small and JSON-safe. Version each adapter, prefer
stable semantic state like selected tabs, expanded sections, draft filters, or
splitter ratios, and avoid runtime-only state like hover, pressed, live focus,
raw handles, or IME composition. Built-in text persistence intentionally skips
password fields.

## Custom drawing, bitmap text, and immediate text

`Bitmap` provides a retained pixel buffer backed by a GPU texture. It can be
edited directly, drawn into with `DrawContext`, and used as an off-screen target
for text rendered through the same HarfBuzz pipeline as retained `Text` and
`RichText`.

```ts
const bmp = new Bitmap(200, 100);

// Direct pixel access
bmp.pixels()[0] = 255;   // red channel of first pixel
bmp.commit();             // upload to GPU

// Canvas drawing
const ctx = bmp.canvas();
ctx.drawRect(0, 0, 50, 50, Paint.fill(rgba(255, 0, 0, 255)));
ctx.flush();
bmp.commit();

// Memory bitmap text with absolute logical placement
const label = new Text("Hello")
  .fontFamily(theme.fonts.bodyFamily)
  .fontSize(24)
  .textColor(rgba(255, 255, 255, 255))
  .width(200).height(100);
label.build();

Bitmap.onTextReady(label, () => {
  bmp.render(label, 12, 32, devicePixelRatio());
  bmp.commit();
});
```

For immediate-mode text in `CustomDrawable.draw(ctx)`, prepare a reusable layout
and draw it once ready:

```ts
const title = TextLayout.text("Revenue")
  .fontFamily(theme.fonts.bodyFamily)
  .fontSize(13)
  .color(rgba(255, 255, 255, 230))
  .onReadyWith(this, (owner, _layout) => owner.markDirty());

const value = DynamicTextLayout.numeric()
  .precision(1)
  .suffix("%")
  .fontFamily(theme.fonts.monoFamily)
  .fontSize(12)
  .color(rgba(255, 255, 255, 230))
  .onReadyWith(this, (owner, _layout) => owner.markDirty());

value.setValue(42.67);

if (title.isReady) ctx.drawTextLayout(title, 16, 24);
if (value.isReady) {
  const m = value.measure();
  ctx.drawRoundRect(12, 40, m.width + 10, 22, 5, 5, Paint.fill(rgba(8, 10, 18, 220)));
  ctx.drawTextLayout(value, 17, 44);
}
```

See [Bitmap](./reference/nodes/Bitmap.md),
[TextLayout](./reference/nodes/TextLayout.md), and
[DynamicTextLayout](./reference/nodes/DynamicTextLayout.md) for details.

Texture sampling is explicit when you need non-default scaling behavior.
Retained images/SVG raster variants and immediate `drawImage(...)` default to
`ImageSampling.linear()`. Use `ImageSampling.nearest()` for pixel art or
`ImageSampling.cubicMitchell()` for higher-quality scaled UI imagery:

```ts
Image.load("/sprites/icon.png")
  .sampling(ImageSampling.nearest());

ctx.drawImage(textureId, 12, 12, 96, 96, ImageSampling.cubicMitchell());
```

## See also

- [v2 architecture positioning](../core/ARCHITECTURE.md#positioning-why-this-is-not-a-game-engine-or-a-mobile-port-runtime)
