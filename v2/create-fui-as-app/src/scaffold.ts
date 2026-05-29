import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createTemplateFiles, type TemplateName } from "./templates.js";

export interface ScaffoldOptions {
  readonly targetDirectory: string;
  readonly projectName: string;
  readonly template?: TemplateName;
}

export interface LoggerLike {
  log(message: string): void;
  error(message: string): void;
}

function normalizePackageName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "") || "fui-as-app";
}

function assertDirectoryIsEmpty(targetDirectory: string): void {
  mkdirSync(targetDirectory, { recursive: true });
  const entries = readdirSync(targetDirectory);
  if (entries.length > 0) {
    throw new Error(`Target directory is not empty: ${targetDirectory}`);
  }
}

export function createProject(options: ScaffoldOptions): void {
  assertDirectoryIsEmpty(options.targetDirectory);
  const templateFiles = createTemplateFiles(options.template ?? "hello", {
    projectName: options.projectName,
    packageName: normalizePackageName(options.projectName),
  });

  for (const [relativePath, contents] of templateFiles) {
    const absolutePath = resolve(options.targetDirectory, relativePath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, contents, "utf8");
  }
}

interface ParsedCliOptions {
  readonly requestedPath: string | null;
  readonly template: TemplateName;
  readonly error: string | null;
}

function parseCliOptions(argv: readonly string[]): ParsedCliOptions {
  let requestedPath: string | null = null;
  let template: TemplateName = "hello";

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--template") {
      const value = argv.at(index + 1);
      if (value === undefined) {
        return { requestedPath, template, error: "--template requires a value (hello or mvc)." };
      }
      if (value !== "hello" && value !== "mvc") {
        return { requestedPath, template, error: `Unsupported template: ${value}` };
      }
      template = value;
      index += 1;
      continue;
    }

    if (argument.startsWith("--template=")) {
      const value = argument.slice("--template=".length);
      if (value !== "hello" && value !== "mvc") {
        return { requestedPath, template, error: `Unsupported template: ${value}` };
      }
      template = value;
      continue;
    }

    if (argument.startsWith("-")) {
      return { requestedPath, template, error: `Unknown option: ${argument}` };
    }

    if (requestedPath !== null) {
      return { requestedPath, template, error: `Unexpected argument: ${argument}` };
    }
    requestedPath = argument;
  }

  return { requestedPath, template, error: null };
}

function printUsage(logger: LoggerLike): void {
  logger.error("Usage: create-fui-as-app <project-directory> [--template hello|mvc]");
}

export function runCli(argv: readonly string[], cwd: string, logger: LoggerLike): number {
  const parsed = parseCliOptions(argv);
  if (parsed.error !== null) {
    logger.error(parsed.error);
    printUsage(logger);
    return 1;
  }

  const requestedPath = parsed.requestedPath;
  if (requestedPath === null || requestedPath.length === 0) {
    printUsage(logger);
    return 1;
  }

  const targetDirectory = resolve(cwd, requestedPath);
  const projectName = requestedPath === "." ? "fui-as-app" : requestedPath;

  try {
    createProject({
      targetDirectory,
      projectName,
      template: parsed.template,
    });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  logger.log(`Created ${projectName} (${parsed.template} template) at ${targetDirectory}`);
  logger.log("Next steps:");
  logger.log(`  cd ${requestedPath}`);
  logger.log("  npm install");
  logger.log("  npm run dev");
  return 0;
}
