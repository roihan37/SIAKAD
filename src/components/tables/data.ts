import type { Fakultas } from "@/types/campus"
import type { Dosen, Mahasiswa } from "@/types/user"

export const mahasiswa: Mahasiswa[] = [
    {
      id: "728ed52f",
      nim: "2403912082",
      name: "cahyadi",
      semester: "5 (Ganjil)",
      status: "active",
      prodi: "Teknik Sipil"
    },
  ]
  
  export const dosen: Dosen[] = [
    {
      id: "728ed52f",
      nidn: "20192013",
      name: "suryadi",
      status: "active",
      prodi: "Teknik Sipil",
      jabatan: "Dekan Teknik"
    },
  ]

 
  export const fakultas: Fakultas[] = [
    {
      id: "728ed52f",
      kode : "2NDBAJ",
      name_fk: "Fakultas Teknik",
      dekan : "suryana"
    },
  ]
  
  export type ProgramStudi = {
        id: string
      kode : string
      name_ps: string
      fakultas : string
      kaProdi : string
  }

  export const programStudi: ProgramStudi[] = [
    {
      id: "728ed52f",
      kode : "2NDBAJ",
      name_ps: "Fakultas Teknik",
      fakultas : "Fakultas Teknik",
      kaProdi : "anjani"
    },
  ]

  export type Matkul = {
    id: string
  kode : string
  name_mk: string
  sks : string
  semester : string
  prodi : string
}

export const matkul: Matkul[] = [
{
  id: "728ed52f",
  kode : "2NDBAJ",
  name_mk: "Fakultas Teknik",
  sks : "Fakultas Teknik",
  semester : "anjani",
  prodi : "Teknik Sipil"
},
]