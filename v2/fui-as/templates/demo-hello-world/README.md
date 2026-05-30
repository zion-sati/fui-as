# Hello World scaffold guide

This template is the smallest FUI-AS app shape:

- `src/App.ts` is the app entrypoint (`__runApp`) and where you compose your root retained UI tree.
- `src/HelloWorld.ts` is a simple feature module you can replace with your own screens/components.
- `harness.ts` boots the browser runtime and mounts the wasm app.
- `src/host/host-services.ts` and `src/host/host-events.ts` define app-owned JS bridge contracts.
- `src/host/generated/*` is generated from those host definition files.

## Typical workflow

1. Build UI from `src/App.ts` with controls/nodes from `./fui/Fui`.
2. Split real features into more files under `src/` and compose them in `App.ts`.
3. If browser-owned capabilities are needed (for example shell APIs), add definitions in `src/host/*.ts` and run `npm run generate:host`.
4. Run `npm run dev` while iterating.

## Architecture intent

Use this template as a single-app baseline: one wasm, one harness, one mounted root tree. Keep UI composition in AssemblyScript and keep browser glue inside `harness.ts` + host bridge definitions.
