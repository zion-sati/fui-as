# EffinDom FUI-AS

> **The AssemblyScript SDK for the EffinDom display server. Build WPF-grade
> web apps without touching the DOM.**

FUI-AS is the flagship Tier 3 SDK for EffinDom. You write TypeScript-style
AssemblyScript — typed, compiled to WebAssembly, running against a retained-mode
C++ rendering engine. No HTML. No CSS. No virtual DOM. No framework tax.

![Demo Video](./fui-as-demo.mov)

---

## Quickstart

```bash
npx @effindomv2/create-fui-as-app my-app
cd my-app
npm install
npm run dev
```

That's it. You'll have a running EffinDom app at `http://localhost:8080`.

For the MVC starter with routing:

```bash
npx @effindomv2/fui-as-app my-mvc-app -- --template mvc
```

The scaffolder lives in its own repo: [create-fui-as-app](https://github.com/zion-sati/create-fui-as-app).

---

## A minimal app

```ts
import { Application, Button, Column, Text } from "@effindomv2/fui-as";
export * from "@effindomv2/fui-as/FuiExports";

function buildPage() {
  return Column(
    new Text("Hello EffinDom"),
    new Button("Click me"),
  );
}

Application.register(app => app.page(buildPage));
```

---

## SDK Reference

- **[SDK Docs Index](./docs/v2/fui-as/SDK_INDEX.md)** — full navigation
- **[API Reference](./docs/v2/fui-as/API_REFERENCE.md)**
- **[Controls & Nodes Overview](./docs/v2/fui-as/CONTROLS_AND_NODES.md)**
- **[Control Customization](./docs/v2/fui-as/CONTROL_CUSTOMIZATION.md)** — sizing, colors, templating
- **[Per-Type Reference](./docs/v2/fui-as/reference/README.md)**
- **[Events & Callbacks](./docs/v2/fui-as/EVENTS_AND_CALLBACKS.md)**
- **[Quickstart (full walk-through)](./docs/v2/fui-as/QUICKSTART.md)**

## Design & Architecture

- **[Accessibility & Semantics](./docs/v2/fui-as/ACCESSIBILITY_AND_SEMANTICS.md)**
- **[Theming & Style Matrix](./docs/v2/fui-as/THEMING_STYLE_MATRIX.md)**
- **[Keyboard Policy](./docs/v2/fui-as/KEYBOARD_POLICY.md)**
- **[Overlays & Portals](./docs/v2/fui-as/OVERLAYS_AND_PORTALS.md)**
- **[Text Input Design](./docs/v2/fui-as/TEXT_INPUT_DESIGN.md)**

---

## Why EffinDom?

The DOM was a 1995 document viewer that accidentally became the world's
application platform. Every framework since has been a progressively more
elaborate bandage on that original wound.

EffinDom treats the browser as a **display server** — a hardware abstraction
layer for input, fonts, networking, and GPU — and moves all UI architecture
into compiled, retained-mode runtimes. The result:

- **~128 KB hello-world app payload** — the multi-megabyte engine is cached globally once
- **60 FPS retained-mode rendering** — no diffing, no layout thrash
- **Real typography** — HarfBuzz + ICU, not bitmap fonts
- **Actual accessibility** — semantic tree projected through the browser bridge
- **Write in AssemblyScript, Rust, or Kotlin** — the runtime doesn't care

[→ Full story: Why EffinDom (detailed)](./WHY_FUI_EFFINDOM.md)
[→ Who is zion-sati?](./WHO_IS_ZION_SATI.md)

---

## The FUI Architecture Reference Matrix

Every feature below ships in the SDK today unless marked "roadmap."

### 📦 1. The Distributed Network & Deploy Layer (The "Web DLL")

- **Web DLL Split Architecture** — Core runtimes are completely separated into
  immutable, independent WebAssembly modules.
- **Tier 1 Display Server** — Stateless, low-level microkernel controlling the
  WebGL context, driving Skia, handling raw drawing instructions.
- **Tier 2 Retained UI Layer** — Houses the structural AST, component
  reactivity, and lifecycle states.
- **Global CDN Caching** — Engine DLLs, ICU datasets, and core components
  cached forever globally.
- **Tiny App Footprint** — The runtime engine is cached once globally. Your
  app payload is just your business logic (hello-world scaffold: ~128 KB),
  ensuring sub-second Time-To-Interactive.
- **Zero-Cost Edge Delivery** — Entire compilation and rendering loop runs
  client-side, allowing infinite scaling via static edge CDNs.
- **Native Fetch Pipeline** — High-performance, reactive REST/HTTP networking
  baked directly into the WebAssembly runtime core.

### 💾 2. Automated Node State & IndexedDB Persistence

- **Opt-In Named Node Tracking** — Assign explicit identifiers to layout nodes
  to opt them into automatic lifecycle state tracking.
- **Zero-Friction Scroll & Component Preservation** — Active component states
  — including scroll positions, input data, and layout configurations — are
  automatically serialized to the browser's IndexedDB in the background.
- **Seamless Back/Forward Navigation** — Eliminates canvas navigation amnesia.
  Browser forward/back buttons automatically hydrate exact state configurations
  back into the Tier 2 Retained UI engine.

### 🎨 3. High-Fidelity Rendering & UI Primitives

- **Immediate-Mode Power, Retained-Mode Ergonomics** — Canvas layout engine
  with full state tracking.
- **Direct Pixel-Level Bitmaps** — Custom drawn, pixel-by-pixel bitmaps
  (identical to WPF / Avalonia writeable bitmaps) written directly to GPU
  textures.
- **Native SVG Parsing** — Native parsing and rendering of vector graphics
  without breaking out into HTML.
- **Transparent PNG & Custom Bitmaps** — Alpha-channel images and custom
  bitmap drawings.
- **SwiftUI-Inspired Fluent Syntax** — Unified declarative chaining API
  implemented natively across languages without custom compiler plugins.
- **Implicit & Explicit Transitions** — Structural animation interpolation
  handled inside the WebAssembly loop.
- **Fixed-Height Virtual Lists** — Structural element virtualization to render
  tens of thousands of data points at locked 60/120 FPS.
- **Native Dialog Modals** — Integrated, declarative overlay systems with
  automatic, layout-aware Accept/Cancel button action assignments.

### 🔤 4. Advanced Typography & Linguistic Engine

- **Global ICU Engine** — Complete international text shaping, character
  attributes, and complex script support.
- **Built-in RTL Foundation** — HarfBuzz and ICU architectures fully baked into
  the Tier 2 layer to natively handle Right-to-Left script layout rules.
- **Real-Time Glyph Caching** — Renders characters to a reusable texture atlas
  to prevent expensive frame-by-frame vector calculations.
- **Perfect Pixel Crispness** — Subpixel anti-aliasing intentionally disabled,
  forcing razor-sharp text scaling without color-fringing.
- **On-Demand Tofu Font Swapping** — Real-time text stream analysis that
  dynamically catches missing Unicode boundaries.
- **Surgical Subset Injections** — Instead of fetching massive multi-megabyte
  language fonts, pulls down the specific missing characters on the fly.
- **Cross-Boundary Text Selection** — Real-time hit-testing mimicking native
  HTML text highlighting, dragging, and copying across boundaries.

### 🖱️ 5. Native Browser Fidelity & OS Integration

- **Lock-Step System Theme Interpolation** — Captures granular OS theme shift
  values (like macOS dynamic shifts) to transition colors in perfect
  frame-by-frame synchronization.
- **Custom In-App Find Engine** — Built-in Ctrl+F / ⌘F hotkey interception
  that fires a custom canvas layout dialog to search text nodes natively.
- **External File Drop Targets** — Extends standard viewport tracking to
  intercept browser-level external files and object drops.
- **Context-Aware Right-Click Menus** — Native-feeling context menus that alter
  their layout and actions based on the specific AST element clicked.
- **Desktop-Grade Navlinks** — Hyperlink interactions render a browser-style
  preview popup at the bottom of the viewport on hover.
- **Mobile Touch Gesture Engines** — Out-of-the-box support for fluent,
  physics-driven mobile gestures like pull-to-refresh.

### 🌐 6. Core Web Accessibility & Interoperability

- **Granular Semantic Overrides** — Every individual semantic label can be
  explicitly overridden at the component level.
- **Pre-Defined Semantic Roles** — Out-of-the-box matrix of core semantic
  roles, ensuring custom controls map accurately to native assistive
  technologies.
- **Out-of-the-Box Semantic Tree** — Auto-generates a synchronized, invisible
  ARIA-compliant HTML mirror layout behind the canvas.
- **Full Search Engine Accessibility** — Built-in structural trees allow web
  crawlers to read text natively.
- **Automatic CPU Software Fallback** — Transparently downgrades to a highly
  optimized CPU-based Software Renderer if WebGL is unavailable (VMs, headless
  CI).
- **Anti-Fingerprint Block Resiliency** — Resilient WebGL setup hooks that
  safely bypass strict browser privacy/fingerprinting blocks without crashing.

### ⚙️ 7. Dynamic Hardware-Targeted Deployment Engine

- **Content-Hashed JSON Matrix** — Runtimes mapped via an immutable JSON
  manifest versioned strictly by cryptographic file content hashes, guaranteeing
  perfect cache invalidation without breaking long-term CDN residency.
- **Adaptive 4-Flavor Compilation** — Automates deployment across four distinct
  hardware optimization profiles (64-bit + SIMD, 64-bit Non-SIMD, 32-bit +
  SIMD, 32-bit Non-SIMD).
- **Hermetic NPM Bundling** — The entire 4-flavor matrix and content-hashed
  JSON manifest are bundled entirely within the local npm package, allowing 100%
  self-contained local builds behind strict firewalls.

### 🛠️ 8. Multi-Language Evolution & Developer Tooling

- **C-ABI Command Buffer** — The runtime doesn't care what language you used.
- **FUI-AS (AssemblyScript)** — The flagship web reference implementation using
  TypeScript-style architecture. *(You are here.)*
- **FUI-KT (Kotlin) is coming** — JetBrains' Compose Multiplatform
  wraps Skiko (their Skia bindings for Kotlin), but FUI-KT will render
  directly through EffinDom's own Tier 1/2 pipeline. Same Skia GPU
  backend, none of the JVM baggage. Write Kotlin, ship WASM.
- **FUI-RS (Rust)** — Zero-cost traits on the stack with zero heap allocation
  overhead.
- **`npx` Scaffolding Engines** — CLI toolkits with standard `simple` and
  `mvc` structural blueprints.

---

## Repos

| Repo | Purpose |
|---|---|
| **[fui-as](https://github.com/zion-sati/fui-as)** | This repo — AssemblyScript SDK |
| **[EffinDOM](https://github.com/zion-sati/EffinDOM)** | Monorepo — runtime, engine, docs |
| **[create-fui-as-app](https://github.com/zion-sati/create-fui-as-app)** | `npx` scaffolder CLI |

---

## Build & publish (maintainers)

```bash
npm install
npm run typecheck
npm run test
npm run build
npm run publish:local
```

---

## License

This repository is licensed under **AGPL-3.0-only** or commercial terms.

The runtime (`@effindomv2/runtime`) is MIT — use it freely. The SDK is AGPL
because I'm a solo maintainer with a young family, and I need commercial use to
support the project's survival. If you're building something commercial, there's
a license for that.

See `LICENSE.md` and `COMMERCIAL.md` for details.
