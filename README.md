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
