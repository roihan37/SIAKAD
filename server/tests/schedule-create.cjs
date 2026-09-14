const assert = require('node:assert/strict');
const { jadwalCreate } = require('../src/validation/academic-data');
const { validateSchedule } = require('../src/services/schedule.service');
const { Controller } = require('../src/controllers/jadwalController');
const { prisma } = require('../src/lib/prisma');
const body = { kelasMataKuliahId: 1, tahunAkademikId: 2, ruanganId: 3, hari: 'SENIN', jamMulai: '08:00', jamSelesai: '10:30' };
async function main() {
  for (const invalid of [undefined, {}, { ...body, ruanganId: 0 }, { ...body, hari: 'MINGGU' }, { ...body, jamMulai: '25:90' }, { ...body, jamMulai: '8:00' }, { ...body, extra: true }, { ...body, kelasMataKuliahId: [] }]) assert.throws(() => jadwalCreate(invalid));
  assert.equal(jadwalCreate({ ...body, ruanganId: '3' }).ruanganId, 3);
  let existing = [];
  let writes = 0;
  const tx = {
    kelasMataKuliah: { findUnique: async () => ({ dosenId: 'lecturer', kelasId: 4, kelas: { tahunAkademikId: 2 } }) },
    tahunAkademik: { findUnique: async () => ({ id: 2 }) }, ruangan: { findUnique: async () => ({ id: 3 }) },
    jadwal: {
      findFirst: async ({ where: w }) => {
        assert.deepEqual(w.OR, [{ ruanganId: 3 }, { kelasMataKuliah: { dosenId: 'lecturer' } }, { kelasMataKuliah: { kelasId: 4 } }]);
        return existing.find(row => row.id !== w.id?.not && row.hari === w.hari && row.tahunAkademikId === w.tahunAkademikId && row.jamMulai < w.jamMulai.lt && row.jamSelesai > w.jamSelesai.gt && (row.ruanganId === 3 || row.dosenId === 'lecturer' || row.kelasId === 4)) ?? null;
      },
      create: async ({ data }) => { writes++; assert.equal(data.hariUrutan, 1); return { id: 5, ...data }; },
    },
  };
  await assert.rejects(() => validateSchedule(tx, { ...body, jamSelesai: '08:00' }), e => e.name === 'BadRequest');
  await assert.rejects(() => validateSchedule(tx, { ...body, tahunAkademikId: 9 }), e => e.name === 'BadRequest');
  for (const model of ['kelasMataKuliah', 'tahunAkademik', 'ruangan']) await assert.rejects(() => validateSchedule({ ...tx, [model]: { findUnique: async () => null } }, body), e => e.name === 'NotFound');
  for (const resource of [{ ruanganId: 3 }, { dosenId: 'lecturer' }, { kelasId: 4 }]) {
    existing = [{ id: 5, tahunAkademikId: 2, hari: 'SENIN', jamMulai: '09:00', jamSelesai: '11:00', ...resource }];
    await assert.rejects(() => validateSchedule(tx, body), e => e.name === 'Conflict');
    await validateSchedule(tx, body, 5);
  }
  existing = [{ id: 5, tahunAkademikId: 2, hari: 'SENIN', jamMulai: '10:30', jamSelesai: '12:00', ruanganId: 3 }];
  await validateSchedule(tx, body);
  prisma.$transaction = async (fn, options) => { assert.equal(options.isolationLevel, 'Serializable'); return fn(tx); };
  await Controller.createJadwal({ body }, { status(code) { assert.equal(code, 201); return this; }, json(result) { assert.equal(result.data.id, 5); assert.deepEqual(result.data, result.j); } }, e => { throw e; });
  assert.equal(writes, 1);
  existing[0].jamMulai = '09:00';
  let error;
  await Controller.createJadwal({ body }, {}, e => { error = e; }); assert.equal(error.name, 'Conflict'); assert.equal(writes, 1);
  const route = require('../src/router/jadwal').default.stack.find(layer => layer.route?.methods.post).route;
  assert.equal(route.stack[0].handle, require('../src/middleware/authMid').adminMiddleware);
  console.log('PASS: required fields, IDs/time/day, relations, room/lecturer/class conflicts, adjacent slots, self-exclusion, transaction and admin route (mock DB)');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
