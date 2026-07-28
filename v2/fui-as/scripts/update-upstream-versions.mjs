import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const packagePath = join(packageDirectory, 'package.json');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const runtimeVersion = execFileSync(
  npm,
  ['view', '@effindomv2/runtime', 'dist-tags.latest'],
  { encoding: 'utf8' },
).trim();
if (!versionPattern.test(runtimeVersion)) {
  throw new Error(`npm returned an invalid EffinDOM runtime version: ${JSON.stringify(runtimeVersion)}`);
}

const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
packageJson.dependencies['@effindomv2/runtime'] = runtimeVersion;
writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
execFileSync(npm, ['install', '--package-lock-only', '--ignore-scripts'], {
  cwd: packageDirectory,
  stdio: 'inherit',
});
console.log(`Pinned @effindomv2/runtime@${runtimeVersion}.`);
