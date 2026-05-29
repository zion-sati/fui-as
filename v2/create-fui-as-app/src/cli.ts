#!/usr/bin/env node
import { runCli } from "./scaffold.js";

const code = runCli(process.argv.slice(2), process.cwd(), console);
if (code !== 0) {
  process.exit(code);
}
