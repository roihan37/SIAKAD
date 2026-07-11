export type Mahasiswa = {
    id: string
    nim: string
    name: string
    status: "active" | "inactive" | "success" | "failed"
    semester: string,
    prodi: string
  }
  
  export type Dosen = {
    id: string
    nidn: string
    name: string
    prodi: string
    jabatan: string,
    status: "active" | "inactive" | "success" | "failed"
  }
  