import { build } from "esbuild";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listHostEventMethods, type NormalizedHostEventMethod } from "../browser/src/host-events";
import type { HostServiceTypeName } from "../browser/src/host-services";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PACKAGE_DIR = path.resolve(path.dirname(SCRIPT_PATH), "..");

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function relativeImport(fromFile: string, targetFile: string): string {
  let relative = path.relative(path.dirname(fromFile), targetFile);
  relative = relative.replace(/\.[^.]+$/, "");
  if (!relative.startsWith(".")) {
    relative = `./${relative}`;
  }
  return toPosix(relative);
}

function sourcePathForHeader(sourceModulePath: string): string {
  const relative = path.relative(process.cwd(), sourceModulePath);
  return toPosix(relative.startsWith(".") ? relative : `./${relative}`);
}

function asTypeName(type: HostServiceTypeName): string {
  switch (type) {
    case "string":
      return "string";
    case "bool":
      return "bool";
    case "i32":
      return "i32";
    case "u32":
      return "u32";
    case "i64":
      return "i64";
    case "u64":
      return "u64";
    case "f64":
      return "f64";
    case "bytes":
      return "Uint8Array";
    case "i32_array":
      return "Int32Array";
    case "u32_array":
      return "Uint32Array";
    case "i64_array":
      return "Int64Array";
    case "u64_array":
      return "Uint64Array";
    case "f64_array":
      return "Float64Array";
    case "void":
      return "void";
  }
}

function callbackTypeFor(method: NormalizedHostEventMethod): string {
  if (method.args.length == 0) {
    return "Callback0";
  }
  if (method.args.length == 1) {
    return `Callback1<${asTypeName(method.args[0])}>`;
  }
  if (method.args.length == 2) {
    return `Callback2<${asTypeName(method.args[0])}, ${asTypeName(method.args[1])}>`;
  }
  throw new Error(`Host event ${method.serviceName}.${method.methodName} uses ${String(method.args.length)} args; only 0-2 are supported right now.`);
}

function emitExportArgs(method: NormalizedHostEventMethod): string {
  const parts: Array<string> = [];
  method.args.forEach((type, index) => {
    if (
      type === "string" ||
      type === "bytes" ||
      type === "i32_array" ||
      type === "u32_array" ||
      type === "i64_array" ||
      type === "u64_array" ||
      type === "f64_array"
    ) {
      parts.push(`arg${String(index)}Ptr: usize`, `arg${String(index)}Len: u32`);
      return;
    }
    parts.push(`arg${String(index)}: ${asTypeName(type)}`);
  });
  return parts.join(", ");
}

function emitDecodedArgs(method: NormalizedHostEventMethod): Array<string> {
  const lines: Array<string> = [];
  method.args.forEach((type, index) => {
    if (type !== "string") {
      if (type === "bytes") {
        lines.push(`  const arg${String(index)} = new Uint8Array(<i32>arg${String(index)}Len);`);
        lines.push(`  if (arg${String(index)}Len > 0) {`);
        lines.push(`    memory.copy(arg${String(index)}.dataStart, arg${String(index)}Ptr, <usize>arg${String(index)}Len);`);
        lines.push("  }");
        return;
      }
      if (type === "i32_array") {
        lines.push(`  const arg${String(index)} = new Int32Array(<i32>arg${String(index)}Len);`);
        lines.push(`  if (arg${String(index)}Len > 0) {`);
        lines.push(`    memory.copy(arg${String(index)}.dataStart, arg${String(index)}Ptr, <usize>arg${String(index)}Len << 2);`);
        lines.push("  }");
        return;
      }
      if (type === "f64_array") {
        lines.push(`  const arg${String(index)} = new Float64Array(<i32>arg${String(index)}Len);`);
        lines.push(`  if (arg${String(index)}Len > 0) {`);
        lines.push(`    memory.copy(arg${String(index)}.dataStart, arg${String(index)}Ptr, <usize>arg${String(index)}Len << 3);`);
        lines.push("  }");
        return;
      }
      if (type === "u32_array") {
        lines.push(`  const arg${String(index)} = new Uint32Array(<i32>arg${String(index)}Len);`);
        lines.push(`  if (arg${String(index)}Len > 0) {`);
        lines.push(`    memory.copy(arg${String(index)}.dataStart, arg${String(index)}Ptr, <usize>arg${String(index)}Len << 2);`);
        lines.push("  }");
        return;
      }
      if (type === "i64_array") {
        lines.push(`  const arg${String(index)} = new Int64Array(<i32>arg${String(index)}Len);`);
        lines.push(`  if (arg${String(index)}Len > 0) {`);
        lines.push(`    memory.copy(arg${String(index)}.dataStart, arg${String(index)}Ptr, <usize>arg${String(index)}Len << 3);`);
        lines.push("  }");
        return;
      }
      if (type === "u64_array") {
        lines.push(`  const arg${String(index)} = new Uint64Array(<i32>arg${String(index)}Len);`);
        lines.push(`  if (arg${String(index)}Len > 0) {`);
        lines.push(`    memory.copy(arg${String(index)}.dataStart, arg${String(index)}Ptr, <usize>arg${String(index)}Len << 3);`);
        lines.push("  }");
      }
      return;
    }
    lines.push(
      `  const arg${String(index)} = arg${String(index)}Len == 0 ? "" : String.UTF8.decodeUnsafe(arg${String(index)}Ptr, <usize>arg${String(index)}Len, false);`,
    );
  });
  return lines;
}

function emitCallbackInvokeArgs(method: NormalizedHostEventMethod): string {
  return method.args
    .map((_type, index) => method.args[index] === "string" ? `arg${String(index)}` : `arg${String(index)}`)
    .join(", ");
}

function emitHandlerBlock(method: NormalizedHostEventMethod): string {
  const eventName = method.eventName;
  const publicName = eventName.length == 0 ? eventName : `${eventName[0].toUpperCase()}${eventName.slice(1)}`;
  const callbackType = callbackTypeFor(method);
  const exportArgs = emitExportArgs(method);
  const decodedArgs = emitDecodedArgs(method);
  const invokeArgs = emitCallbackInvokeArgs(method);
  const directSignature = `${callbackType} | null`;
  return [
    `let __${eventName}Handler: ${directSignature} = null;`,
    "",
    `export function on${publicName}(callback: ${directSignature}): void {`,
    `  __${eventName}Handler = callback;`,
    `}`,
    "",
    `export function clear${publicName}(): void {`,
    `  __${eventName}Handler = null;`,
    `}`,
    "",
    `export function ${method.exportName}(${exportArgs}): void {`,
    `  const callback = __${eventName}Handler;`,
    `  if (callback === null) {`,
    `    return;`,
    `  }`,
    ...decodedArgs,
    method.args.length == 0
      ? `  callback.invoke();`
      : `  callback.invoke(${invokeArgs});`,
    `}`,
  ].join("\n");
}

async function loadHostEvents(modulePath: string, exportName: string): Promise<unknown> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "fui-host-events-"));
  const bundledFile = path.join(tempDir, "host-events.mjs");
  try {
    await build({
      entryPoints: [modulePath],
      outfile: bundledFile,
      bundle: true,
      format: "esm",
      platform: "node",
      target: "node20",
      logLevel: "silent",
    });
    const loaded = await import(pathToFileURL(bundledFile).href);
    if (!(exportName in loaded)) {
      throw new Error(`Host-events module does not export "${exportName}".`);
    }
    return loaded[exportName as keyof typeof loaded];
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

function emitBindingsFile(
  sourceModulePath: string,
  exportName: string,
  outputPath: string,
  methods: ReturnType<typeof listHostEventMethods>,
  primitivesImportOverride: string | undefined,
): string {
  const callbackImport = primitivesImportOverride ?? relativeImport(outputPath, path.resolve(PACKAGE_DIR, "src/FuiPrimitives.ts"));
  const blocks: Array<string> = [
    "// @ts-nocheck",
    `// Generated by scripts/generate-host-events.ts from ${sourcePathForHeader(sourceModulePath)}#${exportName}.`,
    `import { Callback0, Callback1, Callback2 } from "${callbackImport}";`,
    "",
  ];
  methods.forEach((method, index) => {
    blocks.push(emitHandlerBlock(method));
    if (index + 1 < methods.length) {
      blocks.push("");
      blocks.push("");
    }
  });
  return `${blocks.join("\n")}\n`;
}

async function main(): Promise<void> {
  const [moduleArg, exportName, outputArg, primitivesImportArg] = process.argv.slice(2);
  if (moduleArg === undefined || exportName === undefined || outputArg === undefined) {
    throw new Error("Usage: generate-host-events <module-path> <export-name> <output-path> [primitives-import]");
  }
  const modulePath = path.resolve(process.cwd(), moduleArg);
  const outputPath = path.resolve(process.cwd(), outputArg);
  const registry = await loadHostEvents(modulePath, exportName);
  const methods = listHostEventMethods(registry as never);
  const content = emitBindingsFile(modulePath, exportName, outputPath, methods, primitivesImportArg);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content, "utf8");
}

await main();
