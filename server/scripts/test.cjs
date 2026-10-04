const { cpSync, mkdtempSync, readdirSync, rmSync, symlinkSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const workspace = mkdtempSync(path.join(tmpdir(), 'siakad-tests-'));
function discover(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === 'support') return [];
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? discover(filename) : entry.name.endsWith('.cjs') ? [filename] : [];
  }).sort();
}
function run(args, env) {
  const result = spawnSync(process.execPath, args, {
    cwd: workspace, env, stdio: 'inherit', timeout: 180000,
  });
  if (result.error) console.error(`Test tooling failed: ${result.error.code}`);
  return result.status ?? 1;
}
try {
  for (const name of ['src', 'prisma', 'tests', 'tsconfig.json', 'tsconfig.build.json', 'package.json']) {
    cpSync(path.join(root, name), path.join(workspace, name), { recursive: true });
  }
  symlinkSync(path.join(root, 'node_modules'), path.join(workspace, 'node_modules'), 'junction');
  const env = {
    PATH: process.env.PATH,
    ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
    HOME: workspace, USERPROFILE: workspace, TMPDIR: workspace, TMP: workspace, TEMP: workspace,
    NODE_ENV: 'test', TZ: 'UTC',
    DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/siakad_test',
    JWT_SECRET: 'test-only-signing-secret-'.repeat(3),
    CLIENT_ORIGIN: 'http://localhost:5173',
    AWS_REGION: 'us-east-1', AWS_BUCKET_NAME: 'test-only-bucket',
    AWS_EC2_METADATA_DISABLED: 'true',
    AWS_CONFIG_FILE: path.join(workspace, 'no-aws-config'),
    AWS_SHARED_CREDENTIALS_FILE: path.join(workspace, 'no-aws-credentials'),
  };
  const files = discover(path.join(workspace, 'tests'));
  if (!files.length) throw new Error('No backend test files discovered');
  console.log(`Discovered ${files.length} backend test files:\n${files.map(file => path.relative(workspace, file)).join('\n')}`);
  // Build fresh smoke-test artifacts here, never into the developer's dist/.
  process.exitCode = run([require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.build.json'], env);
  if (!process.exitCode) {
    env.NODE_OPTIONS = `--require=${JSON.stringify(path.join(workspace, 'tests/support/network-guard.cjs'))}`;
    process.exitCode = run(['--test', '--test-concurrency=1', '--test-timeout=30000',
      '--require', path.join(workspace, 'tests/support/setup.cjs'), ...files], env);
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
