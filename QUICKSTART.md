# FUI-AS Quickstart

FUI-AS is the AssemblyScript SDK for building Tier 3 applications on the EffinDom runtime. It provides:

- **Fluent-style retained-mode UI controls** (layouts, buttons, text, combobox, etc.)
- **Data binding** and reactive state management
- **Direct TypeScript/AssemblyScript compilation** to WebAssembly
- **Zero-runtime overhead** UI primitives backed by the Tier 1 painting/layout engine

## Prerequisites

You need:

- **Node.js 24+** and npm
- **@effindomv2/runtime@0.1.10+** (the standalone runtime package)

If building from this source directory standalone:

- **npm install** will fetch the runtime from npm

If developing against a local runtime checkout:

- install the runtime package from the separate EffinDOM repo before building

## Build

```bash
# Install dependencies (fetches @effindomv2/runtime from npm or local monorepo)
npm install

# Type-check and build (AssemblyScript → WASM)
npm run build:package
```

Built SDK is output to `dist/`.

### Running the demo

```bash
npm run dev
```

This starts a dev server at `http://localhost:5173/` with sample UI patterns.

## Publish locally (for testing)

```bash
npm run publish:local
```

This packages the SDK and outputs it to the `published/` directory without pushing to npm.

## API documentation

See `docs/v2/fui-as/` for SDK reference, samples, and architecture notes.

See `docs/v2/fui-as/QUICKSTART.md` for a detailed SDK walk-through.
