const assert=require('node:assert/strict');
const {attendanceFilters,attendanceCounts,percentage,meetingResponse}=require('../src/services/attendance.service');
const {Controller}=require('../src/controllers/attendanceController');
const {prisma}=require('../src/lib/prisma');
(async()=>{
assert.equal(percentage(97,144),67.4);assert.equal(percentage(0,0),0);
assert.deepEqual(attendanceCounts([{status:'HADIR'},{status:'SAKIT'},{status:'ALPHA'},{status:'IZIN'}]),{present:1,permission:1,sick:1,absent:1,total:4});
for(const query of [{page:0},{limit:101},{tahunAkademikId:'abc'},{search:['x']},{dosenId:[]}])assert.throws(()=>attendanceFilters(query));
const filters=attendanceFilters({tahunAkademikId:'3',kelasId:'5',prodiId:'1',mataKuliahId:'10',dosenId:'d1',search:'Andi'});assert.equal(filters.structural.kelasMataKuliah.dosenId,'d1');assert.equal(filters.where.OR.length,5);
prisma.absensi.groupBy=async()=>[{status:'HADIR',_count:{_all:97}},{status:'IZIN',_count:{_all:20}},{status:'SAKIT',_count:{_all:15}},{status:'ALPHA',_count:{_all:12}}];
let result;const res={json(value){result=value;}};await Controller.summary({query:{}},res,e=>{throw e});assert.equal(result.data.averageAttendance,67.4);assert.equal(result.data.totalAttendanceRecords,144);
prisma.absensi.findMany=async()=>[5,5,6].map((id,i)=>({status:i===1?'ALPHA':'HADIR',mahasiswa:{id:'s1',nim:'001',user:{id:'u1',name:'Andi'},prodi:{id:1,name:'TI'}},pertemuan:{jadwal:{kelasMataKuliah:{kelas:{id,nama:'TI'}}}}}));
await Controller.students({query:{limit:'1'}},res,e=>{throw e});assert.equal(result.data.pagination.totalRows,2);assert.equal(result.data.students[0].attendance.percentage,50);assert.equal(result.data.students.length,1);
prisma.pertemuan.findFirst=async()=>null;let error;await Controller.meetingDetail({params:{meetingId:'missing'},query:{}},res,e=>error=e);assert.equal(error.name,'NotFound');
const row={id:'m1',pertemuan:1,tanggal:new Date('2026-08-16T18:00:00Z'),jadwal:{kelasMataKuliah:{mataKuliah:{id:1,kode:'TI',nama:'DB'},kelas:{id:2,nama:'TI-3A'},dosen:{user:{id:'u',name:'Dosen'}}}}};assert.equal(meetingResponse(row).date,'2026-08-17');
const router=require('../src/router/admin').default;const guard=require('../src/middleware/authMid').adminMiddleware;const routes=router.stack.filter(x=>x.route?.path.startsWith('/presensi'));assert.equal(routes.length,5);assert.ok(routes.every(x=>x.route.stack[0].handle===guard));
console.log('PASS: filters, counts, percentages, grouped student pagination, detail 404, Jakarta date, five admin guards');
})().catch(e=>{console.error(e);process.exitCode=1;});
