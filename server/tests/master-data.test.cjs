const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ts = require('typescript'), express = require('express');
function load(file, imports = {}) {
  const filename = path.join(__dirname, '..', file);
  const context = { exports: {}, require: name => { if (!(name in imports)) throw new Error(`Unexpected dependency ${name}`); return imports[name]; } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return context.exports;
}
const validation = load('src/validation/master-data.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const entries = [
  ['prodi','prodiController','prodi','updateProdi','deleteProdiById',{ name: ' Informatika ' },{ name: 'Informatika' }],
  ['mata-kuliah','mataKuliahController','mataKuliah','updateMataKuliah','deleteMataKuliahById',{ sks: '3' },{ sks: 3 }],
  ['ruangan','ruanganController','ruangan','updateRuangan','deleteRuanganById',{ gedung: null },{ gedung: null }],
  ['tahun-akademik','tahunAkademikController','tahunAkademik','updateTahunAkademik','deleteTahunAkademikById',{ isActive: false },{ isActive: false }],
  ['kurikulum','kurikulumController','kurikulum','updateKurikulum','deleteKurikulumById',{ nama: ' Baru ', isActive: false },{ nama: 'Baru', isActive: false }],
];
function setup(entry, { missing = false, used = false, parentMissing = false } = {}) {
  const writes = [], prisma = {};
  for (const model of ['prodi','mataKuliah','ruangan','tahunAkademik','kurikulum','fakultas']) prisma[model] = {
    findUnique: async () => (model === entry[2] ? missing : parentMissing) ? null : { id: 1, prodiId: 1, _count: { related: used ? 1 : 0 } },
    update: async args => { writes.push({ operation: 'update', ...plain(args) }); return { id: 1, ...args.data }; },
    delete: async args => { writes.push({ operation: 'delete', ...plain(args) }); return { id: 1 }; },
  };
  prisma.kurikulumMataKuliah = { count: async () => used ? 1 : 0 };
  prisma.$transaction = async (callback, options) => { assert.equal(options.isolationLevel, 'Serializable'); return callback(prisma); };
  return { writes, Controller: load(`src/controllers/${entry[1]}.ts`, { '../lib/prisma': { prisma }, '../validation/master-data': validation, '@prisma/client': { Prisma: { TransactionIsolationLevel: { Serializable: 'Serializable' } } } }).Controller };
}
async function invoke(handler, body = {}, id = '1') {
  let status, response, error;
  await handler({ params: { id }, body }, { status(value) { status=value; return this; }, json(value) { response=value; } }, value => { error=value; });
  return { status, response, error };
}
for (const entry of entries) {
  test(`${entry[0]}: partial update, normalization, omitted fields`, async () => {
    const { Controller, writes }=setup(entry);
    assert.equal((await invoke(Controller[entry[3]],entry[5])).status,200);
    assert.deepEqual(writes[0].data,entry[6]);
  });
  test(`${entry[0]}: invalid ID/body and absent record do not write`, async () => {
    const { Controller,writes }=setup(entry);
    for (const id of ['abc','-1','0','1.5','1e2','2147483648']) {
      assert.equal((await invoke(Controller[entry[3]],entry[5],id)).error.name,'BadRequest');
      assert.equal((await invoke(Controller[entry[4]],{},id)).error.name,'BadRequest');
    }
    for (const body of [{},[],null,{ unknown:true }]) assert.equal((await invoke(Controller[entry[3]],body)).error.name,'BadRequest');
    assert.equal(writes.length,0);
    const missing=setup(entry,{missing:true});
    assert.equal((await invoke(missing.Controller[entry[3]],entry[5])).error.name,'NotFound');
    assert.equal((await invoke(missing.Controller[entry[4]])).error.name,'NotFound');
    assert.equal(missing.writes.length,0);
  });
  test(`${entry[0]}: delete guards relations`,async()=>{
    const used=setup(entry,{used:true});
    assert.equal((await invoke(used.Controller[entry[4]])).error.name,'Conflict');assert.equal(used.writes.length,0);
    const free=setup(entry);assert.equal((await invoke(free.Controller[entry[4]])).status,200);
    assert.deepEqual(free.writes,[{operation:'delete',where:{id:1}}]);
  });
  test(`${entry[0]}: PUT/PATCH/DELETE routes have admin guard`,()=>{
    const admin=function adminMiddleware(){};
    const {Controller}=setup(entry);
    const router=load(`src/router/${entry[0]}.ts`,{ express:{default:express},[`../controllers/${entry[1]}`]:{Controller},'../middleware/authMid':{adminMiddleware:admin}}).default;
    for(const method of ['put','patch','delete']) {
      const layer=router.stack.find(layer=>layer.route?.path==='/:id'&&layer.route.methods[method]);
      assert.ok(layer);assert.equal(layer.route.stack[0].handle,admin);assert.equal(layer.route.stack[1].handle,Controller[method==='delete'?entry[4]:entry[3]]);
    }
  });
}
test('reject unsafe coercions, invalid years and boolean strings',()=>{
  for(const value of [true,null,'',NaN,1.2,-1])assert.throws(()=>validation.resourceId(value));
  for(const body of [{isActive:'false'},{tahun:'2026/2028'},{semester:'INVALID'}])assert.throws(()=>validation.patchBody(body,validation.tahunAkademikPatch));
  assert.deepEqual(plain(validation.patchBody({tahun:'2026/2027',semester:'GANJIL',isActive:false},validation.tahunAkademikPatch)),{tahun:'2026/2027',semester:'GANJIL',isActive:false});
});
test('check references and prevent moving linked curriculum',async()=>{
  for(const [entry,body] of [[entries[0],{fakultasId:99}],[entries[4],{prodiId:99}]]) {
    const {Controller,writes}=setup(entry,{parentMissing:true});assert.equal((await invoke(Controller[entry[3]],body)).error.name,'NotFound');assert.equal(writes.length,0);
  }
  const {Controller,writes}=setup(entries[4],{used:true});assert.equal((await invoke(Controller.updateKurikulum,{prodiId:2})).error.name,'Conflict');assert.equal(writes.length,0);
});
