# Contributing to FUI-AS

This guide is for people working **on the SDK itself** — fixing bugs, adding
controls, improving the runtime integration, or running the demo from source.

If you want to **build an app** with fui-as, you don't need this. Start here
instead:

```bash
npx @effindomv2/create-fui-as-app my-app
cd my-app
npm install
npm run dev
```

---

## Prerequisites

- **Node.js 24+** and npm
- **`@effindomv2/runtime@0.1.15+`** — fetched automatically via `npm install`

If you're developing against a **local runtime checkout** rather than the
published npm package, install the runtime from the
[EffinDOM repo](https://github.com/zion-sati/EffinDOM) first before running
`npm install` here.

---

## Clone and build

```bash
git clone https://github.com/zion-sati/fui-as.git
cd fui-as
npm install
npm run build:package
```

Built SDK is output to `dist/`.

To type-check without a full build:

```bash
npm run typecheck
```

---

## Run the demo

The demo is the primary development harness — it exercises controls, layout,
drag-and-drop, text/font rendering, and more.

```bash
npm run dev
```

Starts a dev server with hot recompilation. Open `http://localhost:8080`.

---

## Test your changes locally before publishing

To package the SDK locally without pushing to npm:

```bash
npm run publish:local
```

Output lands in `published/`. You can point a local app at this directory to
test end-to-end before cutting a release.

---

## Repo structure

```
src/
  Fui.ts          — public SDK entry point
  FuiExports.ts   — AssemblyScript export surface
  controls/       — individual control implementations
  layout/         — layout node primitives
  runtime/        — bridge to Tier 1/2 engine
dist/             — build output (not committed)
published/        — local publish output (not committed)
docs/             — SDK reference docs
```

---

## Docs

Full reference:

- **[SDK Docs Index](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/SDK_INDEX.md)**
- **[API Reference](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/API_REFERENCE.md)**
- **[Controls & Nodes](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/CONTROLS_AND_NODES.md)**
- **[Accessibility & Semantics](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/ACCESSIBILITY_AND_SEMANTICS.md)**
- **[Theming & Style Matrix](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/THEMING_STYLE_MATRIX.md)**

---

## Getting in touch

This is a solo project. If you're thinking about contributing, please open an
issue or start a discussion before writing code — it'll save both of us time.

For anything else: **zionsatidev@gmail.com**
