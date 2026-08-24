export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
  prodiId?: number
  fakultasId?: number
}

  export interface CreateStudentPayload {
    name: string; email: string; username: string; password: string;
    gender: string; phoneNumber: string; address: string; birthDate?: string;
    nim: string; angkatan: number; semester: number; status: string;
    prodiId: number; dosenId: string; avatarKey?: string;
}

export interface CreateLecturerPayload {
  name: string; email: string; username: string; password: string;
  gender: string; phoneNumber: string; address: string; birthDate?: string;
  nidn: string; status: string; jabatan: string; prodiId: number; avatarKey?: string;
}

export interface CreateFakultasPayload {
  kode: string;
  name: string;
}

export interface CreateProdiPayload {
  kode: string;
  name: string;
  fakultasId: number;
}

export interface CreateMatkulPayload {
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  prodiId: number;
}
