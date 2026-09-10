export interface LecturerDetailResponse {
  lecturer: {
    id: string
    dosenId: string | null
    nidn: string | null
    nama: string
    jenisKelamin: string | null
    tempatLahir: string | null
    tanggalLahir: string | null
    email: string
    noHp: string | null
    alamat: string | null
    avatarUrl: string | null
    prodi: { id: number; nama: string } | null
    fakultas: { id: number; nama: string } | null
    summary: {
      mataKuliahDiampu: number | null
      kelasAktif: number | null
      mahasiswaBimbingan: number | null
      jadwalMingguan: number | null
    }
  }
}
