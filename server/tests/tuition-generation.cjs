const assert=require('node:assert/strict');const {prisma}=require('../src/lib/prisma');const {Controller}=require('../src/controllers/adminController');const {billGenerationBody}=require('../src/validation/tuition');
const body={tahunAkademikId:3,prodiId:1,angkatan:2024,nominal:5000000,jatuhTempo:'2026-09-30'};
assert.equal(billGenerationBody(body).jatuhTempo.toISOString(),'2026-09-30T16:59:59.999Z');
for(const patch of [{nominal:0},{nominal:-1},{nominal:'1.234'},{jatuhTempo:'2026-02-30'},{prodiId:[]},{angkatan:1}])assert.throws(()=>billGenerationBody({...body,...patch}));
(async()=>{
const bills=new Set(['s0']);let result;
prisma.$transaction=async fn=>fn({tahunAkademik:{findUnique:async()=>({id:3})},prodi:{findUnique:async()=>({id:1})},mahasiswa:{findMany:async args=>{assert.deepEqual(args.where,{prodiId:1,angkatan:2024,status:'Aktif'});return ['s0','s1','s2'].map(id=>({id}));}},tagihanUKT:{createMany:async args=>{assert.equal(args.skipDuplicates,true);let count=0;for(const row of args.data){assert.equal(row.nominal.toString(),'5000000');if(!bills.has(row.mahasiswaId)){bills.add(row.mahasiswaId);count++;}}return {count};}}});
const res={status(code){assert.equal(code,200);return this;},json(data){result=data;}};
await Controller.generateBillsUKT({body},res,e=>{throw e;});assert.deepEqual(result.data,{generated:2,skipped:1});
await Controller.generateBillsUKT({body},res,e=>{throw e;});assert.deepEqual(result.data,{generated:0,skipped:3});
console.log('PASS: input/date validation, active student filter, generated/skipped counts and repeated request');
})().catch(e=>{console.error(e);process.exitCode=1;});
