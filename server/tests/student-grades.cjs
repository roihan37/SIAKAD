const assert=require('node:assert/strict');const {prisma}=require('../src/lib/prisma');const {Controller}=require('../src/controllers/studentController');
const detail=(id,weight,sks=3)=>({id:`detail-${id}`,kelasMataKuliah:{mataKuliah:{id,kode:`MK${id}`,nama:'Course',sks}},transkrip:weight===null?[]:[{bobot:weight,nilaiAngka:80,nilaiHuruf:'B'}]});
(async()=>{
for(const scenario of ['grades','empty','missingYear','noKrs','duplicate','conflict','invalid','incomplete']){
 let result,error;
 prisma.$transaction=async(fn,options)=>{assert.equal(options.isolationLevel,'RepeatableRead');return fn({user:{findUnique:async()=>({mahasiswa:{id:'m'}})},tahunAkademik:{findUnique:async()=>scenario==='missingYear'?null:{id:3,tahun:'2026/2027',semester:'GANJIL'}},kRS:{findUnique:async()=>null,findMany:async args=>{
 assert.equal(args.where.status,'DISETUJUI');assert.equal(args.select.details.where.status,'DISETUJUI');assert.deepEqual(args.where.tahunAkademik.OR,[{tahun:{lt:'2026/2027'}},{tahun:'2026/2027',semester:'GANJIL'}]);
 if(scenario==='noKrs')return [];
 return [{tahunAkademikId:2,tahunAkademik:{tahun:'2025/2026',semester:'GENAP'},details:[detail(1,4),detail(2,3)]},{tahunAkademikId:3,tahunAkademik:{tahun:'2026/2027',semester:'GANJIL'},details:scenario==='empty'?[]:[detail(1,scenario==='invalid'?5:2),detail(3,0),detail(4,null),...(scenario==='duplicate'?[detail(1,2)]:scenario==='conflict'?[detail(1,3)]:scenario==='incomplete'?[{...detail(5,3),transkrip:[{bobot:3,nilaiAngka:null,nilaiHuruf:null}]}]:[])]}];
 }}});};
 await Controller.getStudentNilai({params:{id:'u'},query:{tahunAkademikId:'3'}},{status(n){assert.equal(n,200);return this;},json(x){result=x;}},e=>error=e);
 if(['grades','duplicate','incomplete'].includes(scenario)){assert.deepEqual(result.nilai.summary,{totalSKS:6,ips:1,ipk:1.67});assert.equal(result.nilai.details.length,2);}
 if(scenario==='empty')assert.deepEqual(result.nilai.summary,{totalSKS:0,ips:0,ipk:3.5});
 if(scenario==='missingYear')assert.equal(error.name,'NotFound');
 if(scenario==='noKrs'){assert.equal(result.nilai,null);assert.equal(result.reason,'KRS_NOT_FOUND');}
 if(['conflict','invalid'].includes(scenario))assert.equal(error.name,'Conflict');
}
for(const id of [undefined,['3'],'abc','0']){let error;prisma.$transaction=()=>assert.fail();await Controller.getStudentNilai({params:{id:'u'},query:{tahunAkademikId:id}},{},e=>error=e);assert.equal(error.name,'BadRequest');}
console.log('PASS: latest repeat grade, zero/null weights, selected-period/status filters, empty KRS, missing year, invalid queries');
})().catch(e=>{console.error(e);process.exitCode=1;});
