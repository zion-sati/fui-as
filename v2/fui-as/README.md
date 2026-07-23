# @effindomv2/fui-as

EffinDOM's retained-mode UI SDK for AssemblyScript and the browser.

## Quick start

Create a new application with the official scaffold:

```bash
npx @effindomv2/create-fui-as-app my-app
cd my-app
npm install
npm run dev
```

The scaffold includes host-service generation, a routed application option, the EffinDOM browser harness, and a production build.

## Install in an existing application

```bash
npm install @effindomv2/fui-as
```

Build an application WASM module with AssemblyScript, then mount it with the generated FUI-AS browser harness. See the package documentation and scaffolded application for the complete setup.

`@effindomv2/fui-as` uses an exact, tested `@effindomv2/runtime` dependency. The runtime first attempts to reuse immutable assets from `https://runtimes.effindom.dev`, then falls back to the runtime assets published with the application.

## Links

- [FUI-AS repository](https://github.com/zion-sati/fui-as)
- [EffinDOM runtime](https://www.npmjs.com/package/@effindomv2/runtime)
- [Create FUI-AS App](https://www.npmjs.com/package/@effindomv2/create-fui-as-app)

## License

AGPL-3.0-only or a commercial EffinDOM license. See `LICENSE.md` and `COMMERCIAL.md`.
