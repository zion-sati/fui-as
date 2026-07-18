# EffinDom FUI-AS

> **Build WPF/SwiftUI-grade web apps in AssemblyScript. No DOM. No CSS. No virtual DOM diffing.**

FUI-AS is the flagship SDK for the [EffinDom](https://github.com/zion-sati/EffinDOM) display server. You write TypeScript-style AssemblyScript — typed, compiled to WebAssembly, running against a retained-mode C++ rendering engine.

If you've ever used SwiftUI and then gone back to React, you already know the feeling this is trying to fix.

**[→ Live demo](https://fui-as-demo.effindom.dev/)** *(works on mobile too — pinch-to-zoom and long press NOW supported)*

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

## A minimal hello world app

```ts
import { Button, SelectionArea, Text } from "./Fui";

class HelloWorld {
  private count: i32 = 0;
  private readonly label: Text;

  constructor() {
    this.label = new Text("Clicked 0 times");
  }

  buildPage(): SelectionArea {
    return new SelectionArea()
      .fillWidth()
      .fillHeight()
      .child(
        new Button("Click me").onClickWith<HelloWorld>(this, (owner) => {
          owner.count += 1;
          owner.label.text(
            "Clicked " + owner.count.toString() + " time" +
            (owner.count == 1 ? "" : "s"),
          );
        }),
      )
      .child(this.label);
  }
}

export function createHelloWorldPage(): SelectionArea {
  return new HelloWorld().buildPage();
}
```

For a fuller example with state, theming, and multiple controls — see the
[hello-world scaffold source](https://github.com/zion-sati/create-fui-as-app)
or the [live demo source](https://github.com/zion-sati/fui-as-demo/fui-as-demo-source).

---

## Why this exists

The DOM is a Document Object Model. That's not a criticism — it's a description. It was designed in 1995 for documents: academic papers, hyperlinked pages, content that flows like text. For that purpose, it's the right tool. HTML, CSS, and the browser's document rendering model are genuinely excellent at what they were built for.

The problem is that somewhere along the way, we started building *applications* with it.

Some developers have never known anything else. They were born into a world where React was already the default, where `useEffect` was just how you do things, where the reconciler mental model was simply "how the web works." Like the Matrix — they can't see the document model underneath because they've never been outside it. The DOM-as-application-platform isn't a deliberate choice they made. It's just the water they swim in.

But for those of us who remember Delphi, WPF, Qt, SwiftUI — retained-mode frameworks where you describe what you want and the runtime figures out how to render it — the mismatch has always been visible. A document viewer is the wrong tool for a trading dashboard, a design tool, a kiosk, a data-heavy enterprise application. Not because HTML is bad. Because it's a document model, not an application model.

**EffinDom is not trying to replace HTML.** If you're building a content site, a blog, a marketing page, an e-commerce store — use HTML. It's the right tool. EffinDom is for the other category: applications that feel at home in WPF or SwiftUI — dashboards, editors, simulators, kiosks, data visualizations, enterprise web apps, anything where you're managing complex state and rendering performance matters.

EffinDom treats the browser as a **display server**: a hardware abstraction
layer for GPU, input, fonts, and networking. All UI architecture lives in
compiled, retained-mode WebAssembly runtimes. FUI-AS is how you write apps
against that runtime.

The result in practice:

- **Under 100 KB over the wire** — the multi-megabyte engine is content-hashed,
  CDN-cached, and shared across every EffinDom app a user visits
- **60/120 FPS retained rendering** — no reconciler, no layout thrash, no
  diffing
- **Real typography** — HarfBuzz + ICU for full international text shaping,
  BiDi, RTL, emoji, surgical font subset injection
- **ARIA-first accessibility** — not bolted on, not retrofitted. The semantic
  tree, coordinate syncing, and real-time DOM mirror were architectural
  requirements from day one. Turn on VoiceOver (⌘F5) and press **⌃⌥A** to
  read all — the native macOS VoiceOver ring highlights canvas-rendered text
  pixel-synced to GPU coordinates as it reads. Tab navigation has its own
  built-in focus ring. State changes announce in real time. **On macOS: open
  the demo, ⌘F5 to enable VoiceOver, ⌃⌥A to read all.**
- **SwiftUI-style fluent API** — declarative chaining, no compiler plugins
  required
- **Native Web Browser Feel** - probably the most time consuming and hardest
  part of this project, to make a pure canvas app feel web native for users.

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
  is just your business logic. Under 100 KB over the wire with Brotli e.g. for our demo pages.
  Sub-second Time-To-Interactive when Tier 1 and 2 have been downloaded one time.
- **Zero-Cost Edge Delivery** — The entire compilation and rendering loop runs
  client-side. No server required. Infinite scaling via static CDNs.
- **Content-Hashed JSON Manifest** — Runtimes are mapped via cryptographic
  content hashes. Perfect cache invalidation without ever breaking CDN
  residency.
- **Adaptive 4-Flavour Compilation** — Automatically selects the right build:
  wasm64+SIMD, wasm64, wasm32+SIMD, wasm32. Every user gets the fastest binary
  their hardware supports.
- **Hermetic NPM Bundling** — The entire 4-flavor matrix and content-hashed
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
  engine — no re-fetch, no re-render from scratch. Specify a nodeID and the 
  framework retains your state automatically for you.

### 🎨 High-Fidelity Rendering & UI Primitives

- **Retained-Mode Ergonomics, Immediate-Mode Power** — A full retained scene
  graph with state tracking, without the overhead of a virtual DOM reconciler.
- **Direct Pixel-Level Bitmaps** — WPF/Avalonia-style writeable bitmaps written
  pixel-by-pixel directly to GPU textures for low-latency custom rendering.
- **SVG Support** — Full vector graphics support.
- **Transparent PNG & Custom Bitmaps** — Full alpha-channel image support and
  custom bitmap drawings.
- **SwiftUI-Inspired Fluent Syntax** — Declarative chaining API across all
  controls and layout nodes. No custom compiler plugins required.
- **Implicit & Explicit Transitions** — Structural animation interpolation
  handled inside the WebAssembly loop, not in JavaScript.
- **Fixed-Height Virtual Lists** — Render tens of thousands of items at a locked
  60/120 FPS with structural element virtualization.
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
  Razor-sharp text at any scale, no color fringing on modern displays.
- **On-Demand Tofu Font Swapping** — Real-time stream analysis catches missing
  Unicode coverage as text flows in.
- **Surgical Subset Injection** — Fetches only the specific missing characters,
  not multi-megabyte language font files.
- **Cross-Boundary Text Selection** — Real-time hit-testing for native-feeling
  highlight, drag, and copy across text node boundaries.

### 🖱️ Native Browser Fidelity & OS Integration

- **Lock-Step System Theme Interpolation** — Captures granular OS theme shift
  values (including macOS dynamic appearance) and transitions colors in
  frame-by-frame synchronization.
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
- **Full Search Engine Visibility** — Web crawlers, AI (e.g. Copilot) read 
  canvas text natively via the semantic tree.
- **Automatic CPU Software Fallback** — Transparently downgrades to a CPU
  renderer when WebGL is unavailable — VMs, headless CI, strict environments.

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

## Enterprise & Security

Run `npx @effindomv2/create-fui-as-app my-app` and then `npm install`. Check
the output:

```
0 vulnerabilities found
```

There are no third-party runtime dependencies. The only code that runs in the browser is yours and EffinDom's own packages.

A typical React app has hundreds of transitive dependencies — each one a
potential supply chain attack vector. Log4Shell, XZ Utils, the Polyfill.io
compromise — enterprises and banks have entire security teams whose job is
auditing that graph. Some organizations can't ship to production without a
full dependency audit that takes weeks.

EffinDom's answer is: **there is no third-party runtime dependency graph to audit.** The only code that ships to the browser is yours and EffinDom's own hermetically bundled, content-hashed packages.

The runtime is hermetically bundled inside the npm package. No external CDN
calls at build time. No transitive packages pulling in unknown code. The WASM
binaries are content-hashed — you know cryptographically exactly what you're
running. Air-gapped environments work out of the box via the hermetic npm
bundle.

Your app is just your code. That's it. That's the entire attack surface.

For organizations with strict supply chain policies, security audits, or
air-gapped build environments — this is a first-class design decision, not
an accident.

---

## Alpha status (v0.1.x)

This is early alpha software. Here's an honest picture of where things stand:

**Solid and heavily tested:** core rendering, the full control set, layout for well-formed constraint trees, theming, routing, accessibility, networking, state persistence, the Web DLL deploy model. No handle leaks — incremental GC is running.

**Works on mobile:** the demo is responsive across screen sizes. Touch input, fling scrolling, and pull-to-refresh work. Find-in-page works on mobile too — it draws a text overlay above the canvas rather than highlighting the canvas text directly, which is a known limitation of the approach.

**Not yet supported on mobile:** pinch-to-zoom and long press gestures.

**Layout edge cases:** conflicting constraint trees produce undefined behavior. For example, two sibling columns both calling `.fillWidth()` — both are asking to fill the parent's width, there's no defined winner. The framework won't crash, but the result isn't guaranteed. Avoid ambiguous constraint trees and you'll be fine. These edge cases are documented as they're discovered.

**Bus factor: 1.** This is a solo project built at nights and on weekends. See the license section below.

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