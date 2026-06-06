# FUI-AS Quickstart

FUI-AS is the AssemblyScript SDK for building Tier 3 applications on the
EffinDom display server. It provides:

- **Fluent-style retained-mode UI controls** — layouts, buttons, text,
  combobox, dialog modals, virtual lists
- **Data binding** and reactive state management via fine-grained signals
- **Direct TypeScript/AssemblyScript compilation** to WebAssembly
- **Zero-runtime overhead** UI primitives backed by the Tier 1 painting/layout
  engine

## Prerequisites

You need:

- **Node.js 24+** and npm
- **@effindomv2/runtime@0.1.15+** (the standalone runtime package)

If building from this source directory:

- `npm install` will fetch the runtime from npm

If developing against a local runtime checkout:

- Install the runtime package from the separate EffinDOM repo before building

## Scaffold a new app (recommended)

The fastest way to start is the standalone scaffolder:

```bash
npx @effindomv2/create-fui-as-app my-app
cd my-app
npm install
npm run dev
```

For the MVC starter with routing:

```bash
npx @effindomv2/fui-as-app my-mvc-app -- --template mvc
```

The scaffolder lives in its own repo:
[→ create-fui-as-app on GitHub](https://github.com/zion-sati/create-fui-as-app)

## Build (from this SDK source)

```bash
# Install dependencies (fetches @effindomv2/runtime from npm)
npm install

# Type-check and build (AssemblyScript → WASM)
npm run build:package
```

Built SDK is output to `dist/`.

### Running the demo

```bash
npm run dev
```

This starts a dev server with sample UI patterns including advanced controls,
templated controls, drag-and-drop reorder, and text/font samples.

## Publish locally (for testing)

```bash
npm run publish:local
```

This packages the SDK and outputs it to the `published/` directory without
pushing to npm.

## API documentation

Full SDK reference, samples, and architecture notes live in the EffinDOM
monorepo:

- **[SDK Docs Index](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/SDK_INDEX.md)**
- **[API Reference](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/API_REFERENCE.md)**
- **[Controls & Nodes](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/CONTROLS_AND_NODES.md)**
- **[Quickstart (full walk-through)](https://github.com/zion-sati/EffinDOM/blob/main/docs/v2/fui-as/QUICKSTART.md)**
