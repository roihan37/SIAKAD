const assert = require('node:assert/strict');
const { adminMiddleware, adminOrMahasiswaMiddleware, mahasiswaMiddleware } = require('../src/middleware/authMid');
function authorize(middleware, userLogin, params = {}) {
  let called = false, error;
  middleware({ userLogin, params }, {}, value => { called = true; error = value; });
  assert.equal(called, true);
  return error;
}
for (const role of ['Mahasiswa', 'Dosen']) assert.equal(authorize(adminMiddleware, { id: 'u', role }).name, 'Forbidden');
assert.equal(authorize(adminMiddleware, undefined).name, 'TokenInvalid');
assert.equal(authorize(adminMiddleware, { id: 'admin', role: 'Admin' }), undefined);
assert.equal(authorize(mahasiswaMiddleware, undefined).name, 'TokenInvalid');
assert.equal(authorize(mahasiswaMiddleware, { id: 'admin', role: 'Admin' }).name, 'Forbidden');
assert.equal(authorize(mahasiswaMiddleware, { id: 'u', role: 'Mahasiswa' }), undefined);
assert.equal(authorize(adminOrMahasiswaMiddleware, { id: 'u', role: 'Mahasiswa' }, { id: 'u' }), undefined);
assert.equal(authorize(adminOrMahasiswaMiddleware, { id: 'u', role: 'Mahasiswa' }, { id: 'other' }).name, 'Forbidden');
const router = name => require(`../src/router/${name}`).default;
for (const name of ['users', 'avatars', 'lecturers', 'krs']) {
  const stack = router(name).stack;
  const guard = stack.findIndex(layer => layer.handle === adminMiddleware);
  assert.ok(guard >= 0, `${name}: missing router guard`);
  assert.ok(stack.every((layer, index) => !layer.route || guard < index), `${name}: route before guard`);
}
for (const name of ['fakultas', 'kelas', 'kelas-mata-kuliah', 'kurikulum', 'mata-kuliah', 'prodi', 'ruangan', 'tahun-akademik', 'jadwal', 'students', 'admin']) {
  for (const layer of router(name).stack) {
    if (!layer.route) continue;
    for (const method of Object.keys(layer.route.methods)) {
      if (!['post','put','patch','delete'].includes(method)) continue;
      assert.equal(layer.route.stack[0].handle, adminMiddleware, `${name} ${method} ${layer.route.path}`);
    }
  }
}
const students = router('students').stack.filter(layer => layer.route);
for (const path of ['/:id', '/:id/history-semester', '/:id/krs', '/:id/nilai']) assert.equal(students.find(layer => layer.route.path === path && layer.route.methods.get).route.stack[0].handle, adminOrMahasiswaMiddleware);
assert.ok(router('users').stack.some(layer => layer.route?.path === '/:id' && layer.route.methods.delete));
const studentKrs = require('../src/router/krs').studentKRSRouter.stack;
const studentKrsGuard = studentKrs.findIndex(layer => layer.handle === mahasiswaMiddleware);
assert.ok(studentKrsGuard >= 0);
assert.ok(studentKrs.every((layer, index) => !layer.route || studentKrsGuard < index));
for (const [method, path] of [['get', '/'], ['put', '/draft'], ['post', '/submit']]) {
  assert.ok(studentKrs.some(layer => layer.route?.path === path && layer.route.methods[method]));
}
const studentProfile = require('../src/router/students').studentProfileRouter.stack;
const studentProfileGuard = studentProfile.findIndex(layer => layer.handle === mahasiswaMiddleware);
assert.ok(studentProfileGuard >= 0);
assert.ok(studentProfile.every((layer, index) => !layer.route || studentProfileGuard < index));
for (const [method, path] of [['get', '/profile'], ['patch', '/profile'], ['patch', '/avatar'], ['patch', '/change-password']]) {
  assert.ok(studentProfile.some(layer => layer.route?.path === path && layer.route.methods[method]));
}
console.log('PASS: admin guards precede protected routes; non-admin/unauthenticated denial; student ownership; master-data mutations and password reset protected');
