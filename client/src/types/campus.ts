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
  id: number
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
  id?: number
  tahun: string
  semester: string
  isActive: boolean
}

export type Kurikulum = {
  id? : number
  nama: string
  kode: string
  prodiId: number
  prodi?: number
  tahun: number | null
  isActive: Boolean
}


export type Jadwal = {
  id?: string
  kode: string
  hari: string
  jamMulai: number
  jamSelesai: string
  jam : string
  mataKuliah : string
  kodeMataKuliah : string
  dosen : string
  ruangan : string
  kodeRuangan : string
  semester : string
}

export type KRS = {
  id? : string
  krsId: string
  nama: string
  nim: string
  prodi: string
  angkatan: number
  totalSKS: number | null
  status: string
  tahunAkademik: {
    id: number;
    tahun: string;
    semester: string;
  }
}

export type StudentDetail = {
  student: {
    id: string;
    nim: string;
    nama: string;
    nik: string | null;
    tempatLahir: string | null;
    tanggalLahir: string | null;
    jenisKelamin: string | null;
    email: string;
    noHp: string | null;
    alamat: string | null;
    angkatan: number;
    status?: string;
    prodi: {
      id: string;
      nama: string;
    } | null;
    fakultas: {
      id: string;
      nama: string;
    } | null;
    dosenPembimbing: {
      id: string;
      nama: string;
    } | null;
  };
};