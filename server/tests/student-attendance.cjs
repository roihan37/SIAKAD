const assert=require('node:assert/strict');
const {Controller}=require('../src/controllers/studentController');
const {prisma}=require('../src/lib/prisma');
(async()=>{
for(const scenario of ['data','empty','missingStudent','missingYear','failure']){
 let result,error;
 prisma.$transaction=async(fn)=>fn({
  user:{findUnique:async args=>{assert.deepEqual(args.where,{id:'u1',role:'Mahasiswa'});return scenario==='missingStudent'?null:{mahasiswa:{id:'s1'}};}},
  tahunAkademik:{findUnique:async()=>scenario==='missingYear'?null:{id:3,tahun:'2026/2027',semester:'GANJIL'}},
  absensi:{findMany:async args=>{assert.deepEqual(args.where,{mahasiswaId:'s1',pertemuan:{jadwal:{tahunAkademikId:3}}});if(scenario==='failure')throw new Error('db');return scenario==='empty'?[]:['HADIR','IZIN','SAKIT','ALPHA','HADIR'].map((status,i)=>({status,pertemuan:{jadwal:{kelasMataKuliah:{mataKuliah:{id:i===4?2:1,kode:i===4?'IF302':'IF301',nama:'Course'}}}}}));}}
 });
 await Controller.getStudentAttendance({params:{id:'u1'},query:{tahunAkademikId:'3'}},{status(n){assert.equal(n,200);return this;},json(x){result=x;}},e=>error=e);
 if(scenario==='data'){assert.equal(result.data.summary.attendancePercentage,40);assert.equal(result.data.courses[0].meetings,4);assert.equal(result.data.courses[0].attendance.percentage,25);assert.equal(result.data.courses[1].attendance.percentage,100);}
 else if(scenario==='empty'){assert.equal(result.data.summary.totalRecords,0);assert.equal(result.data.summary.attendancePercentage,0);assert.deepEqual(result.data.courses,[]);}
 else assert.ok(error);
}
for(const value of [undefined,'0',['3'],'abc']){let error;prisma.$transaction=()=>assert.fail();await Controller.getStudentAttendance({params:{id:'u1'},query:{tahunAkademikId:value}},{},e=>error=e);assert.equal(error.name,'BadRequest');}
const route=require('../src/router/students').default.stack.find(x=>x.route?.path==='/:id/presensi').route;
assert.equal(route.stack[0].handle,require('../src/middleware/authMid').adminOrMahasiswaMiddleware);
console.log('PASS: student/year scope, counts, per-course percentages, empty results, errors, validation and ownership guard');
})().catch(e=>{console.error(e);process.exitCode=1;});
