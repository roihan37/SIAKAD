export type Mahasiswa = {
  id: string,
  name: string,
  role: string,
  mahasiswa: {
    semester: number
    id: string,
    nim: string,
    status: string,
    prodi: {
      name : string
    }
  }
}

export type Dosen = {
  id: string
  nidn: string
  name: string
  prodi: string
  jabatan: string,
  status: "active" | "inactive" | "success" | "failed"
}

export type Fakultas = {
  id: string,
  kode: string,
  name: string,
  dekan: string
}

export type ProgramStudi = {
  id: string
  kode: string
  name_ps: string
  fakultas: string
  kaProdi: string
}

export type Matkul = {
  id: string
  kode: string
  name_mk: string
  sks: string
  semester: string
  prodi: string
}
