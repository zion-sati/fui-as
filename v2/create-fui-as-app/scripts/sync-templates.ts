import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = resolve(PACKAGE_ROOT, "..", "..");
const FUI_AS_ROOT = join(REPO_ROOT, "v2", "fui-as");
const FUI_AS_TEMPLATES_ROOT = join(FUI_AS_ROOT, "templates");
const TEMPLATES_ROOT = join(PACKAGE_ROOT, "build", "templates");
const LEGACY_TEMPLATES_ROOT = join(PACKAGE_ROOT, "templates");

function writeTextFile(filePath: string, contents: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents, "utf8");
}

function posixRelativeImport(fromFilePath: string, toFilePath: string): string {
  const fromDirectory = dirname(fromFilePath);
  let specifier = relative(fromDirectory, toFilePath).replaceAll("\\", "/");
  if (specifier.endsWith(".ts")) {
    specifier = specifier.slice(0, -3);
  }
  if (!specifier.startsWith(".")) {
    specifier = `./${specifier}`;
  }
  return specifier;
}

function rewriteSdkImportsInFile(filePath: string, templateSrcRoot: string): void {
  const original = readFileSync(filePath, "utf8");
  const rewritten = original
    .replace(
      /(['"])(?:\.\.\/)+src\/(Fui|FuiExports|FuiPrimitives|FuiBrowser)\1/g,
      (_full: string, quote: string, symbolName: string): string => {
        const targetPath = join(templateSrcRoot, "fui", `${symbolName}.ts`);
        const relativeSpecifier = posixRelativeImport(filePath, targetPath);
        return `${quote}${relativeSpecifier}${quote}`;
      },
    )
    .replace(/(['"])(?:\.\.\/)+browser\/src\/(?:host-events|host-services)\1/g, '"@effindomv2/fui-as/browser"');
  if (rewritten !== original) {
    writeFileSync(filePath, rewritten, "utf8");
  }
}

function walkFiles(root: string, callback: (path: string) => void): void {
  for (const entry of readdirSync(root)) {
    const absolutePath = join(root, entry);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      walkFiles(absolutePath, callback);
      continue;
    }
    callback(absolutePath);
  }
}

function writeSharedSdkShims(templateRoot: string): void {
  const fuiRoot = join(templateRoot, "src", "fui");
  writeTextFile(
    join(fuiRoot, "Fui.ts"),
    'export * from "../../node_modules/@effindomv2/fui-as/src/Fui";\n',
  );
  writeTextFile(
    join(fuiRoot, "FuiExports.ts"),
    'export * from "../../node_modules/@effindomv2/fui-as/src/FuiExports";\n',
  );
  writeTextFile(
    join(fuiRoot, "FuiPrimitives.ts"),
    'export * from "../../node_modules/@effindomv2/fui-as/src/FuiPrimitives";\n',
  );
  writeTextFile(
    join(fuiRoot, "FuiBrowser.ts"),
    'export * from "../../node_modules/@effindomv2/fui-as/browser/src/index";\n',
  );
}

function writeAsconfig(templateRoot: string): void {
  writeTextFile(
    join(templateRoot, "asconfig.json"),
    JSON.stringify(
      {
        targets: {
          debug: {
            debug: true,
            exportRuntime: true,
            bindings: "esm",
            outFile: "public/app.wasm",
            sourceMap: true,
            textFile: "public/app.wat",
          },
          release: {
            exportRuntime: true,
            bindings: "esm",
            optimizeLevel: 3,
            outFile: "public/app.wasm",
            shrinkLevel: 1,
            sourceMap: false,
            textFile: "public/app.wat",
          },
        },
        options: {
          runtime: "stub",
        },
      },
      null,
      2,
    ) + "\n",
  );
}

function writeTsconfig(templateRoot: string): void {
  writeTextFile(
    join(templateRoot, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "assemblyscript/std/assembly.json",
        compilerOptions: {
          noEmit: true,
        },
        include: ["src/**/*.ts"],
      },
      null,
      2,
    ) + "\n",
  );
}

function writePackageJsonTemplate(
  templateRoot: string,
  scripts: Record<string, string>,
  description: string,
): void {
  writeTextFile(
    join(templateRoot, "package.json"),
    JSON.stringify(
      {
        name: "__PACKAGE_NAME__",
        version: "0.1.0",
        private: true,
        type: "module",
        description,
        scripts,
        dependencies: {
          "@effindomv2/fui-as": "__FUI_AS_VERSION__",
          "@effindomv2/runtime": "__RUNTIME_VERSION__",
        },
        devDependencies: {
          assemblyscript: "0.28.17",
          "chokidar-cli": "^3.0.0",
          concurrently: "^9.2.1",
          esbuild: "^0.27.7",
          "http-server": "^14.1.1",
          tsx: "^4.20.6",
        },
      },
      null,
      2,
    ) + "\n",
  );
}

function writeHelloSupportFiles(templateRoot: string): void {
  writeTextFile(
    join(templateRoot, "scripts", "prepare-runtime.ts"),
    `import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

const outputDir = "public";
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(\`\${outputDir}/runtime\`, { recursive: true });

cpSync("node_modules/@effindomv2/runtime/dist", \`\${outputDir}/runtime/dist\`, { recursive: true });
cpSync("node_modules/@effindomv2/runtime/dist/fonts", \`\${outputDir}/runtime/fonts\`, { recursive: true });
copyFileSync("node_modules/@effindomv2/runtime/dist/bridge.js", \`\${outputDir}/bridge.js\`);
if (existsSync("node_modules/@effindomv2/runtime/dist/bridge.js.map")) {
  copyFileSync("node_modules/@effindomv2/runtime/dist/bridge.js.map", \`\${outputDir}/bridge.js.map\`);
}
writeFileSync(
  \`\${outputDir}/effindom-runtime-config.js\`,
  'window.__effindomRuntime = Object.assign({}, window.__effindomRuntime, { manifestUrl: "./runtime/dist/effindom.v2.manifest.json" });\\n',
  "utf8",
);
copyFileSync("index.html", \`\${outputDir}/index.html\`);
`,
  );

  writeTextFile(
    join(templateRoot, "scripts", "smoke.ts"),
    `import { accessSync } from "node:fs";

const expectedFiles = [
  "public/index.html",
  "public/harness.js",
  "public/app.wasm",
  "public/bridge.js",
  "public/effindom-runtime-config.js",
  "public/runtime/dist/effindom.v2.manifest.json",
  "public/runtime/fonts/NotoSans-Regular.ttf",
];

for (const filePath of expectedFiles) {
  accessSync(filePath);
}
`,
  );

  writePackageJsonTemplate(
    templateRoot,
    {
      build: "npm run generate:host && npm run build:assets && npm run build:wasm && npm run build:harness",
      "build:assets": "tsx scripts/prepare-runtime.ts",
      "build:wasm": "asc src/App.ts --config asconfig.json --target release",
      "build:harness": "esbuild harness.ts --bundle --format=esm --platform=browser --outfile=public/harness.js",
      "generate:host-services":
        "tsx ./node_modules/@effindomv2/fui-as/scripts/generate-host-services.ts src/host/host-services.ts appHostServices src/host/generated/HostServices.ts ../../fui/FuiPrimitives",
      "generate:host-events":
        "tsx ./node_modules/@effindomv2/fui-as/scripts/generate-host-events.ts src/host/host-events.ts appHostEvents src/host/generated/HostEvents.ts ../../fui/FuiPrimitives",
      "generate:host": "npm run generate:host-services && npm run generate:host-events",
      watch:
        'chokidar "src/**/*.ts" "harness.ts" "index.html" "asconfig.json" --ignore "src/host/generated/**" -c "npm run build"',
      serve: "http-server public -p 8080 -c-1",
      dev: 'npm run build && concurrently -k -n watch,serve "npm run watch" "npm run serve"',
      test: "npm run build && tsx scripts/smoke.ts",
    },
    "Scaffolded FUI-AS hello-world app",
  );
}

function writeMvcSupportFiles(templateRoot: string): void {
  writeTextFile(
    join(templateRoot, "index.html"),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=/mvc-home/" />
    <title>FUI-AS MVC App</title>
  </head>
  <body>
    <p>Redirecting to <a href="/mvc-home/">/mvc-home/</a>…</p>
  </body>
</html>
`,
  );

  writeTextFile(
    join(templateRoot, "scripts", "prepare-runtime.ts"),
    `import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

const outputDir = "public";
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(\`\${outputDir}/runtime\`, { recursive: true });
mkdirSync(\`\${outputDir}/mvc-home\`, { recursive: true });
mkdirSync(\`\${outputDir}/mvc-settings\`, { recursive: true });

cpSync("node_modules/@effindomv2/runtime/dist", \`\${outputDir}/runtime/dist\`, { recursive: true });
cpSync("node_modules/@effindomv2/runtime/dist/fonts", \`\${outputDir}/runtime/fonts\`, { recursive: true });
copyFileSync("node_modules/@effindomv2/runtime/dist/bridge.js", \`\${outputDir}/bridge.js\`);
if (existsSync("node_modules/@effindomv2/runtime/dist/bridge.js.map")) {
  copyFileSync("node_modules/@effindomv2/runtime/dist/bridge.js.map", \`\${outputDir}/bridge.js.map\`);
}
writeFileSync(
  \`\${outputDir}/effindom-runtime-config.js\`,
  'window.__effindomRuntime = Object.assign({}, window.__effindomRuntime, { manifestUrl: "./runtime/dist/effindom.v2.manifest.json" });\\n',
  "utf8",
);
copyFileSync("index.html", \`\${outputDir}/index.html\`);
copyFileSync("route-shell.html", \`\${outputDir}/mvc-home/index.html\`);
copyFileSync("route-shell.html", \`\${outputDir}/mvc-settings/index.html\`);
`,
  );

  writeTextFile(
    join(templateRoot, "scripts", "smoke.ts"),
    `import { accessSync } from "node:fs";

const expectedFiles = [
  "public/index.html",
  "public/harness.js",
  "public/mvc-home/index.html",
  "public/mvc-settings/index.html",
  "public/mvc-home.wasm",
  "public/mvc-settings.wasm",
  "public/bridge.js",
  "public/effindom-runtime-config.js",
  "public/runtime/dist/effindom.v2.manifest.json",
  "public/runtime/fonts/NotoSans-Regular.ttf",
];

for (const filePath of expectedFiles) {
  accessSync(filePath);
}
`,
  );

  writePackageJsonTemplate(
    templateRoot,
    {
      build: "npm run generate:host && npm run build:assets && npm run build:wasm && npm run build:harness",
      "build:assets": "tsx scripts/prepare-runtime.ts",
      "build:wasm": "npm run build:wasm:home && npm run build:wasm:settings",
      "build:wasm:home":
        "asc src/routes/mvc_home.ts --config asconfig.json --target release --outFile public/mvc-home.wasm",
      "build:wasm:settings":
        "asc src/routes/mvc_settings.ts --config asconfig.json --target release --outFile public/mvc-settings.wasm",
      "build:harness": "esbuild harness.ts --bundle --format=esm --platform=browser --outfile=public/harness.js",
      "generate:host-services":
        "tsx ./node_modules/@effindomv2/fui-as/scripts/generate-host-services.ts src/host/host-services.ts appHostServices src/host/generated/HostServices.ts ../../fui/FuiPrimitives",
      "generate:host-events":
        "tsx ./node_modules/@effindomv2/fui-as/scripts/generate-host-events.ts src/host/host-events.ts appHostEvents src/host/generated/HostEvents.ts ../../fui/FuiPrimitives",
      "generate:host": "npm run generate:host-services && npm run generate:host-events",
      watch:
        'chokidar "src/**/*.ts" "harness.ts" "route-shell.html" "index.html" "asconfig.json" --ignore "src/host/generated/**" -c "npm run build"',
      serve: "http-server public -p 8080 -c-1",
      dev: 'npm run build && concurrently -k -n watch,serve "npm run watch" "npm run serve"',
      test: "npm run build && tsx scripts/smoke.ts",
    },
    "Scaffolded FUI-AS MVC app",
  );
}

function rewriteHarnessImports(filePath: string): void {
  const original = readFileSync(filePath, "utf8");
  const rewritten = original
    .replace(/(['"])(?:\.\.\/)+browser\/src\/common-harness\1/g, '"@effindomv2/fui-as/browser"')
    .replace(/(['"])(?:\.\.\/)+browser\/src\/routed-harness\1/g, '"@effindomv2/fui-as/browser"')
    .replaceAll("?v=midnight-6", "");
  if (rewritten !== original) {
    writeFileSync(filePath, rewritten, "utf8");
  }
}

function normalizeGeneratedHeader(filePath: string, label: string): void {
  const original = readFileSync(filePath, "utf8");
  const rewritten = original.replace(
    /^\/\/ Generated by .*$/m,
    `// Generated from ${label}.`,
  );
  if (rewritten !== original) {
    writeFileSync(filePath, rewritten, "utf8");
  }
}

function syncHelloTemplate(): void {
  const templateRoot = join(TEMPLATES_ROOT, "hello");
  const templateSrcRoot = join(templateRoot, "src");
  rmSync(templateRoot, { recursive: true, force: true });

  const sourceRoot = join(FUI_AS_TEMPLATES_ROOT, "demo-hello-world");
  cpSync(join(sourceRoot, "src"), templateSrcRoot, { recursive: true });
  cpSync(join(sourceRoot, "harness.ts"), join(templateRoot, "harness.ts"));
  cpSync(join(sourceRoot, "index.html"), join(templateRoot, "index.html"));

  writeSharedSdkShims(templateRoot);
  writeAsconfig(templateRoot);
  writeTsconfig(templateRoot);
  writeHelloSupportFiles(templateRoot);

  walkFiles(templateSrcRoot, (filePath: string): void => {
    if (filePath.endsWith(".ts")) {
      rewriteSdkImportsInFile(filePath, templateSrcRoot);
    }
  });
  rewriteHarnessImports(join(templateRoot, "harness.ts"));
  normalizeGeneratedHeader(join(templateSrcRoot, "host", "generated", "HostEvents.ts"), "the scaffold host-events definition");
  normalizeGeneratedHeader(join(templateSrcRoot, "host", "generated", "HostServices.ts"), "the scaffold host-services definition");
}

function syncMvcTemplate(): void {
  const templateRoot = join(TEMPLATES_ROOT, "mvc");
  const templateSrcRoot = join(templateRoot, "src");
  rmSync(templateRoot, { recursive: true, force: true });

  const sourceRoot = join(FUI_AS_TEMPLATES_ROOT, "demo-mvc");
  cpSync(join(sourceRoot, "src"), templateSrcRoot, { recursive: true });
  cpSync(join(sourceRoot, "harness.ts"), join(templateRoot, "harness.ts"));
  cpSync(join(sourceRoot, "route-shell.html"), join(templateRoot, "route-shell.html"));

  writeSharedSdkShims(templateRoot);
  writeAsconfig(templateRoot);
  writeTsconfig(templateRoot);
  writeMvcSupportFiles(templateRoot);

  walkFiles(templateSrcRoot, (filePath: string): void => {
    if (filePath.endsWith(".ts")) {
      rewriteSdkImportsInFile(filePath, templateSrcRoot);
    }
  });
  rewriteHarnessImports(join(templateRoot, "harness.ts"));
  normalizeGeneratedHeader(join(templateSrcRoot, "host", "generated", "HostEvents.ts"), "the scaffold host-events definition");
  normalizeGeneratedHeader(join(templateSrcRoot, "host", "generated", "HostServices.ts"), "the scaffold host-services definition");
}

rmSync(TEMPLATES_ROOT, { recursive: true, force: true });
rmSync(LEGACY_TEMPLATES_ROOT, { recursive: true, force: true });
mkdirSync(TEMPLATES_ROOT, { recursive: true });
syncHelloTemplate();
syncMvcTemplate();
