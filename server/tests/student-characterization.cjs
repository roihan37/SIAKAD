/**
 * Characterization tests for StudentController behavior preservation.
 * These tests document CURRENT behavior before refactoring.
 */

const assert = require('node:assert/strict');
const { Controller } = require('../src/controllers/studentController');
const { prisma } = require('../src/lib/prisma');
const { S3Service } = require('../src/services/s3.service');

// Mock S3Service methods to avoid real network calls in tests
S3Service.deleteUrl = async () => {};
S3Service.createReadUrl = async (key) => `https://example.com/${key}`;

function makeRequest(options = {}) {
  return {
    params: { id: 'user-123', userId: 'user-123', ...options.params },
    query: options.query || {},
    body: options.body || {},
    userLogin: options.userLogin || { id: 'admin-1', role: 'Admin' },
  };
}

function makeResponse() {
  let statusCode = 200;
  let body = null;
  return {
    status(code) { statusCode = code; return this; },
    json(data) { body = data; return this; },
    getStatusCode() { return statusCode; },
    getBody() { return body; },
  };
}

function makeNext() {
  let error = null;
  return (err) => { error = err; };
}

function mockUser(mahasiswaData = {}) {
  return {
    id: 'user-123',
    name: 'Test Student',
    email: 'test@example.com',
    username: 'testuser',
    phoneNumber: '+6281234567890',
    address: 'Jl. Test No. 1',
    birthDate: '2000-01-01',
    gender: 'Male',
    nik: '1234567890123456',
    birthPlace: 'Jakarta',
    avatarKey: null,
    role: 'Mahasiswa',
    mahasiswa: {
      id: 'm1',
      nim: '12345',
      angkatan: 2024,
      semester: 1,
      status: 'Aktif',
      prodiId: 1,
      dosenId: 'd1',
      riwayatStatus: [],
      ...mahasiswaData,
    },
  };
}

async function testCreateStudent() {
  console.log('Testing createStudent...');
  prisma.$transaction = async (fn) => {
    const tx = {
      user: { create: async () => ({ id: 'new-user', name: 'Test Student' }) },
      mahasiswa: { create: async () => ({ id: 'mahasiswa-id' }) },
    };
    return fn(tx);
  };
  const req = makeRequest({ body: { name: 'Test', email: 't@e.com', username: 'test', password: 'password123', nim: '12345', angkatan: 2024, semester: 1, status: 'Aktif', prodiId: 1 } });
  const res = makeResponse();
  await Controller.createStudent(req, res, () => {});
  assert.equal(res.getStatusCode(), 201);
  assert.ok(res.getBody().message.includes('created successfully'));
}

async function testUpdateStudentById() {
  console.log('Testing updateStudentById...');
  const existingUser = mockUser();
  prisma.user.findUnique = async () => existingUser;
  prisma.$transaction = async (fn) => {
    return fn({
      user: { update: async () => ({ ...existingUser, name: 'Updated Name' }) },
      mahasiswa: { update: async () => ({ ...existingUser.mahasiswa }) },
      riwayatStatusMahasiswa: { create: async () => ({}) },
    });
  };
  const req = makeRequest({ params: { id: 'user-123' }, body: { name: 'Updated Name' } });
  const res = makeResponse();
  await Controller.updateStudentById(req, res, () => {});
  assert.equal(res.getStatusCode(), 200);
  assert.ok(res.getBody().data.nama === 'Updated Name' || res.getBody().message === 'Mahasiswa berhasil diperbarui');
}

async function testUpdateStudentByIdRequiresReasonWhenChangingStatus() {
  console.log('Testing updateStudentById status change validation...');
  const existingUser = mockUser();
  prisma.user.findUnique = async () => existingUser;
  const req = makeRequest({ params: { id: 'user-123' }, body: { status: 'Cuti' } });
  const res = makeResponse();
  let error;
  await Controller.updateStudentById(req, res, (e) => { error = e; });
  assert.equal(error.name, 'BadRequest');
  assert.ok(error.message.includes('Alasan'));
}

async function testDeleteUserById() {
  console.log('Testing deleteUserById...');
  const user = { id: 'user-123', name: 'Student', avatarKey: 'students/user-123/avatar.jpg', mahasiswa: { id: 'm1' } };
  prisma.$transaction = async (fn) => {
    const tx = {
      user: { findUnique: async () => user, delete: async () => user },
      transkrip: { deleteMany: async () => ({}) },
      kRSDetail: { deleteMany: async () => ({}) },
      kRS: { deleteMany: async () => ({}) },
    };
    return fn(tx);
  };
  const req = makeRequest({ params: { id: 'user-123' } });
  const res = makeResponse();
  await Controller.deleteUserById(req, res, () => {});
  assert.equal(res.getStatusCode(), 200);
  assert.ok(res.getBody().message.includes('hapus'));
}

async function testDeleteUserByIdNotFound() {
  console.log('Testing deleteUserById not found...');
  prisma.$transaction = async (fn) => {
    const tx = {
      user: { findUnique: async () => null },
      transkrip: { deleteMany: async () => ({}) },
      kRSDetail: { deleteMany: async () => ({}) },
      kRS: { deleteMany: async () => ({}) },
    };
    return fn(tx);
  };
  const req = makeRequest({ params: { id: 'missing' } });
  const res = makeResponse();
  let error;
  await Controller.deleteUserById(req, res, (e) => { error = e; });
  assert.equal(error.name, 'NotFound');
}

async function testBulkUpdateStatus() {
  console.log('Testing bulkUpdateStatus...');
  const users = [{ id: 'u1', mahasiswa: { id: 'm1', status: 'Aktif' } }, { id: 'u2', mahasiswa: { id: 'm2', status: 'Aktif' } }];
  prisma.user.findMany = async () => users;
  prisma.$transaction = async (fn) => {
    await fn({ mahasiswa: { update: async () => ({}) }, riwayatStatusMahasiswa: { create: async () => ({}) } });
    return {};
  };
  const req = makeRequest({ body: { ids: ['u1', 'u2'], status: 'Cuti', statusReason: 'Sakit' } });
  const res = makeResponse();
  await Controller.bulkUpdateStatus(req, res, () => {});
  assert.equal(res.getStatusCode(), 200);
}

async function testBulkUpdateStatusInvalid() {
  console.log('Testing bulkUpdateStatus invalid status...');
  const req = makeRequest({ body: { ids: ['u1'], status: 'InvalidStatus', statusReason: 'Test' } });
  const res = makeResponse();
  let error;
  await Controller.bulkUpdateStatus(req, res, (e) => { error = e; });
  assert.equal(error.name, 'BadRequest');
}

async function testBulkUpdateStatusMaxIds() {
  console.log('Testing bulkUpdateStatus max IDs limit...');
  const ids = Array(101).fill('u1').map((_, i) => `u${i}`);
  const req = makeRequest({ body: { ids, status: 'Cuti', statusReason: 'Test' } });
  const res = makeResponse();
  let err;
  await Controller.bulkUpdateStatus(req, res, (e) => { err = e; });
  // Either error via next OR status 400 via response
  assert.ok(err?.name === 'BadRequest' || res.getStatusCode() === 400, 'Expected BadRequest error or 400 status');
}

async function testResetPassword() {
  console.log('Testing resetPassword...');
  const mockUser = { id: 'user-123', name: 'Student', role: 'Mahasiswa', mahasiswa: { id: 'm1', nim: '12345' } };
  prisma.user.findUnique = async () => mockUser;
  prisma.$transaction = async (fn) => {
    const tx = {
      user: { findUnique: async () => mockUser, update: async () => ({}) },
      refreshToken: { updateMany: async () => ({}) },
    };
    return fn(tx);
  };
  const req = makeRequest({ params: { userId: 'user-123' }, body: { password: 'newpassword123' } });
  const res = makeResponse();
  await Controller.resetPassword(req, res, () => {});
  assert.equal(res.getStatusCode(), 200);
  assert.ok(res.getBody().message.includes('reset'));
  assert.equal(res.getBody().data.mustChangePassword, true);
}

async function testResetPasswordWeakPassword() {
  console.log('Testing resetPassword weak password rejection...');
  prisma.$transaction = async (fn) => fn({});
  const req = makeRequest({ params: { userId: 'user-123' }, body: { password: 'short' } });
  const res = makeResponse();
  let error;
  await Controller.resetPassword(req, res, (e) => { error = e; });
  assert.equal(error.name, 'BadRequest');
}

async function testGetAllStudents() {
  console.log('Testing getAllStudents pagination...');
  const students = [{ id: 's1', name: 'Student 1', role: 'Mahasiswa', avatarUrl: null, mahasiswa: { id: 'm1', nim: '12345', status: 'Aktif', semester: 1, prodi: { name: 'Teknik Informatika' } } }];
  prisma.user.findMany = async () => students;
  prisma.user.count = async () => 1;
  const req = makeRequest({ params: { id: 'all' }, query: { page: '1', limit: '10' } });
  const res = makeResponse();
  await Controller.getAllStudents(req, res, () => {});
  assert.equal(res.getStatusCode(), 200);
  assert.ok(res.getBody().students);
  assert.ok(res.getBody().pagination);
}

async function testGetStudentById() {
  console.log('Testing getStudentById...');
  const student = {
    id: 'user-123', name: 'Student', email: 'student@example.com', phoneNumber: '+6281234567890', address: 'Jl. Test No. 1',
    birthDate: '2000-01-01', gender: 'Male', nik: '1234567890123456', birthPlace: 'Jakarta',
    avatarKey: 'students/user-123/avatar.jpg',
    mahasiswa: {
      id: 'm1', nim: '12345', angkatan: 2024, semester: 1, status: 'Aktif', riwayatStatus: [],
      prodi: { id: 1, name: 'Teknik Informatika', fakultas: { id: 1, name: 'FT' }, kurikulum: [{ id: 1, kode: 'IF', nama: 'Informatika', tahun: '2024' }] },
      dosen: { id: 'd1', user: { name: 'Dr. Dosen' } }, krs: [],
    },
  };
  prisma.user.findUnique = async () => student;
  prisma.kRS.findMany = async () => [];
  const req = makeRequest({ params: { id: 'user-123' } });
  const res = makeResponse();
  await Controller.getStudentById(req, res, () => {});
  assert.equal(res.getStatusCode(), 200);
  assert.ok(res.getBody().student);
  assert.equal(res.getBody().student.nama, 'Student');
}

async function testGetStudentAttendance() {
  console.log('Testing getStudentAttendance...');
  prisma.$transaction = async (fn) => {
    return fn({
      user: { findUnique: async () => ({ mahasiswa: { id: 's1' } }) },
      tahunAkademik: { findUnique: async () => ({ id: 3, tahun: '2026/2027', semester: 'GANJIL' }) },
      absensi: { findMany: async () => [
        { status: 'HADIR', pertemuan: { jadwal: { kelasMataKuliah: { mataKuliah: { id: 1, kode: 'IF301', nama: 'Course 1' } } } } },
        { status: 'ALPHA', pertemuan: { jadwal: { kelasMataKuliah: { mataKuliah: { id: 1, kode: 'IF301', nama: 'Course 1' } } } } },
      ]},
    });
  };
  const req = makeRequest({ params: { id: 'u1' }, query: { tahunAkademikId: '3' } });
  const res = makeResponse();
  await Controller.getStudentAttendance(req, res, () => {});
  assert.equal(res.getStatusCode(), 200);
  assert.ok(res.getBody().data.summary);
  assert.ok(res.getBody().data.courses);
}

async function main() {
  try {
    await testCreateStudent();
    await testUpdateStudentById();
    await testUpdateStudentByIdRequiresReasonWhenChangingStatus();
    await testDeleteUserById();
    await testDeleteUserByIdNotFound();
    await testBulkUpdateStatus();
    await testBulkUpdateStatusInvalid();
    await testBulkUpdateStatusMaxIds();
    await testResetPassword();
    await testResetPasswordWeakPassword();
    await testGetAllStudents();
    await testGetStudentById();
    await testGetStudentAttendance();
    console.log('PASS: StudentController behavior characterization tests completed');
  } catch (e) {
    console.error('FAIL:', e);
    process.exitCode = 1;
  }
}

main();
