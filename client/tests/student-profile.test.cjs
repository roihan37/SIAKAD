const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function loadApi(api, isAxiosError = () => false) {
  const exports = {}
  const source = fs.readFileSync(path.join(__dirname, '../src/api/student-profile.ts'), 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText
  vm.runInNewContext(output, {
    exports,
    require: (name) => {
      if (name === 'axios') return { isAxiosError }
      if (name === '@/api/axios') return { api }
      throw new Error(`Unexpected dependency ${name}`)
    },
  })
  return exports
}

test('student profile API uses authenticated me endpoints and unwraps response data', async () => {
  const calls = []
  const profile = { header: { name: 'Mahasiswa' } }
  const service = loadApi({
    get: async (url, config) => {
      calls.push({ method: 'get', url, config })
      return { data: { data: profile } }
    },
    patch: async (url, body) => {
      calls.push({ method: 'patch', url, body })
      return { data: { data: profile } }
    },
  })
  const controller = new AbortController()
  assert.deepEqual(await service.getStudentProfile(controller.signal), profile)
  assert.deepEqual(await service.updateStudentProfile({ phoneNumber: null }), profile)
  assert.equal(calls[0].url, '/student/me/profile')
  assert.equal(calls[0].config.signal, controller.signal)
  assert.deepEqual(calls[1], { method: 'patch', url: '/student/me/profile', body: { phoneNumber: null } })
})

test('password change sends only backend-supported fields', async () => {
  let call
  const service = loadApi({
    patch: async (url, body) => {
      call = { url, body }
      return { data: { data: { message: 'Password changed.' } } }
    },
  })
  const input = { currentPassword: 'current-password', newPassword: 'new-password-123' }
  const result = await service.changeStudentPassword(input)
  assert.deepEqual(call, { url: '/student/me/change-password', body: input })
  assert.equal(result.message, 'Password changed.')
})

test('API errors use the backend message with a safe fallback', () => {
  const service = loadApi({}, () => true)
  assert.equal(service.studentProfileErrorMessage({ response: { data: { message: 'Tidak valid' } } }, 'Fallback'), 'Tidak valid')
  assert.equal(service.studentProfileErrorMessage(new Error('network'), 'Fallback'), 'Fallback')
})
