# EffinDom FUI-AS

> **Build WPF/SwiftUI-grade web apps in AssemblyScript. No DOM. No CSS. No virtual DOM diffing.**

FUI-AS is the flagship SDK for the [EffinDom](https://github.com/zion-sati/EffinDOM) display server. You write TypeScript-style AssemblyScript — typed, compiled to WebAssembly, running against a retained-mode C++ rendering engine.

If you've ever used SwiftUI and then gone back to React, you already know the feeling this is trying to fix.

**[→ Live demo](https://fui-as-demo.effindom.dev/)** *(best viewed on desktop)*

https://github.com/user-attachments/assets/cf2fef0e-34b0-4d1d-8f98-2ee45262ede6

---

## Quickstart

```bash
npx @effindomv2/create-fui-as-app my-app
cd my-app
npm install
npm run dev
```

You'll have a running EffinDom app at `http://localhost:8080`. For the MVC starter with routing:

```bash
npx @effindomv2/create-fui-as-app my-app --template mvc
```

---

## A minimal app

Two files. No config. No HTML to touch.

```ts
// App.ts
import { Application } from "@effindomv2/fui-as";
export * from "@effindomv2/fui-as/FuiExports";

import { createHelloWorldPage } from "./HelloWorld";

Application.register((app) => app.page(createHelloWorldPage));
```

```ts
// HelloWorld.ts
import { Button, Column, Text } from "@effindomv2/fui-as";

export function createHelloWorldPage() {
  return Column(
    new Text("Hello EffinDom").fontSize(24.0),
    new Button("Click me"),
  );
}
```

For a fuller example with state, theming, and multiple controls — see the
[hello-world scaffold source](https://github.com/zion-sati/create-fui-as-app)
or the [live demo source](https://github.com/zion-sati/fui-as-demo/fui-as-demo-source).

---

## Why this exists

The DOM was a 1995 document viewer that accidentally became the world's
application platform. Every framework since — React, Svelte, Vue — has been
working around that original mismatch, not fixing it.

EffinDom treats the browser as a **display server**: a hardware abstraction
layer for GPU, input, fonts, and networking. All UI architecture lives in
compiled, retained-mode WebAssembly runtimes. FUI-AS is how you write apps
against that runtime.

The result in practice:

- **~228 KB app payload** — the multi-megabyte engine is content-hashed,
  CDN-cached, and shared across every EffinDom app a user visits
- **60/120 FPS retained rendering** — no reconciler, no layout thrash, no
  diffing
- **Real typography** — HarfBuzz + ICU for full international text shaping,
  BiDi, RTL, emoji, surgical font subset injection
- **Accessibility out of the box** — semantic tree projected through the
  browser bridge; screen readers, password managers, and devtools work without
  extra wiring
- **SwiftUI-style fluent API** — declarative chaining, no compiler plugins
  required

[→ Full story: Why EffinDom](./WHY_FUI_EFFINDOM.md) ·
[→ Who is zion-sati?](./WHO_IS_ZION_SATI.md)

---

## What ships today

Every item below is in the SDK now unless marked *(roadmap)*.

### 📦 The Web DLL — Distributed Network & Deploy Layer

This is the core architectural differentiator. Flutter bundles its engine into
every app. egui does the same. EffinDom doesn't — the runtime lives on the CDN,
cached forever, shared across every EffinDom app the user visits.

- **Web DLL Split Architecture** — Tier 1 and Tier 2 are completely separate,
  immutable WebAssembly modules. Cached globally, shared across all apps.
  Visit ten EffinDom apps — download the engine once.
- **Tiny App Footprint** — The runtime is cached once globally. Your app payload
  is just your business logic. Hello-world scaffold: **~228 KB**. Real apps land
  in the low hundreds. Sub-second Time-To-Interactive.
- **Zero-Cost Edge Delivery** — The entire compilation and rendering loop runs
  client-side. No server required. Infinite scaling via static CDNs.
- **Content-Hashed JSON Manifest** — Runtimes are mapped via cryptographic
  content hashes. Perfect cache invalidation without ever breaking CDN
  residency.
- **Adaptive 4-Flavour Compilation** — Automatically selects the right build:
  wasm64+SIMD, wasm64, wasm32+SIMD, wasm32. Every user gets the fastest binary
  their hardware supports.
- **Hermetic NPM Bundling** — The entire 4-flavour matrix and content-hashed
  manifest are bundled inside the npm package. Fully self-contained builds
  behind strict firewalls, no external CDN calls required.
- **Native Fetch Pipeline** — Reactive REST/HTTP networking (GET, POST, PUT,
  DELETE) baked directly into the WebAssembly runtime core.

### 💾 Automated State Persistence

- **Opt-In Named Node Tracking** — Assign an ID to any layout node and get
  automatic lifecycle state tracking with zero boilerplate.
- **Zero-Friction Scroll & Component Preservation** — Scroll positions, input
  data, and layout configurations are automatically serialized to IndexedDB in
  the background while the user works.
- **Seamless Back/Forward Navigation** — No canvas amnesia. Browser back and
  forward buttons instantly restore the exact retained state into the Tier 2
  engine — no re-fetch, no re-render from scratch.

### 🎨 High-Fidelity Rendering & UI Primitives

- **Retained-Mode Ergonomics, Immediate-Mode Power** — A full retained scene
  graph with state tracking, without the overhead of a virtual DOM reconciler.
- **Direct Pixel-Level Bitmaps** — WPF/Avalonia-style writeable bitmaps written
  pixel-by-pixel directly to GPU textures for low-latency custom rendering.
- **Native SVG Parsing** — Vector graphics parsed and rendered natively, no
  HTML required.
- **Transparent PNG & Custom Bitmaps** — Full alpha-channel image support and
  custom bitmap drawings.
- **SwiftUI-Inspired Fluent Syntax** — Declarative chaining API across all
  controls and layout nodes. No custom compiler plugins required.
- **Implicit & Explicit Transitions** — Structural animation interpolation
  handled inside the WebAssembly loop, not in JavaScript.
- **Fixed-Height Virtual Lists** — Render tens of thousands of items at a locked
  60/120 FPS with structural element virtualisation.
- **Native Dialog Modals** — Declarative overlay system with automatic,
  layout-aware Accept/Cancel button assignments.

### 🔤 Advanced Typography & Linguistic Engine

- **Global ICU Engine** — Complete international text shaping, character
  attributes, and complex script support.
- **Built-In RTL Foundation** — HarfBuzz and ICU handle Right-to-Left and BiDi
  layout rules natively at the Tier 2 level.
- **Real-Time Glyph Caching** — Characters rendered to a reusable texture atlas.
  No per-frame vector recalculation.
- **Perfect Pixel Crispness** — Subpixel anti-aliasing intentionally disabled.
  Razor-sharp text at any scale, no colour fringing on modern displays.
- **On-Demand Tofu Font Swapping** — Real-time stream analysis catches missing
  Unicode coverage as text flows in.
- **Surgical Subset Injection** — Fetches only the specific missing characters,
  not multi-megabyte language font files.
- **Cross-Boundary Text Selection** — Real-time hit-testing for native-feeling
  highlight, drag, and copy across text node boundaries.

### 🖱️ Native Browser Fidelity & OS Integration

- **Lock-Step System Theme Interpolation** — Captures granular OS theme shift
  values (including macOS dynamic appearance) and transitions colours in
  frame-by-frame synchronisation.
- **Custom In-App Find Engine** — Built-in Ctrl+F / ⌘F interception that fires
  a native canvas search dialog across all text nodes.
- **External File Drop Targets** — Browser-level file and object drops routed
  directly into the canvas event system.
- **Context-Aware Right-Click Menus** — Layout and actions adapt to the specific
  AST node under the cursor.
- **Desktop-Grade Navlinks** — Hover over a link, get a browser-style URL
  preview at the bottom of the viewport.
- **Mobile Touch Gesture Engines** — Physics-driven pull-to-refresh and fling
  scrolling out of the box.

### 🌐 Accessibility & Interoperability

- **Out-of-the-Box Semantic Tree** — Auto-generates an ARIA-compliant hidden
  HTML mirror perfectly synced to GPU coordinates. Screen readers, password
  managers, and browser devtools work without any extra wiring.
- **Pre-Defined Semantic Roles** — Built-in role matrix maps every control
  accurately to native assistive technologies.
- **Granular Semantic Overrides** — Every semantic label overridable at the
  individual component level for complex layouts.
- **Full Search Engine Visibility** — Web crawlers read canvas text natively via
  the semantic tree.
- **Automatic CPU Software Fallback** — Transparently downgrades to a CPU
  renderer when WebGL is unavailable — VMs, headless CI, strict environments.
- **Anti-Fingerprint Block Resiliency** — WebGL setup hooks safely bypass strict
  browser privacy blocks without crashing.

### 🛠️ Controls

Button, Text, TextInput, TextArea (monospaced/variable, wrap/no-wrap, scrollbar
states), Checkbox, RadioButton, SelectionArea, Column, Row, FlexBox, Dialog,
VirtualList, RichText, ContextMenu, and more.

---

## SDK reference

- **[SDK Docs Index](./docs/v2/fui-as/SDK_INDEX.md)**
- **[API Reference](./docs/v2/fui-as/API_REFERENCE.md)**
- **[Controls & Nodes](./docs/v2/fui-as/CONTROLS_AND_NODES.md)**
- **[Control Customization](./docs/v2/fui-as/CONTROL_CUSTOMIZATION.md)** — sizing, colors, templating
- **[Events & Callbacks](./docs/v2/fui-as/EVENTS_AND_CALLBACKS.md)**
- **[Theming & Style Matrix](./docs/v2/fui-as/THEMING_STYLE_MATRIX.md)**
- **[Accessibility & Semantics](./docs/v2/fui-as/ACCESSIBILITY_AND_SEMANTICS.md)**
- **[Keyboard Policy](./docs/v2/fui-as/KEYBOARD_POLICY.md)**
- **[Overlays & Portals](./docs/v2/fui-as/OVERLAYS_AND_PORTALS.md)**
- **[Text Input Design](./docs/v2/fui-as/TEXT_INPUT_DESIGN.md)**
- **[Full Quickstart walkthrough](./docs/v2/fui-as/QUICKSTART.md)**

---

## Repos

| Repo | Purpose |
|---|---|
| **[fui-as](https://github.com/zion-sati/fui-as)** | This repo — AssemblyScript SDK |
| **[EffinDOM](https://github.com/zion-sati/EffinDOM)** | Runtime, engine, browser bridge, docs |
| **[create-fui-as-app](https://github.com/zion-sati/create-fui-as-app)** | `npx` scaffolder |

Working on the SDK itself? See **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

---

## Limitations

EffinDom is early. The first release targets **desktop web apps**. Touch input
is handled at the routing level, but mobile gesture recognition isn't polished
yet. The demo app was built for desktop screens — if you open it on a phone it
will work but it won't look great. Desktop-first, web-native.

**Bus factor: 1.** This is a solo project built at night and on weekends. See
the license section below.

---

## License

| Package | License |
|---|---|
| `@effindomv2/runtime` | MIT |
| `@effindomv2/fui-as` | AGPL-3.0-only or commercial |
| `@effindomv2/create-fui-as-app` | MIT |

The runtime is MIT — no restrictions. The SDK is AGPL-3.0 because I'm a solo
maintainer with a young family, building this after hours. AGPL means you can
use it, study it, and modify it freely — but if you ship a commercial product
built on it, you either open-source that product or purchase a commercial
license. That's how this project stays alive.

If you're building something commercial, the license exists — it directly funds
continued development. See [`COMMERCIAL.md`](./COMMERCIAL.md) for details.
