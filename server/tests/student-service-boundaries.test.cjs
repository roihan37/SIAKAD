const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(domain, prisma) {
  const context = { exports: {}, require(name) {
    if (name === '../lib/prisma') return { prisma };
    if (name === '@prisma/client') return { Prisma: { TransactionIsolationLevel: {
      RepeatableRead: 'RepeatableRead', Serializable: 'Serializable',
    } } };
    return {};
  } };
  const file = path.join(__dirname, `../src/services/student-${domain}.service.ts`);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  return Object.values(context.exports)[0];
}

for (const [domain, method, args, isolation] of [
  ['finance', 'getFinance', ['u', 3], 'RepeatableRead'],
  ['finance', 'getUKTBills', ['u'], 'RepeatableRead'],
  ['finance', 'getMyUKT', ['u'], 'RepeatableRead'],
  ['attendance', 'getStudentAttendance', ['u', 3], 'RepeatableRead'],
  ['academic', 'getStudentNilai', ['u', 3], 'RepeatableRead'],
  ['account', 'resetPassword', ['u', 'password'], 'Serializable'],
]) {
  test(`${method} owns one transaction, preserves isolation, and propagates operation/commit failures`, async () => {
    for (const fail of [undefined, 'operation', 'commit']) {
      const events = [], tx = {}, result = {}, failure = new Error(fail);
      const service = load(domain, { async $transaction(fn, options) {
        assert.equal(options.isolationLevel, isolation);
        events.push('begin');
        const value = await fn(tx);
        events.push('commit');
        if (fail === 'commit') throw failure;
        return value;
      } });
      service[`${method}InTransaction`] = async (client, ...received) => {
        events.push('operation');
        assert.equal(client, tx);
        assert.deepEqual(received.slice(0, args.length), args);
        if (domain === 'finance') {
          assert.equal(Object.prototype.toString.call(received.at(-1)), '[object Date]');
          assert.ok(Math.abs(Date.now() - received.at(-1).getTime()) < 5000);
        } else assert.equal(received.length, args.length);
        if (fail === 'operation') throw failure;
        return result;
      };
      if (fail) await assert.rejects(() => service[method](...args), error => error === failure);
      else assert.equal(await service[method](...args), result);
      assert.deepEqual(events, fail === 'operation' ? ['begin', 'operation'] : ['begin', 'operation', 'commit']);
    }
  });
}
