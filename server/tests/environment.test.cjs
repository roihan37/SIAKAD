const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { mkdtempSync, writeFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const run = promisify(execFile);
const configPath = path.resolve(__dirname, '../dist/config/env.js');
const s3Path = path.resolve(__dirname, '../dist/config/s3.js');
const authPath = path.resolve(__dirname, '../dist/auth/config.js');
const base = {
  PATH: process.env.PATH,
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://dummy:private-marker@127.0.0.1:1/test',
  JWT_SECRET: 'private-test-signing-marker-'.repeat(3),
  AWS_REGION: 'us-east-1',
  AWS_BUCKET_NAME: 'test-only-bucket',
  AWS_EC2_METADATA_DISABLED: 'true',
};
function workspace(t) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'siakad-env-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}
async function execute(cwd, code, overrides = {}) {
  const result = await run(process.execPath, ['-e', code], {
    cwd, env: { ...base, HOME: cwd, ...overrides }, timeout: 10000,
  });
  assert.equal(result.stderr, '');
  return result.stdout.trim();
}
const load = `const assert = require('node:assert/strict'); const config = require(${JSON.stringify(configPath)});`;

test('required fields, whitespace, malformed values and diagnostics contain names only', async t => {
  const output = await execute(workspace(t), `${load}
    for (const key of ['DATABASE_URL','JWT_SECRET','AWS_REGION','AWS_BUCKET_NAME']) {
      for (const value of [undefined, '', '   ']) {
        assert.throws(() => config.validateEnv({...process.env, [key]: value}), error => {
          assert.ok(error.message.includes(key));
          assert.ok(!error.message.includes('private-'));
          assert.equal(error.cause, undefined);
          return true;
        });
      }
    }
    for (const [key,value] of [['DATABASE_URL','postgresql://'], ['DATABASE_URL','https://private-marker'], ['JWT_SECRET','private-short'],
      ['AWS_REGION','private invalid'], ['AWS_BUCKET_NAME','https://private-bucket'],
      ['CLIENT_ORIGIN','https://user:private-marker@example.test/path']]) {
      assert.throws(() => config.validateEnv({...process.env,[key]:value}), error => {
        assert.ok(error.message.includes(key)); assert.ok(!error.message.includes(value)); return true;
      });
    }
    assert.equal(config.getEnv().CLIENT_ORIGIN,'http://localhost:5173');
    assert.ok(Object.isFrozen(config.getEnv()));
    assert.equal(config.getEnv().AWS_ACCESS_KEY_ID, undefined);
    console.log('ok');`);
  assert.equal(output, 'ok');
});

test('dotenv loads local settings without overriding deployment environment or logging values', async t => {
  const cwd = workspace(t);
  writeFileSync(path.join(cwd, '.env'), 'JWT_SECRET=file-secret-not-selected\nCLIENT_ORIGIN=https://local.example.test\n');
  assert.equal(await execute(cwd, `${load}
    assert.equal(config.getEnv().JWT_SECRET,${JSON.stringify(base.JWT_SECRET)});
    assert.equal(config.getEnv().CLIENT_ORIGIN,'https://local.example.test');
    console.log('ok');`), 'ok');
});

test('DB-only tooling does not require JWT or storage settings', async t => {
  assert.equal(await execute(workspace(t), `${load}
    assert.equal(config.getDatabaseUrl(),process.env.DATABASE_URL); console.log('ok');`,
    { JWT_SECRET: '', AWS_REGION: '', AWS_BUCKET_NAME: '' }), 'ok');
});

for (const mode of ['production', 'development']) {
  test(`auth cookie behavior preserved in ${mode}`, async t => {
    assert.equal(await execute(workspace(t), `const assert=require('node:assert/strict');
      const auth=require(${JSON.stringify(authPath)});
      assert.equal(auth.refreshCookieOptions.secure,${mode === 'production'});
      assert.equal(auth.refreshCookieOptions.httpOnly,true);
      assert.equal(auth.refreshCookieOptions.sameSite,'strict'); console.log('ok');`, { NODE_ENV: mode }), 'ok');
  });
}

const resolveCredentials = `const assert=require('node:assert/strict');
  const {s3}=require(${JSON.stringify(s3Path)});
  (async()=>{ const credentials=await s3.config.credentials();
    assert.equal(credentials.accessKeyId,'fixture-key');
    assert.equal(credentials.secretAccessKey,'fixture-secret');
    assert.equal(credentials.sessionToken,'fixture-session');
    assert.equal(await s3.config.region(),'us-east-1');
    s3.destroy(); console.log('ok');
  })().catch(()=>{process.exitCode=1;});`;

test('SDK default chain supports temporary environment credentials', async t => {
  assert.equal(await execute(workspace(t), resolveCredentials, {
    AWS_ACCESS_KEY_ID: 'fixture-key', AWS_SECRET_ACCESS_KEY: 'fixture-secret', AWS_SESSION_TOKEN: 'fixture-session',
  }), 'ok');
});

test('SDK default chain supports a local AWS profile', async t => {
  const cwd = workspace(t);
  const credentials = path.join(cwd, 'credentials');
  const awsConfig = path.join(cwd, 'config');
  writeFileSync(credentials, '[local-test]\naws_access_key_id=fixture-key\naws_secret_access_key=fixture-secret\naws_session_token=fixture-session\n');
  writeFileSync(awsConfig, '');
  assert.equal(await execute(cwd, resolveCredentials, {
    AWS_PROFILE: 'local-test', AWS_SHARED_CREDENTIALS_FILE: credentials, AWS_CONFIG_FILE: awsConfig,
  }), 'ok');
});

test('SDK default chain supports container role credentials without static environment keys', async t => {
  const http = require('node:http');
  const { once } = require('node:events');
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify({ AccessKeyId:'fixture-key', SecretAccessKey:'fixture-secret',
      Token:'fixture-session', Expiration:new Date(Date.now()+3600000).toISOString() }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  assert.equal(await execute(workspace(t), resolveCredentials, {
    AWS_CONTAINER_CREDENTIALS_FULL_URI: `http://127.0.0.1:${server.address().port}/credentials`,
  }), 'ok');
});
