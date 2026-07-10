import path from "node:path";
import { generateAssemblyScriptHostEventsFile } from "./hostgen/assemblyscript-host-events";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    throw new Error("Usage: generate-host-events <module-path> <export-name> <output-path> [primitives-import]");
  }
  const [moduleArg, exportName, outputArg, primitivesImportArg] = args as [
    string,
    string,
    string,
    string | undefined,
  ];
  await generateAssemblyScriptHostEventsFile(
    path.resolve(process.cwd(), moduleArg),
    exportName,
    path.resolve(process.cwd(), outputArg),
    primitivesImportArg,
  );
}

await main();
