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
  name: string;
    id: string;
    role: 'Dosen'
    dosen: {
      nidn: string;
      id: string;
      status:  'Aktif' | 'Cuti' | 'Lulus'| 'Nonaktif'
      jabatan: 'Dosen' | 'Kaprodi' | 'Dekan' | 'Rektor'
      prodi: {
          name: string;
      };
  }
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
  name: string
  fakultas: string
  kaProdi: string
}

export type MataKuliah = {
  id: string
  kode: string
  name_mk: string
  sks: string
  semester: string
  prodi: string
}

export type Ruangan = {
  id?: string
  kode: string
  nama: string
  kapasitas: number
  gedung: string
}

export type TahunAkademik = {
  id?: string
  tahun: string
  semester: string
  isActive: boolean
}

export type Kurikulum = {
  id: string
  namaKurikulum: string
  namaProdi: string
  tahun: number | null
  semester: string
  totalSks: number
  status: string
}
