const assert=require('node:assert/strict');
const root=process.cwd();
const {prisma}=require(root+'/src/lib/prisma');
const {seedCampus}=require(root+'/prisma/seed-data/campus');
const db={};let sequence=1;
function match(row,where={}) {return Object.entries(where).every(([key,value])=>{
 if(key==='krs')return db.kRS.some(x=>x.mahasiswaId===row.id&&match(x,value.some));
 if(key==='details')return db.kRSDetail.some(x=>x.krsId===row.id&&match(x,value.some));
 if(key==='krsDetail')return match(db.kRSDetail.find(x=>x.id===row.krsDetailId),value);
 if(value&&typeof value==='object'){
  if('in' in value)return value.in.includes(row[key]);
  if('startsWith' in value)return row[key]?.startsWith(value.startsWith);
  if(!(key in row))return match(row,value);
 }
 return row[key]===value;
});}
const tx=new Proxy({}, {get(_,model){db[model]??=[];return {
 upsert:async({where,update,create})=>{let row=db[model].find(x=>match(x,where));if(row)Object.assign(row,update);else{row={id:sequence++,...create};db[model].push(row);}return {...row};},
 create:async({data})=>{const row={id:sequence++,...data};db[model].push(row);return {...row};},
 findUnique:async({where})=>db[model].find(x=>match(x,where))??null,
 deleteMany:async({where}={})=>{if(model==='jadwal'){const ids=db[model].filter(x=>match(x,where)).map(x=>x.id);const sessions=(db.pertemuan??[]).filter(x=>ids.includes(x.jadwalId)).map(x=>x.id);db.absensi=(db.absensi??[]).filter(x=>!sessions.includes(x.pertemuanId));db.pertemuan=(db.pertemuan??[]).filter(x=>!ids.includes(x.jadwalId));}db[model]=db[model].filter(x=>!match(x,where));},
 delete:async({where})=>{db[model]=db[model].filter(x=>!match(x,where));},
 updateMany:async({where,data})=>{db[model].filter(x=>match(x,where)).forEach(x=>Object.assign(x,data));},
 findMany:async({where,include}={})=>db[model].filter(x=>match(x,where)).map(x=>include?.kelasMataKuliah?{...x,tahunAkademik:db.tahunAkademik.find(a=>a.id===x.tahunAkademikId),kelasMataKuliah:{...db.kelasMataKuliah.find(a=>a.id===x.kelasMataKuliahId),mataKuliah:db.mataKuliah.find(c=>c.id===db.kelasMataKuliah.find(a=>a.id===x.kelasMataKuliahId).mataKuliahId)}}:{...x})
};}});
prisma.$transaction=async fn=>fn(tx);
(async()=>{
for(let run=0;run<2;run++){
 const targets=await seedCampus();assert.equal(targets.length,2);
 for(const [model,count] of Object.entries({user:23,fakultas:2,prodi:2,dosen:6,mahasiswa:16,kelas:4,jadwal:24,kRS:28,kRSDetail:168,transkrip:96,periodeKRS:2,riwayatStatusMahasiswa:16,pertemuan:16,absensi:64}))assert.equal(db[model].length,count,model);
 for(const mark of db.absensi){const session=db.pertemuan.find(x=>x.id===mark.pertemuanId);assert.equal(session.status,'SELESAI');const schedule=db.jadwal.find(x=>x.id===session.jadwalId);assert.ok(db.kRS.some(k=>k.mahasiswaId===mark.mahasiswaId&&k.tahunAkademikId===schedule.tahunAkademikId&&k.status==='DISETUJUI'&&db.kRSDetail.some(d=>d.krsId===k.id&&d.kelasMataKuliahId===schedule.kelasMataKuliahId&&d.status==='DISETUJUI')));}
 assert.equal(db.tahunAkademik.filter(x=>x.isActive).length,1);
 for(const detail of db.kRSDetail){const krs=db.kRS.find(x=>x.id===detail.krsId),assignment=db.kelasMataKuliah.find(x=>x.id===detail.kelasMataKuliahId),kelas=db.kelas.find(x=>x.id===assignment.kelasId),student=db.mahasiswa.find(x=>x.id===krs.mahasiswaId);assert.equal(kelas.tahunAkademikId,krs.tahunAkademikId);assert.equal(kelas.prodiId,student.prodiId);}
 for(const grade of db.transkrip){const detail=db.kRSDetail.find(x=>x.id===grade.krsDetailId),krs=db.kRS.find(x=>x.id===detail.krsId);assert.equal(grade.mahasiswaId,krs.mahasiswaId);assert.equal(detail.status,'DISETUJUI');assert.equal(db.tahunAkademik.find(x=>x.id===krs.tahunAkademikId).isActive,false);}
}
console.log('PASS: seed twice, stable counts, academic-year/program relations, transcript ownership, historical grades only. Mock database; no live writes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
