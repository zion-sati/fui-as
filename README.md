# EffinDom FUI-AS

This repository contains the AssemblyScript SDK lane for EffinDom:

- `@effindomv2/fui-as` (`v2/fui-as`)
- `@effindomv2/create-fui-as-app` (`v2/create-fui-as-app`)

The runtime package lives in the separate public repo:

- https://github.com/zion-sati/EffinDOM

> The runtime is MIT — use it freely. The SDK is AGPL because I'm a solo
> maintainer with a young family, and I need commercial use to support the
> project's survival. If you're building something commercial, there's a
> license for that — it's how this stays alive.

## License

This repository is licensed under AGPL-3.0-only or commercial terms. See
`LICENSE.md` and `COMMERCIAL.md`.

## Build and publish

```bash
npm install
npm run typecheck
npm run test
npm run build
npm run publish:local
npm run publish:local:create-fui-as-app
```

If you publish to npm, do the SDK first, then the scaffolder:

```bash
npm run publish:npm
npm run publish:npm:create-fui-as-app
```

The scaffolder smoke build expects published `@effindomv2/fui-as` and
`@effindomv2/runtime` packages to be available on npm.

## The FUI Architecture Reference Matrix (Master Copy)

### 1. The Distributed Network & Deploy Layer (The "Web DLL")

- Web DLL Split Architecture: Core runtimes are completely separated into immutable, independent WebAssembly modules.
- Tier 1 Display Server: A stateless, low-level microkernel that controls the WebGL context, drives Skia, and handles raw drawing instructions.
- Tier 2 Retained UI Layer: Houses the structural Abstract Syntax Tree (AST), component reactivity, and lifecycle states.
- Global CDN Caching: Engine DLLs, ICU datasets, and core components are cached forever globally.
- 150kb App Footprint: The actual application payload is tiny, ensuring sub-second Time-To-Interactive (TTI).
- Zero-Cost Edge Delivery: The entire compilation and rendering loop runs entirely on the client side, allowing infinite scaling directly via static edge CDNs.
- Native Fetch Pipeline: High-performance, reactive REST/HTTP networking hooks baked directly into the WebAssembly runtime core.

### 2. High-Fidelity Rendering & UI Primitives

- Immediate-Mode Power, Retained-Mode Ergonomics: Blends a canvas layout engine with state tracking.
- Direct Pixel-Level Bitmaps: Support for custom drawn, pixel-by-pixel bitmaps (identical to WPF / Avalonia writeable bitmaps) written directly to a GPU texture for low-latency rendering.
- Native SVG Parsing: Native parsing and rendering of vector graphics without breaking out into HTML.
- Transparent PNG & Custom Bitmaps: Support for alpha-channel images and custom bitmap drawings.
- SwiftUI-Inspired Fluent Syntax: Unified declarative chaining API implemented natively across languages without intrusive custom compiler plugins.
- Implicit & Explicit Transitions: Structural animation interpolation handled inside the WebAssembly loop.
- Fixed-Height Virtual Lists: Structural element virtualization to render tens of thousands of data points at a locked 60/120 FPS.
- Native Dialog Modals: Integrated, declarative overlay systems with automatic, layout-aware Accept/Cancel button action assignments.

### 3. Advanced Typography & Linguistic Engine

- Global ICU Engine: Complete international text shaping, character attributes, and complex script support.
- Built-in RTL Foundation: HarfBuzz and ICU architectures are fully baked into the Tier 2 layer to natively handle Right-to-Left script layout rules.
- Real-Time Glyph Caching: Renders characters to a reusable texture atlas to prevent expensive frame-by-frame vector calculations.
- Perfect Pixel Crispness: Subpixel anti-aliasing is intentionally disabled, forcing razor-sharp text scaling without color-fringing on modern displays.
- On-Demand Tofu Font Swapping: Real-time text stream analysis that dynamically catches missing Unicode boundaries.
- Surgical Subset Injections: Instead of fetching massive multi-megabyte language fonts, it pulls down the specific missing characters on the fly.
- Cross-Boundary Text Selection: Real-time hit-testing that mimics native HTML text highlighting, dragging, and copying across boundaries.

### 4. Native Browser Fidelity & OS Integration

- Lock-Step System Theme Interpolation: Captures granular OS theme shift values (like macOS dynamic shifts) to transition colors in perfect frame-by-frame synchronization.
- Custom In-App Find Engine: Built-in CTRL/CMD+F hotkey interception that fires a custom canvas layout dialog to search text nodes natively.
- External File Drop Targets: Extends standard viewport tracking to intercept browser-level external files and object drops.
- Context-Aware Right-Click Menus: Native-feeling context menus that alter their layout and actions based on the specific AST element clicked.
- Desktop-Grade Navlinks: Hyperlink interactions render a browser-style preview popup at the bottom of the viewport on hover.
- Mobile Touch Gesture Engines: Out-of-the-box support for fluent, physics-driven mobile gestures like pull-to-refresh.

### 5. Core Web Accessibility & Interoperability

- Granular Semantic Overrides: Every individual semantic label can be explicitly overridden at the component level to fit complex app layouts.
- Pre-Defined Semantic Roles: Includes an out-of-the-box matrix of core semantic roles, ensuring custom controls map accurately to native assistive technologies.
- Out-of-the-Box Semantic Tree: Auto-generates a synchronized, invisible ARIA-compliant HTML mirror layout behind the canvas.
- Full Search Engine Accessibility: Built-in structural trees allow web crawlers to read text natively.
- Hardware-Agnostic Stability: Resilient WebGL setup hooks that bypass browser anti-fingerprinting blocks without crashing.

### 6. Multi-Language Evolution & Developer Tooling

- Universal AST Schema: The core execution target does not care what programming language wrote the front-end.
- FUI-AS (AssemblyScript): The flagship web reference implementation using TypeScript-style architecture.
- FUI-KT & FUI-RS Roadmap: Direct architectural translations into Kotlin and Rust.
- Zero-Cost Rust Traits: FUI-RS utilizes static dispatch to compile and evaluate the layout tree directly on the stack with zero heap allocation overhead.
- npx Scaffolding Engines: CLI toolkits with standard simple and mvc structural blueprints.

